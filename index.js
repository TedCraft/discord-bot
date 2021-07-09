const Discord = require("discord.js");
const config = require("./config.json");
const bday = require("./bday/bday.js");
const music = require("./music/music.js");
const poe_characters = require("./poe/poe_characters/poe_characters.js");
var queue = new Map();

function getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const client = new Discord.Client({ fetchAllMembers: true });
/*client.login(config.BOT_TOKEN).catch(err => {
    console.log("ошибка подключения бота");
    return this;
});*/

client.on("ready", function () {
    client.user.setActivity("Minecraft");
    bday.bday(client);
    poe_characters.poe_characters(client);
});

client.on("guildMemberUpdate", function (user_old, user_new) {
    if (user_new.nickname != null) {
        if (user_new.nickname[0] === "!") {
            var temp = 0;
            for (i = 0; i < user_new.nickname.length; i++) {
                if (user_new.nickname[i] === "!" || user_new.nickname[i] === " ") {
                    temp++;
                }
                else {
                    break;
                }
            }
            if (user_new.nickname.length === temp && user_new.user.username[0] === "!") {
                var temp = 0;
                for (i = 0; i < user_new.user.username.length; i++) {
                    if (user_new.user.username[i] === "!" || user_new.user.username[i] === " ") {
                        temp++;
                    }
                    else {
                        break;
                    }
                }
                if (user_new.user.username.length === temp) {
                    user_new.setNickname("Восклицательный знак").catch(() => {
                        return;
                    });
                    return;
                }
                else {
                    user_new.setNickname(user_new.user.username.slice(temp)).catch(() => {
                        return;
                    });
                    return;
                }
            }
            user_new.setNickname(user_new.nickname.slice(temp)).catch(() => {
                return;
            });
        }
    }
    else {
        var temp = 0;
        for (i = 0; i < user_new.user.username.length; i++) {
            if (user_new.user.username[i] === "!" || user_new.user.username[i] === " ") {
                temp++;
            }
            else {
                break;
            }
        }
        if (user_new.user.username.length === temp) {
            user_new.setNickname("Восклицательный знак").catch(() => {
                return;
            });
            return;
        }
        else {
            user_new.setNickname(user_new.user.username.slice(temp)).catch(() => {
                return;
            });
            return;
        }
    }
});
client.on("guildMemberAdd", function (user) {
    if (user.user.username[0] === "!") {
        var temp = 0;
        for (i = 0; i < user.user.username.length; i++) {
            if (user.user.username[i] === "!" || user.user.username[i] === " ") {
                temp++;
            }
            else {
                break;
            }
        }
        if (user.user.username.length === temp) {
            user.setNickname("Восклицательный знак").catch(() => {
                return;
            });
            return;
        }
        else {
            user.setNickname(user.user.username.slice(temp)).catch(() => {
                return;
            });
        }
    }
});

client.on("userUpdate", function (user_old, user_new) {
    if (user_new.username != null) {
        if (user_new.username[0] === "!") {
            var temp = 0;
            for (i = 0; i < user_new.username.length; i++) {
                if (user_new.username[i] === "!" || user_new.username[i] === " ") {
                    temp++;
                }
                else {
                    break;
                }
            }
            const guild = client.guilds.cache.get("205351208796291072");
            const member = guild.members.cache.get(user_new.id);
            if (user_new.username.length === temp) {
                member.setNickname("Восклицательный знак").catch(() => {
                    return;
                });
                return;
            }
            member.setNickname(user_new.username.slice(temp)).catch(() => {
                return;
            });
        }
    }
});

