const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const Discord = require("discord.js");
const { getAudioDurationInSeconds } = require('get-audio-duration');

async function add(message, serverQueue, queue, count = 1, url = true, file_name = "") {
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
            const pl = await ytpl(args[1]);
            const plSongs = pl.items;
            let songs = [];
            for (let i = 0; i < plSongs.length; i++) {
                let songInfo = await ytdl.getInfo(plSongs[i].url);
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
                tempSong.length = sToTime(songInfo.videoDetails.lengthSeconds);
                songs.push(tempSong);
            }
            playlist.push(songs);
            playlist.push(pl.title);
        }
        else if (args[1].match(/^(http|https):\/\/(www\.)?(youtube.com|youtu.be)/) != null) {
            const songInfo = await ytdl.getInfo(args[1]);
            song.title = songInfo.videoDetails.title;
            song.url = songInfo.videoDetails.video_url;
            song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
            song.length = sToTime(songInfo.videoDetails.lengthSeconds);
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
            song.length = sToTime(songInfo.videoDetails.lengthSeconds);
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
                queueContruct.songs = playlist[0];
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
                serverQueue.songs = playlist[0];
            }
            count == 1 ?
                message.channel.send(`Плейлист \`${playlist[1]}\` добавлен в очередь`) :
                message.channel.send(`Плейлист \`${playlist[1]}\` добавлен в очередь (${count})`);
        }
    }
}

function skip(message, serverQueue, count = 1) {
    if (!message.member.voice.channel) return message.channel.send(`${message.author} зайди в войс канал`);
    if (!serverQueue) return message.channel.send(`В очереди пусто`);

    if (count === "all") count = serverQueue.songs.length;
    else if (parseInt(count) > serverQueue.songs.length) count = serverQueue.songs.length;
    serverQueue.songs.splice(0, count - 1);

    if (serverQueue.connection.dispatcher)
        serverQueue.connection.dispatcher.end();
}

function disconnect(message, serverQueue) {
    if (!message.member.voice.channel) return message.channel.send(`${message.author} зайди в войс канал`);
    if (!serverQueue) return;
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function nowPlaying(message, serverQueue) {
    if (!serverQueue) return message.channel.send(`Сейчас ничего не играет`);

    const embed = new Discord.MessageEmbed();
    embed.setColor('RANDOM');
    embed.setTitle('Сейчас играет');

    let str = "";
    if (serverQueue.songs[0].url != null) {
        str += (`\`${serverQueue.songs[0].title}\`\n\n`);
    }
    else {
        str += (`\`${serverQueue.songs[0].title.replace(/_/gi, " ")}\`\n\n`);
    }
    let curTime = msToTime(serverQueue.connection.dispatcher.streamTime)
    let lenTime = serverQueue.songs[0].length;
    while (lenTime.length > 4) {
        if (lenTime[0] === '0' || lenTime[0] === ':') {
            curTime = curTime.slice(1);
            lenTime = lenTime.slice(1);
        }
        else {
            break;
        }
    }
    str += `\`${curTime} / ${lenTime}\``
    embed.setDescription(str);

    embed.setFooter(`от ${serverQueue.songs[0].user}`);

    if (serverQueue.songs[0].thumbnail != null) {
        embed.setThumbnail(serverQueue.songs[0].thumbnail);
    }

    message.channel.send(embed);
}

async function getQueue(message, serverQueue) {
    if (!serverQueue) return message.channel.send(`Очередь пуста`);
    let str = "";
    for (let i = 0; i < (serverQueue.songs.length < 10 ? serverQueue.songs.length : 10); i++) {
        if (serverQueue.songs[i].url != null) {
            str += `${i + 1}. \`${serverQueue.songs[i].title}\` от \`${serverQueue.songs[i].user}\`\n`;
        }
        else {
            str += `${i + 1}. \`${serverQueue.songs[i].title.replace(/_/gi, " ")}\` от \`${serverQueue.songs[i].user}\`\n`;
        }
        str += '---------------------------------------------------------------------------------------------';
        if (i < serverQueue.songs.length - 1) {
            str += '\n'
        }
    }
    message.channel.send(str);
}

function copy(message, serverQueue) {
    if (!serverQueue) return message.channel.send(`Очередь пуста`);
    const args = message.content.split(" ");
    if (args.length == 1) return message.channel.send("Введите номер трека в очереди");
    else if (args.length == 2) return message.channel.send("Введите количество дубликатов");

    let index = 0;
    if (args[1].toLowerCase() == "last" || args[1].toLowerCase() == "l") index = serverQueue.songs.length - 1;
    else {
        if (!isNaN(parseInt(args[1]))) index = parseInt(args[1]) - 1;
        else return Error;
    }

    let count = 0;
    if (!isNaN(parseInt(args[2]))) count = parseInt(args[2]);
    else return Error;
    if (count > 100) count = 100;

    for (let i = 0; i < count; i++) {
        serverQueue.songs.push(serverQueue.songs[index]);
    }
    message.channel.send(`Песня \`${serverQueue.songs[index].title}\` продублирована \`${count} раз\``)
}

async function play(guild, song, queue) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    if (song.url != null) {
        const dispatcher = serverQueue.connection.play(ytdl(song.url, { filter: "audioonly", quality: 'highestaudio' }))
            .on('finish', () => {
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0], queue);
            })
            .on('error', error => {
                serverQueue.voiceChannel.leave();
                queue.delete(guild.id);
                console.error(error);
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

function msToTime(duration) {
    var seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

function sToTime(duration) {
    var minutes = parseInt((duration / 60) % 60)
        , seconds = parseInt(duration - minutes * 60)
        , hours = parseInt((duration / (60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

module.exports.add = add;
module.exports.skip = skip;
module.exports.disconnect = disconnect;
module.exports.nowPlaying = nowPlaying;
module.exports.getQueue = getQueue;
module.exports.copy = copy;