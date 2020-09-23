# huokan-discord-bot

Discord bot for Huokan Boosting Community.

## Commands

[] indicates optional arguments and <> indicates required arguments. Do not surround flags with these indicators when using the command.

### !invitechannel

Only usable by server admins. Sets the channel that invite links created with !invitelink will point to.
If the channel is not specified, the channel the command was posted in will be used.

#### Arguments

[#channel]: Specify a channel other than the one in which the message was posted to use as the invite channel.

### !invitelink

Available to everyone. Creates an invite link to the server's invite channel (or the current channel if not specified) that will be tracked by the bot.

### !inviteleaderboard

Available anyone with Manage Server permission plus Moderators.

#### Arguments:

[--size]: Number of recruiters to show on the leaderboard.
[--dynamic]: If this flag is present, the bot will automatically update this leaderboard every time the numbers change. Only one dynamic leaderboard can exist per discord channel.
[--startDate]: Invites will only count if they occurred after this date/time. This behaves differently with the --cycle option. Example: --startDate "2020-09-21 10:00 EDT"
[--cycle]: Number of days per cycle. After the cycle ends, the leaderboard resets. Example: startDate is set to 2020-09-01 00:00 UTC and cycle is set to 7. On the 8th, 15th, etc., the leaderboard will reset.

## Development Setup

Requires: Docker or MySQL, build-essentials on Linux or Visual Studio C/C++ compiler on windows.

Docker is only used to run MySQL for development.

```bash
docker-compose up # if using docker
npm install
npm run migrate
npm run watch
npm start
```
