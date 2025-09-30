import axios, { AxiosResponse } from 'axios';

// Zibal API Base URL
const ZIBAL_API_BASE = 'http://localhost:5003/order/api/v1';

// Interfaces for Zibal API
export interface ZibalChallengeRequest {
	token: string;
	refreshToken: string;
	userAgent: string;
	ipAddress: string;
}

export interface ZibalChallengeResponse {
	success: boolean;
	message: string;
	token: string;
	nonce: string;
	expiresAtUnix: number;
}

export interface ZibalCardValidationRequest {
	nationalCode: string;
	cardNumber: string;
	// userId is no longer required, backend will use Token and RefreshToken from request body
	nonce: string;
	unixTimestamp: number;
	ChallengeToken: string;        // Backend expects ChallengeToken, not token
	signature: string;
}

export interface ZibalCardValidationResponse {
	success: boolean;
	message: string;
	result?: any;
}

export interface ZibalHealthResponse {
	status: string;
	service: string;
	timestamp: string;
}

// Error types
export class ZibalServiceError extends Error {
	constructor(
		message: string,
		public statusCode?: number,
		public responseData?: any
	) {
		super(message);
		this.name = 'ZibalServiceError';
	}
}

export class ZibalChallengeError extends ZibalServiceError {
	constructor(message: string, statusCode?: number, responseData?: any) {
		super(message, statusCode, responseData);
		this.name = 'ZibalChallengeError';
	}
}

export class ZibalValidationError extends ZibalServiceError {
	constructor(message: string, statusCode?: number, responseData?: any) {
		super(message, statusCode, responseData);
		this.name = 'ZibalValidationError';
	}
}

// Zibal Service Class
export class ZibalService {
	private accessToken: string;
	private refreshToken: string;

