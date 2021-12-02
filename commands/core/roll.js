const {getRandomInRange} = require('../../src/utility/random');

module.exports = {
    name: 'roll',
    aliases: [],
    voice: false,
    
    async execute(client, message, args) {
        try {
            if (args.length === 0) {
                message.channel.send(`${message.author} rolls (1-100): ${getRandomInRange(1, 100)}`);
            }
            else if (args.length === 1) {
                if (!isNaN(parseInt(args[0])))
                    message.channel.send(`${message.author} rolls (1-${parseInt(args[0])}): ${getRandomInRange(1, parseInt(args[0]))}`);
                else
                    message.channel.send(`${message.author} rolls (1-100): ${getRandomInRange(1, 100)}`);
            }
            else {
                if (!isNaN(parseInt(args[0])) && !isNaN(parseInt(args[1])))
                    message.channel.send(`${message.author} rolls (${parseInt(args[0])}-${parseInt(args[1])}): ${getRandomInRange(parseInt(args[0]), parseInt(args[1]))}`);

                else if (!isNaN(parseInt(args[0])))
                    message.channel.send(`${message.author} rolls (1-${parseInt(args[0])}): ${getRandomInRange(1, parseInt(args[0]))}`);

                else
                    message.channel.send(`${message.author} rolls (1-100): ${getRandomInRange(1, 100)}`);
            }
        }
        catch (err) {
            console.log(err);
        };
    }
};