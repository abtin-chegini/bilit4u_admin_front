import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSrvDetails, fetchSeatMap } from '@/services/SeatService';
import { SeatState } from '@/components/PDP/seat/seat';
import { useTicketStore } from '@/store/TicketStore'; // Import the ticket store


// Define types here instead of relying on external store

interface SeatDetail {
	Index: number;
	TableNo: number;
	SeatNo: string | number;
	Status: string;
	Gender: string;
	IsAvailable: boolean;
}





interface Service {
	ServiceNo: string;
	DepartDate: string;
	DepartTime: string;
	Price: string;
	Description: string | null;
	LogoUrl: string;
	IsCharger: boolean;
	IsMonitor: boolean;
	IsBed: boolean;
	IsVIP: boolean;
	IsSofa: boolean;
	IsMono: boolean;
	IsAirConditionType: boolean;
	SrcCityCode: string;
	DesCityCode: string;
	SrcCityName: string;
	DesCityName: string;
	Cnt: string;
	FullPrice: string;
	CoName: string;
	Group: string;
	BusType: string;
	BusTypeFull: string;
	RequestToken: string;
	TicketNo: string;
	Timestamp: string;
}

interface SeatConfiguration {
	Capacity: string;
	Floor: string;
	Col: string;
	Row: string;
	Space: string;
	RequestToken: string;
	TimeStamp: string;
}
// export type SeatState = 'default' | 'occupied' | 'selected-male' | 'selected-female';


