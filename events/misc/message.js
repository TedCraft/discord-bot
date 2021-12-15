const { checkBadWordsRelative, checkCustomCommands, executeCustomCommands } = require('../../src/administration/administration');

module.exports = async (client, message) => {
    if (message.author.bot || message.channel.type === 'dm') return;

    const prefix = client.config.app.prefix;
    if (await checkMessage(client, message, prefix)) return;
    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);

    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));

    if (cmd) {
        cmd.execute(client, message, args).catch(err => {
            message.channel.send("Отказано");
            console.log(err);
        });
        return;
    }
    
    const customCmd = await checkCustomCommands(client, message.guild.id, command);
    if (customCmd) {
        executeCustomCommands(client, message, customCmd).catch(err => {
            message.channel.send("Отказано");
            console.log(err);
        });
    }
};

async function checkMessage(client, message, prefix) {
    const args = message.content.toLowerCase().trim().split(/ +/g);
    if (args[0].slice(prefix.length).toLowerCase() != "deletebw" && args[0].slice(prefix.length).toLowerCase() != "delbw") {
        if (await checkBadWordsRelative(client, message.guild.id, args)) {
            message.channel.send(`${message.author} Сообщение содержит запрещённое слово!`);
            message.delete();
            return true;
        }
    }
    return false;
}