const { updateBirthDayRole, deleteServerBdayRole } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday_role')
        .setDescription('Управление ролью дня рождения.')
        .addSubcommand(subcommand =>
            subcommand.setName('set')
                .setDescription('Устанавливает роль дня рождения.')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Роль дня рождения.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('unset')
                .setDescription('Удаляет роль дня рождения.')),

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

    const role = interaction.options.getRole('role');
    if (!interaction.guild.roles.cache.get(role.id).editable) return await interaction.reply({ content: `Недостаточно прав для выдачи роли ${role}`, ephemeral: true });

    await updateBirthDayRole(client, interaction.guildId, role.id);

    await interaction.reply({ content: `Роль ${role} установлена!`, ephemeral: false });
}

async function unset(client, interaction) {
    if (!interaction.memberPermissions.has('ADMINISTRATOR'))
        return await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    await deleteServerBdayRole(client, interaction.guildId);

    await interaction.reply({ content: `Роль удалена!`, ephemeral: false });
}