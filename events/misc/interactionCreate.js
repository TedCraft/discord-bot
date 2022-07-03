const { checkCustomCommands, executeCustomCommands } = require('../../src/administration/administration');
const { Client, CommandInteraction } = require('discord.js')

module.exports = async (client = Client.prototype, interaction = CommandInteraction.prototype) => {
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
                await interaction.reply({ content: "Отказано", ephemeral: true }).catch(ex => { });
                console.log(err);
            });
        }
    }
    catch (ex) {
        console.log(ex);
    }
};