import axios from "axios";

const ADMIN_API_URL = "https://api.bilit4u.com/admin/api/v1";

const axiosInstance = axios.create({
	timeout: 30000,
});

export interface MenuItem {
	key: string;
	label: string;
	path: string;
	order: number;
	icon: string;
	children: MenuItem[] | null;
}

export interface MenuResponse {
	success: boolean;
	message: string;
	menus: MenuItem[];
	role: {
		id: number;
		name: string;
		description: string;
		isActive: boolean;
	};
}

export const menuService = {
	async getMenuAndRole(token: string): Promise<MenuResponse> {
		try {
			console.log("=== GetMenuAndRole API Call ===");
			console.log("Token:", token ? `${token.substring(0, 20)}...` : "null");
			console.log("Using endpoint:", `${ADMIN_API_URL}/admin/menu-and-role`);
			console.log("================================");

			const response = await axiosInstance.get(`${ADMIN_API_URL}/admin/menu-and-role`, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			console.log("=== GetMenuAndRole API Response ===");
			console.log("Response status:", response.status);
			console.log("Response data:", JSON.stringify(response.data, null, 2));
			console.log("================================");

			return response.data as MenuResponse;
		} catch (error: any) {
			console.error("Error in getMenuAndRole:", error);
			console.error("Error response:", error.response?.data);
			console.error("Error status:", error.response?.status);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error(error?.response?.data?.message || error?.message || "خطا در دریافت منوی سیستم");
		}
	},
};

