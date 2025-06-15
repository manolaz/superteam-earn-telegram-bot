export interface UserPreferences {
    minUSDValue?: number;
    maxUSDValue?: number;
    notifyForBounties?: boolean;
    notifyForProjects?: boolean;
    skills?: string[];
    geography?: string; // User's geography for filtering relevant listings
}

export interface User {
    id: number; // Telegram User ID
    preferences: UserPreferences;
    isConfigured?: boolean;
}
