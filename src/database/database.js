const Firebird = require('node-firebird');

function transactionTemplate(client, sql) {
    return new Promise((resolve, reject) => {
        client.db.transaction(Firebird.ISOLATION_READ_COMMITED, function (err, transaction) {
            if (err) {
                console.log(err);
                reject(err);
            }
            transaction.query(sql, function (err, result) {
                if (err) {
                    console.log(err);
                    transaction.rollback();
                    reject(err);
                }
                else {
                    transaction.commit(function (err) {
                        if (err) {
                            console.log(err);
                            transaction.rollback();
                            reject(err);
                        }
                    });
                    resolve(result);
                }
            });
        });
    });
}

module.exports = {
    connectToDatabase(client) {
        return new Promise((resolve, reject) => {
            Firebird.attach(client.dbOptions, function (err, db) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(db);
            });
        });
    },

    async getServersId(client) {
        const dbServerListTemp = [];
        const result = await transactionTemplate(client, 'SELECT * FROM SERVER;');
        for (const id in result) {
            dbServerListTemp.push(result[id].SERVER_ID.toString('utf8'));
        }
        return dbServerListTemp;
    },

    async updateBirthDayRole(client, serverID, roleID) {
        const dbServerListTemp = [];
        const result = await transactionTemplate(client,
            `UPDATE SERVER
             SET BIRTHDAY_ROLE=${roleID}
             WHERE SERVER_ID=${serverID};`);
        for (const id in result) {
            dbServerListTemp.push(result[id].SERVER_ID.toString('utf8'));
        }
        return dbServerListTemp;
    },

    async getUserBDAYServers(client, userID) {
        const result = await transactionTemplate(client,
            `SELECT * FROM SERVER_USERS 
             JOIN SERVER ON SERVER_USERS.SERVER_ID=SERVER.SERVER_ID
             WHERE USER_ID = ${userID}
             AND BIRTHDAY_ROLE IS NOT NULL;`);
        return result;
    },

    async getUsersId(client) {
        const dbServerListTemp = [];
        const result = await transactionTemplate(client, 'SELECT * FROM USER_T;');
        for (const id in result) {
            dbServerListTemp.push(result[id].USER_ID.toString('utf8'));
        }
        return dbServerListTemp;
    },

    async getUser(client, userID) {
        const result = await transactionTemplate(client,
            `SELECT * FROM USER_T
             WHERE USER_ID=${userID};`);
        return result[0];
    },

    async getUsersBDAYId(client, date = new Date()) {
        const dbServerListTemp = [];
        const result = await transactionTemplate(client, `SELECT * FROM USER_T
                            WHERE EXTRACT(DAY FROM BIRTHDAY)=${date.getDate()}
                            AND EXTRACT(MONTH FROM BIRTHDAY)=${date.getMonth() + 1};`);
        for (const id in result) {
            dbServerListTemp.push(result[id].USER_ID.toString('utf8'));
        }
        return dbServerListTemp;
    },

    async insertServer(client, serverId, birthdayRole = null, rules = null, info = null) {
        if (birthdayRole != null) birthdayRole = "'" + birthdayRole + "'";
        if (rules != null) rules = "'" + rules + "'";
        if (info != null) info = "'" + info + "'";
        const result = await transactionTemplate(client, `INSERT INTO SERVER(SERVER_ID, BIRTHDAY_ROLE, RULES, INFO) 
                          VALUES('${serverId}', ${birthdayRole}, ${rules}, ${info});`);
        return result;
    },

    async insertUser(client, userId, messageCount = 0, birthday = null, lastChange = null) {
        if (birthday != null) birthday = "'" + birthday + "'";
        if (lastChange != null) lastChange = "'" + birthday + "'";
        const result = await transactionTemplate(client, `INSERT INTO USER_T(USER_ID, MESSAGE_COUNT, BIRTHDAY, LAST_CHANGE_BDAY) 
                          VALUES('${userId}', ${messageCount}, ${birthday}, ${lastChange});`);
        return result;
    },

    async updateBirthdayUser(client, userId, birthday) {
        const date = new Date();
        const result = await transactionTemplate(client, `UPDATE USER_T
                            SET BIRTHDAY='${birthday}',
                                LAST_CHANGE_BDAY='${date.getDate()}.${date.getMonth()}.${date.getFullYear()}'
                            WHERE USER_ID=${userId};`);
        return result;
    },

    async deleteServer(client, serverId) {
        const result = await transactionTemplate(client, `DELETE FROM SERVER
                          WHERE SERVER_ID='${serverId}'`);
        return result;
    },

    async deleteServerBdayRole(client, serverID) {
        const result = await transactionTemplate(client, `UPDATE SERVER
                            SET BIRTHDAY_ROLE=NULL
                            WHERE SERVER_ID=${serverID};`);
        return result;
    },

    async deleteUser(client, userId) {
        const result = await transactionTemplate(client, `DELETE FROM USER_T
                          WHERE USER_ID='${userId}'`);
        return result;
    },

    async getServerUsers(client, serverId) {
        const dbServerListTemp = [];
        const result = await transactionTemplate(client, `SELECT * FROM SERVER_USERS
                            WHERE SERVER_ID='${serverId}';`);
        for (const id in result) {
            dbServerListTemp.push(result[id].USER_ID.toString('utf8'));
        }
        return dbServerListTemp;
    },

    async getUserServers(client, userId) {
        const dbServerListTemp = [];
        const result = await transactionTemplate(client, `SELECT * FROM SERVER_USERS
                            WHERE USER_ID='${userId}';`);
        for (const id in result) {
            dbServerListTemp.push(result[id].SERVER_ID.toString('utf8'));
        }
        return dbServerListTemp;
    },

    async insertServerUser(client, serverId, userId, messageCount = 0) {
        const result = await transactionTemplate(client, `INSERT INTO SERVER_USERS(SERVER_ID, USER_ID, SERVER_MESSAGE_COUNT) 
                          VALUES('${serverId}', '${userId}', ${messageCount});`);
        return result;
    },

    async insertSong(client, serverId, title, url, requestUser, thumbnailUrl, length, channelId) {
        const result = await transactionTemplate(client,
            `INSERT INTO MUSIC_QUEUE(SERVER_ID, TITLE, URL, REQUEST_USER, THUMBNAIL_URL, LENGTH, CHANNEL_ID) 
             VALUES('${serverId}', '${title.replace(/\'/g, '\'\'')}', '${url}', '${requestUser.replace(/\'/g, '\'\'')}', 
             '${thumbnailUrl}', ${length}, '${channelId}');`);
        return result;
    },

    async deleteSongs(client, serverId, count = 1) {
        const result = await transactionTemplate(client, `DELETE FROM MUSIC_QUEUE
                          WHERE SERVER_ID='${serverId}'
                          ROWS ${count};`);
        return result;
    },

    async getSongs(client, serverId, from = 1, to = 1) {
        const result = await transactionTemplate(client, `SELECT * FROM MUSIC_QUEUE
                          WHERE SERVER_ID='${serverId}'
                          ROWS ${from} TO ${to};`);
        return result;
    },

    async getAllSongs(client, serverId) {
        const result = await transactionTemplate(client, `SELECT * FROM MUSIC_QUEUE
                          WHERE SERVER_ID='${serverId}';`);
        return result;
    },

    async insertBadWord(client, serverId, word) {
        const result = await transactionTemplate(client, `INSERT INTO BAD_WORDS(SERVER_ID, WORD) 
                          VALUES('${serverId}', '${word.replace(/\'/g, '\'\'')}');`);
        return result;
    },

    async deleteBadWord(client, serverId, word) {
        const result = await transactionTemplate(client, `DELETE FROM BAD_WORDS
                          WHERE SERVER_ID='${serverId}'
                          AND WORD='${word.replace(/\'/g, '\'\'')}'`);
        return result;
    },

    async getBadWord(client, serverId, word) {
        const result = await transactionTemplate(client, `SELECT * FROM BAD_WORDS
                          WHERE SERVER_ID='${serverId}'
                          AND WORD='${word.replace(/\'/g, '\'\'')}'`);
        return result;
    },

    async getBadWords(client, serverId) {
        const dbServerListTemp = [];
        const result = await transactionTemplate(client, `SELECT * FROM BAD_WORDS
                          WHERE SERVER_ID='${serverId}'`);
        for (const id in result) {
            dbServerListTemp.push(result[id].WORD.toString('utf8'));
        }
        return dbServerListTemp;
    },

    async insertServerCommand(client, serverId, command, songUrl = null, imageUrl = null, text = null) {
        if (command != null) command = command.replace(/\'/g, '\'\'');
        if (text != null) text = "'" + text.replace(/\'/g, '\'\'') + "'";
        if (songUrl != null) songUrl = "'" + songUrl + "'";
        if (imageUrl != null) imageUrl = "'" + imageUrl + "'";
        const result = await transactionTemplate(client, `INSERT INTO COMMANDS(SERVER_ID, COMMAND, SONG_URL, IMAGE_URL, TEXT) 
                            VALUES('${serverId}', '${command}', ${songUrl}, ${imageUrl}, ${text});`);
        return result;
    },

    async getServerCommand(client, serverId, command) {
        if (command != null) command = command.replace(/\'/g, '\'\'');
        const result = await transactionTemplate(client, `SELECT * FROM COMMANDS
                          WHERE SERVER_ID='${serverId}'
                          AND COMMAND='${command}';`);
        return result;
    },

    async getServerCommands(client, serverId) {
        const result = await transactionTemplate(client, `SELECT * FROM COMMANDS
                          WHERE SERVER_ID='${serverId}'`);
        return result;
    },

    async deleteServerCommand(client, serverId, command) {
        if (command != null) command = command.replace(/\'/g, '\'\'');
        const result = await transactionTemplate(client, `DELETE FROM COMMANDS
                          WHERE SERVER_ID=${serverId}
                          AND COMMAND='${command}'`);
        return result;
    },

    async getGameType(client, game) {
        const result = await transactionTemplate(client, `SELECT * FROM GAME_TYPES
                          WHERE GAME_TYPE_NAME='${game.replace(/\'/g, '\'\'')}';`);
        return result[0];
    },

    async insertGame(client, channelId, serverId, gameTypeId, isStart = false) {
        const result = await transactionTemplate(client, `INSERT INTO GAME(CHANNEL_ID, SERVER_ID, GAME_TYPE_ID, IS_START) 
                            VALUES('${channelId}', '${serverId}', ${gameTypeId}, ${isStart});`);
        return result;
    },

    async updateGameStart(client, channelId, isStart = true) {
        const result = await transactionTemplate(client, `UPDATE GAME
                            SET IS_START=${isStart}
                            WHERE CHANNEL_ID='${channelId}';`);
        return result;
    },

    async updateGameTurn(client, channelId, turn) {
        const result = await transactionTemplate(client, `UPDATE GAME
                            SET TURN=${turn}
                            WHERE CHANNEL_ID='${channelId}';`);
        return result;
    },

    async getGame(client, channelId) {
        const result = await transactionTemplate(client, `SELECT * FROM GAME
                            WHERE CHANNEL_ID='${channelId}';`);
        return result[0];
    },

    async deleteGame(client, channelId) {
        const result = await transactionTemplate(client, `DELETE FROM GAME
                            WHERE CHANNEL_ID='${channelId}';`);
        return result;
    },

    async insertGamePlayer(client, channelId, userId) {
        const result = await transactionTemplate(client, `INSERT INTO GAME_PLAYERS(CHANNEL_ID, USER_ID) 
                            VALUES('${channelId}', '${userId}');`);
        return result;
    },

    async getGamePlayers(client, channelId) {
        const result = await transactionTemplate(client, `SELECT * FROM GAME_PLAYERS
                          WHERE CHANNEL_ID='${channelId}';`);
        return result;
    },

    async deleteGamePlayers(client, channelId) {
        const result = await transactionTemplate(client, `DELETE FROM GAME_PLAYERS
                          WHERE CHANNEL_ID='${channelId}';`);
        return result;
    },

    async deleteGamePlayer(client, channelId, index) {
        const result = await transactionTemplate(client, `DELETE FROM GAME_PLAYERS
                          WHERE CHANNEL_ID='${channelId}'
                          ROWS ${index} TO ${index};`);
        return result;
    },

    async getTownsGame(client, channelId) {
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

    async insertGameTown(client, channelId, townId, townName) {
        if (townName != null) townName = townName.replace(/\'/g, '\'\'');
        const date = new Date();
        const result = await transactionTemplate(client, `INSERT INTO TOWNS_GAME(CHANNEL_ID, TOWN_ID, GAME_NAME, GAME_DATE)
                            VALUES('${channelId}', ${townId}, '${townName}', '${date.getDate()}.${date.getMonth()}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}');`);
        return result;
    },

    async deleteGameTowns(client, channelId) {
        const result = await transactionTemplate(client, `DELETE FROM TOWNS_GAME
                            WHERE CHANNEL_ID='${channelId}';`);
        return result;
    },

    async insertTown(client, town) {
        if (town != null) town = town.replace(/\'/g, '\'\'');
        const result = await transactionTemplate(client, `INSERT INTO TOWNS(NAME) 
                            VALUES('${town}');`);
        return result;
    },

    async insertTownAlt(client, townId, name) {
        if (name != null) name = name.replace(/\'/g, '\'\'');
        const result = await transactionTemplate(client, `INSERT INTO TOWNS_ALTNAMES(TOWN_ID, ALT_NAME) 
                            VALUES(${townId}, '${name}');`);
        return result;
    },

    async getTownAndAlts(client, name) {
        if (name != null) name = name.replace(/\'/g, '\'\'');
        const result = await transactionTemplate(client, `SELECT * FROM TOWNS_ALTNAMES
                            JOIN TOWNS ON TOWNS_ALTNAMES.TOWN_ID=TOWNS.TOWN_ID
                            WHERE NAME='${name}'
                            OR ALT_NAME='${name}';`);
        return result[0];
    },

    async getTownGame(client, channelId, townId) {
        const result = await transactionTemplate(client, `SELECT * FROM TOWNS_GAME
                          WHERE CHANNEL_ID='${channelId}'
                          AND TOWN_ID=${townId};`);
        return result[0];
    },

    async getLastTownGame(client, channelId) {
        const result = await transactionTemplate(client, `SELECT FIRST 1 * FROM TOWNS_GAME
                          WHERE CHANNEL_ID='${channelId}'
                          ORDER BY GAME_DATE DESC;`);
        return result[0];
    },

    async updateRules(client, serverId, rules) {
        if (rules != null) rules = "'" + rules.replace(/\'/g, '\'\'') + "'";
        const result = await transactionTemplate(client, `UPDATE SERVER
                            SET RULES=${rules}
                            WHERE SERVER_ID='${serverId}';`);
        return result;
    },

    async getRules(client, serverId) {
        const result = await transactionTemplate(client, `SELECT * FROM SERVER
                          WHERE SERVER_ID='${serverId}'
                          AND RULES IS NOT NULL;`);
        return result[0];
    },

    async deleteRules(client, serverId) {
        const result = await transactionTemplate(client, `UPDATE SERVER
                            SET RULES=NULL
                            WHERE SERVER_ID='${serverId}'
                            AND RULES IS NOT NULL;`);
        return result;
    },

    async updateInfo(client, serverId, info) {
        if (info != null) info = "'" + info.replace(/\'/g, '\'\'') + "'";
        const result = await transactionTemplate(client, `UPDATE SERVER
                            SET INFO=${info}
                            WHERE SERVER_ID='${serverId}';`);
        return result;
    },

    async getInfo(client, serverId) {
        const result = await transactionTemplate(client, `SELECT * FROM SERVER
                          WHERE SERVER_ID='${serverId}'
                          AND INFO IS NOT NULL;`);
        return result[0];
    },

    async deleteInfo(client, serverId) {
        const result = await transactionTemplate(client, `UPDATE SERVER
                            SET INFO=NULL
                            WHERE SERVER_ID='${serverId}'
                            AND INFO IS NOT NULL;`);
        return result;
    },
};