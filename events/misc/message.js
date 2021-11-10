module.exports = (client, message) => {
    if (message.author.bot || message.channel.type === 'dm') return;

    const prefix = client.config.app.prefix;

    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(command));
    
    if(cmd) {
        if(cmd.voice) {
            if (!message.member.voice.channel) 
                return message.channel.send(`${message.author} зайди в войс канал`);
                
            const serverQueue = client.queue.get(message.guild.id);
            cmd.execute(message, serverQueue, client.queue, !isNaN(parseInt(args[1])) ? args[1] : 1)
        }
        else
            cmd.execute(client, message, args);
    }
}