const { deleteGamePlayer, deleteGame, deleteGamePlayers,
    deleteGameTowns, updateGameTurn, getGamePlayers,
    getGame, getTownsGame, getLastTownGame } = require('../database/database');

module.exports = {
    setTownTimeout(client, message) {
        client.timers.set(message.channelId, setTimeout(async (client, message) => {
            const game = await getGame(client, message.channelId);
            if (!game || !game.IS_START) return;

            const gamePlayers = await getGamePlayers(client, message.channelId);
            if (gamePlayers.length - 1 != 1)
                message.channel.send(`<@${gamePlayers[game.TURN - 1].USER_ID.toString('utf8')}> Время вышло, передаю ход следующему игроку!`);
            await deleteGamePlayer(client, message.channelId, game.TURN);

            gamePlayers.splice(game.TURN - 1, 1);
            if (gamePlayers.length == 1) {
                await deleteGamePlayers(client, message.channelId);
                await deleteGameTowns(client, message.channelId);
                await deleteGame(client, message.channelId);
                message.channel.send(`<@${gamePlayers[gamePlayers.length - 1].USER_ID.toString('utf8')}> Поздравляю, вы победили! :partying_face:`);
            }
            else {
                const newTurn = game.TURN > gamePlayers.length ? 1 : game.TURN;
                await updateGameTurn(client, message.channelId, newTurn);

                const lastTown = await getLastTownGame(client, message.channelId);
                if (lastTown) {
                    const lastTownName = lastTown.GAME_NAME.toString('utf8');
                    const letters = ["ь", "ъ", "ы"];
                    const letter = !letters.includes(lastTownName.slice(-1)) ? lastTownName.slice(-1) : lastTownName.slice(-2, -1);
                    message.channel.send(`<@${gamePlayers[newTurn - 1].USER_ID.toString('utf8')}> Напишите город на букву \`${letter.toUpperCase()}\`!`);
                }
                else {
                    message.channel.send(`<@${gamePlayers[newTurn - 1].USER_ID.toString('utf8')}> Напишите название города!`);
                }

                this.setTownTimeout(client, message);
            }
        }, 1 * 60 * 1000, client, message));
    }
};