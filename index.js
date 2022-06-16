const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents, Collection } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms));

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const presences = [
	['loominatrx coding me', 'WATCHING'],
	['you copy and pasting SVG to Figma', 'WATCHING'],
	['you using /fluent', 'WATCHING'],
	['some anime', 'WATCHING']
];

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {

	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	} else if (interaction.isAutocomplete()) {

		const command = client.commands.get(interaction.commandName);
		if (!command) return;

		await command.autocomplete(interaction);
	}
});

client.on('ready', async () => {
	console.log('Client ready.');
	console.log('Setting up presence...');
	setInterval(async () => {
		for (const presence of presences) {
			client.user.setActivity(presence[0], {type: presence[1]});
			await sleep(60000);
		}
	}, 0);
	console.log('Done.');
});

client.login(process.env.TOKEN);