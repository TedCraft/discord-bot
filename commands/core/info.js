const { getInfo } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Информация о сервере.'),

    async execute(client, interaction) {
        const server = await getInfo(client, interaction.guildId);

        if (server) {
            await interaction.reply({ content: server.INFO.toString('utf8'), ephemeral: true });
        }
        else {
            await interaction.reply({ content: `Похоже, информации о сервере нет.`, ephemeral: true });
        }
    }
};