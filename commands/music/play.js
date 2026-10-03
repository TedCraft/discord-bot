// const YTDlpWrap = require('yt-dlp-wrap').default;
// const ytDlpWrap = new YTDlpWrap('./yt-dlp.exe');
const { YtDlp } = require('ytdlp-nodejs')
const { createWriteStream, createReadStream } = require('fs');

const prism = require('prism-media');
const ytdl = require("@distube/ytdl-core");
const ytsr = require('@distube/ytsr');
const ytpl = require('@distube/ytpl');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus,
    createAudioPlayer, AudioPlayerStatus, createAudioResource, AudioResource, StreamType } = require('@discordjs/voice');
const { PermissionsBitField } = require('discord.js')
const { insertSong, deleteSongs, getSongs } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { sToTime } = require('../../src/utility/time');
const pathToFfmpeg = require('ffmpeg-static')
const { spawn } = require('node:child_process');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(pathToFfmpeg)
const ytdlp = new YtDlp({
    ffmpegPath: pathToFfmpeg
});
const Readable = require('stream').Readable;
// const agent = ytdl.createAgent(client.config.agent);
// const { Innertube, UniversalCache } = require('youtubei.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Добавляет композицию в очередь')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Ссылка на композицию, плейлист или название.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Число копий.')
                .setMinValue(1)
                .setMaxValue(100))
    ,

    async execute(client, interaction, songGiven = undefined, replying = true, short = false, startTime = 0, playTime = 25) {
        if (replying) {
            await interaction.deferReply().catch(err => {
                console.log(err);
            });
        }
        const voiceChannel = interaction.guild.members.me.voice.channel != undefined ? interaction.guild.members.me.voice.channel : interaction.member.voice.channel;
        if (!voiceChannel) {
            if (replying) await interaction.editReply({ content: `Ты где :face_with_raised_eyebrow:`, ephemeral: true });
            return;
        }

        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
            if (replying) await interaction.editReply({ content: 'Дайте права :)', ephemeral: true });
            return;
        }

        const count = replying ?
            (interaction.options.getInteger('count') != null ? (interaction.options.getInteger('count') < 100 ? interaction.options.getInteger('count') : 100) : 1)
            : 1;

        let song = [];

        const songUrl = songGiven == undefined ? interaction.options.getString('song') : songGiven;
        if (!songUrl) {
            if (replying) await interaction.editReply({ content: `Укажите композицию.`, ephemeral: true });
            return;
        }

        if (songUrl.match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9-_]{34})(?:\S+)?$/) != null) {
            const pl = await ytpl(songUrl, { limit: Infinity });
            const plSongs = pl.items;
            song = await getSongFromInfo(plSongs[0], interaction, count, short, startTime, playTime);
            plSongs.shift();
            for (const i in plSongs)
                await getSongFromInfo(plSongs[i], interaction, count, short, startTime, playTime);

            if (!getVoiceConnection(interaction.guild.id) || interaction.guild.members.me.voice.channel == null) {
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
            song = await getSong(songUrl, interaction, count, short, startTime, playTime);
        }
        else {
            const searchResult = await ytsr(songUrl, { safeSearch: true, limit: 5 });
            if (searchResult.items.length == 0) {
                if (replying) await interaction.editReply({ content: "Не удалось найти композицию!", ephemeral: true });
                return;
            }
            for (const i in searchResult.items) {
                if (searchResult.items[i].isLive || searchResult.items[i].type == "shelf") continue;
                song = await getSongFromInfo(searchResult.items[i], interaction, count, short, startTime, playTime);
                if (song.length == 0) continue;
                break;
            }
        }

        if (song.length == 0) {
            if (replying) await interaction.editReply({ content: `Невозможно найти композицию!`, ephemeral: true });
            return;
        }

        if (!getVoiceConnection(interaction.guild.id) || interaction.guild.members.me.voice.channel == null) {
            const connection = joinVoiceChannel({
                debug: true,
                selfDeaf: false,
                selfMute: false,
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
        // agent 
    });
    if (songInfo.videoDetails.isLive || songInfo.videoDetails.title == undefined) return [];

    song.title = songInfo.videoDetails.title;
    song.url = songInfo.videoDetails.video_url;
    song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
    song.length = songInfo.videoDetails.lengthSeconds;

    for (var i = 0; i < count; i++) {
        await insertSong(client, interaction.guild.id, song.title, song.url, song.user, song.thumbnail, song.length, short, startTime, playTime);
    }
    return song;
}

async function getSongFromInfo(songInfo, interaction, count = 1, short = false, startTime = 0, playTime = 25) {
    if (songInfo.isLive || songInfo.name == undefined) return [];

    const song = {
        title: null,
        url: null,
        user: interaction.member.nickname != null ? interaction.member.nickname : interaction.user.username,
        thumbnail: null,
        length: null,
        short: short,
        startTime: startTime,
        playTime: playTime
    }

    song.title = songInfo.name;
    song.url = songInfo.url;
    song.thumbnail = songInfo.thumbnail;
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
        await insertSong(client, interaction.guild.id, song.title, song.url, song.user, song.thumbnail, song.length, short, startTime, playTime);
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
                // if (!error.toString().includes("write EPIPE")) 
                console.log(error);
                return;
            });

            player.on(AudioPlayerStatus.Idle, async () => {
                toNewSong(client, guild).catch(err => {
                    console.log(err);
                });
            });
        }

        // const { spawn } = require("child_process");
        // const ffmpeg = spawn(pathToFfmpeg,
        //     ["-i", "pipe:3",
        //         "-acodec", "mp3",
        //         "-"],
        //     {
        //         stdio: [
        //             'pipe', 'pipe', 'pipe', 'pipe', 'pipe',
        //         ]
        //     });

        // const download = ytDlpWrap.execStream([
        //         song.url,
        //         '-f',
        //         'bestaudio/best',
        //         '--extract-audio',
        //         // '--audio-quality',
        //         // '0',
        //         // '--concurrent-fragments',
        //         // '16',
        //         // '--buffer-size',
        //         // '16M',
        //         '--no-check-certificate',
        //     ]
        //     )

        // const download = ytdl(song.url, {
        //     filter: "audioonly",
        //     // highWaterMark: 1 << 25,
        //     // dlChunkSize: 0,
        //     // quality: "lowest", 
        //     // agent,
        //     // opusEncoded: true,
        //     // encoderArgs: song.short ? ['-to', '00:00:45', '-af', `afade=t=out:st=${song.length > 3 ? (song.length > 45 ? 42 : song.length - 3) : 0}:d=${song.length > 5 ? 3 : 0}`] : undefined
        // })
        // download.pipe(ffmpeg.stdio[3])
    //     const options = [
    // '--js-runtime', 'node',
    // '--progress-template', '~ytdlp-progress-%(progress)#j',
    // '-x',
    // '--audio-format', 'mp3',
    // '--audio-quality', 'highest',
    // '-o', '-',
    // '--no-playlist',
    // '--progress',
    // '--no-quiet',
    // // We pass postprocessor-args as two distinct elements to completely bypass the Windows CLI parsing bug
    // '--postprocessor-args', `ExtractAudio:-ss ${song.startTime} -t ${song.playTime} -af afade=t=out:st=${song.playTime >= 4 ? song.playTime - 3 : song.playTime}:d=${song.playTime >= 4 ? 3 : 0} -f mp3`
    //     ];
    //     const download = ytdlp.exec(song.url, options);
        const download = ytdlp
        .stream(song.url)
        .filter("audioonly")
        .quality("highest")
        .type("mp3")
        .on("error", (err) => console.log(err.message))
        // .on("progress", (progress) => console.log(progress))
        // .on("data", (err) => console.log(err))
        // .on("end", (err) => console.log(err))
        // .on("stderr", (err) => console.log(err))
        // .on("start", (err) => console.log(err))
        .getStream();

        const startTime = song.startTime > song.length ? 
                song.length - song.playTime > 0 ? song.length - song.playTime : 0
                : song.startTime;
        const command = song.short ?
            // ffmpeg(download).outputFormat("mp3").setStartTime(song.startTime).setDuration(song.playTime).audioFilters(song.playTime >= 4 ? `afade=type=out:start_time=${song.length - song.startTime > song.playTime ? song.playTime - 3 : song.length - song.startTime - 3}:duration=3` : [])
            ffmpeg(download).setStartTime(startTime).setDuration(song.playTime < song.length - startTime ? song.playTime : song.length - startTime).outputFormat("s16le")
            .audioChannels(2)
            .audioFrequency(48000)
            .audioFilters(`afade=type=out:start_time=${song.playTime >= 4 ? song.playTime - 3 : song.playTime}:duration=${song.playTime >= 4 ? 3 : 0}`)
            .pipe()
            : ffmpeg(download)
            .outputFormat("s16le")
            .audioChannels(2)
            .audioFrequency(48000)
            .pipe()

        const audioResource = createAudioResource(command, {
            inputType: StreamType.Raw
        });

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
            short: newSong[0].SHORT,
            startTime: newSong[0].START_TIME,
            playTime: newSong[0].PLAY_TIME
        }
        await play(client, guild, song);
    }
    else {
        await play(client, guild);
    }
}