const { updateBirthdayUser, getUser } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Управление датой дня рождения.')
        .addSubcommand(subcommand =>
            subcommand.setName('set')
                .setDescription('Устанавливает дату рождения.')
                .addIntegerOption(option =>
                    option.setName('day')
                        .setDescription('День рождения.')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(31))
                .addIntegerOption(option =>
                    option.setName('month')
                        .setDescription('Месяц рождения.')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(12))),

    async execute(client, interaction) {
        const day = interaction.options.getInteger('day'),
            month = interaction.options.getInteger('month');

        if (day > new Date(0, 0, day + 1).getDate()) {
            return interaction.reply({ content: `Введите корректный день!`, ephemeral: true });
        }

        const user = await getUser(client, interaction.user.id);
        if (user.LAST_CHANGE_BDAY != null && Math.ceil((Date.now() - new Date(user.LAST_CHANGE_BDAY)) / (1000 * 60 * 60 * 24)) < 356)
            return interaction.reply({ content: `Дату рождения можно менять раз в год!`, ephemeral: true })

        await updateBirthdayUser(client, interaction.user.id, `${day}.${month}.${new Date().getFullYear()}`);

        interaction.reply({ content: `Дата рождения установлена!`, ephemeral: true });
    }
};