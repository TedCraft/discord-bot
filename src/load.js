const { readdirSync } = require('fs');
const { Collection } = require('discord.js');
var path = require("path");

client.commands = new Collection();

client.connections = new Map();

client.dbOptions = {
    host: '127.0.0.1',
    port: 3050,
    database: path.resolve('./database/DISCORD-BOT.FDB'),
    user: 'sysdba',
    password: 'masterkey',
    lowercase_keys: false,
    role: null,
    pageSize: 4096,
    retryConnectionInterval: 1000
};

console.log(`Loading events...`);

const miscEvents = readdirSync('./events/misc/').filter(file => file.endsWith('.js'));

for (const file of miscEvents) {
    const event = require(`../events/misc/${file}`);
    console.log(`-> Loaded event ${file.split('.')[0]}`);
    client.on(file.split('.')[0], event.bind(null, client));
    delete require.cache[require.resolve(`../events/misc/${file}`)];
};

const administrationEvents = readdirSync('./events/administration/').filter(file => file.endsWith('.js'));

for (const file of administrationEvents) {
    const event = require(`../events/administration/${file}`);
    console.log(`-> Loaded event ${file.split('.')[0]}`);
    client.on(file.split('.')[0], event.bind(null, client));
    delete require.cache[require.resolve(`../events/administration/${file}`)];
};

console.log(`-> Loaded event BDay`);
const { bday } = require('../bday/bday')
bday(client);

console.log(`Loading commands...`);

readdirSync('./commands').forEach(dirs => {
    const commands = readdirSync(`./commands/${dirs}`).filter(files => files.endsWith('.js'));

    for (const file of commands) {
        try {
            const command = require(`../commands/${dirs}/${file}`);
            console.log(`-> Loaded command ${command.name.toLowerCase()}`);
            client.commands.set(command.name.toLowerCase(), command);
            delete require.cache[require.resolve(`../commands/${dirs}/${file}`)];
        }
        catch (exception) {
            console.log(exception);
        }
    };
});