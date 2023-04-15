const { Opengram } = require('opengram')
const { MediaGroup } = require('@opengram/media-group')
const bot = new Opengram(process.env.BOT_TOKEN) // <-- put your bot token here (https://t.me/BotFather)
const mediaGroup = new MediaGroup()
bot.use(mediaGroup)

bot.on('media_group', async ctx => {
  // ctx.mediaGroup array of messages
  for (const message of ctx.mediaGroup) {
    console.log(JSON.stringify(message, null, 2)) // Pretty-print media group messages to console
  }

  await ctx.copyMediaGroup(ctx.chat.id) // Copy media-group to current chat
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop())
process.once('SIGTERM', () => bot.stop())
