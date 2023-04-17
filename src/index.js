const { Composer } = require('opengram')
const { compactOptions } = require('./utils')
const d = require('debug')('opengram:media-group')

const storeSymbol = Symbol('store')
const timeoutSymbol = Symbol('store')
const allowedUpdatesSymbol = Symbol('allowedUpdates')
const latestMessage = Symbol('latestMessage')

/**
 * @typedef {Message[]} OpengramContext.mediaGroup
 */

/**
 * Copies media group to chat with given id
 *
 * ```js
 * bot.on('media_group', async ctx => {
 *   await ctx.copyMediaGroup(123456) // 123456 - chat id
 * })
 * ```
 * @param {number|string} chatId Unique identifier for the target chat or username of the target channel
 *   (in the format @channelusername)
 * @param {ExtraMediaGroup|Extra} extra Extra parameters
 * @param {AbortSignal} signal Abort signal
 * @this OpengramContext
 * @return {Promise<Message[]>}
 */
function copyMediaGroup (chatId, extra, signal) {
  if (!this.mediaGroup) {
    throw new TypeError(`"copyMediaGroup" isn't available for "${this.updateType}::${this.updateSubTypes}"`)
  }

  const mediaGroup = this.mediaGroup
    .map(m => {
      const type = ('photo' in m && 'photo') ||
        ('audio' in m && 'audio') ||
        ('video' in m && 'video') ||
        ('document' in m && 'document')

      /** @type {Audio|PhotoSize[]|Document|Video} **/
      const media = m[type]

      return compactOptions({
        type,
        caption: m.caption,
        caption_entities: m.caption_entities,
        has_spoiler: m.has_media_spoiler, // Photo / video
        media: type === 'photo' ? media[media.length - 1].file_id : media.file_id,
        thumbnail: media.thumbnail?.file_id, // Video / Audio
        duration: media.duration, // Video / Audio
        performer: media.performer, // Audio
        title: media.title, // Audio
        width: media.width, // Video
        height: media.height // Video
      })
    })

  return this.telegram.sendMediaGroup(chatId, mediaGroup, extra, signal)
}

/**
 * @typedef {object} MediaGroupOptions
 * @property {object} [store] Map-like object
 * @property {number} [timeout=100] Timeout in milliseconds. By default, `100`. After this timeout, the media group is
 *   considered fully received.
 * @property {Array<'video'|'audio'|'photo'|'document'>} [allowedUpdates] List of allowed updates.
 *   By default, `video`, `audio`, `photo` and `document`
 */

/**
 * A class that generates a middleware for merging media group messages into a single update
 * @class
 *
 * Usage example:
 *
 * ```js
 *  const { Opengram } = require('opengram')
 *  const { MediaGroup } = require('@opengram/media-group')
 *  const bot = new Opengram(process.env.BOT_TOKEN) // <-- put your bot token here (https://t.me/BotFather)
 *  const mediaGroup = new MediaGroup()
 *  bot.use(mediaGroup)
 *
 *  bot.on('media_group', async ctx => {
 *   // ctx.mediaGroup array of messages
 *   for (const message of ctx.mediaGroup) {
 *     console.log(JSON.stringify(message, null, 2)) // Pretty-print media group messages to console
 *   }
 *
 *   await ctx.copyMediaGroup(ctx.chat.id) // Copy media-group to current chat
 * })
 *
 *  bot.launch()
 *
 *  // Enable graceful stop
 *  process.once('SIGINT', () => bot.stop())
 *  process.once('SIGTERM', () => bot.stop())
 * ```
 */

class MediaGroup {
  /**
   * Media group plugin constructor
   * @param {MediaGroupOptions} [options] Options
   */
  constructor (options) {
    this[storeSymbol] = options.store ?? new Map()
    this[timeoutSymbol] = options.timeout ?? 100
    this[allowedUpdatesSymbol] = options.allowedUpdates ?? ['video', 'audio', 'photo', 'document']
  }

