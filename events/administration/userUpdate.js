const { getUserServers } = require('../../src/database/database');
const { checkBadWordsStroke } = require('../../src/administration/administration');

module.exports = async (client, user_old, user_new) => {
    const dbUserServers = await getUserServers(client, user_new.id);
    for(const i in dbUserServers) {
        const guild = client.guilds.cache.get(dbUserServers[i]);
        const member = guild.members.cache.get(user_new.id);
        if(member.nickname == null) {
            newNick = await checkBadWordsStroke(client, guild.id, user_new.username);
            if (newNick != user_new.username) member.setNickname(newNick);
        }
    }
}