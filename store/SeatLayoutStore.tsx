import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SeatLayoutData {
	imageUrl?: string;
	selectedSeats: Array<{ seatNo: string | number, state: string }>;
	ticketId?: string;
	capturedAt?: string;
	// Add new fields for enhanced functionality
	virtualLayoutUrl?: string;
	captureMethod?: 'screenshot' | 'virtual' | 'none';
}

interface SeatLayoutStore {
	seatLayoutData: SeatLayoutData | null;
	setSeatLayoutData: (data: SeatLayoutData) => void;
	clearSeatLayoutData: () => void;
	getSeatLayoutForTicket: (ticketId: string) => SeatLayoutData | null;
}

export const useSeatLayoutStore = create<SeatLayoutStore>()(
	persist(
		(set, get) => ({
			seatLayoutData: null,

			setSeatLayoutData: (data: SeatLayoutData) => {
				set({ seatLayoutData: data });
			},

			clearSeatLayoutData: () => {
				set({ seatLayoutData: null });
			},

			getSeatLayoutForTicket: (ticketId: string) => {
				const { seatLayoutData } = get();
				if (seatLayoutData && seatLayoutData.ticketId === ticketId) {
					return seatLayoutData;
				}
				return null;
			},
		}),
		{
			name: 'seat-layout-storage',
		}
	)
); 