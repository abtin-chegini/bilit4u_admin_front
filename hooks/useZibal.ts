import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
	createZibalServiceFromSession,
	ZibalChallengeResponse,
	ZibalCardValidationResponse,
	ZibalServiceError,
	ZibalChallengeError,
	ZibalValidationError,
	ZibalService
} from '@/services/ZibalService';

export interface UseZibalReturn {
	generateChallenge: () => Promise<void>;
	validateCard: (nationalCode: string, cardNumber: string) => Promise<ZibalCardValidationResponse | null>;
	checkHealth: () => Promise<boolean>;
	resetChallenge: () => void;
	isLoading: boolean;
	challengeToken: string;
	nonce: string;
	expiresAt: number;
	remainingTime: number;
	isExpired: boolean;
}

export const useZibal = (): UseZibalReturn => {
	const { user, session } = useAuth();
	const { toast } = useToast();

	// Simple local state - no complex store logic
	const [isLoading, setIsLoading] = useState(false);
	const [zibalService, setZibalService] = useState<ZibalService | null>(null);
	const [challengeToken, setChallengeToken] = useState('');
	const [nonce, setNonce] = useState('');
	const [expiresAt, setExpiresAt] = useState(0);

	// Computed values
	const remainingTime = Math.max(0, Math.floor(expiresAt - (Date.now() / 1000)));
	const isExpired = expiresAt > 0 && Date.now() / 1000 > expiresAt;

	// Debug session changes
	useEffect(() => {
		console.log('useZibal - Session changed:', {
			hasSession: !!session,
			hasAccessToken: !!session?.access_token,
			hasUser: !!user
		});
	}, [session, user]);

	// Monitor challenge token changes
	useEffect(() => {
		console.log('useZibal - Challenge token changed:', {
			challengeToken: challengeToken ? `${challengeToken.substring(0, 20)}...` : 'null',
			nonce: nonce ? `${nonce.substring(0, 20)}...` : 'null',
			expiresAt: expiresAt
		});
	}, [challengeToken, nonce, expiresAt]);

	// Initialize Zibal service when session changes
	useEffect(() => {
		if (session?.access_token && user) {
			const service = createZibalServiceFromSession(session);
			setZibalService(service);
		} else {
			setZibalService(null);
		}
	}, [session?.access_token, user]);

	// Auto-refresh challenge when it's about to expire
	useEffect(() => {
		if (expiresAt > 0 && !isExpired && remainingTime <= 30) { // Refresh when 30 seconds remaining
			generateChallenge();
		}
	}, [remainingTime, expiresAt, isExpired]);

	// Generate challenge token
	const generateChallenge = useCallback(async () => {
		if (!zibalService || !session?.access_token) {
			toast({
				title: "خطا",
				description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
				variant: "destructive"
			});
			return;
		}

		try {
			setIsLoading(true);

			// Get user agent and IP address for the challenge
			const userAgent = navigator.userAgent;
			// In production, you should get the real IP from your backend
			// For now, we'll use a placeholder
			const ipAddress = '127.0.0.1';

			console.log('generateChallenge - Starting challenge generation...');

			// Use the stored service instance
			const response = await zibalService.generateChallenge(userAgent, ipAddress);

			console.log('generateChallenge - Challenge response received:', {
				token: response.token ? `${response.token.substring(0, 20)}...` : 'null',
				nonce: response.nonce ? `${response.nonce.substring(0, 20)}...` : 'null',
				expiresAt: response.expiresAtUnix
			});

			// Store the challenge response
			setChallengeToken(response.token);
			setNonce(response.nonce);
			setExpiresAt(response.expiresAtUnix);

			console.log('generateChallenge - State updated:', {
				challengeToken: response.token ? `${response.token.substring(0, 20)}...` : 'null',
				nonce: response.nonce ? `${response.nonce.substring(0, 20)}...` : 'null',
				expiresAt: response.expiresAtUnix
			});

			// Test: Log the state immediately after setting
			console.log('generateChallenge - Immediate state check:', {
				challengeToken: challengeToken ? `${challengeToken.substring(0, 20)}...` : 'null',
				nonce: nonce ? `${nonce.substring(0, 20)}...` : 'null'
			});

			toast({
				title: "موفقیت",
				description: "توکن امنیتی با موفقیت دریافت شد",
				variant: "default"
			});
		} catch (error) {
			console.error('Error generating challenge:', error);

			if (error instanceof ZibalChallengeError) {
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

			// Reset challenge state on error
			setChallengeToken('');
			setNonce('');
			setExpiresAt(0);
		} finally {
			setIsLoading(false);
		}
	}, [session?.access_token, toast, zibalService]);

	// Validate card with Zibal
	const validateCard = useCallback(async (
		nationalCode: string,
		cardNumber: string
	): Promise<ZibalCardValidationResponse | null> => {
		console.log('validateCard - Method called with:', { nationalCode, cardNumber });
		console.log('validateCard - Current state:', {
			hasService: !!zibalService,
			challengeToken: challengeToken ? `${challengeToken.substring(0, 20)}...` : 'null',
			nonce: nonce ? `${nonce.substring(0, 20)}...` : 'null',
			expiresAt: expiresAt,
			isExpired: isExpired
		});

		if (!zibalService || !challengeToken || !nonce) {
			console.log('validateCard - Validation failed:', {
				hasService: !!zibalService,
				hasChallengeToken: !!challengeToken,
				hasNonce: !!nonce,
				challengeToken: challengeToken ? `${challengeToken.substring(0, 20)}...` : 'null',
				nonce: nonce ? `${nonce.substring(0, 20)}...` : 'null'
			});
			toast({
				title: "خطا",
				description: "توکن چالش در دسترس نیست. لطفاً صفحه را رفرش کنید",
				variant: "destructive"
			});
			return null;
		}

		if (isExpired) {
			console.log('validateCard - Token expired, regenerating...');
			toast({
				title: "خطا",
				description: "توکن چالش منقضی شده. در حال دریافت توکن جدید...",
				variant: "destructive"
			});
			await generateChallenge();
			return null;
		}

		try {
			setIsLoading(true);

			console.log('validateCard - Building request...');
			console.log('validateCard - Available challenge data:', {
				challengeToken: challengeToken ? `${challengeToken.substring(0, 20)}...` : 'null',
				nonce: nonce ? `${nonce.substring(0, 20)}...` : 'null',
				expiresAt: expiresAt
			});

			// Build canonical payload for signature
			const canonical = [
				"POST",
				"/zibal/validate-card",
				nationalCode,
				cardNumber
			].join("|");

			// Generate signature (implement according to your backend requirements)
			const signature = await generateSignature(canonical);

			const request = {
				nationalCode,
				cardNumber,
				// userId is no longer required, backend will use Token and RefreshToken headers
				nonce,
				unixTimestamp: Math.floor(Date.now() / 1000),
				ChallengeToken: challengeToken,  // Backend expects ChallengeToken
				signature
			};

			console.log('validateCard - Request object built:', {
				...request,
				ChallengeToken: request.ChallengeToken ? `${request.ChallengeToken.substring(0, 20)}...` : 'null'
			});
			console.log('validateCard - ChallengeToken value being sent:', request.ChallengeToken);

			console.log('validateCard - About to call zibalService.validateCard...');

			// Use the stored service instance
			const response = await zibalService.validateCard(request);

			console.log('validateCard - Success! Response:', response);

			toast({
				title: "موفقیت",
				description: "اطلاعات کارت با موفقیت تأیید شد",
				variant: "default"
			});

			return response;

		} catch (error) {
			console.error('Error validating card:', error);

			if (error instanceof ZibalValidationError) {
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
	}, [session?.access_token, challengeToken, nonce, isExpired, toast, generateChallenge, zibalService, expiresAt]);

	// Check Zibal service health
	const checkHealth = useCallback(async (): Promise<boolean> => {
		if (!zibalService) {
			return false;
		}

		try {
			await zibalService.checkHealth();
			return true;
		} catch (error) {
			console.error('Zibal service health check failed:', error);
			return false;
		}
	}, [zibalService]);

	// Reset challenge state
	const resetChallenge = useCallback(() => {
		setChallengeToken('');
		setNonce('');
		setExpiresAt(0);
	}, []);

	// Generate signature (implement according to your backend requirements)
	const generateSignature = async (canonical: string): Promise<string> => {
		// This is a placeholder implementation
		// In production, implement proper signature generation
		return btoa(canonical).replace(/[^a-zA-Z0-9]/g, '');
	};

	return {
		generateChallenge,
		validateCard,
		checkHealth,
		resetChallenge,
		isLoading,
		challengeToken,
		nonce,
		expiresAt,
		remainingTime,
		isExpired
	};
};
