<header>
<img src="https://raw.githubusercontent.com/OpengramJS/opengram/master/docs/media/Logo.svg" alt="logo" height="90" align="left">
<h1 style="display: inline">Opengram media group</h1>

The media-group plugin lets you handle & copy media-groups (albums) with ease.

[![CI][ci-image]][ci-url] [![codecov][codecov-image]][codecov-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url] [![javascript style guide][standard-image]][standard-url] [![Codacy Badge][codacy-image]][codacy-url] [![License: MIT][license-image]][license-url] [![FOSSA Status][fossa-image]][fossa-url]

</header>

## Features
*   `video`, `audio`, `photo`, `document` support
*   Supports sends copy of a media group

## Docs

You can find documentation [here](media-group.opengram.dev) and examples [here](https://github.com/OpengramJS/media-group/tree/master/examples) and try now [here](https://replit.com/team/Opengram)

## Installation

### NPM
```bash
npm i @opengram/media-group
```

### Yarn
```bash
yarn add @opengram/media-group
```

### PNPM
```bash
pnpm add @opengram/media-group
```

## Quick start

```js
const { Opengram } = require('opengram')
const { MediaGroup } = require('@opengram/media-group')
const bot = new Opengram(process.env.BOT_TOKEN) // <-- put your bot token here (https://t.me/BotFather)
const mediaGroup = new MediaGroup()
bot.use(mediaGroup)

bot.on('media_group', async ctx => {
  // ctx.mediaGroup - array of messages
  for (const message of ctx.mediaGroup) {
    console.log(JSON.stringify(message, null, 2)) // Pretty-print media group messages to console
  }

  await ctx.copyMediaGroup(ctx.chat.id) // Copy media-group to current chat
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop())
process.once('SIGTERM', () => bot.stop())

```

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FOpengramJS%2Fmedia-group.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FOpengramJS%2Fmedia-group?ref=badge_large)

[codecov-image]: https://codecov.io/gh/OpengramJS/media-group/branch/master/graph/badge.svg?token=
[codecov-url]: https://codecov.io/gh/OpengramJS/media-group
[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://opensource.org/licenses/MIT
[codacy-image]: https://app.codacy.com/project/badge/Grade/3afaecc924bb4df985be63cf65fdf97d
[codacy-url]: https://app.codacy.com/gh/OpengramJS/media-group/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade
[ci-image]: https://github.com/OpengramJS/media-group/actions/workflows/ci.yml/badge.svg?branch=master
[ci-url]: https://github.com/OpengramJS/media-group/actions/workflows/ci.yml
[npm-image]: https://img.shields.io/npm/v/@opengram/media-group.svg
[npm-url]: https://npmjs.com/package/@opengram/media-group
[downloads-image]: https://img.shields.io/npm/dm/@opengram/media-group.svg
[downloads-url]: https://npmjs.com/package/@opengram/media-group
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com
[fossa-image]: https://app.fossa.com/api/projects/git%2Bgithub.com%2FOpengramJS%2Fmedia-group.svg?type=shield
[fossa-url]: https://app.fossa.com/projects/git%2Bgithub.com%2FOpengramJS%2Fmedia-group?ref=badge_shield
