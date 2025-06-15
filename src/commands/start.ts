import TelegramBot from 'node-telegram-bot-api';
import { createUser, getUser } from '../services/userService';

export default (bot: TelegramBot) => {
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        let user = getUser(chatId);
        if (!user) {
            user = createUser(chatId);
        }

        const welcomeMessage = `
👋 Welcome to the Superteam Earn Notification Bot!

I'll help you stay updated with the latest bounties and projects from Superteam Earn.

Here are some commands you can use:
/configure - Set up your notification preferences (USD value, type, skills).
/myconfig - View your current notification preferences.
/help - Show this help message again.

To get started, please use /configure to set your preferences.
        `;
        bot.sendMessage(chatId, welcomeMessage);
    });
};
