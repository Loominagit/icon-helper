const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const fluentIconsDir = fs.readdirSync(path.join(__dirname, '..', 'icons', 'fluent-icons'));
	
module.exports = {
	data: new SlashCommandBuilder()
	.setName('fluent')
	.setDescription('Search for Microsoft\'s Fluent Icons!')
	.addStringOption(option =>
		option.setName('query')
			.setDescription('The icon that you want to find.')
			.setRequired(true)
			.setAutocomplete(true)
			)
	.addStringOption(option =>
		option.setName('variant')
			.setDescription('The icon variant.')
			.setRequired(true)
			.addChoices(
				{name: 'Regular', value: 'regular'},
				{name: 'Filled', value: 'filled'}
				)
		),

	async execute(interaction) {
		const query = interaction.options.getString('query');
		const variant = interaction.options.getString('variant');
		
		if (fluentIconsDir.find(name => name === query)) {
			
			const svg = path.join(__dirname, '..', 'icons', 'fluent-icons', query, variant + '.svg');
			const uploadFilename = `${query.toLowerCase().replace(' ', '_')}_${variant}.svg`;

			await interaction.reply({
				embeds: [new MessageEmbed()
					.setTitle(query)
					.setImage('attachment://preview.png')
					.setColor('#F1F1F1')
				],
				files: [
					new MessageAttachment(
						await sharp(svg)
							.resize(128, 128)
							.png()
							.toBuffer()
						, 'preview.png'),
					new MessageAttachment(svg, uploadFilename)
				]
			});

			return 0;
		}

		await interaction.reply('I don\'t see what you mean here...');
	},
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices;
		if (focusedOption.name === 'query') {
			choices = fluentIconsDir;
		}

		const filtered = choices.filter(choice => choice.toLowerCase().match(focusedOption.value)).slice(0, 24);
		
		await interaction.respond(
			filtered.map(choice => ({name: choice, value: choice}))
		);
	}
};