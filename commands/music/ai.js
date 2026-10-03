const { SlashCommandBuilder } = require('@discordjs/builders');
const { AttachmentBuilder } = require('discord.js');
const ytdl = require("@distube/ytdl-core");
const agent = ytdl.createAgent(client.config.agent)
const ytsr = require('@distube/ytsr');
const pathToFfmpeg = require('ffmpeg-static')
const { exec, spawn } = require('node:child_process');
const { cwd } = require('node:process');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(pathToFfmpeg)
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cover')
        .setDescription('Делает AI кавер')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Ссылка на композицию или название.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('model')
                .setDescription('AI-модель, которую необходимо использовать')
                .addChoices({ name: 'Тед', value: 'Tedushonog' },
                    { name: 'Олег', value: 'Oleg' },
                    { name: 'Маров', value: 'Marow' },
                    { name: 'Пекора', value: 'pekora' },
                    { name: 'Неко-арк', value: 'neco-arc' },
                    { name: 'Папич', value: 'papich' },
                    { name: 'Беатриче', value: 'beatrice' }))
        .addIntegerOption(option =>
            option.setName('pitch')
                .setDescription('Тон кавера.')
                .setMinValue(-24)
                .setMaxValue(24))
        .addStringOption(option =>
            option.setName('prediction-method')
                .setDescription('F0-prediction method')
                .addChoices({ name: 'crepe', value: 'crepe' },
                    { name: 'crepe-tiny', value: 'crepe-tiny' },
                    { name: 'parselmouth', value: 'parselmouth' },
                    { name: 'dio', value: 'dio' },
                    { name: 'harvest', value: 'harvest' },))
        .addBooleanOption(option =>
            option.setName('auto-pitch')
                .setDescription('Включить/Выключить автотюн.'))
        .addBooleanOption(option =>
            option.setName('enable-video')
                .setDescription('Включить/Выключить видео.'))
        .addBooleanOption(option =>
            option.setName('only-voice')
                .setDescription('Сохранить только голос.')),

    async execute(client, interaction) {
        await ai(client, interaction);
    }
};

