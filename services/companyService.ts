import axios from 'axios';

const LOCATION_API_URL = "https://api.bilit4u.com/location/api/v1";

// Create an axios instance with better timeout handling
const axiosInstance = axios.create({
	timeout: 30000 // 30 seconds
});

interface ApiCompany {
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
}

interface CreateCompanyPayload {
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

interface UpdateCompanyPayload {
	id: number;
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

interface CompaniesResponse {
	companies: {
		pageIndex: number;
		pageSize: number;
		count: number;
		data: ApiCompany[];
	};
}

export const companyService = {
	async getCompanies(
		token: string,
		pageIndex?: number,
		pageSize?: number
	): Promise<ApiCompany[]> {
		try {
			console.log('=== GetCompanies API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('Using endpoint:', `${LOCATION_API_URL}/companies/`);
			console.log('Pagination:', { pageIndex, pageSize });
			console.log('==============================');

			const params: Record<string, string> = {};
			if (pageIndex !== undefined) {
				params.pageIndex = pageIndex.toString();
			}
			if (pageSize !== undefined) {
				params.pageSize = pageSize.toString();
			}

			const response = await axiosInstance.get(`${LOCATION_API_URL}/companies/`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				params: Object.keys(params).length > 0 ? params : undefined,
			});

			console.log('=== GetCompanies API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', JSON.stringify(response.data, null, 2));
			console.log('=================================');

			// Handle different response formats
			const responseData = response.data;

			// If response is an array directly
			if (Array.isArray(responseData)) {
				return responseData;
			}

			// If response has companies.data structure
			if (responseData?.companies?.data && Array.isArray(responseData.companies.data)) {
				return responseData.companies.data;
			}

			// If response has a data property with companies array
			if (responseData?.data && Array.isArray(responseData.data)) {
				return responseData.data;
			}

			// If response has companies array directly
			if (responseData?.companies && Array.isArray(responseData.companies)) {
				return responseData.companies;
			}

			// Return empty array if no companies found
			console.warn('No companies found in response, structure:', responseData);
			return [];
		} catch (error: any) {
			console.error("Error in getCompanies:", error);
			console.error("Error response:", error.response?.data);
			console.error("Error status:", error.response?.status);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			// If endpoint doesn't exist yet, return empty array for now
			if (error.response?.status === 404) {
				console.warn("Companies endpoint not found, returning empty array");
				return [];
			}

			throw new Error(error?.response?.data?.message || error?.message || "خطا در دریافت اطلاعات شرکت‌ها");
		}
	},

	async addCompany(
		token: string,
		companyData: CreateCompanyPayload
	): Promise<void> {
		console.log('=== AddCompany API Call ===');
		console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
		console.log('Company data:', JSON.stringify(companyData, null, 2));
		console.log('Using endpoint:', `${LOCATION_API_URL}/company`);
		console.log('================================');

		try {
			const payload = {
				Company: {
					Name: companyData.name,
					Description: companyData.description ?? '',
					Address: companyData.address ?? '',
					Phone: companyData.phone ?? '',
					Email: companyData.email ?? '',
					WebSite: companyData.webSite ?? '',
					Logo: companyData.logo ?? '',
					CountryID: companyData.countryID ?? 1,
					CompanyID: companyData.companyID ?? 0,
					TerminalID: companyData.terminalID ?? 0,
					CityID: companyData.cityID ?? 1,
					Latitude: companyData.latitude ?? 0,
					Longitude: companyData.longitude ?? 0,
				},
			};

			const response = await axiosInstance.post(`${LOCATION_API_URL}/company`, payload, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			console.log('=== AddCompany API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('===============================');

			if (response.status !== 200 && response.status !== 201) {
				throw new Error("خطا در افزودن شرکت");
			}
		} catch (error: any) {
			console.error("Error in addCompany:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error(error?.response?.data?.message || "خطا در افزودن شرکت");
		}
	},

	async updateCompany(
		token: string,
		companyData: UpdateCompanyPayload
	): Promise<void> {
		console.log('=== UpdateCompany API Call ===');
		console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
		console.log('CompanyId:', companyData.id);
		console.log('Company data:', JSON.stringify(companyData, null, 2));
		console.log('Using endpoint:', `${LOCATION_API_URL}/update/company`);
		console.log('================================');

		try {
			const payload = {
				Company: {
					Id: companyData.id,
					Name: companyData.name,
					Description: companyData.description ?? '',
					Address: companyData.address ?? '',
					Phone: companyData.phone ?? '',
					Email: companyData.email ?? '',
					WebSite: companyData.webSite ?? '',
					Logo: companyData.logo ?? '',
					CountryID: companyData.countryID ?? 1,
					CompanyID: companyData.companyID ?? companyData.id,
					TerminalID: companyData.terminalID ?? 0,
					CityID: companyData.cityID ?? 1,
					Latitude: companyData.latitude ?? 0,
					Longitude: companyData.longitude ?? 0,
				},
			};

			const response = await axiosInstance.post(`${LOCATION_API_URL}/update/company`, payload, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			console.log('=== UpdateCompany API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('==================================');

			if (response.status !== 200 && response.status !== 204) {
				throw new Error("خطا در به‌روزرسانی اطلاعات شرکت");
			}
		} catch (error: any) {
			console.error("Error in updateCompany:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error(error?.response?.data?.message || "خطا در به‌روزرسانی اطلاعات شرکت");
		}
	},

	async deleteCompany(
		token: string,
		companyId: number
	): Promise<void> {
		console.log('=== DeleteCompany API Call ===');
		console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
		console.log('CompanyId:', companyId);
		console.log('Using endpoint:', `${LOCATION_API_URL}/companies/${companyId}`);
		console.log('================================');

		try {
			const response = await axiosInstance.delete(`${LOCATION_API_URL}/companies/${companyId}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			console.log('=== DeleteCompany API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('==================================');

			if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
				throw new Error("خطا در حذف شرکت");
			}
		} catch (error: any) {
			console.error("Error in deleteCompany:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error(error?.response?.data?.message || "خطا در حذف شرکت");
		}
	}
};

