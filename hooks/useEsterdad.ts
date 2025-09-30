import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
	createEsterdadServiceFromSession,
	EsterdadChallengeResponse,
	EsterdadCardValidationResponse,
	EsterdadRefundRequest,
	EsterdadRefundResponse,
	EsterdadServiceError,
	EsterdadChallengeError,
	EsterdadValidationError,
	EsterdadService
} from '@/services/EsterdadService';

export interface UseEsterdadReturn {
	generateChallenge: (phoneNumber: string, refNum: string) => Promise<EsterdadChallengeResponse | null>;
	validateCard: (phoneNumber: string, challengeToken: string, refNum: string) => Promise<EsterdadCardValidationResponse | null>;
	generateOTP: (phoneNumber: string, challengeToken: string, refNum: string) => Promise<EsterdadCardValidationResponse | null>;
	processRefund: (request: EsterdadRefundRequest) => Promise<EsterdadRefundResponse | null>;
	checkHealth: () => Promise<boolean>;
	resetChallenge: () => void;
	isLoading: boolean;
}

export const useEsterdad = (): UseEsterdadReturn => {
	const { user, session } = useAuth();
	const { toast } = useToast();

	// Local state for service instance and loading
	const [esterdadService, setEsterdadService] = useState<EsterdadService | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Debug session changes
	useEffect(() => {
		// console.log('useEsterdad - Session changed:', {
		// 	hasSession: !!session,
		// 	hasAccessToken: !!session?.access_token,
		// 	hasUser: !!user
		// });
	}, [session, user]);

	// Initialize Esterdad service when session changes
	useEffect(() => {
		console.log('useEsterdad - Session changed, initializing service:', {
			hasSession: !!session,
			hasAccessToken: !!session?.access_token,
			hasUser: !!user
		});

		if (session?.access_token && user) {
			try {
				const service = createEsterdadServiceFromSession(session);
				console.log('useEsterdad - Service created successfully:', !!service);
				setEsterdadService(service);
			} catch (error) {
				console.error('useEsterdad - Error creating service:', error);
				setEsterdadService(null);
			}
		} else {
			console.log('useEsterdad - No valid session tokens, clearing service');
			setEsterdadService(null);
		}
	}, [session?.access_token, user]);

	// Generate challenge token
	const generateChallenge = useCallback(async (phoneNumber: string, refNum: string): Promise<EsterdadChallengeResponse | null> => {
		if (!esterdadService || !session?.access_token) {
			toast({
				title: "خطا",
				description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
				variant: "destructive"
			});
			return null;
		}

		if (!phoneNumber || !refNum) {
			toast({
				title: "خطا",
				description: "شماره تلفن و شماره پیگیری الزامی است",
				variant: "destructive"
			});
			return null;
		}

		try {
			setIsLoading(true);

			// console.log('generateChallenge - Starting challenge generation with:', {
			// 	phoneNumber,
			// 	refName
			// });

			// Use the stored service instance
			const response = await esterdadService.generateChallenge(phoneNumber, refNum);

			// console.log('generateChallenge - Challenge response received:', {
			// 	challengeToken: response.challengeToken ? `${response.challengeToken.substring(0, 20)}...` : 'null',
			// 	nonce: response.nonce ? `${response.nonce.substring(0, 20)}...` : 'null',
			// 	expiresAt: response.expiresAtUnix
			// });

			toast({
				title: "موفقیت",
				description: "توکن امنیتی با موفقیت دریافت شد",
				variant: "default"
			});

			return response;
		} catch (error) {
			// console.error('Error generating challenge:', error);

			if (error instanceof EsterdadChallengeError) {
				if (error.statusCode === 401) {
					toast({
						title: "خطا",
						description: "توکن منقضی شده. لطفاً دوباره وارد شوید",
						variant: "destructive"
					});
				} else {
					toast({
						title: "خطا",
						description: error.message,
						variant: "destructive"
					});
				}
			} else {
				toast({
					title: "خطا",
					description: "خطا در دریافت توکن امنیتی",
					variant: "destructive"
				});
			}

			return null;
		} finally {
			setIsLoading(false);
		}
	}, [session?.access_token, toast, esterdadService]);

	// Validate card with Esterdad (Generate OTP)
	const validateCard = useCallback(async (
		phoneNumber: string,
		challengeToken: string,
		refNum: string
	): Promise<EsterdadCardValidationResponse | null> => {
		// console.log('validateCard - Method called with:', { phoneNumber, challengeToken, refNum });

		if (!esterdadService || !challengeToken || !refNum) {
			// console.log('validateCard - Validation failed:', {
			// 	hasService: !!esterdadService,
			// 	hasChallengeToken: !!challengeToken,
			// 	hasRefNum: !!refNum,
			// 	challengeToken: challengeToken ? `${challengeToken.substring(0, 20)}...` : 'null',
			// 	refNum: refNum || 'null'
			// });
			toast({
				title: "خطا",
				description: "توکن چالش یا شماره پیگیری در دسترس نیست. لطفاً صفحه را رفرش کنید",
				variant: "destructive"
			});
			return null;
		}

		try {
			setIsLoading(true);

			// console.log('validateCard - Building request...');
			// console.log('validateCard - Available challenge data:', {
			// 	challengeToken: challengeToken ? `${challengeToken.substring(0, 20)}...` : 'null',
			// 	refNum: refNum
			// });

			const request = {
				phoneNumber,
				challengeToken,
				refNum
			};

			// console.log('validateCard - Request object built:', {
			// 	...request,
			// 	challengeToken: request.challengeToken ? `${request.challengeToken.substring(0, 20)}...` : 'null',
			// 	refNum: request.refNum
			// });

			// console.log('validateCard - About to call esterdadService.validateCard...');

			// Use the stored service instance
			const response = await esterdadService.validateCard(request);

			// console.log('validateCard - Success! Response:', response);

			toast({
				title: "موفقیت",
				description: "اطلاعات کارت با موفقیت تأیید شد",
				variant: "default"
			});

			return response;

		} catch (error) {
			// console.error('Error validating card:', error);

			if (error instanceof EsterdadValidationError) {
				if (error.statusCode === 401) {
					toast({
						title: "خطا",
						description: "توکن منقضی شده. لطفاً دوباره وارد شوید",
						variant: "destructive"
					});
				} else if (error.statusCode === 400) {
					toast({
						title: "خطا",
						description: error.message,
						variant: "destructive"
					});
				} else if (error.statusCode === 422) {
					toast({
						title: "خطا",
						description: "اطلاعات کارت تأیید نشد. لطفاً دوباره بررسی کنید",
						variant: "destructive"
					});
				} else {
					toast({
						title: "خطا",
						description: error.message,
						variant: "destructive"
					});
				}
			} else {
				toast({
					title: "خطا",
					description: "خطا در تأیید اطلاعات کارت",
					variant: "destructive"
				});
			}

			return null;
		} finally {
			setIsLoading(false);
		}
	}, [session?.access_token, toast, esterdadService]);

	// Generate OTP using Esterdad backend
	const generateOTP = useCallback(async (
		phoneNumber: string,
		challengeToken: string,
		refNum: string
	): Promise<EsterdadCardValidationResponse | null> => {
		// console.log('generateOTP - Method called with:', { phoneNumber, challengeToken, refNum });

		if (!esterdadService || !challengeToken || !refNum) {
			// console.log('generateOTP - OTP generation failed:', {
			// 	hasService: !!esterdadService,
			// 	hasChallengeToken: !!challengeToken,
			// 	hasRefNum: !!refNum,
			// 	challengeToken: challengeToken ? `${challengeToken.substring(0, 20)}...` : 'null',
			// 	refNum: refNum || 'null'
			// });
			toast({
				title: "خطا",
				description: "توکن چالش یا شماره پیگیری در دسترس نیست. لطفاً صفحه را رفرش کنید",
				variant: "destructive"
			});
			return null;
		}

		try {
			setIsLoading(true);

			// console.log('generateOTP - About to call esterdadService.generateOTP with RefNum...');

			// Use the stored service instance to generate OTP with RefNum
			const response = await esterdadService.generateOTP(phoneNumber, challengeToken, refNum);

			// console.log('generateOTP - Success! Response:', response);

			toast({
				title: "موفقیت",
				description: "کد تایید با موفقیت ارسال شد",
				variant: "default"
			});

			return response;

		} catch (error) {
			// console.error('Error generating OTP:', error);

			if (error instanceof EsterdadValidationError) {
				if (error.statusCode === 401) {
					toast({
						title: "خطا",
						description: "توکن منقضی شده. لطفاً دوباره وارد شوید",
						variant: "destructive"
					});
				} else if (error.statusCode === 400) {
					toast({
						title: "خطا",
						description: error.message,
						variant: "destructive"
					});
				} else if (error.statusCode === 422) {
					toast({
						title: "خطا",
						description: "خطا در تولید کد تایید. لطفاً دوباره تلاش کنید",
						variant: "destructive"
					});
				} else {
					toast({
						title: "خطا",
						description: error.message,
						variant: "destructive"
					});
				}
			} else {
				toast({
					title: "خطا",
					description: "خطا در تولید کد تایید",
					variant: "destructive"
				});
			}

			return null;
		} finally {
			setIsLoading(false);
		}
	}, [session?.access_token, toast, esterdadService]);

	// Process refund using Esterdad backend
	const processRefund = useCallback(async (
		request: EsterdadRefundRequest
	): Promise<EsterdadRefundResponse | null> => {
		console.log('processRefund - Method called with request:', {
			RefNum: request.RefNum,
			PhoneNumber: request.PhoneNumber,
			ChallengeToken: request.ChallengeToken ? `${request.ChallengeToken.substring(0, 20)}...` : 'null',
			Otp: request.Otp ? `${request.Otp.substring(0, 6)}...` : 'null'
		});

		if (!esterdadService) {
			console.log('processRefund - No Esterdad service available');
			toast({
				title: "خطا",
				description: "سرویس Esterdad در دسترس نیست. لطفاً صفحه را رفرش کنید",
				variant: "destructive"
			});
			return null;
		}

		try {
			setIsLoading(true);

			console.log('processRefund - About to call esterdadService.processRefund...');

			// Use the stored service instance to process refund
			const response = await esterdadService.processRefund(request);

			console.log('processRefund - Success! Response:', response);

			toast({
				title: "موفقیت",
				description: "درخواست استرداد با موفقیت پردازش شد",
				variant: "default"
			});

			return response;

		} catch (error) {
			console.error('Error processing refund:', error);

			if (error instanceof EsterdadValidationError) {
				if (error.statusCode === 401) {
					toast({
						title: "خطا",
						description: "توکن منقضی شده. لطفاً دوباره وارد شوید",
						variant: "destructive"
					});
				} else if (error.statusCode === 400) {
					toast({
						title: "خطا",
						description: error.message,
						variant: "destructive"
					});
				} else if (error.statusCode === 422) {
					toast({
						title: "خطا",
						description: "اطلاعات وارد شده صحیح نیست. لطفاً دوباره بررسی کنید",
						variant: "destructive"
					});
				} else {
					toast({
						title: "خطا",
						description: error.message,
						variant: "destructive"
					});
				}
			} else {
				toast({
					title: "خطا",
					description: "خطا در پردازش درخواست استرداد",
					variant: "destructive"
				});
			}

			return null;
		} finally {
			setIsLoading(false);
		}
	}, [session?.access_token, toast, esterdadService]);

	// Check Esterdad service health
	const checkHealth = useCallback(async (): Promise<boolean> => {
		if (!esterdadService) {
			return false;
		}

		try {
			await esterdadService.checkHealth();
			return true;
		} catch (error) {
			// console.error('Esterdad service health check failed:', error);
			return false;
		}
	}, [esterdadService]);

	// Reset challenge state (no-op in simplified version)
	const resetChallenge = useCallback(() => {
		// console.log('useEsterdad - resetChallenge called (no-op in simplified version)');
	}, []);

	return {
		generateChallenge,
		validateCard,
		generateOTP,
		processRefund,
		checkHealth,
		resetChallenge,
		isLoading
	};
};
