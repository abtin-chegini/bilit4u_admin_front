import { SeatRow } from '../seat_row/seat_row';
import { SeatState } from '../seat/seat';
import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchSeatMap } from '@/services/SeatService';
import { useTicketStore } from '@/store/TicketStore';
import { CountdownTimer } from '../counter_timer/counter_timer';

import { Session } from '@supabase/supabase-js'


// Helper functions for formatting
const toPersianDigits = (input: number | string): string => {
	const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
	return input.toString().replace(/[0-9]/g, (match) => persianDigits[parseInt(match)]);
};

const formatPrice = (price: number): string => {
	return toPersianDigits(price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
};

// Map API status/gender to SeatState
const mapApiStatusToSeatState = (status: string, gender: string | number, seatNo: string | number): SeatState => {
	// Handle API statuses
	// console.log("Seat mapping ", { status, gender, seatNo });
	if (status === 'OC') { // Occupied
		// Convert gender to number if it's a string
		if (gender === 'F')
			return 'reserved-female';
		if (gender === 'M')
			return 'reserved-male';
		if (gender === 'UN')
			return 'default';


		// const genderNum = typeof gender === 'string' ? parseInt(gender) : gender;
		// return genderNum === 1 ? 'reserved-female' : 'reserved-male';
	}
	if (status === 'E') // Empty
		return 'default';

	// Default case
	return 'default'; // Default for 'E' (Empty) or other statuses
};

interface SeatDetail {
	Index: number;
	TableNo: number;
	SeatNo: string | number;
	Status: string;
	Gender: string | number;
	IsAvailable: boolean;
}

// Add types for guidance data
interface GuidanceData {
	selectedSeats: Array<{ id: number, seatNo: string | number, state: string }>;
	maxSelectable: number;
	seatPrice: number;
	totalPrice: number;
	handleTimeExpire: () => void;
}

interface BusLayoutProps {
	maxSelectable: number;
	spaces?: SpaceConfig[];
	guidanceData?: GuidanceData;
	onSeatsLoaded?: (seats: SeatDetail[][]) => void;
	selectedSeats?: Array<{ id: number, seatNo: string | number, state: string }>;
	readOnly?: boolean;
	forceReadOnly?: boolean; // New prop to strictly enforce readonly
	noBorder?: boolean; // New prop to control border visibility


}

interface SpaceConfig {
	row: number;
	col: number;
}

export const BusLayout: React.FC<BusLayoutProps> = ({
	maxSelectable,
	spaces = [],
	guidanceData,
	onSeatsLoaded,
	selectedSeats: externalSelectedSeats,
	readOnly = false,
	noBorder = false, // Default to showing the border

	forceReadOnly = false // Default to false
}) => {

	// State for seats and error management
	const [seats, setSeats] = useState<SeatDetail[][]>([]);
	const [error, setError] = useState<Error | null>(null);
	const { ticketId: storedTicketId, token: storedToken, selectedSeats } = useTicketStore();
	const seatsToUse = readOnly && externalSelectedSeats ? externalSelectedSeats : selectedSeats;
	// Get session from localStorage with proper Supabase types
	const getAuthSession = (): Session | null => {
		if (typeof window === 'undefined') return null;
		try {
			const sessionData = localStorage.getItem('auth_session');
			return sessionData ? JSON.parse(sessionData) as Session : null;
		} catch (error) {
			console.error('Failed to get auth session:', error);
			return null;
		}
	};
	const session = getAuthSession();
	const dataFetchedRef = useRef(false);

	// Helper function to get parameters from store
	const getTicketParams = useCallback(() => {
		// First try to get from Zustand store
		if (storedTicketId && storedToken) {
			return { ticketId: storedTicketId, token: storedToken };
		}

		// If not in Zustand, try localStorage
		try {
			const storedData = localStorage.getItem('ticket-storage');
			if (storedData) {
				const parsedData = JSON.parse(storedData);
				const state = parsedData?.state;

				if (state && state.ticketId && state.token) {
					return { ticketId: state.ticketId, token: state.token };
				}
			}
		} catch (err) {
			console.error('Error reading from localStorage:', err);
		}

		// Try URL params
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const urlTicketId = urlParams.get('ticketid');
			const urlToken = urlParams.get('token');

			if (urlTicketId && urlToken) {
				return { ticketId: urlTicketId, token: urlToken };
			}

			// Try path segments
			const pathSegments = window.location.pathname.split('/');
			if (pathSegments.length >= 4 && pathSegments[1] === 'bus') {
				const pathToken = pathSegments[2];
				const pathTicketId = pathSegments[3];

				if (pathToken && pathTicketId) {
					return { ticketId: pathTicketId, token: pathToken };
				}
			}
		}

		return { ticketId: null, token: null };
	}, [storedTicketId, storedToken]);



	// Process seat map data
	const processSeatMapData = useCallback((data: any) => {
		// console.log('Processing seat map data for desktop');

		if (!data) {
			console.error('Data is null or undefined');
			return [];
		}

		if (data.response === undefined) {
			console.error('Missing response property in data');
			return [];
		}

		// Handle JSON string response
		if (typeof data.response === 'string') {
			try {
				const parsedResponse = JSON.parse(data.response);
				data = { response: parsedResponse };
			} catch (error) {
				console.error('Failed to parse response as JSON');
			}
		}

		let seatDetails;
		let configData;

		// Extract seatDetails from various response formats
		if (Array.isArray(data.response)) {
			if (data.response.length > 0) {
				const firstElement = data.response[0];
				if (firstElement && typeof firstElement === 'object' && firstElement.SeatDetails) {
					seatDetails = firstElement.SeatDetails;
					configData = firstElement;
				}
			}
		} else if (typeof data.response === 'object' && data.response !== null) {
			if (data.response.SeatDetails) {
				seatDetails = data.response.SeatDetails;
				configData = data.response;
			}
		}

		// Fallback: try to find SeatDetails directly in data
		if (!seatDetails && data.SeatDetails) {
			seatDetails = data.SeatDetails;
			configData = data;
		}

		// If seatDetails wasn't found with any method
		if (!seatDetails) {
			console.error('Failed to find SeatDetails in the response');
			setError(new Error('Failed to find seat details in the API response'));
			return [];
		}

		// Process the SeatDetails into rows
		let organizedSeats;

		// If already a nested array, use directly
		if (Array.isArray(seatDetails[0])) {
			organizedSeats = seatDetails;
		} else {
			// Group by TableNo
			const groupedByTable = seatDetails.reduce((acc: { [key: number]: SeatDetail[] }, seat: SeatDetail) => {
				const tableNo = typeof seat.TableNo === 'string' ? parseInt(seat.TableNo, 10) : seat.TableNo;
				if (!acc[tableNo]) {
					acc[tableNo] = [];
				}
				acc[tableNo].push(seat);
				return acc;
			}, {});

			// Sort tables by TableNo
			const tables = Object.keys(groupedByTable)
				.map(Number)
				.sort((a, b) => a - b);

			// Sort seats within each table
			tables.forEach(tableNo => {
				groupedByTable[tableNo].sort((a: SeatDetail, b: SeatDetail) => {
					const seatNoA = typeof a.SeatNo === 'string' ? parseInt(a.SeatNo, 10) : Number(a.SeatNo);
					const seatNoB = typeof b.SeatNo === 'string' ? parseInt(b.SeatNo, 10) : Number(b.SeatNo);
					return seatNoA - seatNoB;
				});
			});

			// Convert to array of rows
			organizedSeats = tables.map(table => groupedByTable[table]);
		}

		// Always reverse the orientation to ensure left-to-right
		organizedSeats = organizedSeats.map((row: any) => [...row].reverse());

		return organizedSeats;
	}, []);

	// Fetch seat data
	useEffect(() => {
		if (dataFetchedRef.current) return;

		const fetchData = async () => {
			try {
				const { ticketId, token } = getTicketParams();
				if (!ticketId || !token) {
					throw new Error('Ticket ID or token not found');
				}

				const response = await fetchSeatMap({ ticketId, token });
				const processedSeats = processSeatMapData(response);

				if (processedSeats.length > 0) {
					console.log('Successfully processed seat data for desktop');
					setSeats(processedSeats);
					dataFetchedRef.current = true;

					if (onSeatsLoaded) {
						onSeatsLoaded(processedSeats);
					}
				}
			} catch (err) {
				console.error('Error fetching seat map for desktop:', err);
				setError(err instanceof Error ? err : new Error('Unknown error'));
			}
		};

		fetchData();
	}, [getTicketParams, processSeatMapData, onSeatsLoaded]);

	// Error state
	if (error) {
		return (
			<div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
				Error loading seats: {error.message || 'Unknown error'}
			</div>
		);
	}

	// Render the desktop bus layout
	return (
		<div className="flex flex-col gap-6" dir="rtl">
			{/* Bus shape container */}
			<div
				className={`relative bg-white rounded-lg p-4 ${noBorder ? '' : 'border border-gray-200'}`}
				data-seat-layout="true"
			>
				<div className="w-full">
					{/* Main container */}
					<div className="flex flex-row justify-center items-end">
						{/* Seat rows container */}
						<div className="flex w-full items-center justify-center">
							<div className="flex flex-col gap-4">
								{seats.length > 0 ? (
									seats.map((rowSeats: SeatDetail[], rowIndex: number) => {
										// Skip empty rows
										if (!rowSeats || rowSeats.length === 0) {
											return null;
										}

										// Map SeatDetail to SeatRow format
										const seatRowData = rowSeats.map(seat => {
											const seatNo = typeof seat.SeatNo === 'string'
												? parseInt(seat.SeatNo, 10)
												: (seat.SeatNo as number);

											// Find if this seat has a selected state from the store
											const storedSeat = selectedSeats.find(s => s.id === seat.Index);

											// Use store state if selected, otherwise map from API
											const state = storedSeat?.state || mapApiStatusToSeatState(seat.Status, seat.Gender, seat.SeatNo);

											return {
												id: seat.Index,
												seatNo: seat.SeatNo,
												state,
												isAvailable: seat.IsAvailable,
												invisible: seatNo === 0
											};
										});

										// Determine empty indices for this row
										const emptyIndicesForRow = spaces
											.filter(space => space.row === rowIndex + 1)
											.map(space => space.col);

										return (
											<div
												key={`row-${rowIndex}`}
												className="flex justify-center mb-3"
											>
												<SeatRow
													seats={seatRowData}
													layout="rtl"
													emptyIndices={emptyIndicesForRow}
													maxSelectable={maxSelectable}
													readOnly={readOnly}
													forceReadOnly={forceReadOnly} // Pass this new prop

												/>
											</div>
										);
									}).filter(Boolean)
								) : (
									<div className="h-24 w-full flex items-center justify-center">
										<div className="h-8 w-8 border-t-2 border-b-2 border-gray-300 rounded-full animate-spin"></div>
									</div>
								)}
							</div>
						</div>

						{/* Front of bus divider and steering wheel */}
						<div className="h-full w-[2px] bg-gray-300 mx-4 self-stretch" />
						<div className="flex flex-row items-center justify-end mb-2">
							<div className="w-12 h-12">
								<svg
									viewBox="0 0 53 56"
									className="w-full h-full"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<rect
										x="0.492188"
										y="8.5127"
										width="45.2151"
										height="39.5244"
										rx="3.5"
										fill="#CCD6E1"
										stroke="#4B5259"
									/>
									<path
										d="M11.8115 45.0693C11.8115 43.1363 13.3785 41.5693 15.3115 41.5693H15.707H20.1024H24.4979H28.8934H33.2888H37.6843H42.0797H42.4752C44.4082 41.5693 45.9752 43.1363 45.9752 45.0693V51.9994C45.9752 53.9324 44.4082 55.4994 42.4752 55.4994H42.0797H37.6843H28.8934H24.4979H15.707H15.3115C13.3785 55.4994 11.8115 53.9324 11.8115 51.9994V45.0693Z"
										fill="#CCD6E1"
										stroke="#4B5259"
									/>
									<path
										d="M11.8115 4.54688C11.8115 2.61388 13.3785 1.04688 15.3115 1.04688H15.707H20.1024H24.4979H28.8934H33.2888H37.6843H42.0797H42.4752C44.4082 1.04688 45.9752 2.61388 45.9752 4.54687V11.4769C45.9752 13.4099 44.4082 14.9769 42.4752 14.9769H42.0797H37.6843H28.8934H24.4979H15.707H15.3115C13.3785 14.9769 11.8115 13.4099 11.8115 11.4769V4.54688Z"
										fill="#CCD6E1"
										stroke="#4B5259"
									/>
									<path
										d="M40.6816 9.87598C40.6816 7.94298 42.2486 6.37598 44.1816 6.37598H48.2378C50.1708 6.37598 51.7378 7.94298 51.7378 9.87598V11.2081V16.5403V21.8725V27.2046V32.5368V37.869V43.2011V44.5333C51.7378 46.4663 50.1708 48.0333 48.2378 48.0333H44.1816C42.2486 48.0333 40.6816 46.4663 40.6816 44.5333V43.2011V37.869V32.5368V27.2046V21.8725V16.5403V11.2081V9.87598Z"
										fill="#CCD6E1"
										stroke="#4B5259"
									/>
								</svg>
							</div>
							<div className="flex items-center justify-center mb-1 mr-2">
								<svg
									className="w-[20px] h-[20px]"
									viewBox="0 0 18 19"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M16.9144 9.27269C16.9144 14.1295 13.2122 18.0151 8.7072 18.0151C4.20217 18.0151 0.5 14.1295 0.5 9.27269C0.5 4.41587 4.20217 0.530273 8.7072 0.530273C13.2122 0.530273 16.9144 4.41587 16.9144 9.27269Z"
										fill="#CCD6E1"
										stroke="#4B5259"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Desktop guidance panel would go here if implemented */}
				{/* You can add it separately instead of inside the BusLayout component */}

			</div>
		</div>
	);
};