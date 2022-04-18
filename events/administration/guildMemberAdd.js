const { getUserServers } = require('../../src/database/database');
const { checkBadWordsStroke } = require('../../src/administration/administration');

module.exports = async (client, user_new) => {
    await insertUser(client, user_new.id);
    //await insertServerUser(client, serverList[i].id, usersIdList[j]);
    
    const dbUserServers = await getUserServers(client, user_new.id);
    for(const i in dbUserServers) {
        const guild = client.guilds.cache.get(dbUserServers[i]);
        const member = await guild.members.fetch(user_new.id);
        if(!member.manageable) return;
        
        if(member.nickname == null) {
            newNick = await checkBadWordsStroke(client, guild.id, user_new.username);
            if (newNick != user_new.username) member.setNickname(newNick);
        }
    }
}