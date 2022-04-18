const { updateInfo, deleteInfo } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Управление информацией о сервере.')
        .addSubcommand(subcommand =>
            subcommand.setName('set')
                .setDescription('Устанавливает информацию о сервере.')
                .addStringOption(option =>
                    option.setName('info')
                        .setDescription('Информация о сервере.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('unset')
                .setDescription('Удаляет информацию о сервере.')),

    async execute(client, interaction) {
        switch (interaction.options.getSubcommand()) {
            case 'set':
                await set(client, interaction);
                break;
            case 'unset':
                await unset(client, interaction);
                break;
            default:
                break;
        }
    }
};

async function set(client, interaction) {
    if (!interaction.memberPermissions.has('ADMINISTRATOR'))
        return await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    const info = interaction.options.getString('info');

    await updateInfo(client, interaction.guildId, info);
    await interaction.reply({ content: `Информация добавлена!`, ephemeral: false });
}

async function unset(client, interaction) {
    if (!interaction.memberPermissions.has('ADMINISTRATOR'))
        return await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    await deleteInfo(client, interaction.guildId);
    await interaction.reply({ content: `Информация удалена!`, ephemeral: false });
}