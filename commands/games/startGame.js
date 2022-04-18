const { getGameType, insertGame, updateGameStart, getGame, deleteGame, insertGamePlayer, deleteGamePlayers, deleteGameTowns } = require('../../src/database/database');
const { msToTime } = require('../../src/utility/time');
const { setTownTimeout } = require('../../src/utility/timer');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startgame')
        .setDescription('Начинает игру.')
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Название игры.')
                .addChoice('города', 'города')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Минуты до начала.')
                .setMinValue(1)
                .setMaxValue(15))
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Секунды до начала.')
                .setMinValue(1)
                .setMaxValue(59)),

    async execute(client, interaction) {
        switch (interaction.options.getString('game')) {
            case 'города':
                towns(client, interaction);
                break;
            default:
                interaction.reply({ content: `Название игры указано неправильно.`, ephemeral: true });
                break;
        }

    }
};

async function towns(client, interaction) {
    const minutes = interaction.options.getInteger('minutes') != null ? interaction.options.getInteger('minutes') : 0;
    const seconds = interaction.options.getInteger('seconds') != null ? interaction.options.getInteger('seconds') : 15;

    const game = interaction.options.getString('game');
    const gameType = await getGameType(client, game);
    if (!gameType) return interaction.reply({ content: `Игры с названием \`${game}\` не существует!`, ephemeral: true });
    if (await getGame(client, interaction.guildId))
        return interaction.reply({ content: `Игра с названием \`${game}\` уже зарегестрирована в данном канале!`, ephemeral: true });

    interaction.reply({ content: `Игра \`${game}\` начнётся через ${(minutes < 10) ? "0" + minutes : minutes}:${(seconds < 10) ? "0" + seconds : seconds} (${msToTime(new Date().getTime() + minutes * 60 * 1000 + seconds * 1000 + 3 * 60 * 60 * 1000)}). Если вы хотите принять участие, нажмите на :white_check_mark:`, ephemeral: false });
    const msg = await interaction.fetchReply();
    await msg.react("✅");
    await insertGame(client, interaction.channelId, interaction.guildId, gameType.GAME_TYPE_ID);

    const filter = (reaction, user) => reaction.emoji.name === "✅" && !user.bot;
    msg.awaitReactions({ filter, time: (minutes * 60 * 1000 + seconds * 1000) })
        .then(async (collected) => {
            const users = await collected.first().users.cache.filter(User => !User.bot);
            if (users.size < 2) {
                msg.edit(`Недостаточно пользователей!`);
                await deleteGamePlayers(client, interaction.channelId);
                await deleteGameTowns(client, interaction.channelId);
                await deleteGame(client, interaction.channelId);
            }
            else {
                await updateGameStart(client, interaction.channelId)
                for (const user of users) {
                    await insertGamePlayer(client, interaction.channelId, user[0]);
                }
                msg.edit(`Рыба-карась, игра \`${game}\` началась!`);
                interaction.channel.send(`Игрок ${interaction.user}, начинайте!`);
                setTownTimeout(client, msg);
            }
        })
        .catch(async (ex) => {
            msg.edit(`Недостаточно пользователей!`);
            await deleteGamePlayers(client, interaction.channelId);
            await deleteGameTowns(client, interaction.channelId);
            await deleteGame(client, interaction.channelId);
        });
}