const {msToTime, sToTime} = require('../../src/utility/time');

module.exports = {
    name: 'nowPlaying',
    aliases: ['np'],
    utilisation: '{prefix}nowPlaying',
    voice: true,
    
    async execute(message, serverQueue) {
        if (!serverQueue) return message.channel.send(`Сейчас ничего не играет`);
    
        const embed = new Discord.MessageEmbed();
        embed.setColor('RED');
        embed.setTitle('Сейчас играет');
    
        let str = "";
        if (serverQueue.songs[0].url != null) {
            str += (`\[${serverQueue.songs[0].title}\]\(${serverQueue.songs[0].url}\)\n`);
        }
        else {
            str += (`\`${serverQueue.songs[0].title.replace(/_/gi, " ")}\`\n`);
        }
        let curTime = msToTime(serverQueue.connection.dispatcher.streamTime)
        let lenTime = sToTime(serverQueue.songs[0].length);
        while (lenTime.length > 4) {
            if (lenTime[0] === '0' || lenTime[0] === ':') {
                curTime = curTime.slice(1);
                lenTime = lenTime.slice(1);
            }
            else {
                break;
            }
        }
        str += `${curTime} / ${lenTime}`
        embed.setDescription(str);
    
        embed.setFooter(`от ${serverQueue.songs[0].user}`);
    
        if (serverQueue.songs[0].thumbnail != null) {
            embed.setThumbnail(serverQueue.songs[0].thumbnail);
        }
    
        message.channel.send(embed);
    }
};