const { getRules } = require('../../src/database/database');

module.exports = {
    name: 'rules',
    aliases: [],
    voice: false,

    async execute(client, message, args) {
        const server = await getRules(client, message.guild.id);

        if (server) {
            message.channel.send(server.RULES.toString('utf8'));
        }
        else {
            message.channel.send(`${message.author} Похоже, правил на сервере нет.`);
        }
    }
};