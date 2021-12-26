const { deleteSongs, getAllSongs } = require('../../src/database/database');

module.exports = {
    name: 'disconnect',
    aliases: ['d'],
    voice: true,

    async execute(client, message, args) {
        const voiceChannel = message.guild.me.voice.channel != undefined ? message.guild.me.voice.channel : message.member.voice.channel;
        if (!voiceChannel) return message.channel.send(`${message.author} зайди в войс канал`);
        
        const serverQueue = await getAllSongs(client, message.guild.id);
        await deleteSongs(client, message.guild.id, serverQueue.length);
        if (!client.connections.get(message.guild.id) || !client.connections.get(message.guild.id).dispatcher) return message.channel.send(`${message.author} Бот ничего не играет!`);

        client.connections.get(message.guild.id).dispatcher.end();
    }
};