import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EsterdadChallengeState {
	refNum: string;
	challengeToken: string;
	nonce: string;
	expiresAt: number;
	phoneNumber: string;
	isLoading: boolean;
	error: string | null;
}

interface EsterdadChallengeActions {
	// Set challenge data from API response
	setChallengeData: (data: {
		refNum: string;
		challengeToken: string;
		nonce: string;
		expiresAt: number;
		phoneNumber: string;
	}) => void;

	// Set loading state
	setLoading: (loading: boolean) => void;

	// Set error state
	setError: (error: string | null) => void;

	// Clear all data
	clearChallenge: () => void;

	// Update specific fields
	updateRefNum: (refNum: string) => void;
	updatePhoneNumber: (phoneNumber: string) => void;

	// Check if challenge is expired
	isChallengeExpired: () => boolean;

	// Get remaining time for challenge
	getRemainingTime: () => number;

	// Debug function to log current state
	logCurrentState: () => void;
}

export interface EsterdadChallengeStore extends EsterdadChallengeState, EsterdadChallengeActions { }

export const useEsterdadStore = create<EsterdadChallengeStore>()(
	persist(
		(set, get) => ({
			// Add hydration logging
			onRehydrateStorage: () => (state: EsterdadChallengeState | undefined) => {
				// console.log('EsterdadStore - Hydration completed:', {
				// 	refNum: state?.refNum || 'none',
				// 	challengeToken: state?.challengeToken ? `${state.challengeToken.substring(0, 20)}...` : 'none',
				// 	nonce: state?.nonce ? `${state.nonce.substring(0, 20)}...` : 'none',
				// 	expiresAt: state?.expiresAt || 0,
				// 	phoneNumber: state?.phoneNumber || 'none'
				// });

				// If we have state, set it immediately
				if (state) {
					set({
						refNum: state.refNum,
						challengeToken: state.challengeToken,
						nonce: state.nonce,
						expiresAt: state.expiresAt,
						phoneNumber: state.phoneNumber,
						isLoading: false,
						error: null,
					});
				}
			},
			// Initial state
			refNum: '',
			challengeToken: '',
			nonce: '',
			expiresAt: 0,
			phoneNumber: '',
			isLoading: false,
			error: null,

			// Actions
			setChallengeData: (data) => {
				// console.log('EsterdadStore - setChallengeData called with:', {
				// 	refNum: data.refNum,
				// 	challengeToken: data.challengeToken ? `${data.challengeToken.substring(0, 20)}...` : 'null',
				// 	nonce: data.nonce ? `${data.nonce.substring(0, 20)}...` : 'null',
				// 	expiresAt: data.expiresAt,
				// 	phoneNumber: data.phoneNumber
				// });

				set({
					refNum: data.refNum,
					challengeToken: data.challengeToken,
					nonce: data.nonce,
					expiresAt: data.expiresAt,
					phoneNumber: data.phoneNumber,
					error: null, // Clear any previous errors
				});

				// console.log('EsterdadStore - State updated, new state:', {
				// 	refNum: data.refNum,
				// 	challengeToken: data.challengeToken ? `${data.challengeToken.substring(0, 20)}...` : 'null',
				// 	nonce: data.nonce ? `${data.nonce.substring(0, 20)}...` : 'null',
				// 	expiresAt: data.expiresAt,
				// 	phoneNumber: data.phoneNumber
				// });
			},

			setLoading: (loading) => {
				set({ isLoading: loading });
			},

			setError: (error) => {
				set({ error });
			},

			clearChallenge: () => {
				// console.log('EsterdadStore - clearChallenge called, clearing all data');
				set({
					refNum: '',
					challengeToken: '',
					nonce: '',
					expiresAt: 0,
					phoneNumber: '',
					isLoading: false,
					error: null,
				});
				// console.log('EsterdadStore - All challenge data cleared');
			},

			updateRefNum: (refNum) => {
				set({ refNum });
			},

			updatePhoneNumber: (phoneNumber) => {
				set({ phoneNumber });
			},

			isChallengeExpired: () => {
				const { expiresAt } = get();
				const result = expiresAt > 0 && Date.now() / 1000 > expiresAt;
				// console.log('EsterdadStore - isChallengeExpired called:', { expiresAt, currentTime: Date.now() / 1000, result });
				return result;
			},

			getRemainingTime: () => {
				const { expiresAt } = get();
				const remaining = expiresAt - (Date.now() / 1000);
				const result = Math.max(0, Math.floor(remaining));
				// console.log('EsterdadStore - getRemainingTime called:', { expiresAt, currentTime: Date.now() / 1000, remaining: result });
				return result;
			},

			logCurrentState: () => {
				const state = get();
				// console.log('EsterdadStore - Current state:', {
				// 	refNum: state.refNum,
				// 	challengeToken: state.challengeToken ? `${state.challengeToken.substring(0, 20)}...` : 'null',
				// 	nonce: state.nonce ? `${state.nonce.substring(0, 20)}...` : 'null',
				// 	expiresAt: state.expiresAt,
				// 	phoneNumber: state.phoneNumber,
				// 	isLoading: state.isLoading,
				// 	error: state.error
				// });

				// Also check localStorage directly
				const stored = localStorage.getItem('esterdad-challenge-storage');
				// console.log('EsterdadStore - LocalStorage raw:', stored);
				if (stored) {
					try {
						const parsed = JSON.parse(stored);
						// console.log('EsterdadStore - LocalStorage parsed:', parsed);
					} catch (e) {
						// console.error('EsterdadStore - Error parsing localStorage:', e);
					}
				}
			},
		}),
		{
			name: 'esterdad-challenge-storage',
			// Only persist these fields
			partialize: (state) => ({
				refNum: state.refNum,
				challengeToken: state.challengeToken,
				nonce: state.nonce,
				expiresAt: state.expiresAt,
				phoneNumber: state.phoneNumber,
			}),
		}
	)
);
