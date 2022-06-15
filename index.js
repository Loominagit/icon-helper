const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents, Collection } = require('discord.js');
const dotenv = require('dotenv');
const cacheGen = require('./cacheGen.js');

dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
	
	if (!interaction.isCommand() && !interaction.isAutocomplete()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	if (interaction.isCommand()) {
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	} else if (interaction.isAutocomplete()) {
		if (!command.autocomplete) return;
		await command.autocomplete(interaction);
	}
});

client.on('ready', async () => {
	console.log('Client ready. Generating caches...');
	await cacheGen.generateFluentTreeCache();
});

client.login(process.env.TOKEN);