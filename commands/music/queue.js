const { getAllSongs } = require('../../src/database/database');
const { msToTime, sToTime } = require('../../src/utility/time');
const { MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Просмотр музыкальной очереди.'),

    async execute(client, interaction) {
        const serverQueue = await getAllSongs(client, interaction.guildId);
        if (serverQueue.length == 0) return await interaction.reply({ content: `Очередь пуста`, ephemeral: true });

        const embed = new MessageEmbed();
        embed.setColor('PURPLE');
        embed.setTitle('Очередь');

        let str = "\*\*Сейчас играет:\*\*\n";
        str += (`\[${serverQueue[0].TITLE.toString('utf8')}\]\(${serverQueue[0].URL.toString('utf8')}\) от \`${serverQueue[0].REQUEST_USER.toString('utf8')}\`\n`);

        let curTime = msToTime(client.audioPlayers.get(interaction.guildId).resource.playbackDuration);
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

        await interaction.reply({ embeds: [embed], ephemeral: false });
    }
};