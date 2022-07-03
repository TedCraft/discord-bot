const { getServersId, insertServer, deleteServer,
    connectToDatabase,
    getUsersId, insertUser, deleteUser,
    getServerUsers, insertServerUser, insertTown, insertTownAlt, getServerCommands } = require('../../src/database/database');
const { readFileSync } = require('fs');
const { checkBirthDays } = require('../../src/administration/administration');
const { scheduleJob } = require("node-schedule");
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = async (client) => {
    console.log(`\nLogged to the client ${client.user.username}\n-> Ready on ${client.guilds.cache.size} servers for a total of ${client.users.cache.size} users`);
    client.user.setActivity(client.config.app.activity);

    console.log(`\nCheck database...`);
    client.db = await connectToDatabase(client);
    await checkDatabase(client);
    console.log(`Database check successful!`);

    /*let temp = readFileSync("C:\\Users\\User\\Desktop\\cities500\\cities500.txt", "utf8");
    temp = temp.split("\n");
    let n = 1;
    for (const i in temp) {
        temp[i] = temp[i].split("\t");
        await insertTown(client, temp[i][2]);
        const alts = temp[i][3].split(",");
        for (const j in alts) {
            if (alts[j] != "")
                await insertTownAlt(client, n, alts[j].toLowerCase());
        }
        n++;
    }*/

    await checkBirthDays(client).catch(err => { console.log(err); });
    scheduleJob('0 0 * * *', () => { checkBirthDays(client).catch(err => { console.log(err); }) });

    const rest = new REST({ version: '9' }).setToken(client.config.app.token);
    await (async () => {
        try {
            console.log('\nStarted refreshing application (/) commands.');

            //client.application.commands.cache.delete();
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: client.commands.map(item => item.data.toJSON()) },
            );
            //client.application.commands.set(client.commands.map(item => item.data.toJSON()))

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();

    const guildsId = client.guilds.cache.map(guild => guild.id);
    for (const i in guildsId) {
        const commands = await getServerCommands(client, guildsId[i]);
        const jsonCommands = commands.map(item => new SlashCommandBuilder().setName(item.COMMAND.toString('utf8')).setDescription('Кастомная команда.').toJSON());

        await (async () => {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guildsId[i]),
                    { body: jsonCommands },
                );
            } catch (error) {
                console.error(error);
            }
        })();
    }
};

async function checkDatabase(client) {
    const serverIDList = client.guilds.cache.map(guild => guild.id);

    const dbServersIDList = await getServersId(client);
    for (const i in serverIDList) {
        if (!dbServersIDList.includes(serverIDList[i])) {
            await insertServer(client, serverIDList[i]);
        }
    }
    for (const i in dbServersIDList) {
        if (!serverIDList.includes(dbServersIDList[i])) {
            try {
                await deleteServer(client, dbServersIDList[i]);
            }
            catch (ex) {
                console.log(ex);
            }
        }
    }

    const serverList = client.guilds.cache.map(guild => guild);
    const dbUsersIDList = await getUsersId(client);
    for (const i in serverList) {
        const users = await serverList[i].members.fetch();
        const usersIdList = users.filter(member => !member.user.bot).map(member => member.id);
        const dbServerUsers = await getServerUsers(client, serverList[i].id);
        for (const j in usersIdList) {
            if (!dbUsersIDList.includes(usersIdList[j])) {
                await insertUser(client, usersIdList[j]);
                dbUsersIDList.push(usersIdList[j]);
            }
            if (!dbServerUsers.includes(usersIdList[j])) {
                await insertServerUser(client, serverList[i].id, usersIdList[j]);
                dbServerUsers.push(usersIdList[j]);
            }
        }
    }
}