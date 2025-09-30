import axios from 'axios';

interface RequestParams {
	ticketId: string;
	token: string;
}
interface RequstPayload {
	Token: string;
	TicketNo: string;
}
const BASE_URL = 'https://api.bilit4u.com/srv/api/v1';
// const BASE_URL = 'http://localhost:5173/srv/api/v1';

// Fetch service details
export const fetchSrvDetails = async ({ ticketId, token }: RequestParams) => {
	try {
		console.log('SeatService: Fetching service details', { ticketId, token });
		const payload: RequstPayload = {
			Token: token,
			TicketNo: ticketId,
		};

		const response = await axios.post(`${BASE_URL}/srvdetail`, payload);
		console.log('SeatService: Received service details response', response.data);
		// const response = await axios.get(`/api/bus/srvdetails/${ticketId}?token=${token}`);
		return response.data;
	} catch (error) {
		console.error('Error fetching service details:', error);
		throw error;
	}
};

// Fetch seat map
export const fetchSeatMap = async ({ ticketId, token }: RequestParams) => {
	try {
		const payload: RequstPayload = {
			Token: token,
			TicketNo: ticketId,
		};

		const response = await axios.post(`${BASE_URL}/seatmap`, payload);
		return response.data;
	} catch (error) {
		console.error('Error fetching seat map:', error);
		throw error;
	}
};