  /**
   * Getter returns timeout in milliseconds
   * @returns {number}
   */
  get timeout () {
    return this[timeoutSymbol]
  }

  /**
   * Setter for timeout
   * @param {number} value Timeout in milliseconds
   * @returns {void}
   */
  set timeout (value) {
    this[timeoutSymbol] = value
  }

  /**
   * Getter returns store
   * @return {object}
   */
  get store () {
    return this[storeSymbol]
  }

  /**
   * Creates and return middleware for register
   * @return {Middleware}
   */
  middleware () {
    /**
     * @param {OpengramContext} ctx Context
     * @param {Function} next
     */
    const mediaGroup = async (ctx, next) => {
      /**
       * Copies media group to chat with given id
       *
       * ```js
       * bot.on('media_group', async ctx => {
       *   await ctx.copyMediaGroup(123456) // 123456 - chat id
       * })
       * ```
       * @param {number|string} chatId Unique identifier for the target chat or username of the target channel
       *   (in the format @channelusername)
       * @param {ExtraMediaGroup|Extra} extra Extra parameters
       * @param {AbortSignal} signal Abort signal
       * @this OpengramContext
       * @return {Promise<Message[]>}
       */
      ctx.copyMediaGroup = copyMediaGroup.bind(ctx)

      // eslint-disable-next-line camelcase
      const { media_group_id } = ctx.anyMessage
      // eslint-disable-next-line camelcase
      if (!media_group_id) {
        d('Message not related to media group, skipped %d', ctx.update.update_id)
        return next()
      }

      const store = this[storeSymbol]

      if (!store.has(ctx.chat.id)) {
        d('Create new Map for chat. Media-group ID: %d Chat ID: %d Update ID: %d', media_group_id, ctx.chat.id, ctx.update.update_id)
        store.set(ctx.chat.id, new Map())
      }

      const chatMap = store.get(ctx.chat.id)

      if (!chatMap.has(media_group_id)) {
        d('Add message to store. Media-group ID: %d Chat ID: %d Update ID: %d', media_group_id, ctx.chat.id, ctx.update.update_id)
        chatMap.set(media_group_id, {
          resolve: () => {},
          messages: []
        })
      }

      const mediaGroupObject = chatMap.get(media_group_id)

      mediaGroupObject.resolve(null)

      mediaGroupObject.messages.push(ctx.anyMessage)

      const result = mediaGroupObject.messages.length !== 10
        ? await new Promise((resolve) => {
          mediaGroupObject.resolve = resolve
          setTimeout(resolve, this[timeoutSymbol], latestMessage)
        })
        : latestMessage

      if (result === latestMessage) {
        if (mediaGroupObject.messages.length === 10) {
          d('Last message of media group received. Media-group ID: %d Chat ID: %d Update ID: %d', media_group_id, ctx.chat.id, ctx.update.update_id)
        } else {
          d('Timeout expired. Media-group ID: %d Chat ID: %d Update ID: %d', media_group_id, ctx.chat.id, ctx.update.update_id)
        }

        ctx.mediaGroup = mediaGroupObject.messages
          .slice()
          .sort((a, b) => a.message_id - b.message_id)

        ctx.updateSubTypes.push('media_group')
        d('Remove media group from Map. Media-group ID: %d Chat ID: %d Update ID: %d', media_group_id, ctx.chat.id, ctx.update.update_id)
        chatMap.delete(media_group_id)

        if (chatMap.size === 0) {
          d('All media groups for chat processed, cleanup. Media-group ID: %d Chat ID: %d Update ID: %d', media_group_id, ctx.chat.id, ctx.update.update_id)
          store.delete(ctx.chat.id)
        }
      }

      await next()
    }

    return Composer.mount(this[allowedUpdatesSymbol], mediaGroup)
  }
}

module.exports = { MediaGroup }
