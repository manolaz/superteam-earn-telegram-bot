import { Listing, ListingType } from '../models/listing';
import prisma from '../prismaClient';
import { BountyType as PrismaBountyType } from '@prisma/client';

// In-memory store for listings that have been processed for notification scheduling.
// In a production system, you'd ideally have a field in the Bounties table
// (e.g., `notifiedAt` or `isNotificationSent`) to track this.
const notifiedListingIds = new Set<string>();

const mapPrismaBountyToListing = (bounty: any): Listing | null => {
    let listingType: ListingType;
    switch (bounty.type) {
        case PrismaBountyType.bounty:
            listingType = ListingType.BOUNTY;
            break;
        case PrismaBountyType.project:
            listingType = ListingType.PROJECT;
            break;
        default:
            // console.warn(`Unsupported bounty type: ${bounty.type} for bounty ID ${bounty.id}`);
            return null; // Or handle hackathon/other types if needed
    }

    let skillsArray: string[] = [];
    if (bounty.skills && Array.isArray(bounty.skills)) {
        skillsArray = bounty.skills.filter(skill => typeof skill === 'string');
    } else if (typeof bounty.skills === 'string') {
        // If skills is a comma-separated string, parse it (example)
        // skillsArray = bounty.skills.split(',').map(s => s.trim());
        // For now, assuming it's an array or null as per Json? type
    }


    return {
        id: bounty.id,
        title: bounty.title,
        sponsorName: bounty.sponsor?.name || 'N/A',
        rewardTokenName: bounty.token || undefined,
        rewardValue: bounty.rewardAmount || undefined,
        rewardUSD: bounty.usdValue || 0,
        usdRange: bounty.compensationType === 'range' && bounty.minRewardAsk && bounty.maxRewardAsk ?
            { min: bounty.minRewardAsk, max: bounty.maxRewardAsk } : undefined,
        isVariableComp: bounty.compensationType === 'variable',
        listingType: listingType,
        skills: skillsArray,
        geographies: bounty.region ? [bounty.region] : ['GLOBAL'], // Prisma schema has region, not geographies
        link: `https://earn.superteam.fun/listings/${bounty.slug}`, // Assuming this link structure
        deadline: bounty.deadline ? new Date(bounty.deadline).toLocaleDateString() : 'N/A',
        publishedAt: bounty.publishedAt ? new Date(bounty.publishedAt) : new Date(), // Fallback, though publishedAt should exist
        // notifiedAt will be handled by the notifiedListingIds set for now
    };
};


// This function fetches listings that were published at least 12 hours ago
// and haven't had a notification sent yet.
export const getDueListings = async (): Promise<Listing[]> => {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    try {
        const duePrismaBounties = await prisma.bounties.findMany({
            where: {
                isPublished: true,
                isActive: true,
                isArchived: false,
                status: 'OPEN', // Assuming 'OPEN' status means it's active for applications
                publishedAt: {
                    lte: twelveHoursAgo, // Published 12 hours ago or earlier
                },
                // Add a filter here if you add a `notifiedAt` or `isNotificationSent` field to your schema
                // e.g., notifiedAt: null
            },
            include: {
                sponsor: { // To get sponsor's name
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                publishedAt: 'asc', // Process older listings first
            },
        });

        const listings: Listing[] = [];
        for (const bounty of duePrismaBounties) {
            // Filter out listings that we've already "notified" using the in-memory set
            if (!notifiedListingIds.has(bounty.id)) {
                const mappedListing = mapPrismaBountyToListing(bounty);
                if (mappedListing) {
                    listings.push(mappedListing);
                }
            }
        }
        return listings;

    } catch (error) {
        console.error("Error fetching due listings from database:", error);
        return [];
    }
};

// This function simulates marking the listing as "notification sent".
// In a real DB, you'd update a field on the bounty record.
export const markListingNotificationSent = async (listingId: string): Promise<void> => {
    notifiedListingIds.add(listingId);
    // Example of how you might update the DB if you had a `notifiedAt` field:
    /*
    try {
        await prisma.bounties.update({
            where: { id: listingId },
            data: { notifiedAt: new Date() }, // Assuming you add `notifiedAt DateTime?` to your schema
        });
        console.log(`Marked listing ${listingId} as notification sent in DB.`);
    } catch (error) {
        console.error(`Error marking listing ${listingId} as notified in DB:`, error);
    }
    */
    console.log(`Marked listing ${listingId} as notification sent (in-memory).`);
};


// For configuration: list of available skills on Earn
export const getAvailableSkills = (): string[] => {
    // In a real app, fetch this from the Earn platform or a dedicated skills table/column.
    // For now, using the previous mock list.
    // If skills are stored consistently in `Bounties.skills` (e.g., as an array of strings),
    // you could query distinct skills:
    /*
    try {
        const allBountiesWithSkills = await prisma.bounties.findMany({
            where: { skills: { not: null } },
            select: { skills: true }
        });
        const skillSet = new Set<string>();
        allBountiesWithSkills.forEach(bounty => {
            if (Array.isArray(bounty.skills)) {
                bounty.skills.forEach(skill => {
                    if (typeof skill === 'string') skillSet.add(skill.toLowerCase());
                });
            }
        });
        return Array.from(skillSet).sort();
    } catch (error) {
        console.error("Error fetching distinct skills:", error);
        // Fallback to mock
    }
    */
    return [
        'typescript', 'javascript', 'python', 'rust', 'solana', 'react', 'vue', 'angular',
        'nodejs', 'go', 'java', 'swift', 'kotlin', 'smart-contracts', 'defi', 'nft',
        'ui-ux', 'graphic-design', 'content-writing', 'marketing', 'social-media',
        'community-management', 'devops', 'telegram-api', 'vietnamese'
    ].sort();
};
