const { checkBadWordsRelative, checkGame } = require('../../src/administration/administration');
const { replaceWith } = require('../../src/utility/string');

module.exports = async (client, message) => {
    if (message.author.bot || message.channel.type === 'dm') return;

    if (await checkMessage(client, message)) return;
    await checkGame(client, message);
};

async function checkMessage(client, message) {
    const args = message.content.toLowerCase().trim().split(/ +/g);
    const badWord = await checkBadWordsRelative(client, message.guild.id, args)
    if (badWord != undefined) {
        message.author.send(`Слово ||\`${badWord}\`|| на сервере ${message.guild.name} запрещено!`).catch(err => { });
        message.delete();
        return true;
    }
    return false;
}