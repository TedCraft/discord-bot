const ytdl = require('discord-ytdl-core');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const { insertSong, deleteSongs, getSongs } = require('../../src/database/database');

module.exports = {
    name: 'play',
    aliases: ['p'],
    voice: true,

    async execute(client, message, args) {
        const voiceChannel = message.guild.me.voice.channel != undefined ? message.guild.me.voice.channel : message.member.voice.channel;
        if (!voiceChannel) return message.channel.send(`${message.author} зайди в войс канал`);

        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) return message.channel.send('Дайте права :)');

        let count = !isNaN(parseInt(args[1])) ? args[1] : 1;
        if (count > 100) count = 100;

        let song = [];

        if (args[0] == undefined) return;

        if (args[0].match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9-_]{34})(?:\S+)?$/) != null) {
            const pl = await ytpl(args[0], { limit: Infinity });
            const plSongs = pl.items;
            song = await getSongFromInfo(plSongs[0], message, voiceChannel.id);
            plSongs.shift();

            for (const i in plSongs) {
                await getSongFromInfo(plSongs[i], message, voiceChannel.id);
            }

            if (!client.connections.get(message.guild.id) || !client.connections.get(message.guild.id).dispatcher) {
                var connection = await voiceChannel.join();
                client.connections.set(message.guild.id, connection);
                play(client, message.guild, song)
            }
            message.channel.send(`Плейлист \`${pl.title}\` добавлен в очередь`);
            return;
        }
        else if (args[0].match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9-_]{11})(?:\S+)?$/) != null) {
            song = await getSong(args[0], message, voiceChannel.id, count);
        }
        else {
            let str = "";
            for (const i in args) {
                str += args[i] + " ";
            }
            str = str.slice(0, -1);
            const searchResult = await ytsr(str, { limit: 5 });
            if (searchResult.items.length == 0) {
                message.channel.send("Не удалось найти композицию!");
                return;
            }
            for(const i in searchResult.items) {
                if(searchResult.items[i].isLive) continue;
                song = await getSongFromInfo(searchResult.items[i], message, voiceChannel.id);
                break;
            }
        }

        if (!client.connections.get(message.guild.id) || !client.connections.get(message.guild.id).dispatcher) {
            var connection = await voiceChannel.join();
            client.connections.set(message.guild.id, connection);
            play(client, message.guild, song)
        }
        count == 1 && !isNaN(parseInt(count)) ?
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
    if(songInfo.isLive) throw "Streams not allowed!";
    
    song.title = songInfo.videoDetails.title;
    song.url = songInfo.videoDetails.video_url;
    song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
    song.length = songInfo.videoDetails.lengthSeconds;

    for (var i = 0; i < count; i++) {
        await insertSong(client, message.guild.id, song.title, song.url, song.user, song.thumbnail, song.length, voiceChannelId);
    }
    return song;
}

async function getSongFromInfo(songInfo, message, voiceChannelId) {
    if(songInfo.isLive) throw "Streams not allowed!";
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

    await insertSong(client, message.guild.id, song.title, song.url, song.user, song.thumbnail, song.length, voiceChannelId);
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
            .on('finish', () => {
                toNewSong(client, guild, song).catch(err => {
                    console.log(err);
                });
            })
            .on('error', (error) => {
                console.error(error);
                toNewSong(client, guild, song).catch(err => {
                    console.log(err);
                });
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