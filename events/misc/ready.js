const { getServers, insertServer, connectToDatabase } = require('../../src/database/database');
const Firebird = require('node-firebird');

module.exports = async (client) => {
    console.log(`Logged to the client ${client.user.username}\n-> Ready on ${client.guilds.cache.size} servers for a total of ${client.users.cache.size} users`);
    client.user.setActivity(client.config.app.activity);

    console.log(`Check database...`);
    client.db = await connectToDatabase(client);
    const ServerList = client.guilds.cache.map(guild => guild.id);

    const dbServerList = await getServers(client);
    
    for (const i in ServerList) {
        if (!dbServerList.includes(ServerList[i])) {
            await insertServer(client, ServerList[i]);
        }
    }
    console.log(`Database check successful!`);
};