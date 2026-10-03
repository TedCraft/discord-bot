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
        .setName('separate')
        .setDescription('Разделяет голос и инструментал.')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Ссылка на композицию или название.')
                .setRequired(true))
    ,

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
        await interaction.editReply({ content: `Композиция превышает максимальную длину (2:30 с видео, 10 минут без видео)`, ephemeral: true });
        client.process_ai = false;
        return;
    }

    try {
        const files = [];

        const savedMP3 = await saveMP3(ytdl(song.url, {
            filter: "audioonly",
            highWaterMark: 1 << 62,
            dlChunkSize: 0,
            quality: "highestaudio",
            opusEncoded: true,
            agent
        }), getFilePath("saved", "mp3"));
        files.push(savedMP3);

        interaction.editReply({ content: `Создание акапеллы...` });
        const [acapellaPath, instrumentalPath] = await generateAcapella(savedMP3, `${cwd()}\\ai\\`);
        const newAPath = `${cwd()}\\ai\\` + (/^\p{P}+$/u.test(song.title) ? "result" : song.title.replaceAll(/\p{P}/gu, "")) + " Acapella.mp3";
        const newInstPath = `${cwd()}\\ai\\` + (/^\p{P}+$/u.test(song.title) ? "result" : song.title.replaceAll(/\p{P}/gu, "")) + " Instrumental.mp3";
        fs.renameSync(acapellaPath, newAPath)
        fs.renameSync(instrumentalPath, newInstPath)
        files.push(newAPath, newInstPath);

        await interaction.editReply({ content: `(Оригинальный трек: ${song.url})`, files: [newAPath, newInstPath] });
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
        // if (f.stderr) f.stderr.on("data", (err) => {
        //     console.log(`err: ${err}`);
        // })
        // if (f.stdout) f.stdout.on("data", (err) => {
        //     console.log(`err: ${err}`);
        // })
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
            "--use_cuda",
            "--model_name", "UVR_MDXNET_Main",
            "--output_format", "MP3",
            "--denoise", "false",
            "--normalize", "false"
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
            "--use_cuda",
            "--model_name", "Reverb_HQ_By_FoxJoy",
            "--output_format", "MP3",
            "--denoise", "false",
            "--normalize", "false",
            "--single_stem", "instrumental"
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
            '-filter_complex', "[0:0]volume=0.75[a];[1:0]volume=1.1[b];[a][b]amix=inputs=2:duration=longest",
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

    const songInfo = await ytdl.getBasicInfo(url, {
         agent 
        });
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