	constructor(accessToken: string, refreshToken: string) {
		console.log('ZibalService constructor called with:', {
			accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : 'null/undefined',
			refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null/undefined',
			accessTokenLength: accessToken?.length || 0,
			refreshTokenLength: refreshToken?.length || 0,
			accessTokenType: typeof accessToken,
			refreshTokenType: typeof refreshToken
		});

		if (!accessToken) {
			throw new Error('Access token is required to create ZibalService');
		}
		if (!refreshToken) {
			throw new Error('Refresh token is required to create ZibalService');
		}

		this.accessToken = accessToken;
		this.refreshToken = refreshToken;

		console.log('ZibalService created successfully with tokens:', {
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

	// Generate challenge token
	async generateChallenge(userAgent: string, ipAddress: string): Promise<ZibalChallengeResponse> {
		try {
			// Create the request body with required parameters
			const requestBody: ZibalChallengeRequest = {
				token: this.accessToken,
				refreshToken: this.refreshToken,
				userAgent: userAgent,
				ipAddress: ipAddress,
			};

			console.log('generateChallenge - Request body:', {
				token: this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null',
				refreshToken: this.refreshToken ? `${this.refreshToken.substring(0, 20)}...` : 'null',
				userAgent,
				ipAddress
			});

			console.log('generateChallenge - Headers:', this.getHeaders());

			const response: AxiosResponse<ZibalChallengeResponse> = await axios.post(
				`${ZIBAL_API_BASE}/zibal/challenge`,
				requestBody,
				{
					headers: this.getHeaders(),
					timeout: 10000, // 10 seconds timeout
				}
			);

			if (!response.data.success) {
				throw new ZibalChallengeError(
					response.data.message || 'خطا در دریافت توکن چالش',
					response.status,
					response.data
				);
			}

			return response.data;
		} catch (error: any) {
			if (error instanceof ZibalChallengeError) {
				throw error;
			}

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					throw new ZibalChallengeError(
						'توکن منقضی شده. لطفاً دوباره وارد شوید',
						401,
						error.response.data
					);
				} else if (error.response?.status === 400) {
					throw new ZibalChallengeError(
						error.response.data?.message || 'درخواست نامعتبر',
						400,
						error.response.data
					);
				} else if (error.code === 'ECONNABORTED') {
					throw new ZibalChallengeError(
						'زمان انتظار به پایان رسید. لطفاً دوباره تلاش کنید',
						408
					);
				} else {
					throw new ZibalChallengeError(
						error.response?.data?.message || 'خطا در ارتباط با سرور',
						error.response?.status || 500,
						error.response?.data
					);
				}
			}

			throw new ZibalChallengeError(
				'خطای غیرمنتظره در ارتباط با سرور',
				500
			);
		}
	}

	// Validate card with Zibal
	async validateCard(request: ZibalCardValidationRequest): Promise<ZibalCardValidationResponse> {
		console.log('validateCard - Method called with request:', request);
		console.log('validateCard - Current service tokens:', {
			accessToken: this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null',
			refreshToken: this.refreshToken ? `${this.refreshToken.substring(0, 20)}...` : 'null'
		});
		console.log('validateCard - Headers being sent:', this.getHeaders());
		console.log('validateCard - Original request ChallengeToken:', request.ChallengeToken ? `${request.ChallengeToken.substring(0, 20)}...` : 'null');

		try {
			// Create the complete request body including user tokens
			// The backend expects:
			// - Token: User's access token (from session.user.accessToken)
			// - RefreshToken: User's refresh token (from session.user.refreshToken)
			// - Plus all the fields from the ZibalCardValidationRequest including ChallengeToken
			const completeRequest = {
				...request,                    // nationalCode, cardNumber, nonce, unixTimestamp, ChallengeToken, signature
				Token: this.accessToken,       // User's access token for authentication
				RefreshToken: this.refreshToken, // User's refresh token for authentication
			};

			console.log('validateCard - Complete request body:', {
				...completeRequest,
				Token: completeRequest.Token ? `${completeRequest.Token.substring(0, 20)}...` : 'null',
				RefreshToken: completeRequest.RefreshToken ? `${completeRequest.RefreshToken.substring(0, 20)}...` : 'null',
				ChallengeToken: completeRequest.ChallengeToken ? `${completeRequest.ChallengeToken.substring(0, 20)}...` : 'null'
			});

			const response: AxiosResponse<ZibalCardValidationResponse> = await axios.post(
				`${ZIBAL_API_BASE}/zibal/validate-card`,
				completeRequest,
				{
					headers: this.getHeaders(),
					timeout: 15000, // 15 seconds timeout for validation
				}
			);

			if (!response.data.success) {
				throw new ZibalValidationError(
					response.data.message || 'خطا در تأیید اطلاعات کارت',
					response.status,
					response.data
				);
			}

			return response.data;
		} catch (error: any) {
			if (error instanceof ZibalValidationError) {
				throw error;
			}

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					throw new ZibalValidationError(
						'توکن منقضی شده. لطفاً دوباره وارد شوید',
						401,
						error.response.data
					);
				} else if (error.response?.status === 400) {
					throw new ZibalValidationError(
						error.response.data?.message || 'اطلاعات وارد شده صحیح نیست',
						400,
						error.response.data
					);
				} else if (error.response?.status === 422) {
					throw new ZibalValidationError(
						'اطلاعات کارت تأیید نشد. لطفاً دوباره بررسی کنید',
						422,
						error.response.data
					);
				} else if (error.code === 'ECONNABORTED') {
					throw new ZibalValidationError(
						'زمان انتظار به پایان رسید. لطفاً دوباره تلاش کنید',
						408
					);
				} else {
					throw new ZibalValidationError(
						error.response?.data?.message || 'خطا در ارتباط با سرور',
						error.response?.status || 500,
						error.response?.data
					);
				}
			}

			throw new ZibalValidationError(
				'خطای غیرمنتظره در ارتباط با سرور',
				500
			);
		}
	}

	// Check Zibal service health
	async checkHealth(): Promise<ZibalHealthResponse> {
		try {
			const response: AxiosResponse<ZibalHealthResponse> = await axios.get(
				`${ZIBAL_API_BASE}/health`,
				{
					timeout: 5000, // 5 seconds timeout for health check
				}
			);

			return response.data;
		} catch (error: any) {
			if (axios.isAxiosError(error)) {
				if (error.response?.status === 503) {
					throw new ZibalServiceError(
						'سرویس Zibal در دسترس نیست',
						503,
						error.response.data
					);
				} else if (error.code === 'ECONNABORTED') {
					throw new ZibalServiceError(
						'زمان انتظار برای بررسی سلامت سرویس به پایان رسید',
						408
					);
				}
			}

			throw new ZibalServiceError(
				'خطا در بررسی سلامت سرویس Zibal',
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
export const createZibalService = (accessToken: string, refreshToken?: string): ZibalService => {
	return new ZibalService(accessToken, refreshToken || ''); // Ensure refreshToken is not undefined
};

// Helper function to create ZibalService from NextAuth session
export const createZibalServiceFromSession = (session: any): ZibalService => {
	console.log('createZibalServiceFromSession - Session received:', {
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
		console.error('createZibalServiceFromSession - Missing accessToken');
		throw new Error('Session accessToken is required to create ZibalService');
	}
	if (!session?.user?.refreshToken) {
		console.error('createZibalServiceFromSession - Missing refreshToken');
		throw new Error('Session refreshToken is required to create ZibalService');
	}

	console.log('createZibalServiceFromSession - Creating service with valid tokens');
	return new ZibalService(
		session.user.accessToken,
		session.user.refreshToken
	);
};

// Export default instance (you can use this if you have a global token)
export default ZibalService;
