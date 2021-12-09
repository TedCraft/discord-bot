const { updateBirthdayUser, getUser } = require('../../src/database/database');

module.exports = {
    name: 'setbirthday',
    aliases: ['setbday'],
    voice: false,

    async execute(client, message, args) {
        if (args.length == 0) return message.channel.send(`${message.author} Введите дату!`);
        if (args[1] == undefined || isNaN(parseInt(args[1])) ||
            parseInt(args[1]) < 1 || parseInt(args[1]) > 12) {
            return message.channel.send(`${message.author} Введите корректный месяц!`);
        }
        if (args[0] == undefined || isNaN(parseInt(args[0])) ||
            parseInt(args[0]) < 1 || parseInt(args[0]) > new Date(0, parseInt(args[1]) + 1, 0).getDate()) {
            return message.channel.send(`${message.author} Введите корректный день!`);
        }

        const user = await getUser(client, message.author.id);
        if (user.LAST_CHANGE_BDAY != null && Math.ceil((Date.now() - new Date(user.LAST_CHANGE_BDAY)) / (1000 * 60 * 60 * 24)) < 356)
            return message.channel.send(`${message.author} Дату рождения можно менять раз в год!`)

        await updateBirthdayUser(client, message.author.id, `${args[0]}.${args[1]}.${new Date().getFullYear()}`);

        message.channel.send(`${message.author} Дата рождения установлена!`);
    }
};