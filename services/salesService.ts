import axios from "axios";

const ADMIN_API_URL = "https://api.bilit4u.com/admin/api/v1";

const axiosInstance = axios.create({
	timeout: 30000,
});

export interface SaleRecord {
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

interface PagedSalesResponse {
	pageIndex?: number;
	pageSize?: number;
	count?: number;
	totalCount?: number;
	data?: SaleRecord[];
}

interface SalesApiResponse extends PagedSalesResponse {
	orders?: PagedSalesResponse;
	vwOrders?: PagedSalesResponse;
}

export interface SalesFetchResult {
	data: SaleRecord[];
	totalCount: number;
	pageIndex: number;
	pageSize: number;
}

export const salesService = {
	async getSales(
		token: string,
		pageIndex: number = 1,
		pageSize: number = 10
	): Promise<SalesFetchResult> {
		try {
			console.log("=== GetSales API Call ===");
			console.log("Token:", token ? `${token.substring(0, 20)}...` : "null");
			console.log("Using endpoint:", `${ADMIN_API_URL}/orders/view`);
			console.log("Pagination:", { pageIndex, pageSize });
			console.log("================================");

			const params: Record<string, string> = {
				pageIndex: pageIndex.toString(),
				pageSize: pageSize.toString(),
			};

			const response = await axiosInstance.get(`${ADMIN_API_URL}/orders/view`, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				params,
			});

			console.log("=== GetSales API Response ===");
			console.log("Response status:", response.status);
			console.log("Response data:", JSON.stringify(response.data, null, 2));
			console.log("================================");

			const responseData: SalesApiResponse | SaleRecord[] = response.data;

			let sales: SaleRecord[] = [];
			let totalCount = 0;
			let currentPageIndex = pageIndex;
			let currentPageSize = pageSize;

			const parsePageValue = (value: unknown, fallback: number) => {
				if (typeof value === "number" && !Number.isNaN(value)) return value;
				if (typeof value === "string") {
					const parsed = parseInt(value, 10);
					if (!Number.isNaN(parsed)) return parsed;
				}
				return fallback;
			};

			const parseCountValue = (value: unknown, fallback: number) => {
				if (typeof value === "number" && !Number.isNaN(value)) return value;
				if (typeof value === "string") {
					const parsed = parseInt(value, 10);
					if (!Number.isNaN(parsed)) return parsed;
				}
				return fallback;
			};

			if (Array.isArray(responseData)) {
				sales = responseData;
				totalCount = responseData.length;
			} else {
				const rawOrders = responseData.vwOrders ?? responseData.orders ?? responseData;

				if (Array.isArray(rawOrders)) {
					sales = rawOrders;
					totalCount = parseCountValue(
						responseData.count ?? responseData.totalCount,
						rawOrders.length
					);
				} else if (rawOrders?.data && Array.isArray(rawOrders.data)) {
					sales = rawOrders.data;
					totalCount = parseCountValue(
						rawOrders.count ?? rawOrders.totalCount ?? responseData.count ?? responseData.totalCount,
						sales.length
					);
					currentPageIndex = parsePageValue(rawOrders.pageIndex ?? responseData.pageIndex, pageIndex);
					currentPageSize = parsePageValue(rawOrders.pageSize ?? responseData.pageSize, pageSize);
				} else if (responseData.data && Array.isArray(responseData.data)) {
					sales = responseData.data;
					totalCount = parseCountValue(responseData.count ?? responseData.totalCount, sales.length);
					currentPageIndex = parsePageValue(responseData.pageIndex, pageIndex);
					currentPageSize = parsePageValue(responseData.pageSize, pageSize);
				}
			}

			return {
				data: sales,
				totalCount,
				pageIndex: currentPageIndex,
				pageSize: currentPageSize,
			};
		} catch (error: any) {
			console.error("Error in getSales:", error);
			console.error("Error response:", error.response?.data);
			console.error("Error status:", error.response?.status);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error(error?.response?.data?.message || error?.message || "خطا در دریافت اطلاعات خریدها");
		}
	},
};
