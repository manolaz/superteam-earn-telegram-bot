import TelegramBot, { Message } from 'node-telegram-bot-api';
import { UserPreferences } from '../models/user';
import { getUser, updateUserPreferences, createUser } from '../services/userService';
import { getAvailableSkills } from '../services/earnApiService';

// Temporary state store for multi-step configuration
const userConfigState: Map<number, { step: string; data: Partial<UserPreferences> }> = new Map();

const CONFIG_STEPS = {
    START: 'START',
    ASK_GEOGRAPHY: 'ASK_GEOGRAPHY',
    ASK_TYPE: 'ASK_TYPE',
    ASK_MIN_USD: 'ASK_MIN_USD',
    ASK_MAX_USD: 'ASK_MAX_USD',
    ASK_SKILLS: 'ASK_SKILLS',
    CONFIRM: 'CONFIRM',
    DONE: 'DONE'
};

const availableSkills = getAvailableSkills();

export default (bot: TelegramBot) => {
    bot.onText(/\/configure/, (msg) => {
        const chatId = msg.chat.id;
        let user = getUser(chatId);
        if (!user) {
            user = createUser(chatId);
        }
        userConfigState.set(chatId, { step: CONFIG_STEPS.ASK_GEOGRAPHY, data: { ...user.preferences } });
        bot.sendMessage(chatId, "Let's configure your notification preferences!");
        askGeography(bot, chatId);
    });

    bot.onText(/\/myconfig/, (msg) => {
        const chatId = msg.chat.id;
        const user = getUser(chatId);
        if (user && user.isConfigured) {
            let message = "Your current configuration:\n";
            message += `- Geography: ${user.preferences.geography || 'Not set'}\n`;
            message += `- Notify for Bounties: ${user.preferences.notifyForBounties ? 'Yes' : 'No'}\n`;
            message += `- Notify for Projects: ${user.preferences.notifyForProjects ? 'Yes' : 'No'}\n`;
            message += `- Min USD Value: ${user.preferences.minUSDValue !== undefined ? '$' + user.preferences.minUSDValue : 'Not set'}\n`;
            message += `- Max USD Value: ${user.preferences.maxUSDValue !== undefined ? '$' + user.preferences.maxUSDValue : 'Not set'}\n`;
            message += `- Skills: ${user.preferences.skills && user.preferences.skills.length > 0 ? user.preferences.skills.join(', ') : 'Any'}\n`;
            bot.sendMessage(chatId, message);
        } else {
            bot.sendMessage(chatId, "You haven't configured your preferences yet. Use /configure to set them up.");
        }
    });

    const askGeography = (bot: TelegramBot, chatId: number) => {
        const state = userConfigState.get(chatId);
        if (!state) return;
        state.step = CONFIG_STEPS.ASK_GEOGRAPHY;
        // In a real bot, you might fetch this list or have a more comprehensive one.
        const exampleGeographies = ['Vietnam', 'India', 'USA', 'Europe', 'Global']; 
        bot.sendMessage(chatId, `What is your primary geography for opportunities? (e.g., Vietnam, Global, etc.). Type one or 'skip'. Current: ${state.data.geography || 'Global'}`);
    };

    const askListingType = (bot: TelegramBot, chatId: number) => {
        const state = userConfigState.get(chatId);
        if (!state) return;
        state.step = CONFIG_STEPS.ASK_TYPE;
        bot.sendMessage(chatId, "Do you want notifications for Bounties, Projects, or Both?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Bounties Only", callback_data: "config_type_bounties" }],
                    [{ text: "Projects Only", callback_data: "config_type_projects" }],
                    [{ text: "Both", callback_data: "config_type_both" }],
                    [{ text: "Skip", callback_data: "config_type_skip" }]
                ]
            }
        });
    };

    const askMinUSD = (bot: TelegramBot, chatId: number) => {
        const state = userConfigState.get(chatId);
        if (!state) return;
        state.step = CONFIG_STEPS.ASK_MIN_USD;
        bot.sendMessage(chatId, `Enter minimum USD value for listings (e.g., 100). Type '0' for no minimum, or 'skip'. Current: ${state.data.minUSDValue || 'Not set'}`);
    };

    const askMaxUSD = (bot: TelegramBot, chatId: number) => {
        const state = userConfigState.get(chatId);
        if (!state) return;
        state.step = CONFIG_STEPS.ASK_MAX_USD;
        bot.sendMessage(chatId, `Enter maximum USD value for listings (e.g., 5000). Type '0' for no maximum, or 'skip'. Current: ${state.data.maxUSDValue || 'Not set'}`);
    };

    const askSkills = (bot: TelegramBot, chatId: number) => {
        const state = userConfigState.get(chatId);
        if (!state) return;
        state.step = CONFIG_STEPS.ASK_SKILLS;
        const currentSkills = state.data.skills?.join(', ') || 'Any';
        // For simplicity, we ask for comma-separated. A real bot might use inline keyboards for selection.
        bot.sendMessage(chatId, `Enter skills you're interested in, separated by commas (e.g., typescript,rust,marketing). Type 'any' or 'skip' to not filter by skills. Current: ${currentSkills}\nAvailable: ${availableSkills.slice(0,10).join(', ')}... (and more)`);
    };

    const confirmConfiguration = (bot: TelegramBot, chatId: number) => {
        const state = userConfigState.get(chatId);
        if (!state) return;
        state.step = CONFIG_STEPS.CONFIRM;

        let summary = "Please confirm your preferences:\n";
        summary += `- Geography: ${state.data.geography || 'Global'}\n`;
        summary += `- Bounties: ${state.data.notifyForBounties ? 'Yes' : 'No'}\n`;
        summary += `- Projects: ${state.data.notifyForProjects ? 'Yes' : 'No'}\n`;
        summary += `- Min USD: ${state.data.minUSDValue !== undefined ? '$' + state.data.minUSDValue : 'Any'}\n`;
        summary += `- Max USD: ${state.data.maxUSDValue !== undefined ? '$' + state.data.maxUSDValue : 'Any'}\n`;
        summary += `- Skills: ${state.data.skills && state.data.skills.length > 0 ? state.data.skills.join(', ') : 'Any'}\n`;

        bot.sendMessage(chatId, summary + "\nIs this correct?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ Yes, Save", callback_data: "config_confirm_yes" }],
                    [{ text: "❌ No, Restart", callback_data: "config_confirm_no" }]
                ]
            }
        });
    };

    // Listener for text messages to handle configuration steps
    bot.on('message', (msg: Message) => {
        const chatId = msg.chat.id;
        if (!msg.text || msg.text.startsWith('/')) return; // Ignore commands and non-text messages

        const state = userConfigState.get(chatId);
        if (!state) return; // Not in configuration mode

        const text = msg.text.trim().toLowerCase();

        switch (state.step) {
            case CONFIG_STEPS.ASK_GEOGRAPHY:
                if (text !== 'skip') {
                    state.data.geography = msg.text.trim(); // Keep original casing for display
                }
                askListingType(bot, chatId);
                break;
            case CONFIG_STEPS.ASK_MIN_USD:
                if (text === 'skip') {
                    delete state.data.minUSDValue;
                } else {
                    const minVal = parseInt(text, 10);
                    if (!isNaN(minVal) && minVal >= 0) {
                        state.data.minUSDValue = minVal === 0 ? undefined : minVal;
                    } else {
                        bot.sendMessage(chatId, "Invalid input. Please enter a number (e.g., 100) or 'skip'.");
                        askMinUSD(bot, chatId); // Re-ask
                        return;
                    }
                }
                askMaxUSD(bot, chatId);
                break;
            case CONFIG_STEPS.ASK_MAX_USD:
                 if (text === 'skip') {
                    delete state.data.maxUSDValue;
                } else {
                    const maxVal = parseInt(text, 10);
                    if (!isNaN(maxVal) && maxVal >= 0) {
                        state.data.maxUSDValue = maxVal === 0 ? undefined : maxVal;
                         if (state.data.minUSDValue !== undefined && state.data.maxUSDValue !== undefined && state.data.maxUSDValue < state.data.minUSDValue) {
                            bot.sendMessage(chatId, "Max USD value cannot be less than Min USD value. Please re-enter.");
                            askMaxUSD(bot, chatId); // Re-ask
                            return;
                        }
                    } else {
                        bot.sendMessage(chatId, "Invalid input. Please enter a number (e.g., 5000) or 'skip'.");
                        askMaxUSD(bot, chatId); // Re-ask
                        return;
                    }
                }
                askSkills(bot, chatId);
                break;
            case CONFIG_STEPS.ASK_SKILLS:
                if (text === 'skip' || text === 'any') {
                    state.data.skills = [];
                } else {
                    state.data.skills = msg.text.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0 && availableSkills.includes(s));
                    if (state.data.skills.length === 0 && text !== 'any' && text !== 'skip') {
                         bot.sendMessage(chatId, "No valid skills recognized from your input or skills list is empty. Please try again or type 'any'/'skip'.");
                         askSkills(bot, chatId); // Re-ask
                         return;
                    }
                }
                confirmConfiguration(bot, chatId);
                break;
        }
    });

    // Listener for callback queries from inline keyboards
    bot.on('callback_query', (callbackQuery) => {
        const msg = callbackQuery.message;
        if (!msg) return;
        const chatId = msg.chat.id;
        const data = callbackQuery.data;

        const state = userConfigState.get(chatId);
        if (!state) {
            // If state is lost, or callback is old, tell user to restart.
            bot.answerCallbackQuery(callbackQuery.id);
            bot.sendMessage(chatId, "Configuration session expired or invalid. Please start over with /configure.");
            return;
        }
        
        bot.answerCallbackQuery(callbackQuery.id); // Acknowledge callback

        if (data?.startsWith("config_type_")) {
            const type = data.substring("config_type_".length);
            if (type === 'bounties') {
                state.data.notifyForBounties = true;
                state.data.notifyForProjects = false;
            } else if (type === 'projects') {
                state.data.notifyForBounties = false;
                state.data.notifyForProjects = true;
            } else if (type === 'both') {
                state.data.notifyForBounties = true;
                state.data.notifyForProjects = true;
            } else if (type === 'skip') {
                // Keep existing or default if not set
                state.data.notifyForBounties = state.data.notifyForBounties === undefined ? true : state.data.notifyForBounties;
                state.data.notifyForProjects = state.data.notifyForProjects === undefined ? true : state.data.notifyForProjects;
            }
            bot.editMessageText(`Selected: ${type}`, { chat_id: chatId, message_id: msg.message_id });
            askMinUSD(bot, chatId);
        } else if (data === "config_confirm_yes") {
            updateUserPreferences(chatId, state.data);
            bot.editMessageText("✅ Preferences saved successfully!", { chat_id: chatId, message_id: msg.message_id });
            bot.sendMessage(chatId, "You're all set! I'll notify you about new opportunities based on these settings. You can use /myconfig to see them or /configure to change them.");
            userConfigState.delete(chatId);
        } else if (data === "config_confirm_no") {
            bot.editMessageText("Configuration cancelled. Let's start over.", { chat_id: chatId, message_id: msg.message_id });
            userConfigState.delete(chatId);
            // Restart configuration
            const user = getUser(chatId) || createUser(chatId);
            userConfigState.set(chatId, { step: CONFIG_STEPS.ASK_GEOGRAPHY, data: { ...user.preferences } });
            askGeography(bot, chatId);
        }
    });
};
