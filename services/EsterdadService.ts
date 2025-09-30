import axios, { AxiosResponse } from 'axios';

// Esterdad API Base URL
const ESTERDAD_API_BASE = 'https://api.bilit4u.com/order/api/v1';

// Interfaces for Esterdad API
export interface EsterdadChallengeRequest {
	phoneNumber: string;
	refNum: string;
}

export interface EsterdadChallengeResponse {
	success: boolean;
	message: string;
	challengeToken: string;
	nonce: string;
	expiresAtUnix: number;
}

export interface EsterdadCardValidationRequest {
	phoneNumber: string;
	challengeToken: string;
	refNum: string;
}

export interface EsterdadCardValidationResponse {
	success: boolean;
	message: string;
	result?: any;
	verId?: string;
	srvTicket?: string;
	coToken?: string;
}

export interface EsterdadHealthResponse {
	status: string;
	service: string;
	timestamp: string;
}

export interface EsterdadRefundRequest {
	RefNum: string;
	UserToken: string;
	RefreshToken: string;
	VerId: string;
	SrvTicket: string;
	CoToken: string;
	PhoneNumber: string;
	ChallengeToken: string;
	Otp: string;
}

export interface EsterdadRefundResponse {
	success: boolean;
	message: string;
	result?: any;
}

// Error types
export class EsterdadServiceError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public responseData?: any
	) {
		super(message);
		this.name = 'EsterdadServiceError';
	}
}

export class EsterdadChallengeError extends EsterdadServiceError {
	constructor(message: string, statusCode?: number, responseData?: any) {
		super(message, statusCode, responseData);
		this.name = 'EsterdadChallengeError';
	}
}

export class EsterdadValidationError extends EsterdadServiceError {
	constructor(message: string, statusCode?: number, responseData?: any) {
		super(message, statusCode, responseData);
		this.name = 'EsterdadValidationError';
	}
}

// Esterdad Service Class
export class EsterdadService {
	private accessToken: string;
	private refreshToken: string;

	constructor(accessToken: string, refreshToken: string) {
		console.log('EsterdadService constructor called with:', {
			accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'null/undefined',
			refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null/undefined',
			accessTokenLength: accessToken?.length || 0,
			refreshTokenLength: refreshToken?.length || 0,
			accessTokenType: typeof accessToken,
			refreshTokenType: typeof refreshToken
		});

		if (!accessToken) {
			throw new Error('Access token is required to create EsterdadService');
		}
		if (!refreshToken) {
			throw new Error('Refresh token is required to create EsterdadService');
		}

		this.accessToken = accessToken;
		this.refreshToken = refreshToken;

		console.log('EsterdadService created successfully with tokens:', {
			storedAccessToken: this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null',
			storedRefreshToken: this.refreshToken ? `${this.refreshToken.substring(0, 20)}...` : 'null'
		});
	}

	// Update tokens (useful when tokens are refreshed)
	updateTokens(accessToken: string, refreshToken: string) {
		if (!accessToken || !refreshToken) {
			throw new Error('Both access token and refresh token are required');
		}
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
	}

	// Get default headers for API calls
	private getHeaders() {
		const headers = {
			'Authorization': `Bearer ${this.accessToken}`,
			'Content-Type': 'application/json',
			'X-Refresh-Token': this.refreshToken,
		};

		console.log('getHeaders - Generated headers:', {
			authorization: headers.Authorization ? `${headers.Authorization.substring(0, 30)}...` : 'null',
			refreshToken: headers['X-Refresh-Token'] ? `${headers['X-Refresh-Token'].substring(0, 20)}...` : 'null',
			contentType: headers['Content-Type']
		});

		return headers;
	}

