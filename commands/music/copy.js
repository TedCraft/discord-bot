const { insertSong, getAllSongs } = require('../../src/database/database');

module.exports = {
    name: 'copy',
    aliases: ['c'],
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
            message.channel.send(`${message.author} Композиция под номером ${index + 1} не найдена`);
            return;
        }

        let count = 0;
        if (!isNaN(parseInt(args[1]))) count = parseInt(args[1]);
        if (count > 100) count = 100;

        var elem;
        let ix = 0;
        for (const i in serverQueue) {
            if (ix == index) {
                elem = serverQueue[i];
                break;
            }
            else {
                ix++;
            }
        }
        for (let i = 0; i < count; i++) {
            insertSong(client, message.guild.id,
                elem.TITLE.toString('utf8'),
                elem.URL.toString('utf8'),
                elem.REQUEST_USER.toString('utf8'),
                elem.THUMBNAIL_URL.toString('utf8'),
                elem.LENGTH);
        }
        message.channel.send(`Песня \`${elem.TITLE.toString('utf8')}\` продублирована \`${count} раз\``)
    }
};