async function ai(client, interaction) {
    await interaction.deferReply().catch(err => {
        console.log(err);
    });

    if (client.process_ai) {
        interaction.editReply({ content: `Другой AI-кавер уже находится в очереди`, ephemeral: true });
        return;
    }

    client.process_ai = true;

    const pitch = interaction.options.getInteger('pitch') | 0;
    const prediction = interaction.options.getString('prediction-method') || "crepe";
    const autoPitch = interaction.options.getBoolean('auto-pitch') || false;
    const enableVideo = interaction.options.getBoolean('enable-video') || false;
    const model = interaction.options.getString('model') || "Tedushonog";
    const onlyVoice = interaction.options.getBoolean('only-voice') || false;

    const songUrl = interaction.options.getString('song');
    if (!songUrl) {
        await interaction.editReply({ content: `Укажите композицию.`, ephemeral: true });
        return;
    }

    let song = [];

    if (songUrl.match(/^(?:http|https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9-_]{11})(?:\S+)?$/) != null) {
        song = await getSong(songUrl, interaction);
    }
    else {
        const searchResult = await ytsr(songUrl, { limit: 5 });
        if (searchResult.items.length == 0) {
            await interaction.editReply({ content: "Не удалось найти композицию!", ephemeral: true });
            return;
        }
        for (const i in searchResult.items) {
            if (searchResult.items[i].isLive || searchResult.items[i].type == "shelf") continue;
            song = await getSongFromInfo(searchResult.items[i], interaction);
            if (song.length == 0) continue;
            break;
        }
    }

    if (song.length == 0) {
        await interaction.editReply({ content: `Невозможно найти композицию!`, ephemeral: true });
        client.process_ai = false;
        return;
    }

    if (song.length > (/*enableVideo ? 150 :*/ 600)) {
        await interaction.editReply({ content: `Композиция превышает максимальную длину (10 минут)`, ephemeral: true });
        client.process_ai = false;
        return;
    }

    try {
        const files = [];

        const savedMP3 = await saveMP3(ytdl(song.url, {
            filter: "audioonly",
            // highWaterMark: 1 << 62,
            // dlChunkSize: 0,
            // quality: "highest",
            // opusEncoded: true,
            // agent
        }), getFilePath("saved", "mp3"));
        files.push(savedMP3);

        interaction.editReply({ content: `Создание акапеллы...` });
        const [acapellaPath, instrumentalPath] = await generateAcapella(savedMP3, `${cwd()}\\ai\\`);
        files.push(acapellaPath, instrumentalPath);

        interaction.editReply({ content: `Дереверберация...` });
        const dereverbPath = await dereverb(acapellaPath, `${cwd()}\\ai\\`);
        files.push(dereverbPath);

        interaction.editReply({ content: `Генерация кавера...` });
        const coverPath = await cover(dereverbPath, getFilePath("ai", "mp3"), model, prediction, autoPitch, pitch);
        files.push(coverPath);

        let mergePath = coverPath;
        const replacedTitle = song.title.replace(/[^a-z0-9 .]/gi, '').replace(/[\s.]+/g, '_').replace(/^_/g, "") || "output";
        if (!onlyVoice) {
            interaction.editReply({ content: `Нормализация...` });
            const normalizePath = await normalize2(instrumentalPath, getFilePath("normalized", "mp3"));
            files.push(normalizePath);

            mergePath = await merge(coverPath, normalizePath, getFilePath(replacedTitle, "mp3"))
            files.push(mergePath);
        }

        let resultPath = mergePath;
        if (enableVideo) {
            interaction.editReply({ content: `Сохранение видео...` });
            const savedMP4 = await saveMP4(ytdl(song.url, {
                filter: "videoonly",
                // highWaterMark: 1 << 62,
                // dlChunkSize: 0,
                // quality: "highest",
                // opusEncoded: true,
                // agent
            }), getFilePath("saved", "mp4"), Math.min(150000 / song.length, 5000));

            const mergeVideoPath = await mergeVideo(savedMP4, mergePath, getFilePath(replacedTitle, "mp4"));
            resultPath = mergeVideoPath;

            files.push(savedMP4, mergeVideoPath);
        }

        await interaction.editReply({ content: `Ваш AI-кавер готов! (Оригинальный трек: ${song.url})`, files: [resultPath] });
        removeFiles(files);
        client.process_ai = false;
    }
    catch (ex) {
        interaction.editReply({ content: `Отказано` });
        console.log(ex);
        client.process_ai = false;
    }
}

const basePromise = async (func, ...args) => {
    return new Promise((resolve, reject) => {
        const f = func(...args);
        f.on("end", () => {
            resolve();
        })
        f.on("close", () => {
            resolve();
        })
        f.on("error", (err) => {
            reject(err)
        });
        if (f.stderr) f.stderr.on("data", (err) => {
            console.log(`err: ${err}`);
        })
        if (f.stdout) f.stdout.on("data", (err) => {
            console.log(`err: ${err}`);
        })
    });
}

const getFilePath = (fileName, ext) => `${cwd()}\\ai\\${fileName}.${ext}`;

const saveMP3 = async (stream, outputFile) => {
    await new Promise((resolve, reject) => {
        ffmpeg(stream)
            .outputFormat("mp3")
            .output(outputFile)
            .on("end", () => {
                resolve();
            })
            .on("error", (err) => {
                reject(err)
            })
            .run()
    });
    return outputFile;
}

const saveMP4 = async (stream, outputFile, bitrate) => {
    await new Promise((resolve, reject) => {
        ffmpeg(stream)
            .outputFormat("mp4")
            .outputOptions(`-b ${bitrate}k`)
            .size("?x720")
            .output(outputFile)
            .on("end", () => {
                resolve();
            })
            .on("error", (err) => {
                reject(err)
            })
            .run();
    });
    return outputFile;
}

const generateAcapella = async (inputFile, outputDir) => {
    await basePromise(
        spawn,
        `audio-separator`,
        [
            inputFile,
            "--output_dir", outputDir,
            // "--use_cuda",
            "--model_filename", "UVR_MDXNET_Main.onnx",
            "--output_format", "MP3",
            // "--denoise", "false",
            // "--normalize", "false"
        ]);
    return [
        `${inputFile.slice(0, -4)}_(Vocals)_UVR_MDXNET_Main.mp3`,
        `${inputFile.slice(0, -4)}_(Instrumental)_UVR_MDXNET_Main.mp3`
    ];
}

