const { updateRules, deleteRules } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Управление правилами сервера.')
        .addSubcommand(subcommand =>
            subcommand.setName('set')
                .setDescription('Устанавливает правила сервера.')
                .addStringOption(option =>
                    option.setName('rules')
                        .setDescription('Правила сервера.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('unset')
                .setDescription('Удаляет правила сервера.')),

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

    const rules = interaction.options.getString('rules');

    await updateRules(client, interaction.guildId, rules);
    await interaction.reply({ content: `Правила добавлены!`, ephemeral: false });
}

async function unset(client, interaction) {
    if (!interaction.memberPermissions.has('ADMINISTRATOR'))
        return await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    await deleteRules(client, interaction.guildId);
    await interaction.reply({ content: `Правила удалены!`, ephemeral: false });
}