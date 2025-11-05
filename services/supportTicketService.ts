import axios from 'axios';

const SUPPORT_API_URL = "https://api.bilit4u.com/support/api/v1";

// Create an axios instance with better timeout handling
const axiosInstance = axios.create({
	timeout: 30000 // 30 seconds
});

export interface SupportTicket {
	id: number;
	refnum?: string;
	userId: number;
	username?: string;
	userName?: string;
	userEmail?: string;
	userPhone?: string;
	subject: string;
	message: string;
	status: 'open' | 'IN_PROGRESS' | 'closed' | 'pending' | 'in_progress' | 'resolved';
	priority?: 'low' | 'medium' | 'high';
	createdAt: string;
	updatedAt?: string;
	assignedTo?: string;
	response?: string;
}

export interface SupportUser {
	name: string;
	email: string;
	phoneNumber: string;
}

export interface SupportResponse {
	id: number;
	refnum?: string;
	message: string;
	createdAt: string;
	userId?: number;
	adminId?: number;
	isAdmin?: boolean;
}

interface SupportTicketsResponse {
	tickets: SupportTicket[];
	total?: number;
}

export const supportTicketService = {
	async getSupportTickets(token: string): Promise<SupportTicket[]> {
		try {
			console.log('=== GetSupportTickets API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('Using endpoint:', `${SUPPORT_API_URL}/admin/tickets`);
			console.log('==============================');

			const response = await axiosInstance.get(`${SUPPORT_API_URL}/admin/tickets`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			console.log('=== GetSupportTickets API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('=================================');

			// Handle different response formats
			const responseData = response.data;
			
			// If response is an array directly
			if (Array.isArray(responseData)) {
				return responseData;
			}
			
			// If response has a tickets property
			if (responseData && Array.isArray(responseData.tickets)) {
				return responseData.tickets;
			}
			
			// If response has a data property with tickets
			if (responseData?.data && Array.isArray(responseData.data)) {
				return responseData.data;
			}
			
			// If response has userTickets property
			if (responseData && Array.isArray(responseData.userTickets)) {
				return responseData.userTickets;
			}
			
			// Return empty array if no tickets found
			console.warn('No tickets found in response, structure:', responseData);
			return [];
		} catch (error: any) {
			console.error("Error in getSupportTickets:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			// If endpoint doesn't exist yet, return empty array for now
			if (error.response?.status === 404) {
				console.warn("Support tickets endpoint not found, returning empty array");
				return [];
			}

			throw new Error("خطا در دریافت اطلاعات درخواست‌های پشتیبانی");
		}
	},

	async getUserById(token: string, userId: number): Promise<SupportUser> {
		try {
			console.log('=== GetUserById API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('UserId:', userId);
			console.log('Using endpoint:', `${SUPPORT_API_URL}/admin/users/${userId}`);
			console.log('==============================');

			const response = await axiosInstance.get(`${SUPPORT_API_URL}/admin/users/${userId}`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			console.log('=== GetUserById API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('=================================');

			return response.data;
		} catch (error: any) {
			console.error("Error in getUserById:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error("خطا در دریافت اطلاعات کاربر");
		}
	},

	async getTicketByRefnum(token: string, refnum: string): Promise<SupportTicket> {
		try {
			const endpoint = `${SUPPORT_API_URL}/admin/tickets/responses/${refnum}`;
			console.log('=== GetTicketByRefnum API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('Refnum:', refnum);
			console.log('Using endpoint:', endpoint);
			console.log('==============================');

			const response = await axiosInstance.get(endpoint, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			console.log('=== GetTicketByRefnum API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('=================================');

			return response.data;
		} catch (error: any) {
			console.error("Error in getTicketByRefnum:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error("خطا در دریافت اطلاعات درخواست پشتیبانی");
		}
	},

	async getTicketResponses(token: string, refnum: string): Promise<SupportResponse[]> {
		try {
			const endpoint = `${SUPPORT_API_URL}/admin/tickets/responses/${refnum}`;
			console.log('=== GetTicketResponses API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('Refnum:', refnum);
			console.log('Using endpoint:', endpoint);
			console.log('==============================');

			const response = await axiosInstance.get(endpoint, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			console.log('=== GetTicketResponses API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('=================================');

			// Handle different response formats
			const responseData = response.data;
			
			// If response is an array directly
			if (Array.isArray(responseData)) {
				return responseData;
			}
			
			// If response has a responses property
			if (responseData && Array.isArray(responseData.responses)) {
				return responseData.responses;
			}
			
			// If response has a data property with responses
			if (responseData?.data && Array.isArray(responseData.data)) {
				return responseData.data;
			}
			
			// Return empty array if no responses found
			console.warn('No responses found in response, structure:', responseData);
			return [];
		} catch (error: any) {
			console.error("Error in getTicketResponses:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			// If endpoint returns 404, return empty array (no responses yet)
			if (error.response?.status === 404) {
				console.warn("No responses found for this ticket");
				return [];
			}

			throw new Error("خطا در دریافت پاسخ‌های درخواست پشتیبانی");
		}
	},
};
