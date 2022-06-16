<img src="/.github/assets/header.png" width=500>

Icon Helper is a Discord bot made specifically to search icons.

<a href="https://discord.com/api/oauth2/authorize?client_id=986299318476632124&permissions=274878015488&scope=bot%20applications.commands"><img src="/.github/assets/add%20bot%20button.png" width=150></a>
<a href="https://saweria.co/loominatrx"><img src="/.github/assets/support%20button.png" width=150></a>

# Why did you create this bot?
Well, to answer the question, I need to tell you a story. While I am new designing in Figma, I find copy and pasting icons between drafts really annoying. Thus I lost motivation on designing UI because of it. I think I found a solution. I had a thought that I can find icons through Discord, and copy the icon from it without having a hassle switching between drafts. I spent a day to implement this bot, and here it is.

# Features
- Easy-to-use bot
- It has autocomplete
- You can find different variant from 1 icon

# Hosting the bot
NOTE: This tutorial assumes that you have [node.js](https://nodejs.org) installed in your device.
1. Clone the repo using git
   ```
   $ git clone https://github.com/Loominagit/icon-helper
   ```
   or download the repo if you have problems cloning the repo.
2. Install the required dependency by running `npm i`
3. Create a new `.env` file and copy the following block:
   ```
   TOKEN=<your discord bot token>
   CLIENT=<your bot CLIENT ID, not APPLICATION ID>
   ```
4. Deploy the commands by running `node deploy-commands.js`, and run `node index.js` to run the bot.

## Fetching the icon pack repos
If you somehow lose your icons folder (or just want to update the icon packs), simply run `node fetch-icons.js`.

# Supported Icon Packs
This bot currently only supports [Fluent Icons](https://github.com/microsoft/fluentui-system-icons), at least for now. If you have icon packs that we can add here, you can open a new issue and link the icon pack there.

# Credits
I used Fluent Icons (Icons and Search) for the bot profile. I do not own those assets.

# License
This project is licensed under GNU GPL v3. Read [LICENSE](/LICENSE) for more info.
