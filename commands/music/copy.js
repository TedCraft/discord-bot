module.exports = {
    name: 'copy',
    aliases: ['c'],
    utilisation: '{prefix}copy [track number] [count]',
    voice: true,
    
    async execute(message, serverQueue) {
        if (!serverQueue) return message.channel.send(`Очередь пуста`);
        const args = message.content.split(" ");
        if (args.length == 0) return message.channel.send("Введите номер трека в очереди");
        else if (args.length == 1) return message.channel.send("Введите количество дубликатов");
    
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
};