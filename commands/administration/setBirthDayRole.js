const { updateBirthDayRole } = require('../../src/database/database');

module.exports = {
    name: 'setbirthdayrole',
    aliases: ['setbdayrole', 'setbr'],
    voice: false,

    async execute(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(`${message.author} Вы не являетесь администратором!`);
        if (args.length == 0 || args[0].match(/^<@&[0-9]+>/) == null) return message.channel.send(`${message.author} Прикрепите роль!`);

        const roleID = args[0].slice(3, -1);
        if (!message.guild.roles.cache.get(roleID).editable) return message.channel.send(`${message.author} Недостаточно прав для выдачи роли ${args[0]}`);

        await updateBirthDayRole(client, message.guild.id, roleID);

        message.channel.send(`Роль ${args[0]} установлена!`);
    }
};