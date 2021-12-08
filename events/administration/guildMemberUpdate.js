const { checkBadWordsStroke } = require('../../src/administration/administration');

module.exports = async (client, user_old, user_new) => {
    if (user_new.nickname != null) {
        newNick = await checkBadWordsStroke(client, user_new.guild.id, user_new.nickname);
        if (newNick != user_new.nickname) user_new.setNickname(newNick);
    }
    else {
        newNick = await checkBadWordsStroke(client, user_new.guild.id, user_new.user.username);
        if (newNick != user_new.user.username) user_new.setNickname(newNick);
    }
}