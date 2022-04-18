const { deleteSongs, getAllSongs } = require('../../src/database/database');
const { getVoiceConnection } = require('@discordjs/voice');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Очищает музыкальную очередь и отключает бота.'),

    async execute(client, interaction) {
        const voiceChannel = interaction.guild.me.voice.channel != undefined ? interaction.guild.me.voice.channel : interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: `зайди в войс канал`, ephemeral: true });

        const serverQueue = await getAllSongs(client, interaction.guildId);
        await deleteSongs(client, interaction.guildId, serverQueue.length);
        if (!getVoiceConnection(interaction.guildId)) return interaction.reply({ content: `Бот ничего не играет!`, ephemeral: false });

        client.audioPlayers.get(interaction.guildId).stop();
        //getVoiceConnection(interaction.guildId).destroy();
        interaction.reply({ content: `Отключаюсь.`, ephemeral: false });
    }
};