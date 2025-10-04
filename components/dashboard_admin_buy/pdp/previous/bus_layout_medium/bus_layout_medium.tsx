import { useState, useEffect, useRef } from 'react';
import { SeatRow } from '../seat_row/seat_row';
import { SeatState } from '../seat/seat';
import { CountdownTimer } from '../counter_timer/counter_timer';
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
const mapApiStatusToSeatState = (status: string, gender: string | number): SeatState => {
	// Handle API statuses
	if (status === 'OC') { // Occupied
		// Convert gender to number if it's a string
		const genderNum = typeof gender === 'string' ? parseInt(gender) : gender;
		return genderNum === 1 ? 'reserved-female' : 'reserved-male';
	}

	// Default case
	return 'default'; // Default for 'E' (Empty) or other statuses
};

interface SeatDetail {
	Index: number;
	TableNo: number;
	SeatNo: string | number;
	Status: string;
	Gender: string | number; // Update to accept both string and number
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

interface MediumBusLayoutProps {
	maxSelectable: number;
	spaces?: SpaceConfig[];
	guidanceData?: GuidanceData,
	noBorder?: boolean; // Add this prop

}

export const MediumBusLayout: React.FC<MediumBusLayoutProps> = ({
	maxSelectable,
	spaces = [],
	guidanceData,
	noBorder
}) => {
	// State for seats and error management
	const [seats, setSeats] = useState<SeatDetail[][]>([]);
	const [error, setError] = useState<Error | null>(null);
	const { ticketId: storedTicketId, token: storedToken, selectedSeats } = useTicketStore();
	const dataFetchedRef = useRef(false);

	// Helper function to get parameters from store
	const getTicketParams = () => {
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
	};



	// Process seat map data - with correct orientation
	const processSeatMapData = (data: any) => {
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

		// Extract seatDetails from various response formats
		if (Array.isArray(data.response)) {
			if (data.response.length > 0) {
				const firstElement = data.response[0];
				if (firstElement && typeof firstElement === 'object' && firstElement.SeatDetails) {
					seatDetails = firstElement.SeatDetails;
				}
			}
		} else if (typeof data.response === 'object' && data.response !== null) {
			if (data.response.SeatDetails) {
				seatDetails = data.response.SeatDetails;
			}
		}

		// Fallback: try to find SeatDetails directly in data
		if (!seatDetails && data.SeatDetails) {
			seatDetails = data.SeatDetails;
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

			// Sort seats within each table - IMPORTANT: Sorting from smallest to largest SeatNo
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

		return organizedSeats;
	};

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
					console.log('Successfully processed seat data');
					setSeats(processedSeats);
					dataFetchedRef.current = true;
				}
			} catch (err) {
				console.error('Error fetching seat map:', err);
				setError(err instanceof Error ? err : new Error('Unknown error'));
			}
		};

		fetchData();
	}, []);

	// Custom component for medium layout with proper spacing and scaling
	const MediumSeatRow = ({ seats, emptyIndices, maxSelectable }: {
		seats: any[],
		emptyIndices: number[],
		maxSelectable: number
	}) => {
		const selectedSeats = useTicketStore(state => state.selectedSeats);
		const isMaxSeatsSelected = selectedSeats.length >= maxSelectable;

		// Add empty slots at specified indices
		const seatsWithSpaces = [...seats];

		// Insert empty spaces from highest index to lowest to avoid index shifting
		[...emptyIndices].sort((a, b) => b - a).forEach(index => {
			if (index >= 0 && index <= seatsWithSpaces.length) {
				seatsWithSpaces.splice(index, 0, {
					id: -1,
					seatNo: '',
					state: 'default',
					isAvailable: false,
					invisible: true
				});
			}
		});

		// For medium layout, we want seat numbers from left to right
		// By reversing the array here, we ensure seats start from left
		const reversedSeats = [...seatsWithSpaces].reverse();

		// Using flex-row with improved spacing and seat scaling
		return (
			<div className="flex flex-row gap-2 items-center justify-center">
				{reversedSeats.map((seat, index) => {
					const { Seat } = require('../seat/seat');
					return (
						<div key={`seat-${seat.id || `empty-${index}`}`} className="transform scale-90">
							{seat.invisible ? (
								<div className="w-12 h-12 xs:w-10 xs:h-10 sm:w-10 sm:h-10 md:w-12 md:h-12"></div>
							) : (
								<Seat
									id={seat.id}
									seatNo={seat.seatNo}
									state={seat.state}
									isAvailable={seat.isAvailable}
									disabled={isMaxSeatsSelected && !selectedSeats.some(s => s.id === seat.id)}
									maxSelectable={maxSelectable}
									layout="rtl"
								/>
							)}
						</div>
					);
				})}
			</div>
		);
	};

	// Render the medium bus layout
	return (
		<div className="flex flex-col gap-6" dir="rtl">
			{/* Bus shape container - optimized for medium screens */}
			<div
				className={`relative bg-white rounded-lg p-4 ${noBorder ? '' : 'border border-gray-200'}`}
				data-seat-layout="true"
			>				<div className="flex flex-row gap-2">
					{/* Left side: Seat Map (4/5 width) */}
					<div className="w-4/5">
						<div className="flex flex-row justify-center items-end">
							{/* Seat rows container */}
							<div className="flex w-full">
								<div className="flex flex-col gap-3 w-full items-center">
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
												const state = storedSeat?.state || mapApiStatusToSeatState(seat.Status, seat.Gender);

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
													className="flex justify-center w-full mb-2"
												>
													{/* Use our custom MediumSeatRow */}
													<MediumSeatRow
														seats={seatRowData}
														emptyIndices={emptyIndicesForRow}
														maxSelectable={maxSelectable}
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

							{/* Front of bus divider and steering wheel - reduced spacing */}
							<div className="h-full w-[2px] bg-gray-300 mx-2 self-stretch" />
							<div className="flex flex-row items-center justify-end mb-2">
								<div className="w-8 h-8">
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
								<div className="flex items-center justify-center mb-1 mr-1">
									<svg
										className="w-[16px] h-[16px]"
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

					{/* Right side: Guidance Panel (smaller width) */}
					{guidanceData && (
						<div className="w-1/5">
							<div className="h-full p-3 bg-gray-50 border border-gray-200 rounded-md">
								<div className="flex flex-col h-full justify-between">
									<div>
										<div className="flex justify-between items-center mb-2">
											<h3 className="text-[10px] font-IranYekanBold text-[#4B5259]">
												راهنمای انتخاب صندلی
											</h3>
											<CountdownTimer initialSeconds={900} onExpire={guidanceData.handleTimeExpire} />
										</div>

										<ul className="space-y-1 text-[9px] font-IranYekanRegular mb-2">
											<li>کلیک اول: <span className="font-IranYekanBold text-[#0D5990]">آقا</span></li>
											<li>کلیک دوم: <span className="font-IranYekanBold text-[#307F4F]">خانم</span></li>
											<li>کلیک سوم: <span className="font-IranYekanBold">لغو</span></li>
										</ul>

										<div className="w-full border-t border-gray-200 my-2"></div>

										<div className="grid grid-cols-1 gap-1 text-[9px]">
											<div className="flex items-center gap-1">
												<div className="w-2 h-2 rounded-full bg-[#CEDFF7] border border-[#4379C4]" />
												<span className="font-IranYekanBold">رزرو شده آقا</span>
											</div>
											<div className="flex items-center gap-1">
												<div className="w-2 h-2 rounded-full bg-[#F7F9FA] border border-[#CCD6E1]" />
												<span className="font-IranYekanBold">قابل رزرو</span>
											</div>
											<div className="flex items-center gap-1">
												<div className="w-2 h-2 rounded-full bg-[#0D5990]" />
												<span className="font-IranYekanBold">رزرو شما</span>
											</div>
											<div className="flex items-center gap-1">
												<div className="w-2 h-2 rounded-full bg-[#CEF7DE] border border-[#43C45F]" />
												<span className="font-IranYekanBold">رزرو شده خانم</span>
											</div>
										</div>
									</div>

									<div className="mt-auto pt-2 border-t border-gray-200">
										<div className="text-[9px] text-gray-700 font-IranYekanBold mb-1">
											صندلی‌های انتخاب شده:
											<span className="text-[#0D5990] mr-1">
												{toPersianDigits(guidanceData.selectedSeats.length)} از {toPersianDigits(guidanceData.maxSelectable)}
											</span>
										</div>

										{guidanceData.selectedSeats.length > 0 && (
											<div className="text-[10px] font-IranYekanBold text-[#0D5990]">
												{formatPrice(guidanceData.totalPrice)} تومان
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Refund rules section */}
				{selectedSeats.length > 0 && (
					<div className="mt-4 p-3 bg-[#F0F7FF] border border-[#CEDFF7] rounded-md">
						<div className="flex items-center gap-2 mb-2">
							<svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M10 18.3334C14.6024 18.3334 18.3333 14.6024 18.3333 10.0001C18.3333 5.39771 14.6024 1.66675 10 1.66675C5.39763 1.66675 1.66667 5.39771 1.66667 10.0001C1.66667 14.6024 5.39763 18.3334 10 18.3334Z" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								<path d="M10 13.3333V10" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
								<path d="M10 6.66675H10.0083" stroke="#0D5990" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
							<h3 className="font-IranYekanBold text-[12px] text-[#0D5990]"> قوانین استرداد </h3>
						</div>

						<ul className="list-disc list-inside text-[10px] font-IranYekanRegular text-[#4B5259] space-y-1 pr-2">
							<li>امکان استرداد بلیت تا ۱ ساعت قبل از حرکت با کسر ۱۰٪ از مبلغ بلیت وجود دارد.</li>
							<li>امکان استرداد بلیت از ۱ ساعت قبل از حرکت با کسر ۵۰٪ از مبلغ بلیت وجود دارد.</li>
						</ul>
					</div>
				)}
			</div>
		</div>
	);
};