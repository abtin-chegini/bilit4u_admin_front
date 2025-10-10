import axios from 'axios';

const WALLET_API_URL = "https://api.bilit4u.com/admin/api/v1/wallet";

// Create an axios instance with better timeout handling
const axiosInstance = axios.create({
	timeout: 30000 // 30 seconds
});

interface Transaction {
	id?: number;
	type: string;
	amount: number;
	date: string;
	description: string;
	status: string;
	referenceCode?: string;
}

interface TransactionsResponse {
	success: boolean;
	transactions: Transaction[];
	totalCount?: number;
}

export const transactionService = {
	async getTransactions(token: string): Promise<Transaction[]> {
		try {
			console.log('=== GetTransactions API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('Using endpoint:', `${WALLET_API_URL}/transactions`);
			console.log('===============================');

			const response = await axiosInstance.get(`${WALLET_API_URL}/transactions`, {
				headers: {
					'Token': token,
				},
			});

			console.log('=== GetTransactions API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('===================================');

			// Return the transactions array from response
			if (response.data && Array.isArray(response.data.transactions)) {
				return response.data.transactions;
			} else if (response.data && Array.isArray(response.data)) {
				return response.data;
			} else {
				return [];
			}
		} catch (error: any) {
			console.error("Error in getTransactions:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error("خطا در دریافت اطلاعات تراکنش‌ها");
		}
	},

	async getBalance(token: string): Promise<any> {
		try {
			console.log('=== GetBalance API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('Using endpoint:', `${WALLET_API_URL}/balance`);
			console.log('===========================');

			const response = await axiosInstance.get(`${WALLET_API_URL}/balance`, {
				headers: {
					'Token': token,
				},
			});

			console.log('=== GetBalance API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('===============================');

			return response.data;
		} catch (error: any) {
			console.error("Error in getBalance:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error("خطا در دریافت موجودی کیف پول");
		}
	}
};

