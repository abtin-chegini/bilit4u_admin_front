import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localForageManager } from '@/services/LocalForageManager';

export interface StoredPassenger {
	id: number | string;
	seatId?: number;
	seatNo?: number | string;
	name: string;
	family: string;
	nationalId: string;
	gender: 1 | 2; // Integer type: 2 = male (true), 1 = female (false)
	birthDate: string;
	isFromPreviousPassengers?: boolean;
	hasBeenModified?: boolean;
	sessionId?: string;
	timestamp?: number;
}

interface PassengerState {
	passengers: StoredPassenger[];
	currentSessionId: string;
	addPassenger: (passenger: StoredPassenger) => void;
	addPassengers: (passengers: StoredPassenger[]) => void;
	removePassenger: (id: number | string) => void;
	clearPassengers: () => void;
	getSessionPassengers: () => StoredPassenger[];
	cleanupOldSessions: (maxAgeMs?: number) => void;
	saveToLocalForage: () => Promise<void>;
}

// Generate a unique session ID
const generateSessionId = () => {
	return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Default session timeout (30 minutes)
const DEFAULT_SESSION_MAX_AGE = 30 * 60 * 1000;

export const usePassengerStore = create<PassengerState>()(
	persist(
		(set, get) => ({
			passengers: [],
			currentSessionId: generateSessionId(),

			addPassenger: (passenger) => {
				const timestamp = Date.now();
				const sessionId = get().currentSessionId;

				set((state) => {
					// Check if passenger already exists in current session
					const existingIndex = state.passengers.findIndex(
						p => p.id === passenger.id && p.sessionId === sessionId
					);

					if (existingIndex >= 0) {
						// Update existing passenger
						const updatedPassengers = [...state.passengers];
						updatedPassengers[existingIndex] = {
							...passenger,
							sessionId,
							timestamp
						};
						return { passengers: updatedPassengers };
					} else {
						// Add new passenger with session info
						return {
							passengers: [
								...state.passengers,
								{ ...passenger, sessionId, timestamp }
							]
						};
					}
				});

				// Save to localforage
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			addPassengers: (newPassengers) => {
				const timestamp = Date.now();
				const sessionId = get().currentSessionId;

				set((state) => {
					// First filter out any existing passengers from this session
					// This ensures we replace the entire set for this session
					const otherSessionPassengers = state.passengers.filter(
						p => p.sessionId !== sessionId
					);

					// Add session info to all new passengers
					const enhancedPassengers = newPassengers.map(passenger => ({
						...passenger,
						sessionId,
						timestamp
					}));

					const finalPassengers = [...otherSessionPassengers, ...enhancedPassengers];

					// Return the combined set
					return {
						passengers: finalPassengers
					};
				});

				// Save to localforage
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			removePassenger: (id) => {
				const sessionId = get().currentSessionId;
				set((state) => ({
					passengers: state.passengers.filter(
						p => !(p.id === id && p.sessionId === sessionId)
					)
				}));

				// Save to localforage
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			clearPassengers: () => {
				// Only clear passengers from the current session
				const sessionId = get().currentSessionId;
				set((state) => ({
					passengers: state.passengers.filter(p => p.sessionId !== sessionId)
				}));

				// Save to localforage
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			getSessionPassengers: () => {
				// Return only passengers from current session
				const { passengers, currentSessionId } = get();
				const sessionPassengers = passengers.filter(p => p.sessionId === currentSessionId);
				return sessionPassengers;
			},

			cleanupOldSessions: (maxAgeMs = DEFAULT_SESSION_MAX_AGE) => {
				const now = Date.now();
				const cutoffTime = now - maxAgeMs;

				set((state) => ({
					passengers: state.passengers.filter(passenger => {
						// Keep if from current session or newer than cutoff time
						return (
							passenger.sessionId === state.currentSessionId ||
							(passenger.timestamp && passenger.timestamp > cutoffTime)
						);
					})
				}));
			},

			// Save current passengers to localforage
			saveToLocalForage: async () => {
				try {
					const state = get();
					const sessionId = state.currentSessionId;
					const sessionPassengers = state.passengers.filter(
						p => p.sessionId === sessionId
					);

					// Store passenger data in localforage
					await localForageManager.storeFlowStep(sessionId, {
						stepId: 'passenger-details',
						stepName: 'Passenger Information',
						data: {
							passengers: sessionPassengers,
							passengerCount: sessionPassengers.length,
							timestamp: Date.now()
						},
						completed: sessionPassengers.length > 0,
						timestamp: Date.now()
					});

					console.log('✅ Passenger data saved to localforage:', {
						sessionId,
						passengerCount: sessionPassengers.length,
						passengers: sessionPassengers
					});
				} catch (error) {
					console.error('❌ Failed to save passengers to localforage:', error);
				}
			}
		}),
		{
			name: 'passenger-storage',
		}
	)
);