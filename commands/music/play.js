const ytdl = require('discord-ytdl-core');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus,
    createAudioPlayer, AudioPlayerStatus, createAudioResource } = require('@discordjs/voice');
const { insertSong, deleteSongs, getSongs } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { sToTime } = require('../../src/utility/time');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Добавляет композицию в очередь')
        .addStringOption(option =>
            option.setName('song_name')
                .setDescription('Поиск композиции по названию.'))
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Ссылка на композицию или плейлист.'))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Число копий.')
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(client, interaction, songGiven = undefined, replying = true, short = false) {
        if (replying) {
            await interaction.deferReply().catch(err => {
                console.log(err);
            });
        }
        const voiceChannel = interaction.guild.me.voice.channel != undefined ? interaction.guild.me.voice.channel : interaction.member.voice.channel;
        if (!voiceChannel) {
            if (replying) await interaction.editReply({ content: `Ты где :face_with_raised_eyebrow:`, ephemeral: true });
            return;
        }

        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            if (replying) await interaction.editReply({ content: 'Дайте права :)', ephemeral: true });
            return;
        }

        const count = replying ?
            (interaction.options.getInteger('count') != null ? (interaction.options.getInteger('count') < 100 ? interaction.options.getInteger('count') : 100) : 1)
            : 1;

        let song = [];

        const songUrl = songGiven == undefined ? interaction.options.getString('song') : songGiven,
            text = replying ? interaction.options.getString('song_name') : undefined;
        if (!songUrl && !text) {
            if (replying) await interaction.editReply({ content: `Укажите композицию.`, ephemeral: true });
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

                if (!getVoiceConnection(interaction.guild.id) || interaction.guild.me.voice.channel == null) {
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                    });
                    connection.on(VoiceConnectionStatus.Ready, async () => {
                        play(client, interaction.guild, song);
                    });
                }
                if (replying) await interaction.editReply({ content: `Плейлист \`${pl.title}\` добавлен в очередь`, ephemeral: false });
                return;
            }
            else if (songUrl.match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9-_]{11})(?:\S+)?$/) != null) {
                song = await getSong(songUrl, interaction, count, short);
            }
            else {
                if (replying) await interaction.editReply({ content: `Ссылка введена неверно!`, ephemeral: true });
                return;
            }
        }
        else {
            const searchResult = await ytsr(text, { limit: 5 });
            if (searchResult.items.length == 0) {
                if (replying) await interaction.editReply({ content: "Не удалось найти композицию!", ephemeral: true });
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
            if (replying) await interaction.editReply({ content: `Невозможно найти композицию!`, ephemeral: true });
            return;
        }

        if (!getVoiceConnection(interaction.guild.id) || interaction.guild.me.voice.channel == null) {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            connection.on(VoiceConnectionStatus.Ready, async () => {
                await play(client, interaction.guild, song);
            });
        }
        if (replying) {
            count == 1 && !isNaN(parseInt(count)) ?
                await interaction.editReply({ content: `\`${song.title}\` добавлена в очередь`, ephemeral: false }) :
                await interaction.editReply({ content: `\`${song.title}\` добавлена в очередь (${count})`, ephemeral: false });
        }
    }
};

async function getSong(url, interaction, count = 1, short = false) {
    const song = {
        title: null,
        url: null,
        user: interaction.member.nickname != null ? interaction.member.nickname : interaction.member.user.username,
        thumbnail: null,
        length: null,
        short: short
    }

    const songInfo = await ytdl.getBasicInfo(url);
    if (songInfo.videoDetails.isLive || songInfo.videoDetails.title == undefined) return [];

    song.title = songInfo.videoDetails.title;
    song.url = songInfo.videoDetails.video_url;
    song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
    song.length = songInfo.videoDetails.lengthSeconds;

    for (var i = 0; i < count; i++) {
        await insertSong(client, interaction.guild.id, song.title, song.url, song.user, song.thumbnail, song.length, short);
    }
    return song;
}

async function getSongFromInfo(songInfo, interaction, count = 1, short = false) {
    if (songInfo.isLive || songInfo.title == undefined) return [];

    const song = {
        title: null,
        url: null,
        user: interaction.member.nickname != null ? interaction.member.nickname : interaction.user.username,
        thumbnail: null,
        length: null,
        short: short
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
        await insertSong(client, interaction.guild.id, song.title, song.url, song.user, song.thumbnail, song.length, short);
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

            player.on('error', async (error) => {
                console.log(error);
                return;
            });

            player.on(AudioPlayerStatus.Idle, async () => {
                toNewSong(client, guild).catch(err => {
                    console.log(err);
                });
            });
        }

        //console.log(`afade=t=out:st=${song.length > 3 ? (song.length > 45 ? 42 : song.length-3) : 0}:d=${song.length > 5 ? 3 : 0}`)
        const audioResource = createAudioResource(ytdl(song.url, { 
            filter: "audioonly", 
            highWaterMark: 1 << 62,
            dlChunkSize: 0,
            quality: "lowestaudio", 
            opusEncoded: true, 
            encoderArgs: song.short ? ['-to', '00:00:45', '-af', `afade=t=out:st=${song.length > 3 ? (song.length > 45 ? 42 : song.length-3) : 0}:d=${song.length > 5 ? 3 : 0}`] : undefined 
        })); //afade=in:d=3,

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
            user: newSong[0].REQUEST_USER.toString('utf8'),
            thumbnail: newSong[0].THUMBNAIL_URL.toString('utf8'),
            length: newSong[0].LENGTH,
            short: newSong[0].SHORT
        }
        await play(client, guild, song);
    }
    else {
        await play(client, guild);
    }
}