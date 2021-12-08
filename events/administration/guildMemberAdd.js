module.exports = async (user) => {
    if (user.user.username[0] === "!") {
        var temp = 0;
        for (i = 0; i < user.user.username.length; i++) {
            if (user.user.username[i] === "!" || user.user.username[i] === " ") {
                temp++;
            }
            else {
                break;
            }
        }
        if (user.user.username.length === temp) {
            user.setNickname("Восклицательный знак").catch(() => {
                return;
            });
            return;
        }
        else {
            user.setNickname(user.user.username.slice(temp)).catch(() => {
                return;
            });
        }
    }
}