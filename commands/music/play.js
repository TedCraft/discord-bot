const ytdl = require('discord-ytdl-core');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus,
    createAudioPlayer, AudioPlayerStatus, createAudioResource } = require('@discordjs/voice');
const { insertSong, deleteSongs, getSongs } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Добавляет композицию в очередь')
        .addStringOption(option =>
            option.setName('search_text')
                .setDescription('Поиск композиции по предложенному тексту.'))
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Ссылка на композицию или плейлист.'))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Число копий.')
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(client, interaction, songGiven = undefined, replying = true) {
        const voiceChannel = interaction.guild.me.voice.channel != undefined ? interaction.guild.me.voice.channel : interaction.member.voice.channel;
        if (!voiceChannel) {
            if (replying) interaction.reply({ content: `зайди в войс канал`, ephemeral: true });
            return;
        }

        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            if (replying) interaction.reply({ content: 'Дайте права :)', ephemeral: true });
            return;
        }

        const count = interaction.options.getInteger('count') != null ? (interaction.options.getInteger('count') < 100 ? interaction.options.getInteger('count') : 100) : 1;

        let song = [];

        const songUrl = songGiven == undefined ? interaction.options.getString('song') : songGiven,
              text = interaction.options.getString('search_text');
        if (!songUrl && !text) {
            if (replying) interaction.reply({ content: `Укажите композицию.`, ephemeral: true });
            return;
        }

        if (songUrl) {
            if (songUrl.match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9-_]{34})(?:\S+)?$/) != null) {
                const pl = await ytpl(songUrl, { limit: Infinity });
                const plSongs = pl.items;
                song = await getSongFromInfo(plSongs[0], interaction, count);
                plSongs.shift();
                for (const i in plSongs)
                    await getSongFromInfo(plSongs[i], interaction, count);

                if (!getVoiceConnection(interaction.guildId) || interaction.guild.me.voice.channel == null) {
                    var connection = await voiceChannel.join();
                    client.connections.set(interaction.guildId, connection);
                    play(client, interaction.guild, song);
                }
                if (replying) interaction.reply({ content: `Плейлист \`${pl.title}\` добавлен в очередь`, ephemeral: false });
                return;
            }
            else if (songUrl.match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9-_]{11})(?:\S+)?$/) != null) {
                song = await getSong(songUrl, interaction, count);
            }
            else {
                if (replying) interaction.reply({ content: `Ссылка введена неверно!`, ephemeral: true });
                return;
            }
        }
        else {
            const searchResult = await ytsr(text, { limit: 5 });
            if (searchResult.items.length == 0) {
                if (replying) interaction.reply({ content: "Не удалось найти композицию!", ephemeral: true });
                return;
            }
            for (const i in searchResult.items) {
                if (searchResult.items[i].isLive) continue;
                song = await getSongFromInfo(searchResult.items[i], interaction, count);
                if (song.length == 0) continue;
                break;
            }
        }

        if (song.length == 0) {
            if (replying) interaction.reply({ content: `Невозможно найти композицию!`, ephemeral: true });
            return;
        }

        if (!getVoiceConnection(interaction.guildId) || interaction.guild.me.voice.channel == null) {
            const connection = await joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            connection.on(VoiceConnectionStatus.Ready, () => {
                play(client, interaction.guild, song);
            });
        }
        if (replying) {
            count == 1 && !isNaN(parseInt(count)) ?
                interaction.reply({ content: `\`${song.title}\` добавлена в очередь`, ephemeral: false }) :
                interaction.reply({ content: `\`${song.title}\` добавлена в очередь (${count})`, ephemeral: false });
        }
    }
};

async function getSong(url, interaction, count = 1) {
    const song = {
        title: null,
        url: null,
        user: interaction.member.nickname != null ? interaction.member.nickname : interaction.user.username,
        thumbnail: null,
        length: null
    }

    const songInfo = await ytdl.getBasicInfo(url);
    if (songInfo.isLive) throw "Streams not allowed!";

    song.title = songInfo.videoDetails.title;
    song.url = songInfo.videoDetails.video_url;
    song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
    song.length = songInfo.videoDetails.lengthSeconds;

    for (var i = 0; i < count; i++) {
        await insertSong(client, interaction.guildId, song.title, song.url, song.user, song.thumbnail, song.length);
    }
    return song;
}

async function getSongFromInfo(songInfo, interaction, count = 1) {
    if (songInfo.isLive || songInfo.title == undefined) return [];

    const song = {
        title: null,
        url: null,
        user: interaction.member.nickname != null ? interaction.member.nickname : interaction.user.username,
        thumbnail: null,
        length: null
    }

    song.title = songInfo.title;
    song.url = songInfo.url;
    song.thumbnail = songInfo.bestThumbnail.url;
    if (songInfo.durationSec != undefined) {
        song.length = songInfo.durationSec;
    }
    else {
        const duration = songInfo.duration.split(/:+/g).reverse();
        song.length = 0;
        for (const i in duration) {
            song.length += parseInt(duration[i]) * Math.pow(60, i);
        }
    }

    for (var i = 0; i < count; i++) {
        await insertSong(client, interaction.guildId, song.title, song.url, song.user, song.thumbnail, song.length);
    }
    return song;
}

async function play(client, guild, song) {
    if (!song) {
        if (client.audioPlayers.get(guild.id))
            client.audioPlayers.delete(guild.id);
        getVoiceConnection(guild.id).destroy();
        return;
    }

    if (song.url != null) {
        var player = client.audioPlayers.get(guild.id);
        if (!player) {
            player = createAudioPlayer();
            getVoiceConnection(guild.id).subscribe(player);
            client.audioPlayers.set(guild.id, player);

            player.on('error', error => {
                console.log(error);
                toNewSong(client, guild).catch(err => {
                    console.log(err);
                });
            });

            player.on(AudioPlayerStatus.Idle, async () => {
                toNewSong(client, guild).catch(err => {
                    console.log(err);
                });
            });
        }

        const audioResource = createAudioResource(ytdl(song.url, { filter: "audioonly", opusEncoded: true, highWaterMark: 1 << 25 }));
        player.resource = audioResource;
        player.play(audioResource);
    }
}

async function toNewSong(client, guild) {
    await deleteSongs(client, guild.id);
    const newSong = await getSongs(client, guild.id, 1, 1);
    if (newSong[0]) {
        song = {
            title: newSong[0].TITLE.toString('utf8'),
            url: newSong[0].URL.toString('utf8'),
            user: newSong[0].THUMBNAIL_URL.toString('utf8'),
            thumbnail: newSong[0].LENGTH,
            length: newSong[0].REQUEST_USER.toString('utf8')
        }
        play(client, guild, song);
    }
    else {
        play(client, guild);
    }
}