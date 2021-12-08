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

    getServersId(client) {
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

    getUsersId(client) {
        return new Promise(resolve => {
            const dbServerListTemp = [];
            client.db.query('SELECT * FROM USER_T;', function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                for (const id in result) {
                    dbServerListTemp.push(result[id].USER_ID.toString('utf8'));
                }
                resolve(dbServerListTemp);
            });
        });
    },

    insertServer(client, serverId, birthdayRole = null, rules = null, info = null) {
        return new Promise(resolve => {
            if (birthdayRole != null) birthdayRole = "'" + birthdayRole + "'";
            if (rules != null) rules = "'" + rules + "'";
            if (info != null) info = "'" + info + "'";
            client.db.query(`INSERT INTO SERVER(SERVER_ID, BIRTHDAY_ROLE, RULES, INFO) 
                          VALUES('${serverId}', ${birthdayRole}, ${rules}, ${info});`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    insertUser(client, userId, messageCount = 0, birthday = null) {
        return new Promise(resolve => {
            if (birthday != null) birthday = "'" + birthday + "'";
            client.db.query(`INSERT INTO USER_T(USER_ID, MESSAGE_COUNT, BIRTHDAY) 
                          VALUES('${userId}', ${messageCount}, ${birthday});`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    deleteServer(client, serverId) {
        return new Promise(resolve => {
            client.db.query(`DELETE FROM SERVER
                          WHERE SERVER_ID='${serverId}'`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    deleteUser(client, userId) {
        return new Promise(resolve => {
            client.db.query(`DELETE FROM USER_T
                          WHERE USER_ID='${userId}'`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    getServerUsers(client, serverId) {
        return new Promise(resolve => {
            const dbServerListTemp = [];
            client.db.query(`SELECT * FROM SERVER_USERS
                            WHERE SERVER_ID='${serverId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                for (const id in result) {
                    dbServerListTemp.push(result[id].USER_ID.toString('utf8'));
                }
                resolve(dbServerListTemp);
            });
        });
    },
    
    getUserServers(client, userId) {
        return new Promise(resolve => {
            const dbServerListTemp = [];
            client.db.query(`SELECT * FROM SERVER_USERS
                            WHERE USER_ID='${userId}';`, function (err, result) {
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
    
    insertServerUser(client, serverId, userId, messageCount = 0) {
        return new Promise(resolve => {
            client.db.query(`INSERT INTO SERVER_USERS(SERVER_ID, USER_ID, SERVER_MESSAGE_COUNT) 
                          VALUES('${serverId}', '${userId}', ${messageCount});`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    insertSong(client, serverId, title, url, requestUser, thumbnailUrl, length, channelId) {
        return new Promise(resolve => {
            client.db.query(`INSERT INTO MUSIC_QUEUE(SERVER_ID, TITLE, URL, REQUEST_USER, THUMBNAIL_URL, LENGTH, CHANNEL_ID) 
                          VALUES('${serverId}', '${title.replace(/\'/g, '\'\'')}', '${url}', '${requestUser.replace(/\'/g, '\'\'')}', '${thumbnailUrl}', ${length}, '${channelId}');`,
                function (err, result) {
                    if (err) {
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
            client.db.query(`SELECT * FROM MUSIC_QUEUE
                          WHERE SERVER_ID='${serverId}'
                          ROWS ${from} TO ${to};`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },

    getAllSongs(client, serverId) {
        return new Promise(resolve => {
            client.db.query(`SELECT * FROM MUSIC_QUEUE
                          WHERE SERVER_ID='${serverId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },

    insertBadWord(client, serverId, word) {
        return new Promise(resolve => {
            client.db.query(`INSERT INTO BAD_WORDS(SERVER_ID, WORD) 
                          VALUES('${serverId}', '${word.replace(/\'/g, '\'\'')}');`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    deleteBadWord(client, serverId, word) {
        return new Promise(resolve => {
            client.db.query(`DELETE FROM BAD_WORDS
                          WHERE SERVER_ID='${serverId}'
                          AND WORD='${word.replace(/\'/g, '\'\'')}'`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    getBadWord(client, serverId, word) {
        return new Promise(resolve => {
            client.db.query(`SELECT * FROM BAD_WORDS
                          WHERE SERVER_ID='${serverId}'
                          AND WORD='${word.replace(/\'/g, '\'\'')}'`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },

    getBadWords(client, serverId) {
        return new Promise(resolve => {
            const dbServerListTemp = [];
            client.db.query(`SELECT * FROM BAD_WORDS
                          WHERE SERVER_ID='${serverId}'`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }

                for (const id in result) {
                    dbServerListTemp.push(result[id].WORD.toString('utf8'));
                }
                resolve(dbServerListTemp);
            });
        });
    },
};