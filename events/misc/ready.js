const Firebird = require('node-firebird');
var path = require("path");

function getServers(db) {
    return new Promise(function (resolve, reject) {
        const dbServerListTemp = [];
        db.query('SELECT * FROM SERVER', function (err, result) {
            if (err) {
                console.log(err);
                reject(err);
            }

            for (const id in result) {
                dbServerListTemp.push(result[id].SERVER_ID.toString('utf8'));
            }
            resolve(dbServerListTemp)
        });
    });
}

module.exports = async (client) => {
    console.log(`Logged to the client ${client.user.username}\n-> Ready on ${client.guilds.cache.size} servers for a total of ${client.users.cache.size} users`);
    client.user.setActivity(client.config.app.activity);

    client.dbOptions = {
        host: '127.0.0.1',
        port: 3050,
        database: path.resolve('./database/DISCORD-BOT.FDB'),
        user: 'sysdba',
        password: 'masterkey',
        lowercase_keys: false,
        role: null,
        pageSize: 4096,
        retryConnectionInterval: 1000
    };

    Firebird.attach(client.dbOptions, function (err, db) {
        console.log(`Check database...`);

        if (err)
            console.log(err);


        const ServerList = client.guilds.cache.map(guild => guild.id);

        getServers(db)
            .then(function (dbServerList) {
                for (const i in ServerList) {
                    if (!dbServerList.includes(ServerList[i])) {
                        db.query(`INSERT INTO SERVER(SERVER_ID) VALUES(${ServerList[i]})`, function (err, result) {
                            if (err)
                                console.log(err);
                        });
                    }
                }

                db.detach();
                console.log(`Database check successful!`);
            })
    });
};