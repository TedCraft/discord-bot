const { deleteServerCommand, getServerCommand } = require('../../src/database/database');
const { loadImage } = require('canvas')

module.exports = {
    name: 'delcustomcommand',
    aliases: ['delcm'],
    voice: false,

    async execute(client, message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR'))
            return message.channel.send(`${message.author} Вы не являетесь администратором!`);
        if (args.length == 0) return message.channel.send(`${message.author} Введите команду!`);

        const command = args.shift().toLowerCase();
        
        const commands = await getServerCommand(client, message.guild.id, command);
        if (commands.length == 0) 
            return message.channel.send(`${message.author} Команды ${command} не существует!`)

        await deleteServerCommand(client, message.guild.id, command);

        message.channel.send(`Команда \`${command}\` удалена!`);
    }
};