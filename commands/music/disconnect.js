const { deleteSongs, getAllSongs } = require('../../src/database/database');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'disconnect',
    aliases: ['d'],
    voice: true,

    async execute(client, message, args) {
        const voiceChannel = message.guild.me.voice.channel != undefined ? message.guild.me.voice.channel : message.member.voice.channel;
        if (!voiceChannel) return message.channel.send(`${message.author} зайди в войс канал`);
        
        const serverQueue = await getAllSongs(client, message.guild.id);
        await deleteSongs(client, message.guild.id, serverQueue.length);
        if (!getVoiceConnection(message.guild.id)) return message.channel.send(`${message.author} Бот ничего не играет!`);

        getVoiceConnection(message.guild.id).destroy();
        client.audioPlayers.get(message.guild.id).stop();
    }
};