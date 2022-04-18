const { insertBadWord, getBadWord, deleteBadWord, getBadWords } = require('../../src/database/database');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badword')
        .setDescription('Управление чёрным списком слов.')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Добавляет слово в чёрный список.')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Слово для добавления в чёрный список.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('delete')
                .setDescription('Удаляет слово из чёрного списка.')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('Слово для добавления в чёрный список.')
                        .setRequired(true)
                        .setAutocomplete(true))),

    async execute(client, interaction) {
        switch (interaction.options.getSubcommand()) {
            case 'add':
                await add(client, interaction);
                break;
            case 'delete':
                await del(client, interaction);
                break;
            default:
                break;
        }
    },

    async autoComplete(client, interaction) {
        const badWords = await getBadWords(client, interaction.guildId);
        var jsonCommands = badWords.map(item => item = {
            name: item,
            value: item
        });
        if (jsonCommands.length == 0) {
            jsonCommands.push({ name: 'Чёрный список слов пуст.', value: 'undefined' });
        }
        else if (interaction.options.getString('word') != '') {
            jsonCommands = jsonCommands.filter(item => item.name.includes(interaction.options.getString('word')));
        }
        interaction.respond(jsonCommands).catch(err => {
            interaction.respond([{
                name: `Невозможно отобразить больше 25 слов :(`, value: -1
            }]);
            console.log(err);
        });
    }
};

async function add(client, interaction) {
    if (!interaction.memberPermissions.has('ADMINISTRATOR'))
        return await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    const word = interaction.options.getString('word').toLowerCase();
    const badWord = await getBadWord(client, interaction.guildId, word);
    if (badWord.length != 0)
        return await interaction.reply({ content: `Слово \`${word}\` уже в чёрном списке`, ephemeral: true });

    await insertBadWord(client, interaction.guildId, word);
    await interaction.reply({ content: `Слово \`${word}\` добавлено в чёрный список`, ephemeral: true });
}

async function del(client, interaction) {
    if (!interaction.memberPermissions.has('ADMINISTRATOR'))
        return await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    const word = interaction.options.getString('word').toLowerCase();
    const badWord = await getBadWord(client, interaction.guildId, word);
    if (badWord.length == 0)
        return await interaction.reply({ content: `Слова \`${word}\` нет в чёрном списке`, ephemeral: true });

    await deleteBadWord(client, interaction.guildId, word);
    await interaction.reply({ content: `Слово \`${word}\` удалено из чёрного списка`, ephemeral: true });
}