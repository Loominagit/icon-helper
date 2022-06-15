const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const fs = require('node:fs');
const fetch = require('node-fetch');
const assetsJSON = require('../.cache/fluent.json');
const sharp = require('sharp');

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

	async execute(interaction) {
		const query = interaction.options.getString('query');
		const variant = interaction.options.getString('variant');
		
		if (assetsJSON.find(name => name === query)) {
			// fetch the blobs!
			const blobs = await fetch(`https://api.github.com/repos/microsoft/fluentui-system-icons/contents/assets/${query}/SVG`);
			const blobsJSON = await blobs.json();

			// get the variatns
			const variantFiltered = blobsJSON.filter(e => e.name.endsWith(`${variant}.svg`));

			// pick the largest SVG possible because why not?
			const largestSVGPossible = variantFiltered[variantFiltered.length-1];

			// i used unix time-based naming because for some reason
			// sharp renders the previous found image :/
			// if anyone has a better solution, you can submit a PR :D
			const svgFilename = `./.cache/${Date.now()}.svg`;

			// download the svg
			await downloadFile(largestSVGPossible.download_url, svgFilename);

			// change the color to white grey-ish
			const svg = fs.readFileSync(svgFilename, {encoding: 'utf-8'})
				.replace(/#212121/g, '#F1F1F1');
			fs.writeFileSync(svgFilename, svg);

			// so that would be 'access_hour_24_filled'
			const filename = largestSVGPossible.name.slice(10);

			await interaction.reply({
				embeds: [new MessageEmbed()
					.setTitle(query)
					.setImage('attachment://preview.png')],
				files: [
					new MessageAttachment(
						await sharp(svgFilename)
							.resize(128, 128)
							.png()
							.toBuffer()
						, 'preview.png'),
					new MessageAttachment(svgFilename, filename)
				]
			});

			// delete the temp svg file
			fs.rmSync(svgFilename);

			return 0;
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