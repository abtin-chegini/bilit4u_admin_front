import { User, Session, AuthError } from '@supabase/supabase-js'

// Types for secure session management
export interface SecureSession {
	sessionId: string;
	userId?: string;
	token?: string;
	refreshToken?: string;
	expiresAt: number;
	isActive: boolean;
	metadata: {
		userAgent: string;
		ipAddress?: string;
		createdAt: number;
		lastActivity: number;
		version: string;
	};
}

export interface SessionSecurityConfig {
	maxInactiveTime: number; // milliseconds
	maxSessionDuration: number; // milliseconds
	encryptionKey?: string;
	requireReauth: boolean;
	autoRefresh: boolean;
}

export class SecureSessionManager {
	private static instance: SecureSessionManager;
	private currentSession: SecureSession | null = null;
	private securityConfig: SessionSecurityConfig;
	private sessionCheckInterval: NodeJS.Timeout | null = null;

	private constructor() {
		this.securityConfig = {
			maxInactiveTime: 30 * 60 * 1000, // 30 minutes
			maxSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
			requireReauth: true,
			autoRefresh: true
		};

		// Start session monitoring
		this.startSessionMonitoring();
	}

	public static getInstance(): SecureSessionManager {
		if (!SecureSessionManager.instance) {
			SecureSessionManager.instance = new SecureSessionManager();
		}
		return SecureSessionManager.instance;
	}

	// Initialize secure session
	async initializeSession(
		userId?: string,
		token?: string,
		refreshToken?: string
	): Promise<SecureSession> {
		const sessionId = this.generateSecureSessionId();
		const now = Date.now();

		const session: SecureSession = {
			sessionId,
			userId,
			token,
			refreshToken,
			expiresAt: now + this.securityConfig.maxSessionDuration,
			isActive: true,
			metadata: {
				userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
				createdAt: now,
				lastActivity: now,
				version: '1.0'
			}
		};

		// Store session in localStorage
		await this.storeSessionInLocalStorage(session);

		this.currentSession = session;
		console.log('🔐 Secure session initialized:', sessionId);

		return session;
	}

