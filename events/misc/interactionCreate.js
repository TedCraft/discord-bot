const { checkCustomCommands, executeCustomCommands } = require('../../src/administration/administration');

module.exports = async (client, interaction) => {
    const cmd = client.commands.get(interaction.commandName);
    if (interaction.isAutocomplete()) {
        cmd.autoComplete(client, interaction).catch(err => {
            console.log(err);
        });
        return;
    }
    if (!interaction.isCommand()) return;

    if (cmd) {
        cmd.execute(client, interaction).catch(err => {
            interaction.reply({ content: "Отказано", ephemeral: true }).catch(ex => { });
            console.log(err);
        });
        return;
    }

    const customCmd = await checkCustomCommands(client, interaction.guildId, interaction.commandName)
    if (customCmd) {
        executeCustomCommands(client, interaction, customCmd).catch(err => {
            interaction.reply("Отказано").catch(ex => { });
            console.log(err);
        });
    }
};