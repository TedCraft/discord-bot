const { insertBadWord } = require('../../src/database/database');

module.exports = {
    name: 'addbadword',
    aliases: ['addbw'],
    voice: false,

    async execute(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(`${message.author} Вы не являетесь администратором!`);
        if (args.length == 0) return message.channel.send(`${message.author} Введите слово!`);

        await insertBadWord(client, message.guild.id, args[0].toLowerCase());
        message.channel.send(`Слово \`${args[0]}\` добавлено в чёрный список`);
    }
};