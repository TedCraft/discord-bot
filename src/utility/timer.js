const { deleteGamePlayer, deleteGame, deleteGamePlayers, deleteGameTowns, updateGameTurn, getGamePlayers, getGame, getTownsGame } = require('../database/database');

module.exports = {
    setTownTimeout(client, message) {
        client.timers.set(message.channel.id, setTimeout(async (client, message) => {
            const game = await getGame(client, message.channel.id);
            if (!game || !game.IS_START) return; 
            
            let gamePlayers = await getGamePlayers(client, message.channel.id);
            message.channel.send(`<@${gamePlayers[game.TURN - 1].USER_ID.toString('utf8')}> Время вышло, передаю ход следующему игроку!`);
            await deleteGamePlayer(client, message.channel.id, game.TURN);
    
            gamePlayers.splice(game.TURN - 1);
            if (gamePlayers.length == 1) {
                await deleteGamePlayers(client, message.channel.id);
                await deleteGameTowns(client, message.channel.id);
                await deleteGame(client, message.channel.id);
                return message.channel.send(`<@${gamePlayers[0].USER_ID.toString('utf8')}> Поздравляю, вы победили! :partying_face:`);
            }
            
            const towns = await getTownsGame(client, message.channel.id);
            const letters = ["ь", "ъ", "ы"];
            const letter = !letters.includes(towns[towns.length - 1].slice(-1)) ? towns[towns.length - 1].slice(-1) : towns[towns.length - 1].slice(-2, -1);
            
            const newTurn = game.TURN == gamePlayers.length ? 1 : game.TURN++;
            await updateGameTurn(client, message.channel.id, newTurn);
            message.channel.send(`<@${gamePlayers[newTurn - 1].USER_ID.toString('utf8')}> Напишите город на букву ${letter}!`);
            setTownTimeout(client, message);
        }, 1 * 60 * 1000, client, message));
    }
};