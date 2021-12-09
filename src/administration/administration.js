const { getBadWords, getUsersBDAYId, getUserBDAYServers } = require('../database/database');

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
        const dateString = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`
        console.log(`\n${dateString} Check birthdays...`);
        const usersID = await getUsersBDAYId(client);
        for(const i in usersID) {
            const serversID = await getUserBDAYServers(client, usersID[i]);
            for (const j in serversID) {
                const guild = client.guilds.cache.get(serversID[j].SERVER_ID.toString('utf8'));
                const role = guild.roles.cache.get(serversID[j].BIRTHDAY_ROLE.toString('utf8'));
                const member = guild.members.cache.get(usersID[i]);
                member.roles.add(role).catch(console.error);
                console.log(`${dateString} Give ${member.user.username} on ${guild.name} role ${role.name}`)
            }
        }
        console.log(`${dateString} Checking birthdays successfull!`);
    },
};

function replaceWith(str, index, replacement) {
    return str.substr(0, index) + replacement + str.substr(index + replacement.length);
}