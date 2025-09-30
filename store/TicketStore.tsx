import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SeatState } from '@/components/PDP/seat/seat';

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
	setTicketInfo: (ticketId: string, token: string) => void;
	setServiceData: (data: any) => void;
	setSeatMap: (data: any) => void;
	handleSeatClick: (id: number, currentState: SeatState, seatNo?: string | number, maxSelectable?: number) => SeatState;
	removeSelectedSeat: (seatId: number) => void;
	clearSelectedSeats: () => void;
	resetState: () => void;
	directlyUpdateSeatGender: (seatId: number, gender: "male" | "female") => void;
	updateSeatState: (seatId: number, newState: SeatState) => void;
}

const initialState = {
	ticketId: null,
	token: null,
	selectedSeats: [],
	serviceData: null,
	seatMap: null,
	lastUpdated: null,
	isClearing: false, // Add this flag to initial state
};

export const useTicketStore = create<TicketState>()(
	persist(
		(set, get) => ({
			...initialState,

			// Set ticket ID and token
			setTicketInfo: (ticketId, token) => set({
				ticketId,
				token,
				lastUpdated: new Date().toISOString()
			}),

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
			setServiceData: (serviceData) => set({ serviceData }),

			// Set seat map
			setSeatMap: (seatMap) => set({ seatMap }),

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
			},

			// Clear selected seats - with guard against recursive calls
			clearSelectedSeats: () => {
				console.log("Clearing all selected seats - simple implementation");
				// Direct state update, no flags or timeouts
				set({ selectedSeats: [] });
			},

			// Reset entire state to initial values
			resetState: () => set(initialState)
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