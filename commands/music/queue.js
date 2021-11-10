const {msToTime, sToTime} = require('../../src/utility/time');

module.exports = {
    name: 'queue',
    aliases: ['q'],
    utilisation: '{prefix}queue',
    voice: true,
    
    async execute(message, serverQueue) {
        if (!serverQueue) return message.channel.send(`Очередь пуста`);
    
        const embed = new Discord.MessageEmbed();
        embed.setColor('PURPLE');
        embed.setTitle('Очередь');
    
        let str = "\*\*Сейчас играет:\*\*\n";
        if (serverQueue.songs[0].url != null) {
            str += (`\[${serverQueue.songs[0].title}\]\(${serverQueue.songs[0].url}\) от \`${serverQueue.songs[0].user}\`\n`);
        }
        else {
            str += (`\`${serverQueue.songs[0].title.replace(/_/gi, " ")}\` от \`${serverQueue.songs[0].user}\`\n`);
        }
        let curTime = msToTime(serverQueue.connection.dispatcher.streamTime);
        let lenTime = sToTime(serverQueue.songs[0].length);
        let totTime = parseInt(serverQueue.songs[0].length);
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
    
        if (serverQueue.songs.length > 1) {
            str += `\*\*Далее в очереди:\*\*\n`
            for (let i = 1; i < (serverQueue.songs.length < 11 ? serverQueue.songs.length : 11); i++) {
                if (serverQueue.songs[i].url != null) {
                    str += (`\`${i}.\` \[${serverQueue.songs[i].title}\]\(${serverQueue.songs[i].url}\)`);
                }
                else {
                    str += (`\`${i}.\` \`${serverQueue.songs[i].title.replace(/_/gi, " ")}\``);
                }
                let lenTime = sToTime(serverQueue.songs[i].length);
                while (lenTime.length > 4) {
                    if (lenTime[0] === '0' || lenTime[0] === ':') {
                        lenTime = lenTime.slice(1);
                    }
                    else {
                        break;
                    }
                }
                str += ` | \`${lenTime}\` от \`${serverQueue.songs[i].user}\``;
                str += '\n\n';
            }
    
            for (let i = 1; i < serverQueue.songs.length; i++) {
                totTime += parseInt(serverQueue.songs[i].length);
            }
        }
    
        str += `\*\*Всего песен: \`${serverQueue.songs.length}\`. Длительность очереди: \`${sToTime(String(totTime))}\`\*\*`;
        embed.setDescription(str);
    
        message.channel.send(embed);
    }
};