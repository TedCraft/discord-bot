const { getRandomInRange } = require('../../src/utility/random');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Получает случайное число.')
        .addIntegerOption(option =>
            option.setName('from')
                .setDescription('От какого числа.'))
        .addIntegerOption(option =>
            option.setName('to')
                .setDescription('до какого числа.')),

    async execute(client, interaction) {
        const from = interaction.options.getInteger('from') != null ? interaction.options.getInteger('from') : 1;
        const to = interaction.options.getInteger('to') != null ? interaction.options.getInteger('to') : 100;
        interaction.reply({ content: `roll (${from}-${to}): ${getRandomInRange(from, to)}`, ephemeral: false }).catch(err => { });
    }
};