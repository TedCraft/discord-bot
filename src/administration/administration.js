const { getBadWords } = require('../database/database');

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
};

function replaceWith(str, index, replacement) {
    return str.substr(0, index) + replacement + str.substr(index + replacement.length);
}