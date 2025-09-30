import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StoredPassenger {
	id: number | string;
	seatId?: number;
	seatNo?: number | string;
	name: string;
	family: string;
	nationalId: string;
	gender: 1 | 2; // FIXED: Use integer type (1 = female, 2 = male)
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

					// Return the combined set
					return {
						passengers: [...otherSessionPassengers, ...enhancedPassengers]
					};
				});
			},

			removePassenger: (id) => {
				const sessionId = get().currentSessionId;
				set((state) => ({
					passengers: state.passengers.filter(
						p => !(p.id === id && p.sessionId === sessionId)
					)
				}));
			},

			clearPassengers: () => {
				// Only clear passengers from the current session
				const sessionId = get().currentSessionId;
				set((state) => ({
					passengers: state.passengers.filter(p => p.sessionId !== sessionId)
				}));
			},

			getSessionPassengers: () => {
				// Return only passengers from current session
				const { passengers, currentSessionId } = get();
				return passengers.filter(p => p.sessionId === currentSessionId);
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
			}
		}),
		{
			name: 'passenger-storage',
		}
	)
);