const { msToTime, sToTime } = require('../../src/utility/time');
const { getSongs } = require('../../src/database/database');
const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('now_playing')
        .setDescription('Текущая композиция в очереди.'),

    async execute(client, interaction) {
        const serverQueue = await getSongs(client, interaction.guildId);
        if (serverQueue.length == 0) return await interaction.reply({ content: `В очереди пусто`, ephemeral: false });

        const embed = new MessageEmbed();
        embed.setColor('RED');
        embed.setTitle('Сейчас играет');

        let str = (`\[${serverQueue[0].TITLE.toString('utf8')}\]\(${serverQueue[0].URL.toString('utf8')}\)\n`);
        let curTime = msToTime(client.audioPlayers.get(interaction.guildId).resource.playbackDuration);
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

        embed.setFooter({ text: `от ${serverQueue[0].REQUEST_USER.toString('utf8')}` });

        embed.setThumbnail(serverQueue[0].THUMBNAIL_URL.toString('utf8'));

        await interaction.reply({ embeds: [embed], ephemeral: false });
    }
};