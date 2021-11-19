const ytdl = require('discord-ytdl-core');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const async = require('async');

module.exports = {
    name: 'play',
    aliases: ['p'],
    utilisation: '{prefix}play [song name/URL/playlist URL]',
    voice: true,

    async execute(client, message, args) {
        Firebird.attach(client.dbOptions, function (err, db) {
            
        });
    },
    
    async execute2(client, message, args) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send(`${message.author} зайди в войс канал`);
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return message.channel.send('Дайте права :)');
        }
        if (count > 100) count = 100;

        let playlist = [];
        const song = {
            title: null,
            url: null,
            user: message.author.username,
            thumbnail: null,
            length: null
        }

        if (url === true) {
            const args = message.content.split(' ');
            if (args[1] == undefined) return;

            if (args[1].match(/^(http|https):\/\/(www\.)?(youtube.com|youtu.be)\/playlist/) != null) {
                const pl = await ytpl(args[1]/*, { limit: Infinity }*/);
                const plSongs = pl.items;
                let songs = [];
                songs = await getSongsData(plSongs, message);
                playlist.push(songs);
                playlist.push(pl.title);
            }
            else if (args[1].match(/^(http|https):\/\/(www\.)?(youtube.com|youtu.be)/) != null) {
                const songInfo = await ytdl.getInfo(args[1]);
                song.title = songInfo.videoDetails.title;
                song.url = songInfo.videoDetails.video_url;
                song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
                song.length = songInfo.videoDetails.lengthSeconds;
            }
            else {
                let str = "";
                for (let i = args[0].length + 1; i < message.content.length; i++) {
                    str += message.content[i];
                }
                const searchResult = await ytsr(str, { limit: 1 });
                const songInfo = await ytdl.getInfo(searchResult.items[0].url);
                song.title = songInfo.videoDetails.title;
                song.url = songInfo.videoDetails.video_url;
                song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
                song.length = songInfo.videoDetails.lengthSeconds;
            }
        }
        else {
            song.title = file_name;
            getAudioDurationInSeconds(`./music/${song.title}.mp3`).then((duration) => {
                song.length = duration;
            });
        }

        if (!serverQueue) {
            const queueContruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true,
            };

            if (playlist.length === 0) {
                for (let i = 0; i < count; i++) {
                    queueContruct.songs.push(song);
                }
            }
            else {
                for (let i = 0; i < count; i++) {
                    playlist[0].forEach(song => {
                        queueContruct.songs.push(song);
                    });
                }
            }

            queue.set(message.guild.id, queueContruct);

            try {
                var connection = await voiceChannel.join();
                queueContruct.connection = connection;

                if (playlist.length === 0) {
                    if (url === true) {
                        count == 1 ?
                            message.channel.send(`\`${song.title}\` добавлена в очередь`) :
                            message.channel.send(`\`${song.title}\` добавлена в очередь (${count})`);
                    }
                }
                else {
                    count == 1 ?
                        message.channel.send(`Плейлист \`${playlist[1]}\` добавлен в очередь`) :
                        message.channel.send(`Плейлист \`${playlist[1]}\` добавлен в очередь (${count})`);
                }
                /*else {
                    count == 1 ?
                        message.channel.send(`\`${song.title.replace(/_/gi, " ")}\` добавлена в очередь`) :
                        message.channel.send(`\`${song.title.replace(/_/gi, " ")}\` добавлена в очередь (${count})`);
                }*/

                play(message.guild, queueContruct.songs[0], queue);
            } catch (err) {
                console.log(err);
                queue.delete(message.guild.id);
                return message.channel.send(err);
            }
        }
        else {
            if (playlist.length === 0) {
                for (let i = 0; i < count; i++) {
                    serverQueue.songs.push(song);
                }
                if (url === true) {
                    count == 1 ?
                        message.channel.send(`\`${song.title}\` добавлена в очередь`) :
                        message.channel.send(`\`${song.title}\` добавлена в очередь (${count})`);
                }
                /*else {
                    return count == 1 ?
                        message.channel.send(`\`${song.title.replace(/_/gi, " ")}}\` добавлена в очередь`) :
                        message.channel.send(`\`${song.title.replace(/_/gi, " ")}}\` добавлена в очередь (${count})`);
                }*/
            }
            else {
                for (let i = 0; i < count; i++) {
                    playlist[0].forEach(song => {
                        serverQueue.songs.push(song);
                    });
                }
                count == 1 ?
                    message.channel.send(`Плейлист \`${playlist[1]}\` добавлен в очередь`) :
                    message.channel.send(`Плейлист \`${playlist[1]}\` добавлен в очередь (${count})`);
            }
        }
    }
};

async function getSongsData(plSongs, message) {
    let songs = [];
    await async.forEach(plSongs, async function (song, callback) {
        let songInfo = await ytdl.getInfo(song.shortUrl);
        let tempSong = {
            title: null,
            url: null,
            user: message.author.username,
            thumbnail: null,
            length: null
        }
        tempSong.title = songInfo.videoDetails.title;
        tempSong.url = songInfo.videoDetails.video_url;
        tempSong.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
        tempSong.length = songInfo.videoDetails.lengthSeconds;
        songs.push(tempSong);
    })

    let metka = true;
    while (metka == true) {
        metka = false;
        for (let i = 0; i < songs.length; i++) {
            if (songs[i].url != plSongs[i].shortUrl) {
                for (let j = i; j < songs.length; j++) {
                    if (songs[i].url === plSongs[j].shortUrl) {
                        let temp = songs[i];
                        songs[i] = songs[j];
                        songs[j] = temp;
                        metka = true;
                        break;
                    }
                }
            }
        }
    }
    return songs;
}

async function play(guild, song, queue) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    if (song.url != null) {
        const dispatcher = serverQueue.connection.play(ytdl(song.url, { filter: "audioonly", opusEncoded: true, highWaterMark: 1 << 25 }), { type: 'opus' })
            .on('finish', () => {
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0], queue);
            })
            .on('error', error => {
                /*serverQueue.voiceChannel.leave();
                queue.delete(guild.id);*/
                console.error(error);
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0], queue);
            });
        dispatcher.setVolume(serverQueue.volume / 5);
    }
    else {
        const dispatcher = serverQueue.connection.play(`./music/${song.title}.mp3`)
            .on('finish', () => {
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0], queue);
            })
            .on('error', error => {
                serverQueue.voiceChannel.leave();
                queue.delete(guild.id);
                console.error(error);
            });
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    }
}