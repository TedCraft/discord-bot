const { getRandomInRange } = require('../../src/utility/random');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Подбрасывает монетку.'),

    async execute(client, interaction) {
        getRandomInRange(1, 2) == 1 ?
            interaction.reply({ content: `Орёл!`, ephemeral: false }) :
            interaction.reply({ content: `Решка!`, ephemeral: false });
    }
};