const bday_config = require("./bday_config.json");

module.exports = {
    async bday(client) {
        let date = new Date();
        let metka = true;
        setInterval(function () {
            if (metka === true) {
                const guild = client.guilds.cache.get("205351208796291072");
                const role = guild.roles.cache.get("398208367341862924");
                for (var i in bday_config.BDAY) {
                    for (var j in bday_config.BDAY[i]) {
                        const member = guild.members.cache.get(j);
                        if (member != undefined) {
                            member.roles.remove(role).catch(console.error);
                            if (bday_config.BDAY[i][j]['0'] === (new Date().getDate().toString()) &&
                                bday_config.BDAY[i][j]['1'] === (new Date().getMonth() + 1).toString()) {
                                member.roles.add(role).catch(console.error);
                            }
                        }
                    }
                }
            }
            if (date.getDate().toString() != (new Date().getDate().toString())) {
                metka = true;
                date = new Date();
            }
            else {
                if (metka === true) {
                    metka = false;
                }
                date = new Date();
            }
        }, 60000);
    }
}