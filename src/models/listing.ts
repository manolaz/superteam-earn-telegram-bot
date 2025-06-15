export enum ListingType {
    BOUNTY = 'Bounty',
    PROJECT = 'Project'
}

export interface Listing {
    id: string;
    title: string;
    sponsorName: string;
    rewardTokenName?: string;
    rewardValue?: number; // For bounties or fixed-price projects
    rewardUSD: number; // Can be a single value or the lower end of a range
    usdRange?: { min: number; max: number }; // For projects with a range
    isVariableComp?: boolean; // For projects with variable compensation
    listingType: ListingType;
    skills: string[];
    geographies: string[]; // List of geographies this listing is open to, or ['Global']
    link: string;
    deadline: string; // ISO date string or human-readable
    publishedAt: Date;
    notifiedAt?: Date; // When notification was sent for this listing
}