const prefix = "//";
client.on("message", function (message) {
    if (message.author.bot) return;
    if (message.content.toLowerCase().indexOf("свин") != -1) {
        message.channel.send("олег))");
    }
    /*if (message.author.id.toString()==="205350885042159617")
    {
        const attachment = new Discord.MessageAttachment('https://sun9-23.userapi.com/impf/jJ9M_-kCyO7Ag1k70-ROLf3rb9OANanSPOn11w/cfkHsRLfaQI.jpg?size=1205x718&quality=96&sign=e440c1fa6eea13c40bf200d9a71e9438&type=album');
        message.channel.send(attachment);
    }*/
    if (message.content.toLowerCase().indexOf("ахах") != -1 || message.content.toLowerCase().indexOf("хаха") != -1) {
        const attachment = new Discord.MessageAttachment('https://sun9-62.userapi.com/impf/RTrS87VsJbW2MrA3OS9tp3TAtTOR1tA6Ktmnlw/oABAwI0PdGM.jpg?size=1000x651&quality=96&sign=97a0ca69b45ac8850f7e156615ac0c1e&type=album');
        message.channel.send(attachment);
    }
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command === "rip") {
        const attachment = new Discord.MessageAttachment('https://i.imgur.com/w3duR07.png');
        message.channel.send(`АХАХА ${message.author} рипнулся в пое!!`, attachment);
    }

    else if (command === "кирилл" || command === "торч") {
        const startDate = new Date("06/28/2021");
        const dateDiff = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if(command === "кирилл") {
            message.channel.send(`Кирилл в армии уже \`${dateDiff}\` дней :pleading_face::point_right::point_left:`);
        }
        else {
            message.channel.send(`Торч в армии уже \`${dateDiff}\` дней :pleading_face::point_right::point_left:`);
        }
    }

    else if (command === "p" || command === "play") {
        const serverQueue = queue.get(message.guild.id);
        music.add(message, serverQueue, queue, !isNaN(parseInt(args[1])) ? args[1] : 1)
            .catch(err => { message.channel.send("Отказано") });
    }

    else if (command === "d" || command === "disconnect") {
        const serverQueue = queue.get(message.guild.id);
        music.disconnect(message, serverQueue);
    }

    else if (command === "s" || command === "skip") {
        const serverQueue = queue.get(message.guild.id);
        music.skip(message, serverQueue, args[0] != undefined ?
            (args[0].toLowerCase() === "all" ? "all" : (!isNaN(parseInt(args[0])) ? args[0] : 1))
            : undefined).catch(err => { message.channel.send("Отказано") });
    }

    else if (command === "np" || (command === "now" && args[0] === "playing")) {
        const serverQueue = queue.get(message.guild.id);
        music.nowPlaying(message, serverQueue).catch(err => { message.channel.send("Отказано") });
    }

    else if (command === "q" || command === "queue") {
        const serverQueue = queue.get(message.guild.id);
        music.getQueue(message, serverQueue).catch(err => { message.channel.send("Отказано") });
    }

    else if (command === "c" || command === "copy") {
        const serverQueue = queue.get(message.guild.id);
        music.copy(message, serverQueue).catch(err => { message.channel.send("Отказано") });
    }

    else if (command === "правила") {
        if (message.member.voice.channel != null) {
            const serverQueue = queue.get(message.guild.id);
            music.add(message, serverQueue, queue, !isNaN(parseInt(args[0])) ? args[0] : 1,
                false, "rules").catch(err => { message.channel.send("Отказано") });
        }
        else {
            const attachment = new Discord.MessageAttachment('https://media.discordapp.net/attachments/674333694454136852/674339404336070677/srFFirYSOGU.png?width=935&height=701');
            message.channel.send(`${message.author}`, attachment);
        }
    }

    else if (command === "?") {
        message.channel.send(new Discord.MessageAttachment('https://media1.tenor.com/images/3c143abc0d0ac290ab47f25f12f0e8c3/tenor.gif?itemid=21302407'));
        const serverQueue = queue.get(message.guild.id);
        music.add(message, serverQueue, queue, !isNaN(parseInt(args[0])) ? args[0] : 1,
            false, "fem.love_-_фотографирую_закат").catch(err => { message.channel.send("Отказано") });
    }

    else if (command === "sus") {
        message.channel.send(`amogus ඞ`);
        const serverQueue = queue.get(message.guild.id);
        music.add(message, serverQueue, queue, !isNaN(parseInt(args[0])) ? args[0] : 1,
            false, "amogus").catch(err => { message.channel.send("Отказано") });
    }

    else if (command === "амням") {
        const serverQueue = queue.get(message.guild.id);
        music.add(message, serverQueue, queue, !isNaN(parseInt(args[0])) ? args[0] : 1,
            false, "амням").catch(err => { message.channel.send("Отказано") });
    }

    else if (command === "no" && args[0] === "homo") {
        message.channel.send(new Discord.MessageAttachment('https://media1.tenor.com/images/47a36950989bd9837da717289dbcf602/tenor.gif?itemid=21479982'));
        const serverQueue = queue.get(message.guild.id);
        music.add(message, serverQueue, queue, !isNaN(parseInt(args[1])) ? args[1] : 1,
            false, "XARAKTER_-_NO_HOMO").catch(err => { message.channel.send("Отказано") });
    }

    else if (command === "roll") {
        try {
            if (args.length === 0) {
                message.channel.send(`${message.author} rolls (1-100): ${getRandomInRange(1, 100)}`);
            }
            else if (args.length === 1) {
                if (!isNaN(parseInt(args[0])))
                    message.channel.send(`${message.author} rolls (1-${parseInt(args[0])}): ${getRandomInRange(1, parseInt(args[0]))}`);
                else
                    message.channel.send(`${message.author} rolls (1-100): ${getRandomInRange(1, 100)}`);
            }
            else {
                if (!isNaN(parseInt(args[0])) && !isNaN(parseInt(args[1])))
                    message.channel.send(`${message.author} rolls (${parseInt(args[0])}-${parseInt(args[1])}): ${getRandomInRange(parseInt(args[0]), parseInt(args[1]))}`);

                else if (!isNaN(parseInt(args[0])))
                    message.channel.send(`${message.author} rolls (1-${parseInt(args[0])}): ${getRandomInRange(1, parseInt(args[0]))}`);

                else
                    message.channel.send(`${message.author} rolls (1-100): ${getRandomInRange(1, 100)}`);
            }
        }
        catch (err) {
            console.log(err);
        };
    }
});

client.login(config.BOT_TOKEN);