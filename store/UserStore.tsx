import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
	userId?: string;
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
	email?: string;
	additionalPhone?: string; // Additional contact phone for ticket delivery
	additionalEmail?: string; // Additional contact email for ticket delivery
	birthDate?: string;
	gender?: "male" | "female";
	profileData?: any; // Full profile data for other fields you might need
	sessionId?: string;
	timestamp?: number;
}

interface UserState {
	user: UserProfile | null;
	currentSessionId: string;
	setUser: (userData: UserProfile) => void;
	updateUserField: (field: keyof UserProfile, value: any) => void;
	clearUser: () => void;
	cleanupOldSessions: (maxAgeMs?: number) => void;
}

// Generate a unique session ID
const generateSessionId = () => {
	return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Default session timeout (30 minutes)
const DEFAULT_SESSION_MAX_AGE = 30 * 60 * 1000;

export const useUserStore = create<UserState>()(
	persist(
		(set, get) => ({
			user: null,
			currentSessionId: generateSessionId(),

			setUser: (userData: UserProfile) => set({
				user: {
					...userData,
					sessionId: get().currentSessionId,
					timestamp: Date.now()
				}
			}),

			updateUserField: (field: keyof UserProfile, value: any) =>
				set((state) => ({
					user: state.user ? {
						...state.user,
						[field]: value,
						timestamp: Date.now()
					} : null
				})),

			clearUser: () => set({ user: null }),

			cleanupOldSessions: (maxAgeMs = DEFAULT_SESSION_MAX_AGE) => {
				const now = Date.now();
				const cutoffTime = now - maxAgeMs;

				set((state) => {
					// If user is from current session or is newer than cutoff, keep it
					// Otherwise, clear it
					if (!state.user ||
						state.user.sessionId === state.currentSessionId ||
						(state.user.timestamp && state.user.timestamp > cutoffTime)) {
						return {}; // No change needed
					}

					return { user: null }; // Clear outdated user
				});
			}
		}),
		{
			name: 'bilit4u-user-store',
		}
	)
);