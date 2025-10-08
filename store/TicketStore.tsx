import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SeatState } from '@/components/PDP/seat/seat';
import { localForageManager } from '@/services/LocalForageManager';

// Define a proper type for seats
interface Seat {
	id: number;
	seatNo: string | number;
	state: SeatState;
}

interface TicketState {
	ticketId: string | null;
	token: string | null;
	selectedSeats: Seat[];
	serviceData: any | null;
	seatMap: any | null;
	lastUpdated: string | null;
	isClearing: boolean; // Add flag to prevent recursive clearing
	sessionId: string | null; // Add session ID for localforage
	srvTicket: any | null; // Add srvTicket data
	setTicketInfo: (ticketId: string, token: string) => void;
	setServiceData: (data: any) => void;
	setSeatMap: (data: any) => void;
	setSrvTicket: (data: any) => void;
	handleSeatClick: (id: number, currentState: SeatState, seatNo?: string | number, maxSelectable?: number) => SeatState;
	removeSelectedSeat: (seatId: number) => void;
	clearSelectedSeats: () => void;
	resetState: () => void;
	directlyUpdateSeatGender: (seatId: number, gender: "male" | "female") => void;
	updateSeatState: (seatId: number, newState: SeatState) => void;
	saveToLocalForage: () => Promise<void>;
}

