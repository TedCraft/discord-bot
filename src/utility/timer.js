const { deleteGamePlayer, deleteGame, deleteGamePlayers, deleteGameTowns, updateGameTurn, getGamePlayers, getGame } = require('../database/database');

module.exports = {
    setTownTimeout(client, message) {
        client.timers.set(message.channel.id, setTimeout(async (client, message) => {
            const game = await getGame(client, message.channel.id);
            if (!game || !game.IS_START) return;
            
            await deleteGamePlayer(client, message.channel.id, game.TURN)
    
            const gamePlayers = await getGamePlayers(client, message.channel.id);
            if (gamePlayers.length == 1) {
                await deleteGamePlayers(client, message.channel.id);
                await deleteGameTowns(client, message.channel.id);
                await deleteGame(client, message.channel.id);
                return message.channel.send(`<@${gamePlayers[0].USER_ID.toString('utf8')}> Поздравляю, ты победили! :partying_face:`);
            }

            const newTurn = game.TURN == gamePlayers.length ? 1 : game.TURN++;
            await updateGameTurn(client, message.channel.id, newTurn);
            message.channel.send(`<@${gamePlayers[newTurn - 1].USER_ID.toString('utf8')}> Напишите город на букву ${letter}!`);
            setTownTimeout(client, message);
        }, 2 * 60 * 1000, client, message));
    }
};