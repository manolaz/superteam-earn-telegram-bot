import { Listing, ListingType } from '../models/listing';

// Mock data - in a real scenario, this would fetch from Superteam Earn DB/API
const mockListings: Listing[] = [
    {
        id: '1',
        title: 'Build a Telegram Bot',
        sponsorName: 'Solana Foundation',
        rewardTokenName: 'USDC',
        rewardValue: 1000,
        rewardUSD: 1000,
        listingType: ListingType.BOUNTY,
        skills: ['typescript', 'telegram-api', 'nodejs'],
        geographies: ['Global'],
        link: 'https://earn.superteam.fun/listings/1',
        deadline: '2024-08-01',
        publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000) // ~15 hours ago
    },
    {
        id: '2',
        title: 'Develop a dApp',
        sponsorName: 'Superteam',
        listingType: ListingType.PROJECT,
        usdRange: { min: 2000, max: 5000 },
        rewardUSD: 2000, // Lower end of range for filtering
        skills: ['rust', 'solana', 'react'],
        geographies: ['Vietnam', 'India'],
        link: 'https://earn.superteam.fun/listings/2',
        deadline: '2024-09-15',
        publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000) // ~20 hours ago
    },
    {
        id: '3',
        title: 'Marketing Campaign for NFT Project',
        sponsorName: 'NFT Innovators',
        isVariableComp: true,
        rewardUSD: 0, // For variable comp, might need a different handling or min expectation
        listingType: ListingType.PROJECT,
        skills: ['marketing', 'social-media', 'nft'],
        geographies: ['Global'],
        link: 'https://earn.superteam.fun/listings/3',
        deadline: '2024-07-30',
        publishedAt: new Date() // Published just now
    },
    {
        id: '4',
        title: 'Vietnamese Community Moderator',
        sponsorName: 'Solana VN',
        rewardTokenName: 'USDC',
        rewardValue: 300,
        rewardUSD: 300,
        listingType: ListingType.BOUNTY,
        skills: ['community-management', 'vietnamese'],
        geographies: ['Vietnam'],
        link: 'https://earn.superteam.fun/listings/4',
        deadline: '2024-08-10',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // ~5 hours ago
    }
];

// In-memory store for listings that have been processed for notification scheduling
const notifiedListingIds = new Set<string>();

export const getNewListings = async (): Promise<Listing[]> => {
    // Simulate fetching new listings that haven't been processed for notification yet
    // In a real system, you'd query your DB for listings published > 12 hours ago
    // and not yet marked as 'notification_scheduled' or similar.
    // For this mock, we'll filter based on publishedAt and if we've "notified" them.
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    
    return mockListings.filter(listing => {
        // Check if listing is older than 0 hours (i.e., published)
        // and younger than 12 hours for the notification trigger logic
        // The actual notification sending will happen after 12 hours of publish time.
        // This function simulates fetching listings that are candidates for notification.
        return listing.publishedAt <= new Date() && !notifiedListingIds.has(listing.id);
    });
};

// Call this function after a notification has been successfully sent for a listing
export const markListingAsNotified = (listingId: string) => {
    notifiedListingIds.add(listingId);
};

// This function would be used by the notification service to get listings
// that are due to be notified (published 12 hours ago or more)
export const getDueListings = async (): Promise<Listing[]> => {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    return mockListings.filter(listing => 
        listing.publishedAt <= twelveHoursAgo && !listing.notifiedAt
    );
};

// This function simulates updating the listing in the DB after notification
export const markListingNotificationSent = async (listingId: string): Promise<void> => {
    const listing = mockListings.find(l => l.id === listingId);
    if (listing) {
        listing.notifiedAt = new Date();
        console.log(`Marked listing ${listingId} as notification sent.`);
    }
};


// For configuration: list of available skills on Earn
export const getAvailableSkills = (): string[] => {
    // In a real app, fetch this from the Earn platform
    return [
        'typescript', 'javascript', 'python', 'rust', 'solana', 'react', 'vue', 'angular',
        'nodejs', 'go', 'java', 'swift', 'kotlin', 'smart-contracts', 'defi', 'nft',
        'ui-ux', 'graphic-design', 'content-writing', 'marketing', 'social-media',
        'community-management', 'devops', 'telegram-api', 'vietnamese'
    ].sort();
};