export const useSeatManagement = () => {

	// const { serviceData, seatMap } = useBusStore();
	// Local state instead of using Zustand
	const [seats, setSeats] = useState<SeatDetail[][]>([]);
	const [service, setService] = useState<Service | null>(null);
	const [seatConfiguration, setSeatConfiguration] = useState<SeatConfiguration | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const { ticketId: storedTicketId, token: storedToken } = useTicketStore();

	// Helper function to get parameters from Zustand or localStorage
	const getTicketParams = useCallback(() => {
		// First try to get from Zustand store
		if (storedTicketId && storedToken) {
			console.log('Found ticket params in Zustand store:', { ticketId: storedTicketId, token: storedToken });
			return { ticketId: storedTicketId, token: storedToken };
		}

		// If not in Zustand, try localStorage directly (fallback)
		try {
			const storedData = localStorage.getItem('ticket-storage');
			if (storedData) {
				const parsedData = JSON.parse(storedData);
				const state = parsedData?.state;

				if (state && state.ticketId && state.token) {
					console.log('Found ticket params in localStorage:', { ticketId: state.ticketId, token: state.token });
					return { ticketId: state.ticketId, token: state.token };
				}
			}
		} catch (err) {
			console.error('Error reading from localStorage:', err);
		}
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const urlTicketId = urlParams.get('ticketid');
			const urlToken = urlParams.get('token');

			if (urlTicketId && urlToken) {
				console.log('Found ticket params in URL:', { ticketId: urlTicketId, token: urlToken });
				return { ticketId: urlTicketId, token: urlToken };
			}

			// Try to extract from path segments
			const pathSegments = window.location.pathname.split('/');
			// Assuming a URL pattern like /ticket/[token]/[ticketid]
			if (pathSegments.length >= 4 && pathSegments[1] === 'ticket') {
				const pathToken = pathSegments[2];
				const pathTicketId = pathSegments[3];

				if (pathToken && pathTicketId) {
					console.log('Found ticket params in path:', { ticketId: pathTicketId, token: pathToken });
					return { ticketId: pathTicketId, token: pathToken };
				}
			}
		}

		console.error('Could not find ticket parameters in any source');
		return { ticketId: null, token: null };
	}, [storedTicketId, storedToken]);

	const needsOrientationFix = (seats: any[][]) => {
		if (seats.length > 0 && seats[0].length > 1) {
			try {
				const firstRow = seats[0];
				const firstSeatNo = typeof firstRow[0].SeatNo === 'string'
					? parseInt(firstRow[0].SeatNo, 10)
					: Number(firstRow[0].SeatNo);

				const lastSeatNo = typeof firstRow[firstRow.length - 1].SeatNo === 'string'
					? parseInt(firstRow[firstRow.length - 1].SeatNo, 10)
					: Number(firstRow[firstRow.length - 1].SeatNo);

				// If first seat number is higher than last, orientation is likely wrong
				return firstSeatNo > lastSeatNo;
			} catch (e) {
				return false;
			}
		}
		return false;
	};
	// Processing function to handle complex JSON response
	const processSeatMapData = useCallback((data: any) => {
		console.log('Processing seat map data:', data);

		// Check if data has a 'response' property
		if (!data) {
			console.error('Data is null or undefined');
			return false;
		}

		if (data.response === undefined) {
			console.error('Missing response property in data');
			console.log('Available keys in data:', Object.keys(data));
			return false;
		}


		// Log more detailed information about data.response
		console.log('Inspecting data.response:', data.response);
		console.log('Type of data.response:', typeof data.response);

		// Special handling for string response (possibly JSON string)
		if (typeof data.response === 'string') {
			console.log('data.response is a string, attempting to parse as JSON');
			try {
				const parsedResponse = JSON.parse(data.response);
				console.log('Successfully parsed string response into:', parsedResponse);

				// Replace the string with the parsed object for further processing
				data = { response: parsedResponse };
			} catch (error) {
				console.error('Failed to parse data.response as JSON:', error);
				// Continue with original data - it might be a non-JSON string
			}
		}

		let seatDetails;
		let configData;

		// Handle data.response as an array

		if (Array.isArray(data.response)) {
			console.log('data.response is an array with length:', data.response.length);

			if (data.response.length === 0) {
				console.error('data.response is an empty array');
				return false;
			}

			const firstElement = data.response[0];
			console.log('First element of data.response:', firstElement);

			if (firstElement && typeof firstElement === 'object' && firstElement !== null) {
				if (firstElement.SeatDetails && Array.isArray(firstElement.SeatDetails)) {
					console.log('Found SeatDetails inside data.response[0]');
					seatDetails = firstElement.SeatDetails;
					configData = firstElement;
				} else {
					console.error('data.response[0] does not contain SeatDetails array');
					console.log('Keys in data.response[0]:', Object.keys(firstElement));
				}
			} else {
				console.error('data.response[0] is not an object:', firstElement);
			}
		}
		// Handle data.response as an object
		else if (typeof data.response === 'object' && data.response !== null) {
			console.log('data.response is an object');

			if (data.response.SeatDetails && Array.isArray(data.response.SeatDetails)) {
				console.log('Found SeatDetails inside data.response object');
				seatDetails = data.response.SeatDetails;
				configData = data.response;
			} else {
				console.error('data.response does not contain SeatDetails array');
				console.log('Keys in data.response:', Object.keys(data.response));
			}
		}
		// Handle special case when data.response is null (different from undefined)
		else if (data.response === null) {
			console.error('data.response is null');
		}
		// Handle any other type
		else {
			console.error(`data.response is neither an object nor an array. It's type is: ${typeof data.response}`, data.response);

			// Try to look directly in data as a fallback
			if (data.SeatDetails && Array.isArray(data.SeatDetails)) {
				console.log('Found SeatDetails directly in the data object');
				seatDetails = data.SeatDetails;
				configData = data;
			}
		}

		// If seatDetails wasn't found with any method
		if (!seatDetails) {
			console.error('Failed to find SeatDetails in the response');
			setError(new Error('Failed to find seat details in the API response'));
			return false;
		}

		// Process the SeatDetails into rows if it's not already in rows
		let organizedSeats;

		// If seatDetails is already a nested array, use it directly
		if (Array.isArray(seatDetails[0])) {
			console.log('SeatDetails is already a nested array structure');
			organizedSeats = seatDetails;
		}
		// Otherwise, organize by TableNo
		else {
			console.log('Organizing seats by TableNo');

			// Group seats by TableNo to create rows
			const groupedByTable = seatDetails.reduce((acc: { [key: number]: SeatDetail[] }, seat: SeatDetail) => {
				const tableNo = typeof seat.TableNo === 'string' ? parseInt(seat.TableNo, 10) : seat.TableNo;
				if (!acc[tableNo]) {
					acc[tableNo] = [];
				}
				acc[tableNo].push(seat);
				return acc;
			}, {});

			// Convert the grouped object to a nested array
			organizedSeats = Object.values(groupedByTable);
		}

		console.log('Organized seats:', organizedSeats);

		// Set the state
		setSeats(organizedSeats);
		setSeatConfiguration(configData);
		console.log('Successfully processed seat data');
		return true;
	}, []);


	// Service data processing
	const processServiceData = useCallback((data: any) => {
		console.log('Processing service data:', data);

		if (!data) {
			console.error('Service data is empty');
			return false;
		}

		setService(data);
		console.log('Successfully processed service data');
		return true;
	}, []);

	// React Query for service details
	const { isLoading: isLoadingService } = useQuery({
		queryKey: ['serviceDetails'],
		queryFn: async () => {
			try {
				const { ticketId, token } = getTicketParams();
				if (!ticketId || !token) {
					throw new Error('Ticket ID or token not found');
				}


				console.log('Fetching service details with:', { ticketId, token });
				const response = await fetchSrvDetails({ ticketId, token });
				if (response) {
					console.log('Service Details Response:', response);
					processServiceData(response);
					return response;
				}
				throw new Error('Service details not found');
			} catch (err) {
				console.error('Error fetching service details:', err);
				setError(err instanceof Error ? err : new Error('Unknown error fetching service details'));
				throw err;
			}
		},
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false
	});

	// React Query for seat map
	const { isLoading: isLoadingSeatMap } = useQuery({
		queryKey: ['seatMap'],
		queryFn: async () => {
			try {
				const { ticketId, token } = getTicketParams();

				if (!ticketId || !token) {
					throw new Error('Ticket ID or token not found');
				}

				console.log('Fetching seat map with:', { ticketId, token });
				const response = await fetchSeatMap({ ticketId, token });
				// const response = await fetchSeatMap();
				if (response) {
					console.log('Seat Map Response:', response);
					processSeatMapData(response);
					return response;
				}
				throw new Error('Seat map not found');
			} catch (err) {
				console.error('Error fetching seat map:', err);
				setError(err instanceof Error ? err : new Error('Unknown error fetching seat map'));
				throw err;
			}
		},
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false
	});

	// Update seat state function
	const updateSeatState = useCallback((seatId: number, newState: SeatState) => {
		console.log('Updating seat state:', { seatId, newState });
		setSeats(prevSeats =>
			prevSeats.map(row =>
				row.map(seat =>
					seat.Index === seatId
						? { ...seat, Status: newState }
						: seat
				)
			)
		);
	}, []);

	// For testing/development - use mock data if API doesn't work
	useEffect(() => {
		// If there's no data after a while, use mock data for development
		const timer = setTimeout(() => {
			if (seats.length === 0 && !isLoadingSeatMap) {
				console.log('Setting up mock data as fallback');
				// Create sample seat data for testing
				const mockSeats: SeatDetail[][] = [
					// Row 1
					Array(4).fill(0).map((_, i) => ({
						Index: i,
						TableNo: 1,
						SeatNo: i + 1,
						Status: 'E',
						Gender: 'UN',
						IsAvailable: true
					})),
					// Row 2
					Array(4).fill(0).map((_, i) => ({
						Index: i + 4,
						TableNo: 2,
						SeatNo: i === 1 ? 0 : i + 5, // Make one seat invisible (SeatNo = 0)
						Status: i === 2 ? 'OC' : 'E',
						Gender: i === 2 ? 'F' : 'UN',
						IsAvailable: i !== 2
					}))
				];
				setSeats(mockSeats);
			}
		}, 5000);

		return () => clearTimeout(timer);
	}, [seats, isLoadingSeatMap]);

	const isLoading = isLoadingService || isLoadingSeatMap;

	return {
		seats,
		service,
		seatConfiguration,
		isLoading,
		error,
		updateSeatState,
	};
};