import axios from 'axios';


const ADMIN_API_URL = "https://api.bilit4u.com/admin/api/v1";

// Create an axios instance with better timeout handling
const axiosInstance = axios.create({
	timeout: 30000 // 30 seconds
});

interface ApiPassenger {
	id?: number;
	userID?: number | null;
	fName: string;
	lName: string;
	gender: boolean; // true = male, false = female
	nationalCode: string;
	phoneNumber: string;
	dateOfBirth: string;
	address?: string;
	email?: string;
	seatNo?: string;
	seatID?: string;
}

interface PassengersResponse {
	passengers: ApiPassenger[];
}

export const passengerService = {
	async getPassengers(token: string, refreshToken?: string, userID?: string): Promise<ApiPassenger[]> {
		try {
			console.log('=== GetPassengers API Call ===');
			console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
			console.log('Using endpoint:', `${ADMIN_API_URL}/admin/passengers`);
			console.log('==============================');

			const response = await axiosInstance.get(`${ADMIN_API_URL}/admin/passengers`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			console.log('=== GetPassengers API Response ===');
			console.log('Response status:', response.status);
			console.log('Response data:', response.data);
			console.log('=================================');

			// Return the passengers array from response
			if (response.data && Array.isArray(response.data.passengers)) {
				return response.data.passengers;
			} else if (response.data && Array.isArray(response.data)) {
				return response.data;
			} else {
				return [];
			}
		} catch (error: any) {
			console.error("Error in getPassengers:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error("خطا در دریافت اطلاعات مسافران");
		}
	},

	async updatePassenger(
		token: string,
		refreshToken: string,
		passengerId: string,
		passengerData: ApiPassenger
	): Promise<void> {
		// Validate that userID is not null before proceeding
		if (passengerData.userID === null || passengerData.userID === undefined) {
			throw new Error("userID is required and cannot be null");
		}

		console.log('=== UpdatePassenger API Call ===')
		console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null')
		console.log('PassengerId:', passengerId)
		console.log('Using endpoint:', `https://api.bilit4u.com/admin/api/v1/admin/passenger/update`)
		console.log('================================')

		try {
			// Prepare payload matching API requirements
			const updatePayload = {
				id: parseInt(passengerId),
				fName: passengerData.fName,
				lName: passengerData.lName,
				gender: passengerData.gender ? "2" : "1", // Convert boolean to string: true = "2" (Male), false = "1" (Female)
				nationalCode: passengerData.nationalCode,
				address: passengerData.address || "",
				dateOfBirth: passengerData.dateOfBirth || "",
				phoneNumber: passengerData.phoneNumber || "",
				email: passengerData.email || "",
				seatNo: passengerData.seatNo || "",
				seatID: passengerData.seatID ? parseInt(passengerData.seatID) : 0
			};

			console.log('Request payload:', JSON.stringify(updatePayload, null, 2))

			const response = await axiosInstance.post(`https://api.bilit4u.com/admin/api/v1/admin/passenger/update`, updatePayload, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			// Debug: Log the API response
			console.log('=== UpdatePassenger API Response ===')
			console.log('Response status:', response.status)
			console.log('Response data:', response.data)
			console.log('====================================')

			// Check if the update was successful
			if (response.status !== 200 && response.status !== 204) {
				throw new Error("خطا در به‌روزرسانی اطلاعات مسافر");
			}
		} catch (error: any) {
			console.error("Error in updatePassenger:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error("خطا در به‌روزرسانی اطلاعات مسافر");
		}
	},

	async addPassenger(
		token: string,
		refreshToken: string,
		passengerDto: {
			userID: number | null;
			fName: string;
			lName: string;
			gender: boolean;
			nationalCode: string;
			address: string;
			dateOfBirth: string;
			phoneNumber: string;
			email: string;
			seatNo?: string;
			seatID?: string;
		}
	): Promise<void> {
		// Debug: Log the incoming passengerDto
		console.log('=== AddPassenger API Call ===')
		console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null')
		console.log('RefreshToken:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null')
		console.log('PassengerDto payload:', JSON.stringify(passengerDto, null, 2))
		console.log('userID type:', typeof passengerDto.userID, 'Value:', passengerDto.userID)
		console.log('================================')

		// Validate that userID is not null before proceeding
		if (passengerDto.userID === null || passengerDto.userID === undefined) {
			console.error('❌ AddPassenger failed: userID is null or undefined')
			throw new Error("userID is required and cannot be null");
		}

		try {
			const requestPayload = {
				Token: token,
				RefreshToken: refreshToken,
				Passenger: {
					userID: passengerDto.userID,
					fName: passengerDto.fName,
					lName: passengerDto.lName,
					gender: passengerDto.gender,
					nationalCode: passengerDto.nationalCode,
					address: passengerDto.address,
					dateOfBirth: passengerDto.dateOfBirth,
					phoneNumber: passengerDto.phoneNumber,
					email: passengerDto.email,
					seatNo: passengerDto.seatNo || "",
					seatID: passengerDto.seatID || ""
				}
			}

			// Debug: Log the complete request payload
			console.log('=== Complete API Request ===')
			console.log('Request payload:', JSON.stringify(requestPayload, null, 2))
			console.log('==========================')

			const response = await axiosInstance.post(`${ADMIN_API_URL}/passengers/add`, requestPayload, {
				headers: {
					'Content-Type': 'application/json',
				},
			});

			// Debug: Log the API response
			console.log('=== AddPassenger API Response ===')
			console.log('Response status:', response.status)
			console.log('Response data:', response.data)
			console.log('===============================')

			if (response.status !== 200 && response.status !== 201) {
				throw new Error("خطا در افزودن مسافر");
			}
		} catch (error: any) {
			console.error("❌ Error in addPassenger:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error(error?.response?.data?.message || "خطا در افزودن مسافر");
		}
	},

	async deletePassenger(
		token: string,
		refreshToken: string,
		passengerId: string
	): Promise<void> {
		// Debug: Log the delete request
		console.log('=== DeletePassenger API Call ===')
		console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null')
		console.log('PassengerId:', passengerId)
		console.log('Using endpoint:', `https://api.bilit4u.com/admin/api/v1/admin/passenger/${passengerId}`)
		console.log('================================')

		try {
			const response = await axiosInstance.delete(`https://api.bilit4u.com/admin/api/v1/admin/passenger/${passengerId}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			// Debug: Log the API response
			console.log('=== DeletePassenger API Response ===')
			console.log('Response status:', response.status)
			console.log('Response data:', response.data)
			console.log('==================================')

			if (response.status !== 200 && response.status !== 201 && response.status !== 204) {
				throw new Error("خطا در حذف مسافر");
			}
		} catch (error: any) {
			console.error("❌ Error in deletePassenger:", error);

			if (error.response?.status === 401) {
				throw new Error("جلسه منقضی شده است. لطفاً مجدداً وارد شوید.");
			}

			throw new Error(error?.response?.data?.message || "خطا در حذف مسافر");
		}
	}
};
