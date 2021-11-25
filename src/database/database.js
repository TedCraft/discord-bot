const { reject } = require("async");
const Firebird = require('node-firebird');

module.exports = {
    connectToDatabase(client) {
        return new Promise(resolve => {
            Firebird.attach(client.dbOptions, function (err, db) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(db);
            });
        });
    },

    getServers(client) {
        return new Promise(resolve => {
            const dbServerListTemp = [];
            client.db.query('SELECT * FROM SERVER;', function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                for (const id in result) {
                    dbServerListTemp.push(result[id].SERVER_ID.toString('utf8'));
                }
                resolve(dbServerListTemp);
            });
        });
    },

    insertServer(client, serverId, birthdayRole = null, rules = null, info = null) {
        return new Promise(resolve => {
            client.db.query(`INSERT INTO SERVER(SERVER_ID, BIRTHDAY_ROLE, RULES, INFO) 
                          VALUES('${serverId}', '${birthdayRole}', '${rules}', '${info}');`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    insertMusic(client, serverId, title, url, requestUser, thumbnailUrl, length, channelId) {
        return new Promise(resolve => {
            client.db.query(`INSERT INTO MUSIC_QUEUE(SERVER_ID, TITLE, URL, REQUEST_USER, THUMBNAIL_URL, LENGTH, CHANNEL_ID) 
                          VALUES('${serverId}', '${title.replace(/\'/g, '\'\'')}', '${url}', '${requestUser.replace(/\'/g, '\'\'')}', '${thumbnailUrl}', ${length}, '${channelId}');`,
                function (err, result) {
                    if (err) {
                        console.log(title)
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    deleteSongs(client, serverId, count = 1) {
        return new Promise(resolve => {
            client.db.query(`DELETE FROM MUSIC_QUEUE
                          WHERE SERVER_ID='${serverId}'
                          ROWS ${count};`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    getSongs(client, serverId, from = 1, to = 1) {
        return new Promise(resolve => {
            const dbServerListTemp = [];
            client.db.query(`SELECT * FROM MUSIC_QUEUE
                          WHERE SERVER_ID='${serverId}'
                          ROWS ${from} TO ${to};`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                for (const id in result) {
                    dbServerListTemp.push(result[id]);
                }
                resolve(dbServerListTemp);
            });
        });
    },
    
    getAllSongs(client, serverId) {
        return new Promise(resolve => {
            const dbServerListTemp = [];
            client.db.query(`SELECT * FROM MUSIC_QUEUE
                          WHERE SERVER_ID='${serverId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                for (const id in result) {
                    dbServerListTemp.push(result[id]);
                }
                resolve(dbServerListTemp);
            });
        });
    },
}