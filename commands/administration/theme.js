const { insertTheme, deleteTheme, setThemeEnabled } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('theme')
        .setDescription('Управляет вашей музыкальной темой.')
        .addSubcommand(subcommand =>
            subcommand.setName('set')
                .setDescription('Устанавливает вашу музыкальную тему.')
                .addStringOption(option =>
                    option.setName('song')
                        .setDescription('Музыкальная тема.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('unset')
                .setDescription('Удаляет вашу музыкальную тему.'))
        .addSubcommand(subcommand =>
            subcommand.setName('enabled')
                .setDescription('Включить/Выключить поддержку музыкальных тем.')
                .addBooleanOption(option =>
                    option.setName('is_enabled')
                        .setDescription('Включить или выключить.')
                        .setRequired(true))),

    async execute(client, interaction) {
        switch (interaction.options.getSubcommand()) {
            case 'set':
                await set(client, interaction);
                break;
            case 'unset':
                await unset(client, interaction);
                break;
            case 'enabled':
                await enabled(client, interaction);
                break;
            default:
                break;
        }
    }
};

async function set(client, interaction) {
    const song = interaction.options.getString('song');
    if (song.match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9-_]{11})(?:\S+)?$/) == null ) {
        await interaction.reply({ content: `Ссылка на композицию введена неверно!`, ephemeral: true });
        return;
    }
    

    await insertTheme(client, interaction.user.id, song);
    await interaction.reply({ content: `Музыкальная тема добавлена!`, ephemeral: true });
}

async function unset(client, interaction) {
    await deleteTheme(client, interaction.user.id);
    await interaction.reply({ content: `Музыкальная тема удалена!`, ephemeral: true });
}

async function enabled(client, interaction) {
    const enabled = interaction.options.getBoolean('is_enabled');
    
    if (!interaction.memberPermissions.has('ADMINISTRATOR'))
        return await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    await setThemeEnabled(client, interaction.guildId, enabled);
    await interaction.reply({ content: `${enabled ? 'Музыкальные темы включены!' : 'Музыкальные темы выключены!'}`, ephemeral: true });
}