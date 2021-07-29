const Discord = require("discord.js");
const fs = require("fs");
const got = require('got');
const main_cfg = require("./main_cfg.json");
const cfg_mas = [];

for (var i in main_cfg) {
    try {
        cfg_mas[i] = require("./configs/" + i + ".json");
    }
    catch (err) {
        cfg_mas[i] = null;
    }
}



async function poe_characters(client) {
    const channel = client.channels.cache.get("205351208796291072");
    setInterval(function () {
        for (const i in cfg_mas) {
            got.get("https://pathofexile.com/character-window/get-characters?accountName=" + i, { responseType: 'json' })
                .then(res => {
                    const user = client.users.cache.get(main_cfg[i]);
                    const current_json = res.body;
                    if (cfg_mas[i] === null) {
                        fs.writeFile(`./poe/poe_characters/configs/${i}.json`, JSON.stringify(current_json), function () { });
                        cfg_mas[i] = current_json;
                    }
                    if (JSON.stringify(current_json) != JSON.stringify(cfg_mas[i])) {
                        for (var j in cfg_mas[i]) {
                            try {
                                if (current_json[j]["name"] != cfg_mas[i][j]["name"]) {
                                    continue;
                                }
                                if (current_json[j]["league"] != cfg_mas[i][j]["league"] && 
                                (current_json[j]["league"] === "Standard" || current_json[j]["league"] === "SSF Standard")) {
                                    const attachment = new Discord.MessageAttachment('https://i.imgur.com/w3duR07.png');
                                    channel.send(`АХАХА ${user} рипнул ${cfg_mas[i][j]["name"]} в пое!!!`, attachment);
                                }
                            }
                            catch (err) {
                                break;
                            }
                        }
                        fs.writeFile(`./poe/poe_characters/configs/${i}.json`, JSON.stringify(current_json), function () { });
                        cfg_mas[i] = current_json;
                    }
                })
                .catch (err => {
                    console.log("ошибка sql запроса");
                });
            }
    }, 15000);
};
module.exports.poe_characters = poe_characters;