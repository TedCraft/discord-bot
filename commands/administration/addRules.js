const { updateRules } = require('../../src/database/database');

module.exports = {
    name: 'addrules',
    aliases: ['addr'],
    voice: false,

    async execute(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(`${message.author} Вы не являетесь администратором!`);
        if (args.length == 0) return message.channel.send(`${message.author} Введите слово!`);

        const rules = message.content.slice(message.content.indexOf(args[0]));
        
        await updateRules(client, message.guild.id, rules);
        message.channel.send(`${message.author} Правило добавлено!`);
    }
};