	// Generate challenge token using Esterdad backend
	async generateChallenge(phoneNumber: string, refNum: string): Promise<EsterdadChallengeResponse> {
		try {
			// Create the request body with required parameters
			const requestBody: EsterdadChallengeRequest = {
				phoneNumber: phoneNumber,
				refNum: refNum,
			};

			console.log('generateChallenge - Request body:', {
				phoneNumber,
				refNum
			});

			console.log('generateChallenge - Headers:', this.getHeaders());

			const response: AxiosResponse<EsterdadChallengeResponse> = await axios.post(
				`${ESTERDAD_API_BASE}/esterdad/challenge`,
				requestBody,
				{
					headers: this.getHeaders(),
					timeout: 10000, // 10 seconds timeout
				}
			);

			if (!response.data.success) {
				throw new EsterdadChallengeError(
					response.data.message || 'خطا در دریافت توکن چالش',
					response.status,
					response.data
				);
			}

			return response.data;
		} catch (error: any) {
			if (error instanceof EsterdadChallengeError) {
				throw error;
			}

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					throw new EsterdadChallengeError(
						'توکن منقضی شده. لطفاً دوباره وارد شوید',
						401,
						error.response.data
					);
				} else if (error.response?.status === 400) {
					throw new EsterdadChallengeError(
						error.response.data?.message || 'درخواست نامعتبر',
						400,
						error.response.data
					);
				} else if (error.code === 'ECONNABORTED') {
					throw new EsterdadChallengeError(
						'زمان انتظار به پایان رسید. لطفاً دوباره تلاش کنید',
						408
					);
				} else {
					throw new EsterdadChallengeError(
						error.response?.data?.message || 'خطا در ارتباط با سرور',
						error.response?.status || 500,
						error.response?.data
					);
				}
			}

