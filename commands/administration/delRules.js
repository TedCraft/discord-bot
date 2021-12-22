const { deleteRules } = require('../../src/database/database');

module.exports = {
    name: 'delrules',
    aliases: ['delr'],
    voice: false,

    async execute(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(`${message.author} Вы не являетесь администратором!`);

        await deleteRules(client, message.guild.id);
        message.channel.send(`${message.author} Правила удалены!`);
    }
};