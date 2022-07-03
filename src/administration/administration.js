const { getBadWords, getUsersBDAYId, getUserBDAYServers,
    getServerCommands, getGame, getGamePlayers,
    getTownsGame, insertGameTown, updateGameTurn,
    getTownAndAlts, getTownGame, getLastTownGame } = require('../database/database');
const { MessageAttachment } = require('discord.js');
const { replaceWith } = require('../utility/string');
const { setTownTimeout } = require('../utility/timer');
const { get } = require('got');

module.exports = {
    async checkBadWordsAbsolute(client, guildId, args) {
        const badWords = await getBadWords(client, guildId);
        for (const i in args) {
            if (badWords.includes(args[i])) return true;
        }
        return false;
    },

    async checkBadWordsRelative(client, guildId, args) {
        const badWords = await getBadWords(client, guildId);
        for (const i in args) {
            for (const j in badWords) {
                if (args[i].includes(badWords[j])) return args[i];
            }
        }
        return undefined;
    },

    async checkBadWordsStroke(client, guildId, str) {
        var args = str.trim().split(/ +/g);
        const badWords = await getBadWords(client, guildId);
        for (const i in args) {
            badWords.forEach(function (element) {
                if (args[i].toLowerCase().includes(element))
                    args[i] = replaceWith(args[i], args[i].indexOf(element), "*".repeat(element.length));
            });
        }
        let newStr = "";
        for (const i in args) {
            newStr += args[i] + " ";
        }
        newStr = newStr.slice(0, -1);
        return newStr;
    },

    async checkBirthDays(client) {
        const date = new Date();
        const dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`

        console.log(`\n${dateString} Check birthdays...`);
        const usersID = await getUsersBDAYId(client);
        for (const i in usersID) {
            const serversID = await getUserBDAYServers(client, usersID[i]);
            for (const j in serversID) {
                const guild = client.guilds.cache.get(serversID[j].SERVER_ID.toString('utf8'));
                const role = guild.roles.cache.get(serversID[j].BIRTHDAY_ROLE.toString('utf8'));
                const member = await guild.members.fetch(usersID[i]);
                if (!member.roles.cache.has(role.id)) {
                    member.roles.add(role);
                    console.log(`${dateString} Give ${member.user.username} on ${guild.name} role ${role.name}`);
                    member.user.send('С днём рождения! :partying_face:');
                }
            }
        }

        date.setDate(date.getDate() - 1);
        const usersOldID = await getUsersBDAYId(client, date)
        for (const i in usersOldID) {
            const serversID = await getUserBDAYServers(client, usersOldID[i]);
            for (const j in serversID) {
                const guild = client.guilds.cache.get(serversID[j].SERVER_ID.toString('utf8'));
                const role = guild.roles.cache.get(serversID[j].BIRTHDAY_ROLE.toString('utf8'));
                const member = await guild.members.fetch(usersOldID[i]);
                if (member.roles.cache.has(role.id)) {
                    member.roles.remove(role);
                    console.log(`${dateString} Remove ${member.user.username} on ${guild.name} role ${role.name}`);
                }
            }
        }
        console.log(`${dateString} Birthdays check successfull!`);
    },

    async checkCustomCommands(client, serverId, command) {
        const commands = await getServerCommands(client, serverId);
        return commands.find(cmd => cmd.COMMAND.toString('utf8') && cmd.COMMAND.toString('utf8') == command);
    },

    async checkGame(client, message) {
        const game = await getGame(client, message.channelId);
        if (!game || !game.IS_START) return;

        const gamePlayers = await getGamePlayers(client, message.channelId);
        if (gamePlayers[game.TURN - 1].USER_ID.toString('utf8') != message.author.id)
            return message.reply(`Сейчас не ваша очередь!`);

        const args = message.content.trim().split(/ +/g);
        const place = await getTownAndAlts(client, args[0].toLowerCase());
        if (!place) return message.reply(`Такого города нет!`);

        const town = await getTownGame(client, message.channelId, place.TOWN_ID);
        if (town) return message.reply(`Город \`${args[0]}\` уже был!`);

        const lastTown = await getLastTownGame(client, message.channelId)
        const letters = ["ь", "ъ", "ы"];
        if (lastTown) {
            const lastTownName = lastTown.GAME_NAME.toString('utf8');
            const letter = !letters.includes(lastTownName.slice(-1)) ? lastTownName.slice(-1) : lastTownName.slice(-2, -1);
            if (args[0][0].toLowerCase() != letter) return message.reply(`Город должен начинаться с буквы \`${letter.toUpperCase()}\`!`);
        }

        await insertGameTown(client, message.channelId, place.TOWN_ID, args[0]);
        try {
            clearInterval(client.timers.get(message.channelId));
        }
        catch (ex) {
            console.log(ex);
        }
        const newTurn = game.TURN == gamePlayers.length ? 1 : game.TURN + 1;
        await updateGameTurn(client, message.channelId, newTurn)
        setTownTimeout(client, message);
        message.channel.send(`<@${gamePlayers[newTurn - 1].USER_ID.toString('utf8')}> Напишите город на букву \`${(!letters.includes(args[0].slice(-1)) ? args[0].slice(-1) : args[0].slice(-2, -1)).toUpperCase()}\`!`);
    },

    async executeCustomCommands(client, interaction, command) {
        await interaction.deferReply();
        const channel = interaction.channel;
        let str;
        const image = [];
        if (command.IMAGE_URL) {
            image.push(new MessageAttachment(command.IMAGE_URL.toString('utf8')));
        }
        if (command.TEXT) {
            str = command.TEXT.toString('utf8');
        }
        const mark = (str != undefined || image.length != 0);
        if (command.SONG_URL) {
            const cmd = client.commands.get("play");
            cmd.execute(client, interaction, command.SONG_URL.toString('utf8'), !mark).catch(err => {
                console.log(err);
            });
        }
        if (mark) {
            await interaction.editReply({ content: str, files: image, ephemeral: false });
        }
    },
};

async function checkCorrectPlace(place) {
    return new Promise(resolve => {
        const statements = ["city", "town", "village", "hamlet"];
        const cityStates = ["сингапур", "монако", "ватикан", "гибралтар", "гонконг", "макао", "мелилья", "сеута"];
        if (cityStates.includes(place)) resolve(place);
        get(`https://nominatim.openstreetmap.org/search?q=${place}&format=jsonv2&extratags=1&limit=3`, { responseType: 'json' })
            .then(res => {
                const json = res.body;
                if (json.length == 0) resolve(undefined);

                for (const i in json) {
                    if (statements.includes(json[i]["type"]) || statements.includes(json[i]["extratags"]["linked_place"]) ||
                        statements.includes(json[i]["extratags"]["place"])) {
                        resolve(json[i]["display_name"].split(",")[0].toLowerCase());
                    }
                }
                resolve(undefined);
            })
            .catch(err => {
                console.log(err);
            });
    });
}