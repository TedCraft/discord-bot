const { deleteSongs, getAllSongs } = require('../../src/database/database');

module.exports = {
    name: 'skip',
    aliases: ['s'],
    utilisation: '{prefix}skip',
    voice: true,

    async execute(client, message, args) {
        const voiceChannel = message.guild.me.voice.channel != undefined ? message.guild.me.voice.channel : message.member.voice.channel;
        if (!voiceChannel) return message.channel.send(`${message.author} зайди в войс канал`);
        const serverQueue = await getAllSongs(client, message.guild.id);
        if (serverQueue.length == 0) return message.channel.send(`${message.author} В очереди пусто`);

        let count = 1;
        if (args[0] === "all") count = serverQueue.length;
        else if (parseInt(args[0]) != 0 && parseInt(args[0]) != undefined && !isNaN(parseInt(args[0]))) count = parseInt(args[0]);
        deleteSongs(client, message.guild.id, count - 1);

        if (client.connections.get(message.guild.id).dispatcher)
            client.connections.get(message.guild.id).dispatcher.end();
    }
};