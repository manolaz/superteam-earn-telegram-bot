import TelegramBot from 'node-telegram-bot-api';
import { Listing, ListingType } from '../models/listing';
import { User } from '../models/user';
import { getAllUsers } from './userService';
import { getDueListings, markListingNotificationSent } from './earnApiService';

const UTM_SOURCE = '?utm_source=telegrambot';

const formatListingMessage = (listing: Listing): string => {
    let rewardString = '';
    if (listing.isVariableComp) {
        rewardString = 'Variable Comp';
    } else if (listing.usdRange) {
        rewardString = `$${listing.usdRange.min} - $${listing.usdRange.max} USD`;
    } else if (listing.rewardTokenName && listing.rewardValue) {
        rewardString = `${listing.rewardValue} ${listing.rewardTokenName} (~$${listing.rewardUSD} USD)`;
    } else {
        rewardString = `$${listing.rewardUSD} USD`;
    }

    return `
📢 *New Opportunity on Superteam Earn!* 📢

*Title:* ${listing.title}
*Sponsor:* ${listing.sponsorName}
*Type:* ${listing.listingType}
*Reward:* ${rewardString}
*Deadline:* ${listing.deadline}
*Skills:* ${listing.skills.join(', ') || 'N/A'}

🔗 *View Listing:* ${listing.link}${UTM_SOURCE}
    `;
};

const isUserEligibleForListing = (user: User, listing: Listing): boolean => {
    const prefs = user.preferences;

    // Geography check: User must be in a geography the listing is open to, or listing is Global
    // or user's geography preference is Global (meaning they want all)
    const userGeography = prefs.geography?.toLowerCase();
    const listingGeographies = listing.geographies.map(g => g.toLowerCase());

    if (userGeography !== 'global' && !listingGeographies.includes('global') && !listingGeographies.includes(userGeography!)) {
        return false;
    }


    // Listing type check
    if (prefs.notifyForBounties === false && listing.listingType === ListingType.BOUNTY) {
        return false;
    }
    if (prefs.notifyForProjects === false && listing.listingType === ListingType.PROJECT) {
        return false;
    }

    // USD value check
    const listingValue = listing.rewardUSD; // Use rewardUSD as the base for filtering
    if (prefs.minUSDValue !== undefined && listingValue < prefs.minUSDValue) {
        return false;
    }
    if (prefs.maxUSDValue !== undefined && listingValue > prefs.maxUSDValue) {
        // For ranges, check if the max preference is less than the listing's min range value
        if (listing.usdRange && prefs.maxUSDValue < listing.usdRange.min) return false;
        // If not a range, and it exceeds max, then false
        if (!listing.usdRange && listingValue > prefs.maxUSDValue) return false;
    }


    // Skills check: if user specified skills, listing must have at least one
    if (prefs.skills && prefs.skills.length > 0) {
        const hasMatchingSkill = prefs.skills.some(skill => listing.skills.includes(skill));
        if (!hasMatchingSkill) {
            return false;
        }
    }

    return true;
};


export const checkAndSendNotifications = async (bot: TelegramBot) => {
    console.log('Checking for new listings to notify...');
    const dueListings = await getDueListings();
    if (dueListings.length === 0) {
        console.log('No new listings due for notification.');
        return;
    }

    const users = getAllUsers().filter(user => user.isConfigured); // Only notify configured users

    for (const listing of dueListings) {
        console.log(`Processing listing: ${listing.title}`);
        for (const user of users) {
            if (isUserEligibleForListing(user, listing)) {
                try {
                    const message = formatListingMessage(listing);
                    await bot.sendMessage(user.id, message, { parse_mode: 'Markdown' });
                    console.log(`Notified user ${user.id} about listing ${listing.id}`);
                } catch (error: any) {
                    console.error(`Failed to send notification to user ${user.id} for listing ${listing.id}:`, error.message);
                    // Handle specific errors, e.g., bot blocked by user
                    if (error.response && error.response.statusCode === 403) {
                        console.warn(`Bot was blocked by user ${user.id}. Consider removing them or marking as inactive.`);
                        // Potentially remove user or mark as inactive: userService.setUserInactive(user.id);
                    }
                }
            }
        }
        // Mark listing as notified to prevent re-sending (in a real DB, update a status field)
        await markListingNotificationSent(listing.id);
    }
};

// Set up a poller to run checkAndSendNotifications periodically
export const startNotificationPolling = (bot: TelegramBot, intervalMinutes: number = 60) => {
    console.log(`Notification polling started. Checking every ${intervalMinutes} minutes.`);
    // Run once immediately, then set interval
    checkAndSendNotifications(bot);
    setInterval(() => checkAndSendNotifications(bot), intervalMinutes * 60 * 1000);
};
