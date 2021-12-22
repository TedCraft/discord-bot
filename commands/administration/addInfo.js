const { updateInfo } = require('../../src/database/database');

module.exports = {
    name: 'addinfo',
    aliases: ['addi'],
    voice: false,

    async execute(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(`${message.author} Вы не являетесь администратором!`);
        if (args.length == 0) return message.channel.send(`${message.author} Введите слово!`);

        const info = message.content.slice(message.content.indexOf(args[0]));
        
        await updateInfo(client, message.guild.id, info);
        message.channel.send(`${message.author} Информация добавлена!`);
    }
};