// Helper function to generate session ID
const generateSessionId = () => {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const initialState = {
	ticketId: null,
	token: null,
	selectedSeats: [],
	serviceData: null,
	seatMap: null,
	lastUpdated: null,
	isClearing: false, // Add this flag to initial state
	sessionId: null,
	srvTicket: null,
};

export const useTicketStore = create<TicketState>()(
	persist(
		(set, get) => ({
			...initialState,

			// Set ticket ID and token
			setTicketInfo: (ticketId, token) => {
				const sessionId = get().sessionId || generateSessionId();
				set({
					ticketId,
					token,
					sessionId,
					lastUpdated: new Date().toISOString()
				});

				// Save to localforage
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			updateSeatState: (seatId: number, newState: SeatState) => {
				// Don't process updates if we're in the middle of clearing
				if (get().isClearing) {
					console.log("Skipping seat update during clear operation");
					return;
				}

				const store = get();
				console.log(`Directly updating seat ${seatId} to state ${newState}`);

				if (newState === 'default') {
					// Remove the seat if setting to default
					set({
						selectedSeats: store.selectedSeats.filter(s => s.id !== seatId)
					});
					console.log(`Removed seat ${seatId}`);
					// Save to localforage after removing seat
					setTimeout(() => get().saveToLocalForage(), 0);
					return;
				}

				// Check if seat exists
				const seatExists = store.selectedSeats.some(s => s.id === seatId);

				if (seatExists) {
					// Update existing seat
					set({
						selectedSeats: store.selectedSeats.map(s =>
							s.id === seatId ? { ...s, state: newState } : s
						)
					});
					console.log(`Updated seat ${seatId} to state ${newState}`);
				} else {
					// Add new seat if it doesn't exist
					set({
						selectedSeats: [
							...store.selectedSeats,
							{
								id: seatId,
								seatNo: seatId,  // Use ID as fallback
								state: newState
							}
						]
					});
					console.log(`Added new seat ${seatId} with state ${newState}`);
				}

				// Save to localforage after seat state update
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			// Keep directlyUpdateSeatGender for compatibility but make it use updateSeatState
			directlyUpdateSeatGender: (seatId, gender) => {
				// Don't process updates if we're in the middle of clearing
				if (get().isClearing) return;

				const nextState: SeatState = gender === "female" ? "selected-female" : "selected-male";
				get().updateSeatState(seatId, nextState);
			},

			// Method removed to avoid duplication with the implementation below
			// Set service data
			setServiceData: (serviceData) => {
				set({ serviceData });
				// Save to localforage
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			// Set seat map
			setSeatMap: (seatMap) => {
				set({ seatMap });
				// Save to localforage
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			// Set srvTicket data
			setSrvTicket: (srvTicket) => {
				set({ srvTicket });
				console.log('✅ srvTicket data updated in store:', srvTicket);
				// Save to localforage
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			// Centralized seat click handler with cycling behavior
			handleSeatClick: (id, currentState, seatNo, maxSelectable = 4) => {
				// Don't process updates if we're in the middle of clearing
				if (get().isClearing) {
					console.log("Skipping seat click during clear operation");
					return currentState;
				}

				const store = get();
				console.log(`TicketStore handling click on seat ${id}, current state: ${currentState}`);

				// Skip if the seat is already reserved
				if (currentState === 'reserved-male' || currentState === 'reserved-female') {
					console.log(`Seat ${id} is already reserved, ignoring click`);
					return currentState; // Return unchanged state
				}

				// Determine next state based on current state
				let nextState: SeatState;
				switch (currentState) {
					case 'default':
						nextState = 'selected-male';
						break;
					case 'selected-male':
						nextState = 'selected-female';
						break;
					case 'selected-female':
					default:
						nextState = 'default';
						break;
				}

				console.log(`Seat ${id} state cycling: ${currentState} → ${nextState}`);

				// Handle the state change
				if (nextState === 'default') {
					// Remove seat when cycling back to default
					set({
						selectedSeats: store.selectedSeats.filter(seat => seat.id !== id)
					});
				} else {
					// Check if seat is already selected
					const existingSeatIndex = store.selectedSeats.findIndex(seat => seat.id === id);

					if (existingSeatIndex !== -1) {
						// Update existing seat
						set({
							selectedSeats: store.selectedSeats.map(seat =>
								seat.id === id ? { ...seat, state: nextState } : seat
							)
						});
					} else {
						// Check if at max selections before adding new seat
						if (store.selectedSeats.length >= maxSelectable) {
							if (typeof window !== 'undefined') {
								alert(`حداکثر تعداد صندلی قابل انتخاب ${maxSelectable} عدد می‌باشد.`);
							}
							return currentState; // Return unchanged state
						}

						// Add new seat
						set({
							selectedSeats: [...store.selectedSeats, {
								id,
								seatNo: seatNo || id,
								state: nextState
							}]
						});
					}
				}

				// Save to localforage after seat click
				setTimeout(() => get().saveToLocalForage(), 0);

				return nextState;
			},

			// Remove selected seat
			removeSelectedSeat: (seatId) => {
				// Don't process removals if we're in the middle of clearing
				if (get().isClearing) {
					console.log("Skipping seat removal during clear operation");
					return;
				}

				set({
					selectedSeats: get().selectedSeats.filter(seat => seat.id !== seatId)
				});

				// Save to localforage after removing seat
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			// Clear selected seats - with guard against recursive calls
			clearSelectedSeats: () => {
				console.log("Clearing all selected seats - simple implementation");
				// Direct state update, no flags or timeouts
				set({ selectedSeats: [] });

				// Save to localforage after clearing
				setTimeout(() => get().saveToLocalForage(), 0);
			},

			// Reset entire state to initial values
			resetState: () => {
				set(initialState);
				// Clear from localforage
				const sessionId = get().sessionId;
				if (sessionId) {
					localForageManager.clearSession(sessionId).catch(console.error);
				}
			},

			// Save current state to localforage
			saveToLocalForage: async () => {
				try {
					const state = get();

					// Create or get session ID
					const sessionId = state.sessionId || generateSessionId();
					if (!state.sessionId) {
						set({ sessionId });
					}

					// Prepare data for localforage
					const sessionData = {
						sessionId,
						userId: state.token || 'anonymous',
						ticketData: {
							ticketId: state.ticketId,
							token: state.token,
							selectedSeats: state.selectedSeats,
							serviceData: state.serviceData,
							seatMap: state.seatMap,
							srvTicket: state.srvTicket,
						},
						flowData: {
							currentStep: 'seat-selection',
							selectedSeatsData: state.selectedSeats.map(seat => ({
								seatId: seat.id,
								seatNo: seat.seatNo,
								gender: seat.state === 'selected-male' ? 'male' : 'female',
								state: seat.state
							})),
							srvTicketData: state.srvTicket
						}
					};

					// Store in localforage
					await localForageManager.storeSession(sessionData);
					console.log('✅ Ticket data saved to localforage:', {
						sessionId,
						selectedSeatsCount: state.selectedSeats.length,
						hasSrvTicket: !!state.srvTicket,
						hasServiceData: !!state.serviceData
					});
				} catch (error) {
					console.error('❌ Failed to save to localforage:', error);
				}
			}
		}),
		{
			name: 'ticket-storage', // unique name for localStorage
			storage: createJSONStorage(() => localStorage),
			// Only persist these specific fields
			partialize: (state) => ({
				ticketId: state.ticketId,
				token: state.token,
				lastUpdated: state.lastUpdated
			}),
		}
	)
);