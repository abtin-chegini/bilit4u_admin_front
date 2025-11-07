import axios from 'axios';

const LOCATION_API_URL = "https://api.bilit4u.com/location/api/v1";

const axiosInstance = axios.create({
	timeout: 30000
});

export interface ApiTerminal {
	id: number;
	name: string;
	description: string;
	address: string;
	phone: string;
	email: string;
	webSite: string;
	logo: string;
	cityID: number;
	countryID: number;
	latitude: number;
	longitude: number;
	companyID?: number;
	terminalID?: number;
}

interface PaginatedTerminalsResponse {
	pageIndex?: number;
	pageSize?: number;
	count?: number;
	data?: ApiTerminal[];
}

interface TerminalsResponse {
	terminals?: PaginatedTerminalsResponse;
	data?: ApiTerminal[];
}

export interface CreateTerminalPayload {
	name: string;
	description?: string;
	address?: string;
	phone?: string;
	email?: string;
	webSite?: string;
	logo?: string;
	cityID?: number;
	countryID?: number;
	latitude?: number;
	longitude?: number;
	companyID?: number;
	terminalID?: number;
}

export interface UpdateTerminalPayload extends CreateTerminalPayload {
	id: number;
}

export const terminalService = {
	async getTerminals(
		token: string,
		pageIndex?: number,
		pageSize?: number
	): Promise<ApiTerminal[]> {
		try {
			console.log('=== GetTerminals API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('Using endpoint:', `${LOCATION_API_URL}/terminals/`);
			console.log('Pagination:', { pageIndex, pageSize });
			console.log('==============================');

			const params: Record<string, string> = {};
			if (pageIndex !== undefined) {
				params.pageIndex = pageIndex.toString();
			}
			if (pageSize !== undefined) {
				params.pageSize = pageSize.toString();
			}

			const response = await axiosInstance.get(`${LOCATION_API_URL}/terminals/`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				params: Object.keys(params).length > 0 ? params : undefined,
			});

			console.log('=== GetTerminals API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', JSON.stringify(response.data, null, 2));
			console.log('=================================');

			const responseData: TerminalsResponse | ApiTerminal[] = response.data;

			if (Array.isArray(responseData)) {
				return responseData;
			}

			if (responseData?.terminals?.data && Array.isArray(responseData.terminals.data)) {
				return responseData.terminals.data;
			}

			if (responseData?.data && Array.isArray(responseData.data)) {
				return responseData.data;
			}

			console.warn('No terminals found in response, structure:', responseData);
			return [];
		} catch (error: any) {
			console.error('Error in getTerminals:', error);
			console.error('Error response:', error.response?.data);
			console.error('Error status:', error.response?.status);

			if (error.response?.status === 401) {
				throw new Error('جلسه منقضی شده است. لطفاً مجدداً وارد شوید.');
			}

			if (error.response?.status === 404) {
				console.warn('Terminals endpoint not found, returning empty array');
				return [];
			}

			throw new Error(error?.response?.data?.message || error?.message || 'خطا در دریافت اطلاعات ترمینال‌ها');
		}
	},

	async addTerminal(token: string, terminalData: CreateTerminalPayload): Promise<void> {
		console.log('=== AddTerminal API Call ===');
		console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
		console.log('Terminal data:', JSON.stringify(terminalData, null, 2));
		console.log('Using endpoint:', `${LOCATION_API_URL}/terminal`);
		console.log('================================');

		try {
			const payload = {
				Terminal: {
					Name: terminalData.name,
					Description: terminalData.description ?? '',
					Address: terminalData.address ?? '',
					Phone: terminalData.phone ?? '',
					Email: terminalData.email ?? '',
					WebSite: terminalData.webSite ?? '',
					Logo: terminalData.logo ?? '',
					CountryID: terminalData.countryID ?? 1,
					CompanyID: terminalData.companyID ?? 0,
					TerminalID: terminalData.terminalID ?? 0,
					CityID: terminalData.cityID ?? 1,
					Latitude: terminalData.latitude ?? 0,
					Longitude: terminalData.longitude ?? 0,
				},
			};

			const response = await axiosInstance.post(`${LOCATION_API_URL}/terminal`, payload, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			console.log('=== AddTerminal API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('===============================');

			if (response.status !== 200 && response.status !== 201) {
				throw new Error('خطا در افزودن ترمینال');
			}
		} catch (error: any) {
			console.error('Error in addTerminal:', error);

			if (error.response?.status === 401) {
				throw new Error('جلسه منقضی شده است. لطفاً مجدداً وارد شوید.');
			}

			throw new Error(error?.response?.data?.message || 'خطا در افزودن ترمینال');
		}
	},

	async updateTerminal(token: string, terminalData: UpdateTerminalPayload): Promise<void> {
		console.log('=== UpdateTerminal API Call ===');
		console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
		console.log('TerminalId:', terminalData.id);
		console.log('Terminal data:', JSON.stringify(terminalData, null, 2));
		console.log('Using endpoint:', `${LOCATION_API_URL}/update/terminal`);
		console.log('================================');

		try {
			const payload = {
				Terminal: {
					Id: terminalData.id,
					Name: terminalData.name,
					Description: terminalData.description ?? '',
					Address: terminalData.address ?? '',
					Phone: terminalData.phone ?? '',
					Email: terminalData.email ?? '',
					WebSite: terminalData.webSite ?? '',
					Logo: terminalData.logo ?? '',
					CountryID: terminalData.countryID ?? 1,
					CompanyID: terminalData.companyID ?? terminalData.id,
					TerminalID: terminalData.terminalID ?? terminalData.id,
					CityID: terminalData.cityID ?? 1,
					Latitude: terminalData.latitude ?? 0,
					Longitude: terminalData.longitude ?? 0,
				},
			};

			const response = await axiosInstance.post(`${LOCATION_API_URL}/update/terminal`, payload, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			console.log('=== UpdateTerminal API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('=================================');

			if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
				throw new Error('خطا در به‌روزرسانی اطلاعات ترمینال');
			}
		} catch (error: any) {
			console.error('Error in updateTerminal:', error);

			if (error.response?.status === 401) {
				throw new Error('جلسه منقضی شده است. لطفاً مجدداً وارد شوید.');
			}

			throw new Error(error?.response?.data?.message || 'خطا در به‌روزرسانی اطلاعات ترمینال');
		}
	},
};

export type { ApiTerminal, CreateTerminalPayload, UpdateTerminalPayload };

