import axios from "axios";

const ADMIN_API_URL = "https://api.bilit4u.com/admin/api/v1";

const axiosInstance = axios.create({
	timeout: 30000,
});

export interface RefundedRecord {
	Id: number;
	Description?: string;
	IsVerify?: boolean;
	UserId?: number;
	Name?: string;
	phoneNumber?: string;
	CreationDate?: string;
	ArrivalDate?: string;
	DepartureDate?: string;
	CompanyName?: string;
	AddedPhone?: string;
	FactorUrl?: string;
	Price?: number;
	CompanyShare?: number;
	Bilit4uShare?: number;
	SepandShare?: number;
	LastStatus?: string;
	srcCityId?: string;
	SourceCityName?: string;
	dstCityId?: string;
	DestinationCityName?: string;
	passenger_count?: number;
}

interface RefundedResponse {
	success?: boolean;
	message?: string;
	refunded?: RefundedRecord[];
}

export const refundService = {
	async getRefunded(token: string): Promise<RefundedRecord[]> {
		try {
			console.log("=== GetRefunded API Call ===");
			console.log("Token:", token ? `${token.substring(0, 20)}...` : "null");
			console.log("Using endpoint:", `${ADMIN_API_URL}/orders/refunded`);
			console.log("================================");

			const response = await axiosInstance.get(`${ADMIN_API_URL}/orders/refunded`, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			console.log("=== GetRefunded API Response ===");
			console.log("Response status:", response.status);
			console.log("Response data:", JSON.stringify(response.data, null, 2));
			console.log("==================================");

			const responseData: RefundedResponse | RefundedRecord[] = response.data;

			// Handle different response formats
			if (Array.isArray(responseData)) {
				return responseData;
			}

			if ((responseData as RefundedResponse)?.refunded && Array.isArray((responseData as RefundedResponse).refunded)) {
				return (responseData as RefundedResponse).refunded!;
			}

			console.warn("No refunded records found in response, structure:", responseData);
			return [];
		} catch (error: any) {
			console.error("Error in getRefunded:", error);
			console.error("Error response:", error.response?.data);
			console.error("Error status:", error.response?.status);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			if (error.response?.status === 404) {
				console.warn("Refunded endpoint not found, returning empty array");
				return [];
			}

			throw new Error(error?.response?.data?.message || error?.message || "خطا در دریافت اطلاعات استردادها");
		}
	},
};

