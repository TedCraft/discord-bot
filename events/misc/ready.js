const { getServersId, insertServer, deleteServer, 
        connectToDatabase, 
        getUsersId, insertUser, deleteUser, 
        getServerUsers, insertServerUser } = require('../../src/database/database');

module.exports = async (client) => {
    console.log(`Logged to the client ${client.user.username}\n-> Ready on ${client.guilds.cache.size} servers for a total of ${client.users.cache.size} users`);
    client.user.setActivity(client.config.app.activity);

    console.log(`Check database...`);
    client.db = await connectToDatabase(client);
    await checkDatabase(client);
    console.log(`Database check successful!`);
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
            catch(ex) {
                console.log(ex);
            }
        }
    }
    
    const serverList = client.guilds.cache.map(guild => guild);
    const dbUsersIDList = await getUsersId(client);
    for(const i in serverList) {
        const usersIdList = serverList[i].members.cache.filter(member => !member.user.bot).map(member => member.id);
        const dbServerUsers = await getServerUsers(client, serverList[i].id);
        for (const j in usersIdList) {
            if (!dbUsersIDList.includes(usersIdList[j])) {
                await insertUser(client, usersIdList[j]);
            }
            if (!dbServerUsers.includes(usersIdList[j])) {
                await insertServerUser(client, serverList[i].id, usersIdList[j]);
            }
        }
    }
}