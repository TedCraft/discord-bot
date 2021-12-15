const { getBadWords, getUsersBDAYId, getUserBDAYServers, getServerCommands } = require('../database/database');
const { createCanvas, loadImage } = require('canvas');
const { MessageAttachment } = require('discord.js');

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
                if (args[i].includes(badWords[j])) return true;
            }
        }
        return false;
    },

    async checkBadWordsStroke(client, guildId, str) {
        var args = str.trim().split(/ +/g);
        const badWords = await getBadWords(client, guildId);
        for (const i in args) {
            badWords.forEach(function (element) {
                if (args[i].includes(element))
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
                const member = guild.members.cache.get(usersID[i]);
                member.roles.add(role);
                console.log(`${dateString} Give ${member.user.username} on ${guild.name} role ${role.name}`)
            }
        }

        const usersOldID = await getUsersBDAYId(client, new Date(`${date.getMonth() + 1}.${date.getDate() - 1}`))
        for (const i in usersOldID) {
            const serversID = await getUserBDAYServers(client, usersOldID[i]);
            for (const j in serversID) {
                const guild = client.guilds.cache.get(serversID[j].SERVER_ID.toString('utf8'));
                const role = guild.roles.cache.get(serversID[j].BIRTHDAY_ROLE.toString('utf8'));
                const member = guild.members.cache.get(usersOldID[i]);
                member.roles.remove(role);
                console.log(`${dateString} Remove ${member.user.username} on ${guild.name} role ${role.name}`)
            }
        }
        console.log(`${dateString} Birthdays check successfull!`);
    },

    async checkCustomCommands(client, serverId, command) {
        const commands = await getServerCommands(client, serverId);
        return commands.find(cmd => cmd.COMMAND.toString('utf8') && cmd.COMMAND.toString('utf8') == command);
    },

    async executeCustomCommands(client, message, command) {
        var str;
        var image;
        if (command.IMAGE_URL.toString('utf8') != "null") {
            const img = await loadImage(command.IMAGE_URL.toString('utf8'));
            const canvas = createCanvas(img.width, img.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height);
            image = new MessageAttachment(canvas.createPNGStream());
        }
        if (command.SONG_URL.toString('utf8') != "null") {
            const cmd = client.commands.get("play");
            cmd.execute(client, message, [command.SONG_URL.toString('utf8')]).catch(err => {
                message.channel.send("Отказано");
                console.log(err);
            });
        }
        if (command.TEXT.toString('utf8') != "null") {
            str = command.TEXT.toString('utf8');
        }
        
        if(str||image) {
            message.channel.send(str, image);
        }
    },
};

function replaceWith(str, index, replacement) {
    return str.substr(0, index) + replacement + str.substr(index + replacement.length);
}