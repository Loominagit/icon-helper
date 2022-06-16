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
                .setDescription('Icon Helper is a Discord bot made specifically to search icons.')
                .setColor('#F1F1F1')
                .addField('Supported Icon Packs', '- Microsoft Fluent Icons (`/fluent`)')
                .addField('Source code', 'https://github.com/Loominagit/icon-helper', true)
                .addField('Support me!', '[Saweria (ID only)](https://saweria.co/loominatrx), no paypal atm', true)
                .addField('Add to your server', '[Click this blue text!](https://discord.com/api/oauth2/authorize?client_id=986299318476632124&permissions=274878015488&scope=bot%20applications.commands)', true)
                .setThumbnail('attachment://profile.png')
                .setFooter({
                    'text': 'Developed by loominatrx with ♥️.', 
                    'iconURL': 'https://cdn.discordapp.com/avatars/552829346381955078/16cc88aaf3b4cb5d0df969a4b9ff1cbf.png'
                })
            ],
            files: [
                new MessageAttachment(path.join(__dirname, '..', 'profile.png'))
            ]
        });
    }
};
