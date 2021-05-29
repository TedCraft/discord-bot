const ytdl = require('ytdl-core');
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

    const song = {
        title: null,
        url: null,
        user: message.author.username,
        thumbnail: null,
        length: null
    }
    if (url === true) {
        const args = message.content.split(' ');
        const songInfo = await ytdl.getInfo(args[1]);
        song.title = songInfo.videoDetails.title;
        song.url = songInfo.videoDetails.video_url;
        song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
        song.length = songInfo.videoDetails.lengthSeconds;
    }
    else {
        song.title = file_name;
        getAudioDurationInSeconds(`./music/${song.title}.mp3`).then((duration) =>{
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

        queue.set(message.guild.id, queueContruct);

        for (let i = 0; i < count; i++) {
            queueContruct.songs.push(song);
        }

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            if (url === true) {
                count == 1 ?
                    message.channel.send(`\`${song.title}\` добавлена в очередь`) :
                    message.channel.send(`\`${song.title}\` добавлена в очередь (${count})`);
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
        for (let i = 0; i < count; i++) {
            serverQueue.songs.push(song);
        }
        if (url === true) {
            return count == 1 ?
                message.channel.send(`\`${song.title}\` добавлена в очередь`) :
                message.channel.send(`\`${song.title}\` добавлена в очередь (${count})`);
        }
        /*else {
            return count == 1 ?
                message.channel.send(`\`${song.title.replace(/_/gi, " ")}}\` добавлена в очередь`) :
                message.channel.send(`\`${song.title.replace(/_/gi, " ")}}\` добавлена в очередь (${count})`);
        }*/
    }
}

function skip(message, serverQueue, count = 1) {
    if (!message.member.voice.channel) return message.channel.send(`${message.author} зайди в войс канал`);
    if (!serverQueue) return message.channel.send(`В очереди пусто`);

    if (count > serverQueue.songs.length) count = serverQueue.songs.length;
    else if (count === "all") count = serverQueue.songs.length;
    serverQueue.songs.splice(0, count - 1);

    if (serverQueue.connection.dispatcher)
        serverQueue.connection.dispatcher.end();
}

function disconnect(message, serverQueue) {
    if (!message.member.voice.channel) return message.channel.send(`${message.author} зайди в войс канал`);
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function nowPlaying(message, serverQueue) {
    if (!serverQueue) return message.channel.send(`Сейчас ничего не играет`);

    const embed = new Discord.MessageEmbed();
    embed.setColor('RANDOM');
    embed.setTitle('Сейчас играет');

    var str = "";
    if (serverQueue.songs[0].url != null) {
        str += (`\`${serverQueue.songs[0].title}\`\n\n`);
    }
    else {
        str += (`\`${serverQueue.songs[0].title.replace(/_/gi, " ")}\`\n\n`);
    }
    var curTime = msToTime(serverQueue.connection.dispatcher.streamTime)
    var lenTime = sToTime(serverQueue.songs[0].length);
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
    var str = "";
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

    return hours + ":" + minutes + ":" + seconds;
}

module.exports.add = add;
module.exports.skip = skip;
module.exports.disconnect = disconnect;
module.exports.nowPlaying = nowPlaying;
module.exports.getQueue = getQueue;