const { deleteBadWord, getBadWord } = require('../../src/database/database');

module.exports = {
    name: 'deletebadword',
    aliases: ['delbw'],
    voice: false,

    async execute(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(`${message.author} Вы не являетесь администратором!`);
        if (args.length == 0) return message.channel.send(`${message.author} Введите слово!`);
            
        const badWordList = await getBadWord(client, message.guild.id, args[0].toLowerCase());
        if (badWordList.length == 0)
            return message.channel.send(`Слова \`${args[0]}\` нет в чёрном списке`);

        await deleteBadWord(client, message.guild.id, args[0].toLowerCase());
        message.channel.send(`Слово \`${args[0]}\` удалено из чёрного списка`);
    }
};