			throw new EsterdadChallengeError(
				'خطای غیرمنتظره در ارتباط با سرور',
				500
			);
		}
	}

	// Validate card with Esterdad (Generate OTP)
	async validateCard(request: EsterdadCardValidationRequest): Promise<EsterdadCardValidationResponse> {
		console.log('validateCard - Method called with request:', request);
		console.log('validateCard - Current service tokens:', {
			accessToken: this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null',
			refreshToken: this.refreshToken ? `${this.refreshToken.substring(0, 20)}...` : 'null'
		});
		console.log('validateCard - Headers being sent:', this.getHeaders());
		console.log('validateCard - Original request challengeToken:', request.challengeToken ? `${request.challengeToken.substring(0, 20)}...` : 'null');

		try {
			// Create the complete request body including user tokens
			const completeRequest = {
				...request,
				Token: this.accessToken,
				RefreshToken: this.refreshToken,
			};

			console.log('validateCard - Complete request body:', {
				...completeRequest,
				Token: completeRequest.Token ? `${completeRequest.Token.substring(0, 20)}...` : 'null',
				RefreshToken: completeRequest.RefreshToken ? `${completeRequest.RefreshToken.substring(0, 20)}...` : 'null',
				challengeToken: completeRequest.challengeToken ? `${completeRequest.challengeToken.substring(0, 20)}...` : 'null',
				refNum: completeRequest.refNum
			});

			const response: AxiosResponse<EsterdadCardValidationResponse> = await axios.post(
				`${ESTERDAD_API_BASE}/esterdad/generate-otp`,
				completeRequest,
				{
					headers: this.getHeaders(),
					timeout: 15000, // 15 seconds timeout for validation
				}
			);

			if (!response.data.success) {
				throw new EsterdadValidationError(
					response.data.message || 'خطا در تأیید اطلاعات کارت',
					response.status,
					response.data
				);
			}

			return response.data;
		} catch (error: any) {
			if (error instanceof EsterdadValidationError) {
				throw error;
			}

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					throw new EsterdadValidationError(
						'توکن منقضی شده. لطفاً دوباره وارد شوید',
						401,
						error.response.data
					);
				} else if (error.response?.status === 400) {
					throw new EsterdadValidationError(
						error.response.data?.message || 'اطلاعات وارد شده صحیح نیست',
						400,
						error.response.data
					);
				} else if (error.response?.status === 422) {
					throw new EsterdadValidationError(
						'اطلاعات کارت تأیید نشد. لطفاً دوباره بررسی کنید',
						422,
						error.response.data
					);
				} else if (error.code === 'ECONNABORTED') {
					throw new EsterdadValidationError(
						'زمان انتظار به پایان رسید. لطفاً دوباره تلاش کنید',
						408
					);
				} else {
					throw new EsterdadValidationError(
						error.response?.data?.message || 'خطا در ارتباط با سرور',
						error.response?.status || 500,
						error.response?.data
					);
				}
			}

			throw new EsterdadValidationError(
				'خطای غیرمنتظره در ارتباط با سرور',
				500
			);
		}
	}

	// Generate OTP using Esterdad backend
	async generateOTP(phoneNumber: string, challengeToken: string, refNum: string): Promise<EsterdadCardValidationResponse> {
		console.log('generateOTP - Method called with:', { phoneNumber, challengeToken, refNum });
		console.log('generateOTP - Current service tokens:', {
			accessToken: this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null',
			refreshToken: this.refreshToken ? `${this.refreshToken.substring(0, 20)}...` : 'null'
		});

		try {
			// Create the request body for OTP generation
			const requestBody = {
				PhoneNumber: phoneNumber,
				ChallengeToken: challengeToken,
				RefNum: refNum, // Include RefNum in the request
			};

			console.log('generateOTP - Request body:', {
				PhoneNumber: requestBody.PhoneNumber,
				ChallengeToken: requestBody.ChallengeToken ? `${requestBody.ChallengeToken.substring(0, 20)}...` : 'null',
				RefNum: requestBody.RefNum
			});

			const response: AxiosResponse<EsterdadCardValidationResponse> = await axios.post(
				`${ESTERDAD_API_BASE}/esterdad/otp`,
				requestBody,
				{
					headers: this.getHeaders(),
					timeout: 15000, // 15 seconds timeout for OTP generation
				}
			);

			if (!response.data.success) {
				throw new EsterdadValidationError(
					response.data.message || 'خطا در تولید کد تایید',
					response.status,
					response.data
				);
			}

			return response.data;
		} catch (error: any) {
			if (error instanceof EsterdadValidationError) {
				throw error;
			}

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					throw new EsterdadValidationError(
						'توکن منقضی شده. لطفاً دوباره وارد شوید',
						401,
						error.response.data
					);
				} else if (error.response?.status === 400) {
					throw new EsterdadValidationError(
						error.response.data?.message || 'اطلاعات وارد شده صحیح نیست',
						400,
						error.response.data
					);
				} else if (error.response?.status === 422) {
					throw new EsterdadValidationError(
						'خطا در تولید کد تایید. لطفاً دوباره تلاش کنید',
						422,
						error.response.data
					);
				} else if (error.code === 'ECONNABORTED') {
					throw new EsterdadValidationError(
						'زمان انتظار به پایان رسید. لطفاً دوباره تلاش کنید',
						408
					);
				} else {
					throw new EsterdadValidationError(
						error.response?.data?.message || 'خطا در ارتباط با سرور',
						error.response?.status || 500,
						error.response?.data
					);
				}
			}

			throw new EsterdadValidationError(
				'خطای غیرمنتظره در ارتباط با سرور',
				500
			);
		}
	}

	// Process refund using Esterdad backend
	async processRefund(request: EsterdadRefundRequest): Promise<EsterdadRefundResponse> {
		console.log('processRefund - Method called with request:', {
			RefNum: request.RefNum,
			PhoneNumber: request.PhoneNumber,
			ChallengeToken: request.ChallengeToken ? `${request.ChallengeToken.substring(0, 20)}...` : 'null',
			Otp: request.Otp ? `${request.Otp.substring(0, 6)}...` : 'null'
		});

		try {
			// Create the request body for refund processing
			// Note: The request already contains UserToken and RefreshToken from the component
			// We don't need to override them here
			const requestBody = request;

			console.log('processRefund - Complete request body:', {
				...requestBody,
				UserToken: requestBody.UserToken ? `${requestBody.UserToken.substring(0, 20)}...` : 'null',
				RefreshToken: requestBody.RefreshToken ? `${requestBody.RefreshToken.substring(0, 20)}...` : 'null',
				VerId: requestBody.VerId ? `${requestBody.VerId.substring(0, 20)}...` : 'null',
				SrvTicket: requestBody.SrvTicket ? `${requestBody.SrvTicket.substring(0, 20)}...` : 'null',
				CoToken: requestBody.CoToken ? `${requestBody.CoToken.substring(0, 20)}...` : 'null',
				ChallengeToken: requestBody.ChallengeToken ? `${requestBody.ChallengeToken.substring(0, 20)}...` : 'null',
				Otp: requestBody.Otp ? `${requestBody.Otp.substring(0, 6)}...` : 'null'
			});

			const response: AxiosResponse<EsterdadRefundResponse> = await axios.post(
				`${ESTERDAD_API_BASE}/esterdad/refund`,
				requestBody,
				{
					headers: this.getHeaders(),
					timeout: 30000, // 15 seconds timeout for refund processing
				}
			);

			if (!response.data.success) {
				console.log('processRefund - Error response:', response.data);
				throw new EsterdadValidationError(
					response.data.message || 'خطا در پردازش درخواست استرداد',
					response.status,
					response.data
				);
			}

			return response.data;
		} catch (error: any) {
			if (error instanceof EsterdadValidationError) {
				throw error;
			}

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					throw new EsterdadValidationError(
						'توکن منقضی شده. لطفاً دوباره وارد شوید',
						401,
						error.response.data
					);
				} else if (error.response?.status === 400) {
					throw new EsterdadValidationError(
						error.response.data?.message || 'درخواست استرداد نامعتبر است',
						400,
						error.response.data
					);
				} else if (error.response?.status === 422) {
					throw new EsterdadValidationError(
						'اطلاعات وارد شده صحیح نیست. لطفاً دوباره بررسی کنید',
						422,
						error.response.data
					);
				} else if (error.code === 'ECONNABORTED') {
					throw new EsterdadValidationError(
						'زمان انتظار به پایان رسید. لطفاً دوباره تلاش کنید',
						408
					);
				} else {
					throw new EsterdadValidationError(
						error.response?.data?.message || 'خطا در ارتباط با سرور',
						error.response?.status || 500,
						error.response?.data
					);
				}
			}

			throw new EsterdadValidationError(
				'خطای غیرمنتظره در پردازش درخواست استرداد',
				500
			);
		}
	}

	// Check Esterdad service health
	async checkHealth(): Promise<EsterdadHealthResponse> {
		try {
			const response: AxiosResponse<EsterdadHealthResponse> = await axios.get(
				`${ESTERDAD_API_BASE}/health`,
				{
					timeout: 5000, // 5 seconds timeout for health check
				}
			);

			return response.data;
		} catch (error: any) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 503) {
					throw new EsterdadServiceError(
						'سرویس Esterdad در دسترس نیست',
						503,
						error.response.data
					);
				} else if (error.code === 'ECONNABORTED') {
					throw new EsterdadServiceError(
						'زمان انتظار برای بررسی سلامت سرویس به پایان رسید',
						408
					);
				}
			}

			throw new EsterdadServiceError(
				'خطا در بررسی سلامت سرویس Esterdad',
				500
			);
		}
	}

	// Utility method to check if challenge is expired
	isChallengeExpired(expiresAtUnix: number): boolean {
		return Date.now() / 1000 > expiresAtUnix;
	}

	// Utility method to get remaining time for challenge
	getChallengeRemainingTime(expiresAtUnix: number): number {
		const remaining = expiresAtUnix - (Date.now() / 1000);
		return Math.max(0, Math.floor(remaining));
	}

	// Utility method to format remaining time for display
	formatChallengeRemainingTime(expiresAtUnix: number): string {
		const remaining = this.getChallengeRemainingTime(expiresAtUnix);
		if (remaining <= 0) return 'منقضی شده';

		const minutes = Math.floor(remaining / 60);
		const seconds = remaining % 60;

		if (minutes > 0) {
			return `${minutes} دقیقه و ${seconds} ثانیه`;
		}
		return `${seconds} ثانیه`;
	}
}

