import { useState, useCallback, useEffect, useRef } from 'react';
import { SeatRow } from '../seat_row/seat_row';
import { SeatState } from '../seat/seat';
// import { CountdownTimer } from '../counter_timer/counter_timer';
import { useTicketStore } from '@/store/TicketStore';
import { fetchSeatMap } from '@/services/SeatService';


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

interface SpaceConfig {
	row: number;
	col: number;
}

interface GuidanceData {
	selectedSeats: Array<{ id: number, seatNo: string | number, state: string }>;
	maxSelectable: number;
	seatPrice: number;
	totalPrice: number;
	handleTimeExpire: () => void;
}

interface MobileBusLayoutProps {
	maxSelectable: number;
	spaces?: SpaceConfig[];
	guidanceData?: GuidanceData;
	onSeatsLoaded?: (seats: SeatDetail[][]) => void;
	selectedSeats?: Array<{ id: number, seatNo: string | number, state: string }>;
	readOnly?: boolean;
	noBorder?: boolean;
	forceReadOnly?: boolean;
}

export const MobileBusLayout: React.FC<MobileBusLayoutProps> = ({
	maxSelectable,
	spaces = [],
	guidanceData,
	onSeatsLoaded,
	selectedSeats: externalSelectedSeats,
	readOnly = false,
	forceReadOnly = false,
	noBorder = false
}) => {
	// State for seats and error management
	const [seats, setSeats] = useState<SeatDetail[][]>([]);
	const [error, setError] = useState<Error | null>(null);
	const { ticketId: storedTicketId, token: storedToken, selectedSeats } = useTicketStore();
	const seatsToUse = readOnly && externalSelectedSeats ? externalSelectedSeats : selectedSeats;

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
		console.log('Processing seat map data for mobile');

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
		console.log(seatDetails)
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
					return seatNoA - seatNoB; // Normal order - lower numbers at top
				});
			});

			// Convert to array of rows
			organizedSeats = tables.map(table => groupedByTable[table]);
		}

		// Reverse the orientation to ensure correct order
		organizedSeats = organizedSeats.reverse();

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
					console.log('Successfully processed seat data for mobile');
					setSeats(processedSeats);
					dataFetchedRef.current = true;

					if (onSeatsLoaded) {
						onSeatsLoaded(processedSeats);
					}
				}
			} catch (err) {
				console.error('Error fetching seat map for mobile:', err);
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

	// Render mobile-specific layout
	return (
		<div className="flex flex-col gap-6" dir="rtl">
			{/* Mobile-First Indicator */}
			<div className="text-center py-2 bg-blue-50 text-blue-600 rounded-md mb-2 text-xs font-IranYekanRegular">
				نمایش اتوبوس به شکل عمودی است
			</div>

			{/* Bus shape container */}
			<div
				className={`relative bg-white rounded-lg p-4 ${noBorder ? '' : 'border border-gray-200'}`}
				data-seat-layout="true"
			>
				<div className="flex flex-col">
					{/* Main bus layout - full width */}
					<div className="w-full">
						{/* Main container - vertical layout */}
						<div className="flex flex-col justify-center items-end">
							{/* Front text indicating front of bus */}
							<div className="w-full text-center border-b border-gray-300 pb-2 mb-4">
								<span className="text-xs font-IranYekanBold text-gray-600">جلوی اتوبوس</span>
							</div>

							<div className="flex w-full items-center">
								<div className="flex flex-row-reverse mx-auto gap-4">
									{seats.length > 0 ? (
										seats.map((rowSeats: SeatDetail[], rowIndex: number) => {
											// Skip empty rows
											if (!rowSeats || rowSeats.length === 0) {
												return null;
											}

											// Map SeatDetail to SeatRow format
											const seatRowData = rowSeats.map((seat, seatIndex) => {
												const seatNo = typeof seat.SeatNo === 'string'
													? parseInt(seat.SeatNo, 10)
													: (seat.SeatNo as number);

												// Find if this seat has a selected state from the store
												const storedSeat = selectedSeats.find(s => s.id === seat.Index);

												// Use store state if selected, otherwise map from API
												const state = storedSeat?.state || mapApiStatusToSeatState(seat.Status, seat.Gender, seat.SeatNo);

												return {
													id: seatNo === 0 ? -(rowIndex * 1000 + seatIndex + 1) : seat.Index,
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
												<div key={`row-${rowIndex}`} className="flex flex-col">
													<div className="flex flex-col items-center mb-3">
														<SeatRow
															seats={seatRowData}
															layout="vertical"
															emptyIndices={emptyIndicesForRow}
															maxSelectable={maxSelectable}
															readOnly={readOnly}
															forceReadOnly={forceReadOnly}
														/>
													</div>
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
						</div>
					</div>

					{/* Mobile guidance panel - placed at bottom */}
					{guidanceData && !readOnly && (
						<div className="w-full mt-6">
							{/* Boxed container for guidance panel */}
							<div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
								{/* Single column layout with centered elements */}
								<div className="flex flex-col items-center">
									{/* Timer at top */}
									{/* <div className="mb-3">
                                        <CountdownTimer initialSeconds={900} onExpire={guidanceData.handleTimeExpire} />
                                    </div> */}

									{/* Title */}
									<h3 className="text-xs font-IranYekanBold mb-3 text-center text-[#4B5259]">
										راهنمای انتخاب صندلی
									</h3>

									{/* Click instructions */}
									<ul className="space-y-1 text-[10px] font-IranYekanRegular mb-3 text-center">
										<li>کلیک اول: <span className="font-IranYekanBold text-[#0D5990]">آقا</span></li>
										<li>کلیک دوم: <span className="font-IranYekanBold text-[#307F4F]">خانم</span></li>
										<li>کلیک سوم: <span className="font-IranYekanBold">لغو</span></li>
									</ul>

									{/* Divider */}
									<div className="w-full border-t border-gray-200 my-3"></div>

									{/* Seat indicators */}
									<div className="grid grid-cols-2 gap-3 text-[10px] w-full max-w-[240px] mb-3">
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 rounded-full bg-[#CEDFF7] border border-[#4379C4]" />
											<span className="font-IranYekanBold">رزرو شده آقا</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 rounded-full bg-[#F7F9FA] border border-[#CCD6E1]" />
											<span className="font-IranYekanBold">قابل رزرو</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 rounded-full bg-[#0D5990]" />
											<span className="font-IranYekanBold">رزرو شما</span>
										</div>
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 rounded-full bg-[#CEF7DE] border border-[#43C45F]" />
											<span className="font-IranYekanBold">رزرو شده خانم</span>
										</div>
									</div>

									{/* Divider */}
									<div className="w-full border-t border-gray-200 my-2"></div>

									{/* Selected seat count */}
									<div className="text-[11px] text-gray-700 font-IranYekanBold mb-2 text-center">
										صندلی‌های انتخاب شده:
										<span className="text-[#0D5990] mr-1">
											{toPersianDigits(guidanceData.selectedSeats.length)} از {toPersianDigits(guidanceData.maxSelectable)}
										</span>
									</div>

									{/* Price display */}
									{guidanceData.selectedSeats.length > 0 && (
										<div className="text-[12px] font-IranYekanBold text-[#0D5990]">
											{formatPrice(guidanceData.totalPrice)} تومان
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Refund rules section */}
				{!readOnly && seatsToUse.length > 0 && (
					<div className="mt-4 p-4 bg-[#F0F7FF] border border-[#CEDFF7] rounded-md">
						<div className="flex items-center gap-2 mb-3">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M10 18.3334C14.6024 18.3334 18.3333 14.6024 18.3333 10.0001C18.3333 5.39771 14.6024 1.66675 10 1.66675C5.39763 1.66675 1.66667 5.39771 1.66667 10.0001C1.66667 14.6024 5.39763 18.3334 10 18.3334Z" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								<path d="M10 13.3333V10" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								<path d="M10 6.66675H10.0083" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							<h3 className="font-IranYekanBold text-[14px] text-[#0D5990]"> قوانین استرداد </h3>
						</div>

						<ul className="list-disc list-inside text-[12px] font-IranYekanRegular text-[#4B5259] space-y-2 pr-2">
							<li>امکان استرداد بلیت تا ۱ ساعت قبل از حرکت با کسر ۱۰٪ از مبلغ بلیت وجود دارد.</li>
							<li>امکان استرداد بلیت از ۱ ساعت قبل از حرکت با کسر ۵۰٪ از مبلغ بلیت وجود دارد.</li>
						</ul>
					</div>
				)}
			</div>
		</div>
	);
};