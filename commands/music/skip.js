const { deleteSongs, getAllSongs } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Копирует композицию в очереди.')
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Число копий.')
                .setMinValue(1)),

    async execute(client, interaction) {
        const voiceChannel = interaction.guild.me.voice.channel != undefined ? interaction.guild.me.voice.channel : interaction.member.voice.channel;
        if (!voiceChannel) return await interaction.reply({content: `зайди в войс канал`, ephemeral: true});

        const serverQueue = await getAllSongs(client, interaction.guildId);
        if (serverQueue.length == 0) return await interaction.reply({content: `В очереди пусто`, ephemeral: true});

        const count = interaction.options.getInteger('count') != null ? interaction.options.getInteger('count') - 1 : 0 ;

        await deleteSongs(client, interaction.guildId, count);

        if (client.audioPlayers.get(interaction.guildId))
            client.audioPlayers.get(interaction.guildId).stop();
        await interaction.reply({content: `Вы пропустили ${count} композиций.`, ephemeral: false});
    }
};