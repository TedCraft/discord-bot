const { deleteSongs, getAllSongs } = require('../../src/database/database');

module.exports = {
    name: 'disconnect',
    aliases: ['d'],
    utilisation: '{prefix}disconnect',
    voice: true,
    
    async execute(client, message, args) {
        const voiceChannel = message.guild.me.voice.channel != undefined ? message.guild.me.voice.channel : message.member.voice.channel;
        if (!voiceChannel) return message.channel.send(`${message.author} зайди в войс канал`);
        const serverQueue = await getAllSongs(client, message.guild.id);
        if (serverQueue.length == 0) return message.channel.send(`В очереди пусто`);
 
        deleteSongs(client, message.guild.id, serverQueue.length);
        if (client.connections.get(message.guild.id).dispatcher)
            client.connections.get(message.guild.id).dispatcher.end();
    }
};