const { createCanvas, loadImage } = require('canvas')
const { cwd } = require('node:process');
const { AttachmentBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Двигает Кирилла.')
        .addIntegerOption(option =>
            option.setName('field')
                .setDescription('Поле, на которое нужно передвинуться.')
                .setMinValue(1)
                .setMaxValue(40)
                .setRequired(true)),

    async execute(client, interaction) {
        await interaction.deferReply().catch(err => {
            console.log(err);
        });

        const fields = {
            1: { name: "Старт лиги", desc: "Стартовое поле." },
            2: { name: "Cringles", desc: `Пачка вкусных чипсов. Может стоит сделать перерыв и сходить за ними?\n\nДлительность: 1-4\nСтоимость: 0-6\nТеги: Point & Click, Point-and-click` },
            3: { name: "Сектор приколов", desc: "Крути колесо приколов." },
            4: { name: "Новый мерч", desc: `Модный лук - всегда круто. Теперь вы одеты как чёрт.\n\nДлительность: 2-5\nСтоимость: 5-12\nТеги: Retro` },
            5: { name: "Квасилич: Киберпанковый", desc: `Любимый прохладительный напиток дества. Отдаёт сладостью и вапорвейвом.\n\nДлительность: 2-7\nТеги: FPS, Shooter` },
            6: { name: "Сектор удачи", dex: "Крути сектор удачи." },
            7: { name: "Бетатест ПОЕ 2", desc: `Длительность: 4-9\nТеги: Hack and Slash\nСтоимость: 0-8` },
            8: {
                name: "Картина Тэдмунда Мунка", desc: `Один из шедевров мирового исскуства. Многие считали его утерянным после пожара в Олегденской библиотеке, но данной картине повезло, ведь Тэдмунд напечатал её на принтере.\n\nДлительность: от 5\nТеги: Point & Click, Point-and-click\nСтоимость: 0-10`
            },
            9: { name: "Вовсе не Олег", desc: `Ты попробовал этот странный совет, чтобы ненавидить этого человека. Во время игры, если Олег будет тебе что-то говорить - отвечай "я тебя ненавижу".\n\nДлительность: 10-20\nТеги: RPG, Action RPG, JRPG, Tactical RPG` },
            10: { name: "Вилен Скала Джонсон", desc: `Вы находитесь под пристальным вниманием. Если в игре Вилен Скала Джонсон попросит что-то сделать - сделай. Я бы не хотел с ним проблем.\n\nДлительность: 4-10\nСтоимость: 15-30` },
            11: { name: "Тюрьма", desc: "ШУЕ ППШ." },
            12: { name: "Киберпанковый ёбакирилл", desc: `Длительность: 3-7\nТеги: Platformer, 3D Platformer\nОценка: 40-80` },
            13: { name: "Сектор приколов", desc: "Крути колесо приколов." },
            14: { name: "Голодный ёбакирилл", desc: "Теги: Psychological Horror, Survival Horror, Horror" },
            15: { name: "Бизнесменовый ёбакирилл", desc: `Длительность: 4-8\nСтоимость: 0-7\nТеги: Platformer, 3D Platformer` },
            16: { name: "Сектор удачи", dex: "Крути сектор удачи." },
            17: { name: "Токсичный ёбакирилл", desc: `Длительность: 4-10\nТеги: Psychological Horror, Survival Horror, Horror` },
            18: { name: "Властный ёбакирилл", desc: `Длительность: от 8\nТеги: Detective, Detective-mystery` },
            19: { name: "Квасиличный ёбакирилл", desc: `Длительность: 6-12\nТеги: FPS, Shooter` },
            20: { name: "Армейский ёбакирилл", desc: `Длительность: от 7\nТеги: Psychological Horror, Survival Horror, Horror.` },
            21: { name: "Пинги", desc: "Роль от 1 до 4 и отправляйся на сектор приколов под выпавшим номером (3,13,23,33)" },
            22: {
                name: "Кошачьи обнимашки", desc:
                    `Ч                           Теги: Puzzle
  Т
　　 O
　　　　 o
　　　　　o
　　　　　 o
　　　　　o
　　　　 。
` },
            23: { name: "Сектор приколов", desc: "Крути колесо приколов." },
            24: { name: "Тебя зовут боба", desc: `Тебя реально зовут боба. На время прохождения игры меняй ник в дискорде на "боба".\n\nДлительность: 7-14\nТеги: Rogue-like, Roguelike` },
            25: { name: "TED Talk", desc: `Ты находишься в канале TED Talk. Если Тед что-то говорит, ты обязан выслушать (выполнять при этом не обязательно).\n\nДлительность: 6-12\nОценка: 30-70\nТеги: Puzzle` },
            26: { name: "Сектор удачи", dex: "Крути сектор удачи." },
            27: { name: "Рука на Пуджа", desc: `Длительность: от 8\nТеги: Rogue-like, Roguelike` },
            28: { name: "Ивент вышел", desc: `Стоимость: от 25\nТеги: RPG, Action RPG, JRPG, Tactical RPG` },
            29: { name: "Умерчик", desc: `Оценка: 20-50\nСтоимость: от 20` },
            30: { name: "Кап резистов", desc: `Оценка: 55-85\nТеги: Turn-Based Strategy, Strategy, Strategy RPG` },
            31: { name: "Мафия бедности", desc: `Роль колесо с айтемами из ПОЕ`},
            32: { name: "Еда →", desc: `Длительность 4-12\nОценка: 30-60\nТеги: Difficult, FPS` },
            33: { name: "Сектор приколов", desc: "Крути колесо приколов." },
            34: { name: "Мастурбист", desc: `Вас посетил популярный блогер - Мастурбист. В дополнение к поинтам за прохождение игры, получай 200 поинтов бесплатно!\n\nДлительность: 10-20\nТеги: Funny, Memes` },
            35: { name: "Красноярск", desc: `Длительность: 5-10\nТеги: Platformer, 3D Platformer\nОценка от 75` },
            36: { name: "Сектор удачи", dex: "Крути сектор удачи." },
            37: { name: "Безтедагеймс", desc: `Длительность: 8-16\nИздатель: Bethesda Softworks` },
            38: { name: "RoflanPominki", desc: `Длительность: 8-18\nТеги: Anime` },
            39: { name: "Олегден реален?", desc: `Похоже, Олегден вошёл в эру пиратов. Ставьте в бота все опенинги ван писа и айда пороздить океан, якорь мне жопу!\n\nСвоё колесо: One Piece\nКоличество игр: 6` },
            40: { name: "Любовь →", desc: `Длительность: 6-16\nТеги: RPG, Action RPG, Difficult` },
        }

        const canvas = createCanvas(3840, 2160);
        const ctx = canvas.getContext('2d');
        const image = await loadImage(`${cwd()}\\img\\test.png`)
        ctx.drawImage(image, 0, 0, 3840, 2160);

        const field = interaction.options.getInteger('field')
        const x = field <= 11 ? 100 + 3840 / 11 * (field - 1) :
            field >= 12 && field <= 20 ? 3590 :
                field >= 21 && field <= 30 ? 3590 - 3840 / 11 * (((field % 10) || 10) - 1) :
                    100
        const y = field <= 11 ? 100 :
            field >= 12 && field <= 20 ? 335 + 168 * (((field % 10) || 10) - 2) :
                field >= 21 && field <= 31 ? 1925 :
                    1680 - 168 * (((field % 10) || 10) - 2)

        const kirill = await loadImage(`${cwd()}\\img\\kirill.png`)
        ctx.drawImage(kirill, x, y, 150, 150);

        await interaction.editReply({ content: `Вы на клетке номер ${field} - ${fields[field].name}.\n\n${fields[field].desc}` , files: [new AttachmentBuilder(canvas.createPNGStream())], ephemeral: false });
    }
};