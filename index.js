const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents, Collection } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const presences = [
	{activities: [{name: 'loominatrx coding me', type: 'WATCHING'}]},
	{activities: [{name: 'you copy and pasting icons to figma', type: 'WATCHING'}]},
	{activities: [{name: 'lists of icon packs', type: 'WATCHING'}]},
	{activities: [{name: 'discord.js tutorial', type: 'WATCHING'}]},
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

const setPresence = () => {
	const currentPresence = presences[Math.floor(Math.random()*(presences.length-1))];
	client.user.setPresence(currentPresence);
};

client.on('ready', async () => {
	console.log('Client ready.');
	console.log('Setting up presence...');

	setPresence();
	setInterval(setPresence , 60000);

	console.log('Done.');
});

client.login(process.env.TOKEN);