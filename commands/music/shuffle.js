const { deleteSongs, getAllSongs, insertSongs } = require('../../src/database/database');
const { getVoiceConnection } = require('@discordjs/voice');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Перемешивает очередь.'),

    async execute(client, interaction) {
        const voiceChannel = interaction.guild.me.voice.channel != undefined ? interaction.guild.me.voice.channel : interaction.member.voice.channel;
        if (!voiceChannel) return await interaction.reply({ content: `зайди в войс канал`, ephemeral: true });

        const serverQueue = await getAllSongs(client, interaction.guildId);
        if (serverQueue.length == 0) return await interaction.reply({ content: `В очереди пусто`, ephemeral: false });
        
        const first = serverQueue.shift();
        const randomlySorted = serverQueue.map(item => item = item.IN_QUEUE);
        randomlySorted.sort(() => Math.random() - 0.5);
        for (var i in randomlySorted) {
            serverQueue[i].IN_QUEUE = randomlySorted[i];
        }
        serverQueue.unshift(first);
        
        await deleteSongs(client, interaction.guildId, serverQueue.length);
        await insertSongs(client, serverQueue);
        await interaction.reply({ content: `Плейлист перемешан.`, ephemeral: false });
    }
};