const { getTheme, getThemeEnabled, setLastSeen } = require('../../src/database/database');
const { VoiceState, Client } = require('discord.js')

module.exports = async (client = Client.prototype, oldState = VoiceState.prototype, newState = VoiceState.prototype) => {
    if (await getThemeEnabled(client, newState.guild.id) && !newState.member.user.bot) {
        if (newState.channelId !== null && oldState.channelId == null) {
            const userTheme = await getTheme(client, newState.member.id);

            const now = new Date();
            if (now.getHours() < 6) now.setDate(now.getDate() - 1)
            if (userTheme.LAST_SEEN == null) userTheme.LAST_SEEN = new Date(Date.now() - 86400000);
            else userTheme.LAST_SEEN = new Date(userTheme.LAST_SEEN);

            if (userTheme.THEME == null || now.setHours(6, 0, 0, 0) - userTheme.LAST_SEEN.getTime() == 0) return;

            const cmd = client.commands.get("play");
            cmd.execute(client, newState, userTheme.THEME.toString('utf8'), false, true).catch(err => {
                console.log(err);
            });
            await setLastSeen(client, newState.member.id);
        }
    }
};