const { readdirSync } = require('fs');
const { Collection } = require('discord.js');

client.commands = new Collection();

client.queue = new Map();

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
    client.on(file.split('.')[0], event);
    delete require.cache[require.resolve(`../events/administration/${file}`)];
};

console.log(`-> Loaded event BDay`);
const {bday} = require('../bday/bday')
bday(client);

console.log(`Loading commands...`);

readdirSync('./commands').forEach(dirs => {
    const commands = readdirSync(`./commands/${dirs}`).filter(files => files.endsWith('.js'));

    for (const file of commands) {
        const command = require(`../commands/${dirs}/${file}`);
        console.log(`-> Loaded command ${command.name.toLowerCase()}`);
        client.commands.set(command.name.toLowerCase(), command);
        delete require.cache[require.resolve(`../commands/${dirs}/${file}`)];
    };
});