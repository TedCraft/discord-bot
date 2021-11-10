module.exports = (user_old, user_new) => {
    if (user_new.nickname != null) {
        if (user_new.nickname[0] === "!") {
            var temp = 0;
            for (i = 0; i < user_new.nickname.length; i++) {
                if (user_new.nickname[i] === "!" || user_new.nickname[i] === " ") {
                    temp++;
                }
                else {
                    break;
                }
            }
            if (user_new.nickname.length === temp && user_new.user.username[0] === "!") {
                var temp = 0;
                for (i = 0; i < user_new.user.username.length; i++) {
                    if (user_new.user.username[i] === "!" || user_new.user.username[i] === " ") {
                        temp++;
                    }
                    else {
                        break;
                    }
                }
                if (user_new.user.username.length === temp) {
                    user_new.setNickname("Восклицательный знак").catch(() => {
                        return;
                    });
                    return;
                }
                else {
                    user_new.setNickname(user_new.user.username.slice(temp)).catch(() => {
                        return;
                    });
                    return;
                }
            }
            user_new.setNickname(user_new.nickname.slice(temp)).catch(() => {
                return;
            });
        }
    }
    else {
        var temp = 0;
        for (i = 0; i < user_new.user.username.length; i++) {
            if (user_new.user.username[i] === "!" || user_new.user.username[i] === " ") {
                temp++;
            }
            else {
                break;
            }
        }
        if (user_new.user.username.length === temp) {
            user_new.setNickname("Восклицательный знак").catch(() => {
                return;
            });
            return;
        }
        else {
            user_new.setNickname(user_new.user.username.slice(temp)).catch(() => {
                return;
            });
            return;
        }
    }
}