const { insertSong, getAllSongs } = require('../../src/database/database');

module.exports = {
    name: 'copy',
    aliases: ['c'],
    utilisation: '{prefix}copy [track number] [count]',
    voice: true,

    async execute(client, message, args) {
        const serverQueue = await getAllSongs(client, message.guild.id);
        if (serverQueue.length == 0) return message.channel.send(`${message.author} В очереди пусто`);

        if (args.length == 0) return message.channel.send(`${message.author} Введите номер композиции в очереди`);
        else if (args.length == 1) return message.channel.send(`${message.author} Введите количество дубликатов`);

        let index = 0;
        if (args[0].toLowerCase() == "last" || args[0].toLowerCase() == "l") index = serverQueue.length - 1;
        else if (!isNaN(parseInt(args[0])) && parseInt(args[0]) <= serverQueue.length) index = parseInt(args[0]) - 1;
        else {
            message.channel.send(`${message.author} Композиция под номером ${index+1} не найдена`);
            return;
        }

        let count = 0;
        if (!isNaN(parseInt(args[1]))) count = parseInt(args[1]);
        if (count > 100) count = 100;
        
        for (let i = 0; i < count; i++) {
            insertSong(client, message.guild.id, 
                serverQueue[index].TITLE.toString('utf8'), 
                serverQueue[index].URL.toString('utf8'), 
                serverQueue[index].REQUEST_USER.toString('utf8'), 
                serverQueue[index].THUMBNAIL_URL.toString('utf8'), 
                serverQueue[index].LENGTH, 
                serverQueue[index].CHANNEL_ID.toString('utf8'));
        }
        message.channel.send(`Песня \`${serverQueue[index].TITLE.toString('utf8')}\` продублирована \`${count} раз\``)
    }
};