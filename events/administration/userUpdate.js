module.exports = (client, message, user_old, user_new) => {
    if (user_new.username != null) {
        if (user_new.username[0] === "!") {
            var temp = 0;
            for (i = 0; i < user_new.username.length; i++) {
                if (user_new.username[i] === "!" || user_new.username[i] === " ") {
                    temp++;
                }
                else {
                    break;
                }
            }
            const guild = client.guilds.cache.get("205351208796291072");
            const member = guild.members.cache.get(user_new.id);
            if (user_new.username.length === temp) {
                member.setNickname("Восклицательный знак").catch(() => {
                    return;
                });
                return;
            }
            member.setNickname(user_new.username.slice(temp)).catch(() => {
                return;
            });
        }
    }
}