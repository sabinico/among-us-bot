# Among Us - Discord Bot
Discord.js based Among Us Bot

<div align="center">
  <br />
  <p>
    <img src="http://www.innersloth.com/Images/GAMES/AmongUs/bannerLogo_AmongUs.png" width="447" alt="Among Us" />
  </p>
  <br />
  <p>
    <a href="https://discord.gg/VdaB5NK"><img src="https://img.shields.io/discord/753630838372958269?color=7289da&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/v/discord.js.svg?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/dt/discord.js.svg?maxAge=3600" alt="NPM downloads" /></a>
    <a href="https://github.com/discordjs/discord.js/actions"><img src="https://github.com/discordjs/discord.js/workflows/Testing/badge.svg" alt="Build status" /></a>
    <a href="https://david-dm.org/discordjs/discord.js"><img src="https://img.shields.io/david/discordjs/discord.js.svg?maxAge=3600" alt="Dependencies" /></a>
    <a href="https://www.patreon.com/discordjs"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Patreon" /></a>
  </p>
  <p>
    <a href="https://nodei.co/npm/discord.js/"><img src="https://nodei.co/npm/discord.js.png?downloads=true&stars=true" alt="npm installnfo" /></a>
  </p>
</div>

## Table of contents

- [About](#about)
- [Installation](#installation)
  - [Usage](#usage)
- [Configuration file](#configuration-file)
- [Links](#links)
- [Contributing](#contributing)
- [Help](#help)

## About

Among Us - Discord Bot is a powerful [Node.js](https://nodejs.org) module that allows you to easily interact with the
[Discord API](https://discord.com/developers/docs/intro) using [Discord.js](https://discord.js.org/) in order to create
custom Game Rooms for an enchanted experience playing the [Among Us](http://www.innersloth.com/gameAmongUs.php) game.

- Easy channel creator: Join a channel to create a Room
- Actions throw reactions: React bot messages to interact with the Room
- Includes some moderators tools
- 100% customizable

## Installation

**Node.js 12.0.0 or newer is required.**  
Ignore any warnings about unmet peer dependencies, as they're all optional.

Install dependencies: `yarn install` or `npm install`

### Usage

Run the bot: `yarn start` or `node index.js`

## Configuration file

```json
{
    "owners": ["<YOUR_DISCORD_USER_ID>"],
    "administrators": ["<YOUR_DISCORD_USER_ID>"],
    "token": "<YOUR_DISCORD_BOT_TOKEN>",
    "prefix": "$",
    "botMainDiscordServer": "<YOUR_DISCORD_SERVER_ID>",
    "log_channels": {
	    "logs": "<CHANNEL_ID>"
    },
    "NODE_ENV": "production",
    "colors": ["Red", "Orange", "Yellow", "Lime", "Green", "Cyan", "Blue", "Purple", "Pink", "Brown", "White", "Black"],
    "roomscreator": {
        "enabled": true,
        "channel": "<CHANNEL_ID>",
        "category": "<CHANNEL_ID>"
    }
}
```

## Links

- [Discord.js Website](https://discord.js.org/) ([source](https://github.com/discordjs/website))
- [Discord.js Documentation](https://discord.js.org/#/docs/main/master/general/welcome)
- [Discord.js Guide](https://discordjs.guide/) ([source](https://github.com/discordjs/guide)) - this is still for stable  
  See also the [Discord.js Update Guide](https://discordjs.guide/additional-info/changes-in-v12.html), including updated and removed items in the library.
- [Discord.js Discord server](https://discord.gg/bRCvFy9)
- [Discord API Discord server](https://discord.gg/discord-api)
- [Discord.js GitHub](https://github.com/discordjs/discord.js)
- [Discord.js NPM](https://www.npmjs.com/package/discord.js)
- [Discord.js Related libraries](https://discordapi.com/unofficial/libs.html)

### Extensions

- [RPC](https://www.npmjs.com/package/discord-rpc) ([source](https://github.com/discordjs/RPC))

## Contributing

Before creating an issue, please ensure that it hasn't already been reported/suggested, and double-check the
[documentation](https://github.com/sabinico/among-us-bot/wiki).  
See [the contribution guide](https://github.com/sabinico/among-us-bot/blob/master/CONTRIBUTING.md) if you'd like to submit a PR.

## Help

If you don't understand something in the documentation, you are experiencing problems, or you just wanna join a cool community to play games with, please don't hesitate to join our official [Among Us - ESPAÑOL Discord Server](https://discord.gg/VdaB5NK).