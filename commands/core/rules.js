const { getRules } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Правила сервера.'),

    async execute(client, interaction) {
        const server = await getRules(client, interaction.guildId);

        if (server) {
            interaction.reply({ content: server.RULES.toString('utf8'), ephemeral: true });
        }
        else {
            interaction.reply({ content: `Похоже, правил на сервере нет.`, ephemeral: true });
        }
    }
};