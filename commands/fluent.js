const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const fs = require('node:fs');
const fetch = require('node-fetch');
const assetsJSON = require('../.cache/fluent.json');
// eslint-disable-next-line no-unused-vars
const sharp = require('sharp');

// eslint-disable-next-line no-unused-vars
const downloadFile = async (url, path) => {
	const result = await fetch(url);
	fs.writeFileSync(path, 'dummy');
	const fileStream = fs.createWriteStream(path);
	return new Promise((resolve, reject) => {
		result.body.pipe(fileStream);
		result.body.on('error', reject);
		fileStream.on('finish', resolve);
	});
};
	
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
	// eslint-disable-next-line no-unused-vars
	async execute(interaction) {
		const query = interaction.options.getString('query');
		const variant = interaction.options.getString('variant');
		for (const name of assetsJSON) {
			if (name === query) {
				// eslint-disable-next-line no-unused-vars
				const blobs = await fetch(`https://api.github.com/repos/microsoft/fluentui-system-icons/contents/assets/${query}/SVG`);
				const blobsJSON = await blobs.json();

				const variantFiltered = blobsJSON.filter(e => e.name.endsWith(`${variant}.svg`));
				const largestSVGPossible = variantFiltered[variantFiltered.length-1];
				//console.log(variantFiltered);

				const filename = `${query}_${variant}.svg`;
				// eslint-disable-next-line no-unused-vars
				const svg = await downloadFile(largestSVGPossible.download_url, './.cache/_.svg');
				const png = await sharp(`../.cache/_.svg`)
					.png()
					.toBuffer();
				


				await interaction.reply({
					embeds: [new MessageEmbed()
						.setTitle(query)
						.setDescription('Download the svg file above!')
						.setImage('attachment://preview.png')
					], files: [
						new MessageAttachment('./.cache/_.svg', filename),
						new MessageAttachment(png, 'preview.png')
					]
				});
				return 0;
			}
			
		}
		await interaction.reply({
			embeds: [new MessageEmbed()
				.setTitle('Not found')
				.setDescription('Huh, I don\'t see what you mean here...')
			]
		});
	},
	async autocomplete(interaction) {
		const focusedOption = interaction.options.getFocused(true);
		let choices;
		if (focusedOption.name === 'query') {
			choices = assetsJSON;
		}

		const filtered = choices.filter(choice => choice.toLowerCase().match(focusedOption.value)).slice(0, 24);
		
		await interaction.respond(
			filtered.map(choice => ({name: choice, value: choice}))
		);
	}
};