const { msToTime, sToTime } = require('../../src/utility/time');
const { getSongs } = require('../../src/database/database');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'nowPlaying',
    aliases: ['np'],
    utilisation: '{prefix}nowPlaying',
    voice: true,

    async execute(client, message, args) {
        const serverQueue = await getSongs(client, message.guild.id);
        if (serverQueue.length == 0) return message.channel.send(`В очереди пусто`);

        const embed = new MessageEmbed();
        embed.setColor('RED');
        embed.setTitle('Сейчас играет');

        let str = (`\[${serverQueue[0].TITLE.toString('utf8')}\]\(${serverQueue[0].URL.toString('utf8')}\)\n`);
        let curTime = msToTime(client.connections.get(message.guild.id).dispatcher.streamTime)
        let lenTime = sToTime(serverQueue[0].LENGTH);

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

        embed.setFooter(`от ${serverQueue[0].REQUEST_USER.toString('utf8')}`);

        embed.setThumbnail(serverQueue[0].THUMBNAIL_URL.toString('utf8'));

        message.channel.send(embed);
    }
};