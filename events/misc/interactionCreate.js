const { checkCustomCommands, executeCustomCommands } = require('../../src/administration/administration');

module.exports = async (client, interaction) => {
    const cmd = client.commands.get(interaction.commandName);

    try {
        if (interaction.isAutocomplete()) {
            await cmd.autoComplete(client, interaction).catch(async (err) => {
                console.log(err);
            });
            return;
        }
        if (!interaction.isCommand()) return;

        if (cmd) {
            await cmd.execute(client, interaction).catch(async (err) => {
                await interaction.reply({ content: "Отказано", ephemeral: true }).catch(ex => { });
                console.log(err);
            });
            return;
        }

        const customCmd = await checkCustomCommands(client, interaction.guildId, interaction.commandName)
        if (customCmd) {
            await executeCustomCommands(client, interaction, customCmd).catch(async (err) => {
                await interaction.reply("Отказано").catch(ex => { });
                console.log(err);
            });
        }
    }
    catch (ex) {
        console.log(ex);
    }
};