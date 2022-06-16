const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment, MessageEmbed } = require('discord.js');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('About this bot.'),
    async execute(interaction) {
        await interaction.reply({
            embeds: [
            new MessageEmbed()
                .setTitle('About me')
                .setDescription('Icon Helper is a Discord bot that is created specifically to search icons.')
                .addField('Supported Icon Packs', '- Microsoft Fluent Icons (`/fluent`)')
                .addField('Source code', 'https://github.com/Loominagit/icon-helper', true)
                .addField('Add to your server', '[Click this blue text!](https://discord.com/api/oauth2/authorize?client_id=986299318476632124&permissions=274878015488&scope=bot%20applications.commands)', true)
                .setThumbnail('attachment://profile.png')
                .setFooter({'text': 'Developed by loominatrx with love.', 'iconURL': ''})
            ],
            files: [
                new MessageAttachment(path.join(__dirname, '..', 'profile.png'))
            ]
        });
    }
};