const dereverb = async (inputFile, outputDir) => {
    await basePromise(
        spawn,
        `audio-separator`,
        [
            inputFile,
            "--output_dir", outputDir,
            // "--use_cuda",
            "--model_name", "Reverb_HQ_By_FoxJoy.onnx",
            "--output_format", "MP3",
            // "--denoise", "false",
            // "--normalize", "false",
            "--single_stem", "Instrumental"
        ]);
    return `${inputFile.slice(0, -4)}_(Instrumental)_Reverb_HQ_By_FoxJoy.mp3`;
}

const cover = async (inputFile, outputFile,
    model = "Tedushonog",
    prediction = "crepe",
    autoPitch = true,
    pitch = 0,
    db = "-35",
    p = "0.1") => {
    await basePromise(
        spawn,
        'svc',
        [
            'infer',
            '-s', `${model}`,
            '-m', `${cwd()}\\ai\\model\\${model}`,
            '-c', `${cwd()}\\ai\\model\\${model}\\config.json`,
            '-fm', prediction,
            `${autoPitch ? "-a" : "-na"}`,
            '-t', pitch,
            '-db', db,
            '-p', p,
            '-ab',
            '-o', outputFile,
            inputFile
        ]);
    return outputFile;
}

const normalize = async (inputFile1, inputFile2, outputFile1, outputFile2) => {
    await basePromise(
        spawn,
        `ffmpeg-normalize`,
        [
            inputFile1,
            inputFile2,
            outputFile1,
            outputFile2,
            '-b:a', '192k',
            "-c:a", "libmp3lame"
        ]);
    return [outputFile1, outputFile2];
}

const normalize2 = async (inputFile, outputFile) => {
    await basePromise(
        spawn,
        `ffmpeg-normalize`,
        [
            inputFile,
            "-o", outputFile,
            '-b:a', '192k',
            "-c:a", "libmp3lame"
        ]);
    return outputFile;
}

const merge = async (inputFile1, inputFile2, outputFile) => {
    await basePromise(
        spawn,
        pathToFfmpeg,
        [
            '-y',
            '-i', inputFile1,
            '-i', inputFile2,
            '-filter_complex', "[0:0]volume=1.1[a];[1:0]volume=0.75[b];[a][b]amix=inputs=2:duration=longest",
            '-c:a', 'libmp3lame',
            outputFile
        ]);
    return outputFile;
}

const mergeVideo = async (videoFile, audioFile, outputFile) => {
    await basePromise(
        spawn,
        pathToFfmpeg,
        [
            '-i', videoFile,
            '-i', audioFile,
            '-c:v', 'copy',
            '-c:a', 'aac',
            outputFile
        ]);
    return outputFile;
}

const removeFiles = (files) => {
    files.forEach((file) => {
        fs.unlinkSync(file);
    });
}

async function getSong(url, interaction, count = 1, short = false) {
    const song = {
        title: null,
        url: null,
        user: interaction.member.nickname != null ? interaction.member.nickname : interaction.member.user.username,
        thumbnail: null,
        length: null,
        short: short
    }

    const songInfo = await ytdl.getBasicInfo(url, { agent });
    if (songInfo.videoDetails.isLive || songInfo.videoDetails.title == undefined) return [];

    song.title = songInfo.videoDetails.title;
    song.url = songInfo.videoDetails.video_url;
    song.thumbnail = songInfo.videoDetails.thumbnails[songInfo.videoDetails.thumbnails.length - 1].url;
    song.length = songInfo.videoDetails.lengthSeconds;

    return song;
}

async function getSongFromInfo(songInfo, interaction, count = 1, short = false) {
    if (songInfo.isLive || songInfo.title == undefined) return [];

    const song = {
        title: null,
        url: null,
        user: interaction.member.nickname != null ? interaction.member.nickname : interaction.user.username,
        thumbnail: null,
        length: null,
        short: short
    }

    song.title = songInfo.title;
    song.url = songInfo.url;
    song.thumbnail = songInfo.bestThumbnail.url;
    if (songInfo.durationSec != undefined) {
        song.length = songInfo.durationSec;
    }
    else {
        const duration = songInfo.duration.split(/:+/g).reverse();
        song.length = 0;
        for (const i in duration) {
            song.length += parseInt(duration[i]) * Math.pow(60, i);
        }
    }

    return song;
}