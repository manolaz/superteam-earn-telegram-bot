import TelegramBot from 'node-telegram-bot-api';

export default (bot: TelegramBot) => {
    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        const helpMessage = `
Superteam Earn Notification Bot Help:

/start - Welcome message and basic bot information.
/configure - Set or update your notification preferences. This includes:
    - Minimum and Maximum USD value for listings.
    - Whether to receive notifications for Bounties, Projects, or both.
    - Specific skills you are interested in.
    - Your primary geography (e.g., Vietnam, India, Global).
/myconfig - Display your current notification settings.
/help - Show this help message.

Notifications for new listings are sent approximately 12 hours after they are published on Superteam Earn, matching your configured preferences.
        `;
        bot.sendMessage(chatId, helpMessage);
    });
};
