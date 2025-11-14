import axios from 'axios';

const ADMIN_API_URL = "https://api.bilit4u.com/admin/api/v1";

// Create an axios instance with better timeout handling
const axiosInstance = axios.create({
	timeout: 30000 // 30 seconds
});

export interface ApiUser {
	id: number;
	email: string;
	name: string;
	employeeId: string;
	phoneNumber: string;
	department: string;
	roleId: number;
	creditLimit: number;
	currentBalance: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	lastLoginAt: string | null;
	roleName: string;
}

interface UsersResponse {
	success: boolean;
	message: string;
	users: ApiUser[];
}

interface UserDetailResponse {
	success?: boolean;
	message?: string;
	user?: ApiUser;
}

export interface SetRolePayload {
	userId: number;
	roleId: number;
}

export const userService = {
	async getUsers(token: string): Promise<ApiUser[]> {
		try {
			console.log('=== GetUsers API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('Using endpoint:', `${ADMIN_API_URL}/admin/users`);
			console.log('==============================');

			const response = await axiosInstance.get(`${ADMIN_API_URL}/admin/users`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			console.log('=== GetUsers API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', JSON.stringify(response.data, null, 2));
			console.log('=================================');

			const responseData: UsersResponse = response.data;

			// Return the users array from response
			if (responseData?.users && Array.isArray(responseData.users)) {
				return responseData.users;
			} else if (Array.isArray(responseData)) {
				return responseData;
			} else {
				return [];
			}
		} catch (error: any) {
			console.error("Error in getUsers:", error);
			console.error("Error response:", error.response?.data);
			console.error("Error status:", error.response?.status);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error(error?.response?.data?.message || "خطا در دریافت اطلاعات کاربران");
		}
	},

	async getUserDetail(token: string, userId: number): Promise<ApiUser> {
		try {
			console.log('=== GetUserDetail API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('UserId:', userId);
			console.log('Using endpoint:', `${ADMIN_API_URL}/admin/users/${userId}`);
			console.log('==============================');

			const response = await axiosInstance.get(`${ADMIN_API_URL}/admin/users/${userId}`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			console.log('=== GetUserDetail API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', JSON.stringify(response.data, null, 2));
			console.log('=================================');

			const responseData: UserDetailResponse | ApiUser = response.data;

			// Handle different response formats
			if ((responseData as UserDetailResponse)?.user) {
				return (responseData as UserDetailResponse).user!;
			} else if ((responseData as ApiUser)?.id) {
				return responseData as ApiUser;
			} else {
				throw new Error("فرمت پاسخ نامعتبر است");
			}
		} catch (error: any) {
			console.error("Error in getUserDetail:", error);
			console.error("Error response:", error.response?.data);
			console.error("Error status:", error.response?.status);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			if (error.response?.status === 404) {
				throw new Error("کاربر یافت نشد");
			}

			throw new Error(error?.response?.data?.message || "خطا در دریافت اطلاعات کاربر");
		}
	},

	async setUserRole(token: string, userId: number, roleId: number): Promise<void> {
		try {
			console.log('=== SetUserRole API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('UserId:', userId);
			console.log('RoleId:', roleId);
			console.log('Using endpoint:', `${ADMIN_API_URL}/admin/users/set-role`);
			console.log('==============================');

			const payload: SetRolePayload = {
				userId: userId,
				roleId: roleId,
			};

			console.log('Request payload:', JSON.stringify(payload, null, 2));

			const response = await axiosInstance.post(`${ADMIN_API_URL}/admin/users/set-role`, payload, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			console.log('=== SetUserRole API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('=================================');

			if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
				throw new Error("خطا در تغییر نقش کاربر");
			}
		} catch (error: any) {
			console.error("Error in setUserRole:", error);
			console.error("Error response:", error.response?.data);
			console.error("Error status:", error.response?.status);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error(error?.response?.data?.message || "خطا در تغییر نقش کاربر");
		}
	},
};

