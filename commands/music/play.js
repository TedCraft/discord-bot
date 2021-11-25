const ytdl = require('discord-ytdl-core');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const async = require('async');
const { insertMusic, deleteSongs, getSongs } = require('../../src/database/database');

module.exports = {
    name: 'play',
    aliases: ['p'],
    utilisation: '{prefix}play [song name/URL/playlist URL]',
    voice: true,

    async execute(client, message, args) {
        const voiceChannel = message.guild.me.voice.channel != undefined ? message.guild.me.voice.channel : message.member.voice.channel;
        if (!voiceChannel) return message.channel.send(`${message.author} зайди в войс канал`);

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) return message.channel.send('Дайте права :)');

        const count = !isNaN(parseInt(args[1])) ? args[1] : 1;
        if (count > 100) count = 100;

        let song = [];

        if (args[0] == undefined) return;

        if (args[0].match(/^(http|https):\/\/(www\.)?(youtube.com|youtu.be)\/playlist/) != null) {
            const pl = await ytpl(args[0], { limit: Infinity });
            const plSongs = pl.items;
            song = await getSongPL(plSongs[0], message, voiceChannel.id);
            plSongs.shift();

            for (const i in plSongs) {
                await getSongPL(plSongs[i], message, voiceChannel.id);
            }

            if (!client.connections.get(message.guild.id)) {
                var connection = await voiceChannel.join();
                client.connections.set(message.guild.id, connection);
                play(client, message.guild, song)
            }
            message.channel.send(`Плейлист \`${pl.title}\` добавлен в очередь`);
            return;
        }
        else if (args[0].match(/^(http|https):\/\/(www\.)?(youtube.com|youtu.be)/) != null) {
            song = await getSong(args[0], message, voiceChannel.id, count);
        }
        else {
            let str = "";
            for (let i = args[0].length + 1; i < message.content.length; i++) {
                str += message.content[i];
            }
            const searchResult = await ytsr(str, { limit: 1 });
            song = await getSong(searchResult.items[0].url, message, voiceChannel.id, count);
        }

        if (!client.connections.get(message.guild.id)) {
            var connection = await voiceChannel.join();
            client.connections.set(message.guild.id, connection);
            play(client, message.guild, song)
        }
        count == 1 ?
            message.channel.send(`\`${song.title}\` добавлена в очередь`) :
            message.channel.send(`\`${song.title}\` добавлена в очередь (${count})`);
    }
};

async function getSong(url, message, voiceChannelId, count = 1) {
    const song = {
        title: null,
        url: null,
        user: message.author.username,
        thumbnail: null,
        length: null
    }

    const songInfo = await ytdl.getBasicInfo(url);
    song.title = songInfo.videoDetails.title;
    song.url = songInfo.videoDetails.video_url;
    song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
    song.length = songInfo.videoDetails.lengthSeconds;

    for (var i = 0; i < count; i++) {
        await insertMusic(client, message.guild.id, song.title, song.url, song.user, song.thumbnail, song.length, voiceChannelId);
    }
    return song;
}

async function getSongPL(songInfo, message, voiceChannelId) {
    const song = {
        title: null,
        url: null,
        user: message.author.username,
        thumbnail: null,
        length: null
    }

    song.title = songInfo.title;
    song.url = songInfo.url;
    song.thumbnail = songInfo.bestThumbnail.url;
    song.length = songInfo.durationSec;

    await insertMusic(client, message.guild.id, song.title, song.url, song.user, song.thumbnail, song.length, voiceChannelId);
    return song;
}

async function play(client, guild, song) {
    if (!song) {
        guild.me.voice.channel.leave();
        client.connections.delete(guild.id);
        return;
    }

    if (song.url != null) {
        client.connections.get(guild.id).play(ytdl(song.url, { filter: "audioonly", opusEncoded: true, highWaterMark: 1 << 25 }), { type: 'opus' })
            .on('finish', async () => {
                toNewSong(client, guild, song);
            })
            .on('error', error => {
                console.error(error);
                toNewSong(client, guild, song);
            });
    }
}

async function toNewSong(client, guild, song) {
    await deleteSongs(client, guild.id);
    const newSong = await getSongs(client, guild.id, 1, 1);
    if (newSong[0]) {
        song.title = newSong[0].TITLE.toString('utf8');
        song.url = newSong[0].URL.toString('utf8');
        song.thumbnail = newSong[0].THUMBNAIL_URL.toString('utf8');
        song.length = newSong[0].LENGTH;
        song.user = newSong[0].REQUEST_USER.toString('utf8');
        play(client, guild, song);
    }
    else {
        play(client, guild);
    }
}