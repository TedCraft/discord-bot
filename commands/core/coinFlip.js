const { getRandomInRange } = require('../../src/utility/random');

module.exports = {
    name: 'coinflip',
    aliases: ['cf'],
    voice: false,

    async execute(client, message, args) {
        if(getRandomInRange(1, 2) == 1) {
            message.channel.send(`${message.author} Орёл!`);
        }
        else {
            message.channel.send(`${message.author} Решка!`);
        }
    }
};