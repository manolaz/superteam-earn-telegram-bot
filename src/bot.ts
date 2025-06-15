import dotenv from 'dotenv';
dotenv.config();

import TelegramBot from 'node-telegram-bot-api';
import registerStartCommand from './commands/start';
import registerHelpCommand from './commands/help';
import registerConfigureCommand from './commands/configure';
import { startNotificationPolling } from './services/notificationService';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error("Telegram Bot Token not found. Please set TELEGRAM_BOT_TOKEN in your .env file.");
    process.exit(1);
}

console.log("Bot token loaded. Initializing bot...");
const bot = new TelegramBot(token, { polling: true });
console.log("Bot initialized. Registering commands...");

// Register commands
registerStartCommand(bot);
console.log("/start command registered.");

registerHelpCommand(bot);
console.log("/help command registered.");

registerConfigureCommand(bot);
console.log("/configure and /myconfig commands registered.");


// Start notification polling
// Check every 15 minutes for new listings that are due for notification
startNotificationPolling(bot, 15); 

console.log("Superteam Earn Telegram Bot is running...");

bot.on('polling_error', (error) => {
    console.error(`Polling error: ${error.message}`);
    // Potentially add more robust error handling or restart logic here
});

bot.on('webhook_error', (error) => {
    console.error(`Webhook error: ${error.message}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log("Shutting down bot...");
    bot.stopPolling().then(() => {
        console.log("Bot polling stopped.");
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log("Shutting down bot...");
    bot.stopPolling().then(() => {
        console.log("Bot polling stopped.");
        process.exit(0);
    });
});