// Export a factory function for easy instantiation
export const createEsterdadService = (accessToken: string, refreshToken?: string): EsterdadService => {
	return new EsterdadService(accessToken, refreshToken || '');
};

// Helper function to create EsterdadService from NextAuth session
export const createEsterdadServiceFromSession = (session: any): EsterdadService => {
	console.log('createEsterdadServiceFromSession - Session received:', {
		hasSession: !!session,
		userKeys: session?.user ? Object.keys(session.user) : [],
		accessToken: session?.user?.accessToken ? `${session.user.accessToken.substring(0, 20)}...` : 'null/undefined',
		refreshToken: session?.user?.refreshToken ? `${session.user.refreshToken.substring(0, 20)}...` : 'null/undefined',
		accessTokenLength: session?.user?.accessToken?.length || 0,
		refreshTokenLength: session?.user?.refreshToken?.length || 0,
		accessTokenType: typeof session?.user?.accessToken,
		refreshTokenType: typeof session?.user?.refreshToken
	});

	if (!session?.user?.accessToken) {
		console.error('createEsterdadServiceFromSession - Missing accessToken');
		throw new Error('Session accessToken is required to create EsterdadService');
	}
	if (!session?.user?.refreshToken) {
		console.error('createEsterdadServiceFromSession - Missing refreshToken');
		throw new Error('Session refreshToken is required to create EsterdadService');
	}

	console.log('createEsterdadServiceFromSession - Creating service with valid tokens');
	return new EsterdadService(
		session.user.accessToken,
		session.user.refreshToken
	);
};

// Export default instance
export default EsterdadService;
