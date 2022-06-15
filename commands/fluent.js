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
		
		const index = assetsJSON.find(value => value.name === query);

		if (index) {
			// eslint-disable-next-line no-unused-vars
			const blobs = await fetch(`https://api.github.com/repos/microsoft/fluentui-system-icons/contents/assets/${query}/SVG`);
			const blobsJSON = await blobs.json();

			const variantFiltered = blobsJSON.filter(e => e.name.endsWith(`${variant}.svg`));
			const largestSVGPossible = variantFiltered[variantFiltered.length-1];

			// download the svg
			await downloadFile(largestSVGPossible.download_url, './.cache/_.svg');

			// change the color to white grey-ish
			const svg = fs.readFileSync('./.cache/_.svg', {encoding: 'utf-8'})
				.replace(/#212121/g, '#F1F1F1');
			fs.writeFileSync('./.cache/_.svg', svg);

			// convert to png for preview
			await sharp(`./.cache/_.svg`)
				.resize(128, 128)
				.png()
				.toFile('./.cache/preview.png');

			// eslint-disable-next-line no-unused-vars
			const filename = `${query}_${variant}.svg`;

			const embed = new MessageEmbed()
				.setTitle(query)
				.setImage('attachment://preview.png');

			const body = {
				embeds: [embed],
				files: [
					new MessageAttachment('./.cache/preview.png', 'preview.png')
				]
			};

			if (svg.length > 1018) {
				body.files.push(new MessageAttachment('./.cache/_.svg', filename));
				embed.setDescription('Due to how large the SVG is, we provide you a SVG attachment instead.');
			} else
				embed.addField('SVG Text', `\`\`\`\n${svg}\n\`\`\` `);

			await interaction.reply(body);
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