const { deleteInfo } = require('../../src/database/database');

module.exports = {
    name: 'delinfo',
    aliases: ['deli'],
    voice: false,

    async execute(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(`${message.author} Вы не являетесь администратором!`);

        await deleteInfo(client, message.guild.id);
        message.channel.send(`${message.author} Информация удалена!`);
    }
};