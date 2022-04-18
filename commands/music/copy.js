const { insertSong, getAllSongs } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('copy')
        .setDescription('Копирует композицию в очереди.')
        .addIntegerOption(option =>
            option.setName('track')
                .setDescription('Номер композиции.')
                .setRequired(true)
                .setAutocomplete(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('Число копий.')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(client, interaction) {
        const serverQueue = await getAllSongs(client, interaction.guildId);
        if (serverQueue.length == 0) return await interaction.reply({ content: `${message.author} В очереди пусто`, ephemeral: false });

        const index = interaction.options.getInteger('track') != null ? interaction.options.getInteger('track') - 1 : 0;
        if (index > serverQueue.length) return await interaction.reply({ content: `${message.author} Композиция под номером ${index + 1} не найдена`, ephemeral: false });

        const count = interaction.options.getInteger('count') < 100 ? interaction.options.getInteger('count') : 100;

        var elem;
        let ix = 0;
        for (const i in serverQueue) {
            if (ix == index) {
                elem = serverQueue[i];
                break;
            }
            else {
                ix++;
            }
        }
        for (let i = 0; i < count; i++) {
            insertSong(client, interaction.guildId,
                elem.TITLE.toString('utf8'),
                elem.URL.toString('utf8'),
                elem.REQUEST_USER.toString('utf8'),
                elem.THUMBNAIL_URL.toString('utf8'),
                elem.LENGTH);
        }
        await interaction.reply({ content: `Песня \`${elem.TITLE.toString('utf8')}\` продублирована \`${count} раз\``, ephemeral: false })
    },

    async autoComplete(client, interaction) {
        const serverQueue = await getAllSongs(client, interaction.guildId);
        let iterator = 1;
        var jsonCommands = serverQueue.map(item => item = {
            name: item.TITLE.toString('utf8'),
            value: iterator
        }, iterator++);
        jsonCommands = jsonCommands.reduce((unique, item) => unique.some(x => x.name === item.name) ? unique : [...unique, item], []);

        if (jsonCommands.length == 0) {
            jsonCommands.push({ name: 'Похоже в очереди пусто.', value: -1 });
        }
        else if (interaction.options.getInteger('track') != '') {
            jsonCommands = jsonCommands.filter(item => item.name.includes(interaction.options.getInteger('track')));
        }
        interaction.respond(jsonCommands).catch(err => {
            interaction.respond([{
                name: `Всего композиций в очереди: ${jsonCommands.length}`, value: -1
            }]);
            console.log(err);
        });
    }
};