	// Generate cryptographically secure session ID
	private generateSecureSessionId(): string {
		const timestamp = Date.now().toString(36);
		const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(16)))
			.map(b => b.toString(36))
			.join('');

		return `secure_${timestamp}_${randomPart}`;
	}

	// Store session in localStorage
	private async storeSessionInLocalStorage(session: SecureSession): Promise<void> {
		try {
			const sessionData = JSON.stringify(session);
			localStorage.setItem(`secure_session_${session.sessionId}`, sessionData);
			console.log('✅ Session stored in localStorage');
		} catch (error) {
			console.error('❌ Failed to store session in localStorage:', error);
			throw error;
		}
	}

	// Get current session
	getCurrentSession(): SecureSession | null {
		return this.currentSession;
	}

	// Update session activity
	async updateActivity(): Promise<void> {
		if (!this.currentSession) return;

		this.currentSession.metadata.lastActivity = Date.now();

		try {
			await this.storeSessionInLocalStorage(this.currentSession);
		} catch (error) {
			console.error('❌ Failed to update session activity:', error);
		}
	}

	// Refresh session tokens
	async refreshTokens(newToken: string, newRefreshToken: string): Promise<void> {
		if (!this.currentSession) {
			throw new Error('No active session to refresh');
		}

		this.currentSession.token = newToken;
		this.currentSession.refreshToken = newRefreshToken;
		this.currentSession.metadata.lastActivity = Date.now();

		try {
			await this.storeSessionInLocalStorage(this.currentSession);
			console.log('🔄 Session tokens refreshed');
		} catch (error) {
			console.error('❌ Failed to refresh session tokens:', error);
			throw error;
		}
	}

	// Validate session
	async validateSession(): Promise<boolean> {
		if (!this.currentSession) {
			return false;
		}

		const now = Date.now();

		// Check if session has expired
		if (now > this.currentSession.expiresAt) {
			console.log('⏰ Session expired');
			await this.invalidateSession();
			return false;
		}

		// Check if session has been inactive too long
		const inactiveTime = now - this.currentSession.metadata.lastActivity;
		if (inactiveTime > this.securityConfig.maxInactiveTime) {
			console.log('😴 Session inactive too long');
			await this.invalidateSession();
			return false;
		}

		// Update activity
		await this.updateActivity();
		return true;
	}

	// Invalidate session
	async invalidateSession(): Promise<void> {
		if (!this.currentSession) return;

		try {
			// Clear from localStorage
			localStorage.removeItem(`secure_session_${this.currentSession.sessionId}`);

			// Clear local session
			this.currentSession = null;

			console.log('🚫 Session invalidated');
		} catch (error) {
			console.error('❌ Failed to invalidate session:', error);
		}
	}

	// Load session from localStorage
	async loadSessionFromLocalStorage(sessionId: string): Promise<SecureSession | null> {
		try {
			const sessionData = localStorage.getItem(`secure_session_${sessionId}`);

			if (sessionData) {
				const session: SecureSession = JSON.parse(sessionData);

				// Validate loaded session
				if (await this.validateSession()) {
					this.currentSession = session;
					return session;
				}
			}

			return null;
		} catch (error) {
			console.error('❌ Failed to load session from localStorage:', error);
			return null;
		}
	}

	// Start session monitoring
	private startSessionMonitoring(): void {
		if (typeof window === 'undefined') return;

		// Check session every 5 minutes
		this.sessionCheckInterval = setInterval(async () => {
			if (this.currentSession) {
				const isValid = await this.validateSession();
				if (!isValid) {
					// Redirect to login or show session expired message
					this.handleSessionExpired();
				}
			}
		}, 5 * 60 * 1000);

		// Monitor user activity
		const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

		const updateActivity = () => {
			this.updateActivity().catch(console.error);
		};

		activityEvents.forEach(event => {
			document.addEventListener(event, updateActivity, true);
		});

		// Cleanup on page unload
		window.addEventListener('beforeunload', () => {
			this.cleanup();
		});
	}

	// Handle session expired
	private handleSessionExpired(): void {
		console.log('🚫 Session expired, redirecting to login');

		// Clear all local storage
		if (typeof window !== 'undefined') {
			localStorage.clear();
			sessionStorage.clear();
		}

		// Redirect to login
		if (typeof window !== 'undefined') {
			window.location.href = '/auth/signin?session=expired';
		}
	}

	// Cleanup resources
	cleanup(): void {
		if (this.sessionCheckInterval) {
			clearInterval(this.sessionCheckInterval);
			this.sessionCheckInterval = null;
		}
	}

	// Get session info for debugging
	getSessionInfo(): any {
		if (!this.currentSession) {
			return { status: 'no_session' };
		}

		const now = Date.now();
		const inactiveTime = now - this.currentSession.metadata.lastActivity;
		const timeUntilExpiry = this.currentSession.expiresAt - now;

		return {
			sessionId: this.currentSession.sessionId,
			userId: this.currentSession.userId,
			isActive: this.currentSession.isActive,
			inactiveTime: Math.floor(inactiveTime / 1000), // seconds
			timeUntilExpiry: Math.floor(timeUntilExpiry / 1000), // seconds
			createdAt: new Date(this.currentSession.metadata.createdAt).toISOString(),
			lastActivity: new Date(this.currentSession.metadata.lastActivity).toISOString()
		};
	}

	// Update security configuration
	updateSecurityConfig(config: Partial<SessionSecurityConfig>): void {
		this.securityConfig = { ...this.securityConfig, ...config };
		console.log('🔧 Security configuration updated:', this.securityConfig);
	}
}

// Create singleton instance
export const secureSessionManager = SecureSessionManager.getInstance();

// React hook for secure session management - updated to use Supabase types
export function useSecureSession() {
	// Get session from localStorage with proper Supabase types
	const getAuthSession = (): Session | null => {
		if (typeof window === 'undefined') return null;
		try {
			const sessionData = localStorage.getItem('auth_session');
			return sessionData ? JSON.parse(sessionData) as Session : null;
		} catch (error) {
			console.error('Failed to get auth session:', error);
			return null;
		}
	};

	const session = getAuthSession();
	const isAuthenticated = !!session?.access_token;
	const isLoading = false; // We can determine this from session state

	const initializeSecureSession = async () => {
		if (session?.access_token && session?.refresh_token) {
			return await secureSessionManager.initializeSession(
				session.user?.id,
				session.access_token,
				session.refresh_token
			);
		}
		return null;
	};

	const validateSession = async () => {
		return await secureSessionManager.validateSession();
	};

	const refreshTokens = async (newToken: string, newRefreshToken: string) => {
		return await secureSessionManager.refreshTokens(newToken, newRefreshToken);
	};

	const invalidateSession = async () => {
		return await secureSessionManager.invalidateSession();
	};

	const getSessionInfo = () => {
		return secureSessionManager.getSessionInfo();
	};

	return {
		currentSession: secureSessionManager.getCurrentSession(),
		initializeSecureSession,
		validateSession,
		refreshTokens,
		invalidateSession,
		getSessionInfo,
		isAuthenticated,
		isLoading,
		session // Expose the Supabase session for components that need it
	};
}
