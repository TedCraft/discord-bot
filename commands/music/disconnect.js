module.exports = {
    name: 'disconnect',
    aliases: ['d'],
    utilisation: '{prefix}disconnect',
    voice: true,
    
    async execute(message, serverQueue) {
        if (!message.member.voice.channel) return message.channel.send(`${message.author} зайди в войс канал`);
        if (!serverQueue) return;
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }
};