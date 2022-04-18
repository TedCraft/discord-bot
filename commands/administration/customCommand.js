const { insertServerCommand, getServerCommand, deleteServerCommand, getServerCommands } = require('../../src/database/database');
const { loadImage } = require('canvas');
const ytdl = require('discord-ytdl-core');
const ytpl = require('ytpl');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom_command')
        .setDescription('Управление кастомными коммандами.')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Добавляет команду.')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('Название команды.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('Текст ответа команды.'))
                .addStringOption(option =>
                    option.setName('song')
                        .setDescription('Ссылка на композицию или плейлист.'))
                .addStringOption(option =>
                    option.setName('image')
                        .setDescription('Ссылка на изображение.')))

        .addSubcommand(subcommand =>
            subcommand.setName('delete')
                .setDescription('Удаляет команду.')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('Название команды.')
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
        const commands = await getServerCommands(client, interaction.guildId);
        var jsonCommands = commands.map(item => item = {
            name: item.COMMAND.toString('utf8'),
            value: item.COMMAND.toString('utf8')
        });
        if (jsonCommands.length == 0) {
            jsonCommands.push({ name: 'Похоже на сервере нет комманд. Может стоит их добавить?', value: 'undefined' });
        }
        else if (interaction.options.getString('command') != '') {
            jsonCommands = jsonCommands.filter(item => item.name.includes(interaction.options.getString('command')));
        }
        interaction.respond(jsonCommands).catch(err => {
            interaction.respond([{
                name: `Невозможно отобразить больше 25 комманд :(`, value: -1
            }]);
            console.log(err);
        });
    }
};

async function add(client, interaction) {
    if (!interaction.memberPermissions.has('ADMINISTRATOR'))
        await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    const songUrl = interaction.options.getString('song'),
        imageUrl = interaction.options.getString('image'),
        text = interaction.options.getString('text'),
        command = interaction.options.getString('command').toLowerCase();
    if (!songUrl && !imageUrl && !text) return await interaction.reply({ content: `Добавьте ответ команды!`, ephemeral: true });
    if (!/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u.test(command)) return await interaction.reply({ content: `Некорректное название комманды!`, ephemeral: true });

    const serverCommand = await getServerCommand(client, interaction.guildId, command);
    if (await serverCommand.length > 0 ||
        client.commands.get(command))
        return await interaction.reply({ content: `Команда ${command} уже существует!`, ephemeral: true })

    if (songUrl) {
        if (songUrl.match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9-_]{34})(?:\S+)?$/) != null) {
            await ytpl(songUrl).catch(async (err) => {
                return await interaction.reply({ content: `Ссылка на плейлист введена неправильно!`, ephemeral: true });
            });
        }
        else {
            await ytdl.getBasicInfo(songUrl).catch(async (err) => {
                return await interaction.reply({ content: `Ссылка на композицию введена неправильно!`, ephemeral: true });
            });
        }
    }

    if (imageUrl) {
        await loadImage(imageUrl).catch(async (err) => {
            await interaction.reply({ content: `Ссылка на изображение введена неправильно!`, ephemeral: true });
        });
    }

    await insertServerCommand(client, interaction.guildId, command, songUrl, imageUrl, text);
    await interaction.reply({ content: `Команда \`${command}\` добавлена!`, ephemeral: false });

    const commands = await getServerCommands(client, interaction.guildId);
    const jsonCommands = commands.map(item => new SlashCommandBuilder().setName(item.COMMAND.toString('utf8')).setDescription('Кастомная команда.').toJSON());

    const rest = new REST({ version: '9' }).setToken(client.config.app.token);
    (async () => {
        try {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, interaction.guildId),
                { body: jsonCommands },
            );
        } catch (error) {
            console.error(error);
        }
    })();
}

async function del(client, interaction) {
    if (!interaction.memberPermissions.has('ADMINISTRATOR'))
        return await interaction.reply({ content: `Вы не являетесь администратором!`, ephemeral: true });

    const command = interaction.options.getString('command').toLowerCase();

    if (await getServerCommand(client, interaction.guildId, command) == 0)
        return await interaction.reply({ content: `Команды ${command} не существует!`, ephemeral: true })

    await deleteServerCommand(client, interaction.guildId, command);

    await interaction.reply({ content: `Команда \`${command}\` удалена!`, ephemeral: false });

    const commands = await getServerCommands(client, interaction.guildId);
    commands.splice(commands.findIndex(cmd => cmd.COMMAND.toString('utf8') == command));
    const jsonCommands = commands.map(item => new SlashCommandBuilder().setName(item.COMMAND.toString('utf8')).setDescription('Кастомная команда.').toJSON());

    const rest = new REST({ version: '9' }).setToken(client.config.app.token);
    (async () => {
        try {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, interaction.guildId),
                { body: jsonCommands },
            );
        } catch (error) {
            console.error(error);
        }
    })();
}