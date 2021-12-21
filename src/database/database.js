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
        return new Promise((resolve, reject) => {
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

    updateBirthDayRole(client, serverID, roleID) {
        return new Promise((resolve, reject) => {
            const dbServerListTemp = [];
            client.db.query(`UPDATE SERVER
                            SET BIRTHDAY_ROLE=${roleID}
                            WHERE SERVER_ID=${serverID};`, function (err, result) {
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

    getUserBDAYServers(client, userID) {
        return new Promise((resolve, reject) => {
            client.db.query(`SELECT * FROM SERVER_USERS 
                            JOIN SERVER ON SERVER_USERS.SERVER_ID=SERVER.SERVER_ID
                            WHERE USER_ID = ${userID}
                            AND BIRTHDAY_ROLE IS NOT NULL;`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },

    getUsersId(client) {
        return new Promise((resolve, reject) => {
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

    getUser(client, userID) {
        return new Promise((resolve, reject) => {
            client.db.query(`SELECT * FROM USER_T
                            WHERE USER_ID=${userID};`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result[0]);
            });
        });
    },

    getUsersBDAYId(client, date = new Date()) {
        return new Promise((resolve, reject) => {
            const dbServerListTemp = [];
            client.db.query(`SELECT * FROM USER_T
                            WHERE EXTRACT(DAY FROM BIRTHDAY)=${date.getDate()}
                            AND EXTRACT(MONTH FROM BIRTHDAY)=${date.getMonth() + 1};`, function (err, result) {
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
        return new Promise((resolve, reject) => {
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

    insertUser(client, userId, messageCount = 0, birthday = null, lastChange = null) {
        return new Promise((resolve, reject) => {
            if (birthday != null) birthday = "'" + birthday + "'";
            if (lastChange != null) lastChange = "'" + birthday + "'";
            client.db.query(`INSERT INTO USER_T(USER_ID, MESSAGE_COUNT, BIRTHDAY, LAST_CHANGE_BDAY) 
                          VALUES('${userId}', ${messageCount}, ${birthday}, ${lastChange});`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },

    updateBirthdayUser(client, userId, birthday) {
        return new Promise((resolve, reject) => {
            const date = new Date();
            client.db.query(`UPDATE USER_T
                            SET BIRTHDAY='${birthday}',
                                LAST_CHANGE_BDAY='${date.getDate()}.${date.getMonth()}.${date.getFullYear()}'
                            WHERE USER_ID=${userId};`,
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
        return new Promise((resolve, reject) => {
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

    deleteServerBdayRole(client, serverID) {
        return new Promise((resolve, reject) => {
            client.db.query(`UPDATE SERVER
                            SET BIRTHDAY_ROLE=NULL
                            WHERE SERVER_ID=${serverID};`,
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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

    insertServerCommand(client, serverId, command, songUrl = null, imageUrl = null, text = null) {
        return new Promise((resolve, reject) => {
            if (command != null) command = command.replace(/\'/g, '\'\'');
            if (text != null) text = "'" + text.replace(/\'/g, '\'\'') + "'";
            if (songUrl != null) songUrl = "'" + songUrl + "'";
            if (imageUrl != null) imageUrl = "'" + imageUrl + "'";
            client.db.query(`INSERT INTO COMMANDS(SERVER_ID, COMMAND, SONG_URL, IMAGE_URL, TEXT) 
                            VALUES('${serverId}', '${command}', ${songUrl}, ${imageUrl}, ${text});`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },

    getServerCommand(client, serverId, command) {
        return new Promise((resolve, reject) => {
            if (command != null) command = command.replace(/\'/g, '\'\'');
            client.db.query(`SELECT * FROM COMMANDS
                          WHERE SERVER_ID='${serverId}'
                          AND COMMAND='${command}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    getServerCommands(client, serverId) {
        return new Promise((resolve, reject) => {
            client.db.query(`SELECT * FROM COMMANDS
                          WHERE SERVER_ID='${serverId}'`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    deleteServerCommand(client, serverId, command) {
        return new Promise((resolve, reject) => {
            if (command != null) command = command.replace(/\'/g, '\'\'');
            client.db.query(`DELETE FROM COMMANDS
                          WHERE SERVER_ID=${serverId}
                          AND COMMAND='${command}'`,
                function (err, result) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    resolve(result);
                });
        });
    },
    
    getGameType(client, game) {
        return new Promise((resolve, reject) => {
            client.db.query(`SELECT * FROM GAME_TYPES
                          WHERE GAME_TYPE_NAME='${game.replace(/\'/g, '\'\'')}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result[0]);
            });
        });
    },
    
    insertGame(client, channelId, serverId, gameTypeId, isStart = false) {
        return new Promise((resolve, reject) => {
            client.db.query(`INSERT INTO GAME(CHANNEL_ID, SERVER_ID, GAME_TYPE_ID, IS_START) 
                            VALUES('${channelId}', '${serverId}', ${gameTypeId}, ${isStart});`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    updateGameStart(client, channelId, isStart = true) {
        return new Promise((resolve, reject) => {
            client.db.query(`UPDATE GAME
                            SET IS_START=${isStart}
                            WHERE CHANNEL_ID='${channelId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    updateGameTurn(client, channelId, turn) {
        return new Promise((resolve, reject) => {
            client.db.query(`UPDATE GAME
                            SET TURN=${turn}
                            WHERE CHANNEL_ID='${channelId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    getGame(client, channelId) {
        return new Promise((resolve, reject) => {
            client.db.query(`SELECT * FROM GAME
                            WHERE CHANNEL_ID='${channelId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result[0]);
            });
        });
    },
    
    deleteGame(client, channelId) {
        return new Promise((resolve, reject) => {
            client.db.query(`DELETE FROM GAME
                            WHERE CHANNEL_ID='${channelId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },

    insertGamePlayer(client, channelId, userId) {
        return new Promise((resolve, reject) => {
            client.db.query(`INSERT INTO GAME_PLAYERS(CHANNEL_ID, USER_ID) 
                            VALUES('${channelId}', '${userId}');`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    getGamePlayers(client, channelId) {
        return new Promise((resolve, reject) => {
            client.db.query(`SELECT * FROM GAME_PLAYERS
                          WHERE CHANNEL_ID='${channelId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    deleteGamePlayers(client, channelId) {
        return new Promise((resolve, reject) => {
            client.db.query(`DELETE FROM GAME_PLAYERS
                          WHERE CHANNEL_ID='${channelId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    deleteGamePlayer(client, channelId, index) {
        return new Promise((resolve, reject) => {
            client.db.query(`DELETE FROM GAME_PLAYERS
                          WHERE CHANNEL_ID='${channelId}'
                          ROWS ${index} TO ${index};`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    getTownsGame(client, channelId) {
        return new Promise((resolve, reject) => {
            const dbTownsList = [];
            client.db.query(`SELECT * FROM TOWNS_GAME
                            JOIN TOWNS ON
                            WHERE CHANNEL_ID='${channelId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                for (const id in result) {
                    dbTownsList.push(result[id].TOWN.toString('utf8'));
                }
                resolve(dbTownsList);
            });
        });
    },
    
    insertGameTown(client, channelId, townId, townName) {
        return new Promise((resolve, reject) => {
            if (townName != null) townName = townName.replace(/\'/g, '\'\'');
            const date = new Date();
            client.db.query(`INSERT INTO TOWNS_GAME(CHANNEL_ID, TOWN_ID, GAME_NAME, GAME_DATE)
                            VALUES('${channelId}', ${townId}, '${townName}', '${date.getDate()}.${date.getMonth()}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}');`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    deleteGameTowns(client, channelId) {
        return new Promise((resolve, reject) => {
            client.db.query(`DELETE FROM TOWNS_GAME
                            WHERE CHANNEL_ID='${channelId}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    insertTown(client, town) {
        return new Promise((resolve, reject) => {
            if (town != null) town = town.replace(/\'/g, '\'\'');
            client.db.query(`INSERT INTO TOWNS(NAME) 
                            VALUES('${town}');`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    insertTownAlt(client, townId, name) {
        return new Promise((resolve, reject) => {
            if (name != null) name = name.replace(/\'/g, '\'\'');
            client.db.query(`INSERT INTO TOWNS_ALTNAMES(TOWN_ID, ALT_NAME) 
                            VALUES(${townId}, '${name}');`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result);
            });
        });
    },
    
    getTownAndAlts(client, name) {
        return new Promise((resolve, reject) => {
            if (name != null) name = name.replace(/\'/g, '\'\'');
            client.db.query(`SELECT * FROM TOWNS_ALTNAMES
                            JOIN TOWNS ON TOWNS_ALTNAMES.TOWN_ID=TOWNS.TOWN_ID
                            WHERE NAME='${name}'
                            OR ALT_NAME='${name}';`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result[0]);
            });
        });
    },
    
    getTownGame(client, channelId, townId) {
        return new Promise((resolve, reject) => {
            client.db.query(`SELECT * FROM TOWNS_GAME
                          WHERE CHANNEL_ID='${channelId}'
                          AND TOWN_ID=${townId};`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result[0]);
            });
        });
    },
    
    getLastTownGame(client, channelId) {
        return new Promise((resolve, reject) => {
            client.db.query(`SELECT FIRST 1 * FROM TOWNS_GAME
                          WHERE CHANNEL_ID='${channelId}'
                          ORDER BY GAME_DATE DESC;`, function (err, result) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(result[0]);
            });
        });
    },
};