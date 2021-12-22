const { getInfo } = require('../../src/database/database');

module.exports = {
    name: 'info',
    aliases: [],
    voice: false,

    async execute(client, message, args) {
        const server = await getInfo(client, message.guild.id);

        if (server) {
            message.channel.send(server.INFO.toString('utf8'));
        }
        else {
            message.channel.send(`${message.author} Похоже, информации о сервере нет.`);
        }
    }
};