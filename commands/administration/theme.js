const { insertTheme, deleteTheme, setThemeEnabled } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require("@distube/ytdl-core");
const agent = ytdl.createAgent(client.config.agent)
const { PermissionsBitField } = require('discord.js')

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
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('start_time')
                        .setDescription('Начало проигрывания музыкальной темы. (Пример: 25 или 00:00:25'))
                .addIntegerOption(option =>
                    option.setName('play_time')
                        .setDescription('Время проигрывания музыкальной темы.')
                        .setMaxValue(25)))
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
    let startTime = interaction.options.getString('start_time') || '0';
    if (startTime.match(/^((\d\d:)?(\d\d:)(\d\d))|(\d:)(\d\d)$/)) {
        const splitTime = startTime.split(':');
        let timeFactor = 1;
        startTime = 0;
        while (splitTime.length > 0) {
            startTime += splitTime.pop() * timeFactor;
            timeFactor *= 60;
        }
    } else if (startTime.match(/^\d+$/)) {
        startTime = parseInt(startTime);
    } else {
        await interaction.reply({ content: `Время начала введено неверно!`, ephemeral: true });
        return;
    }
    
    const playTime = interaction.options.getInteger('play_time') || 25;
    
    const song = interaction.options.getString('song');
    if (song.match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9-_]{11})(?:\S+)?$/) == null ) {
        await interaction.reply({ content: `Ссылка на композицию введена неверно!`, ephemeral: true });
        return;
    }
    
    const songInfo = await getSong(song, interaction);
    if (startTime >= songInfo.length - 5) {
        await interaction.reply({ content: `Неверно введено начало композиции!`, ephemeral: true });
        return;
    }

    await insertTheme(client, interaction.user.id, song, startTime, playTime);
    await interaction.reply({ content: `Музыкальная тема добавлена!`, ephemeral: true });
}

async function unset(client, interaction) {
    await deleteTheme(client, interaction.user.id);
    await interaction.reply({ content: `Музыкальная тема удалена!`, ephemeral: true });
}

async function enabled(client, interaction) {
    const enabled = interaction.options.getBoolean('is_enabled');
    
    if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator))
        return await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    await setThemeEnabled(client, interaction.guildId, enabled);
    await interaction.reply({ content: `${enabled ? 'Музыкальные темы включены!' : 'Музыкальные темы выключены!'}`, ephemeral: true });
}

async function getSong(url, interaction, count = 1, short = false, startTime = 0, playTime = 25) {
    const song = {
        title: null,
        url: null,
        user: interaction.member.nickname != null ? interaction.member.nickname : interaction.member.user.username,
        thumbnail: null,
        length: null,
        short: short,
        startTime: startTime,
        playTime: playTime
    }

    const songInfo = await ytdl.getBasicInfo(url, { 
        agent 
    });
    if (songInfo.videoDetails.isLive || songInfo.videoDetails.title == undefined) return [];

    song.title = songInfo.videoDetails.title;
    song.url = songInfo.videoDetails.video_url;
    song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
    song.length = songInfo.videoDetails.lengthSeconds;
    return song;
}