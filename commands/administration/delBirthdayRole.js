const { deleteServerBdayRole } = require('../../src/database/database');

module.exports = {
    name: 'delbirthdayrole',
    aliases: ['delbdayrole', 'delbr'],
    voice: false,

    async execute(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(`${message.author} Вы не являетесь администратором!`);
        
        await deleteServerBdayRole(client, message.guild.id);
        
        message.channel.send(`Роль удалена!`);
    }
};