import { User, UserPreferences } from '../models/user';

// In-memory store for users. Replace with a database for persistence.
const users: Map<number, User> = new Map();

export const getUser = (userId: number): User | undefined => {
    return users.get(userId);
};

export const createUser = (userId: number): User => {
    const newUser: User = {
        id: userId,
        preferences: {
            notifyForBounties: true,
            notifyForProjects: true,
            skills: [],
            geography: 'Global' // Default, user might need to set this
        },
        isConfigured: false,
    };
    users.set(userId, newUser);
    return newUser;
};

export const updateUserPreferences = (userId: number, preferences: Partial<UserPreferences>): User | undefined => {
    const user = users.get(userId);
    if (user) {
        user.preferences = { ...user.preferences, ...preferences };
        user.isConfigured = true; // Mark as configured once preferences are updated
        users.set(userId, user);
        return user;
    }
    return undefined;
};

export const getAllUsers = (): User[] => {
    return Array.from(users.values());
};
