const { getAllSongs } = require('../../src/database/database');
const { msToTime, sToTime } = require('../../src/utility/time');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    voice: true,

    async execute(client, message, args) {
        const serverQueue = await getAllSongs(client, message.guild.id);
        if (serverQueue.length == 0) return message.channel.send(`Очередь пуста`);

        const embed = new MessageEmbed();
        embed.setColor('PURPLE');
        embed.setTitle('Очередь');

        let str = "\*\*Сейчас играет:\*\*\n";
        str += (`\[${serverQueue[0].TITLE.toString('utf8')}\]\(${serverQueue[0].URL.toString('utf8')}\) от \`${serverQueue[0].REQUEST_USER.toString('utf8')}\`\n`);

        let curTime = msToTime(client.connections.get(message.guild.id).dispatcher.streamTime);
        let lenTime = sToTime(serverQueue[0].LENGTH);
        let totTime = parseInt(serverQueue[0].LENGTH);
        while (lenTime.length > 4) {
            if (lenTime[0] === '0' || lenTime[0] === ':') {
                curTime = curTime.slice(1);
                lenTime = lenTime.slice(1);
            }
            else {
                break;
            }
        }
        str += ` \`${curTime} / ${lenTime}\`\n\n`;

        if (serverQueue.length > 1) {
            str += `\*\*Далее в очереди:\*\*\n`
            for (let i = 1; i < (serverQueue.length < 11 ? serverQueue.length : 11); i++) {
                str += (`\`${i}.\` \[${serverQueue[i].TITLE.toString('utf8')}\]\(${serverQueue[i].URL.toString('utf8')}\)`);
                let lenTime = sToTime(serverQueue[i].LENGTH);
                while (lenTime.length > 4) {
                    if (lenTime[0] === '0' || lenTime[0] === ':') {
                        lenTime = lenTime.slice(1);
                    }
                    else {
                        break;
                    }
                }
                str += ` | \`${lenTime}\` от \`${serverQueue[i].REQUEST_USER}\``;
                str += '\n\n';
            }

            for (let i = 1; i < serverQueue.length; i++) {
                totTime += parseInt(serverQueue[i].LENGTH);
            }
        }

        str += `\*\*Всего песен: \`${serverQueue.length}\`. Длительность очереди: \`${sToTime(totTime)}\`\*\*`;
        embed.setDescription(str);

        message.channel.send(embed);
    }
};