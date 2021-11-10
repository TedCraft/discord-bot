module.exports = {
    name: 'skip',
    aliases: ['s'],
    utilisation: '{prefix}skip',
    voice: true,
    
    async execute(message, serverQueue, queue, count = 1) {
        if (!message.member.voice.channel) return message.channel.send(`${message.author} зайди в войс канал`);
        if (!serverQueue) return message.channel.send(`В очереди пусто`);
    
        if (count === "all") count = serverQueue.songs.length;
        else if (parseInt(count) > serverQueue.songs.length) count = serverQueue.songs.length;
        serverQueue.songs.splice(0, count - 1);
    
        if (serverQueue.connection.dispatcher)
            serverQueue.connection.dispatcher.end();
    }
};