const { getGameType, insertGame, updateGameStart, getGame, deleteGame, insertGamePlayer, deleteGamePlayers, getTownGame } = require('../../src/database/database');
const { msToTime } = require('../../src/utility/time');
const { setTownTimeout } = require('../../src/utility/timer');

module.exports = {
    name: 'startgame',
    aliases: ['startg', 'sg'],
    voice: false,

    async execute(client, message, args) {
        if (args.length == 0) return message.channel.send(`${message.author} Введите название игры!`);
        const time = args[1] != undefined ? args[1].split(":") : [];
        let minutes = !isNaN(parseInt(time[0])) ? parseInt(time[0]) : 5;
        let seconds = !isNaN(parseInt(time[1])) ? parseInt(time[1]) : 0;

        if (seconds > 59 || seconds < 0 || minutes < 0) return message.channel.send(`${message.author} Введите корректное время!`);
        if (minutes > 15) minutes = 15;

        const game = args[0].toLowerCase();
        const gameType = await getGameType(client, game);
        if (!gameType) return message.channel.send(`${message.author} Игры с названием \`${game}\` не существует!`);
        if (await getGame(client, message.channel.id))
            return message.channel.send(`${message.author} Игра с названием \`${game}\` уже зарегестрирована в данном канале!`);

        const msg = await message.channel.send(`Игра \`${game}\` начнётся через ${(minutes < 10) ? "0" + minutes : minutes}:${(seconds < 10) ? "0" + seconds : seconds} (${msToTime(new Date().getTime() + minutes * 60 * 1000 + seconds * 1000 + 3 * 60 * 60 * 1000)}). Если вы хотите принять участие, нажмите на :white_check_mark:`);
        await msg.react("✅");
        await insertGame(client, message.channel.id, message.guild.id, gameType.GAME_TYPE_ID);

        await msg.awaitReactions((reaction, user) => !user.bot && reaction.emoji.name == "✅",
            { time: (minutes * 60 * 1000 + seconds * 1000) })
            .then(async (collected) => {
                const users = collected.first().users.cache.filter(User => !User.bot);
                if (users.size < 2) {
                    msg.edit(`Недостаточно пользователей!`);
                    await deleteGame(client, message.channel.id);
                }
                else {
                    await updateGameStart(client, message.channel.id)
                    for (const user of users) {
                        await insertGamePlayer(client, message.channel.id, user[0]);
                    }
                    msg.edit(`Рыба-карась, игра \`${game}\` началась!`);
                    message.channel.send(`Игрок ${message.author}, начинайте!`);
                    setTownTimeout(client, message.channel.id);
                }
            })
            .catch(async () => {
                msg.edit(`Недостаточно пользователей!`);
                await deleteGame(client, message.channel.id);
            });
    }
};