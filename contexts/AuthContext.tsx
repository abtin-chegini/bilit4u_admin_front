"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { API_BASE_URL } from '@/lib/config'
import { apiClient } from '@/lib/api'

interface AuthContextType {
	user: User | null
	session: Session | null
	loading: boolean
	needsOtp: boolean
	challengeToken: string | null
	signIn: (username: string, password: string) => Promise<{ error: AuthError | null; needsOtp?: boolean; challengeToken?: string }>
	sendOtp: () => Promise<{ error: AuthError | null }>
	verifyOtp: (otp: string) => Promise<{ error: AuthError | null }>
	signOut: () => Promise<void>
	validateTokenWithBackend: (token: string) => Promise<{ isValid: boolean; shouldRefresh: boolean; shouldLogout: boolean }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)
	const [needsOtp, setNeedsOtp] = useState(false)
	const [challengeToken, setChallengeToken] = useState<string | null>(null)

	// Validate token with your backend
	const validateTokenWithBackend = async (token: string): Promise<{ isValid: boolean; shouldRefresh: boolean; shouldLogout: boolean }> => {
		try {
			console.log('🔍 [TOKEN VALIDATION] Starting token validation...')
			console.log('🔍 [TOKEN VALIDATION] JWT Token from login response:', token.substring(0, 20) + '...')
			console.log('🔍 [TOKEN VALIDATION] API Endpoint: ' + API_BASE_URL + 'admin/validateToken')
			console.log('🔍 [TOKEN VALIDATION] Request Body: { "token": "' + token.substring(0, 20) + '..." }')
			console.log('🔍 [TOKEN VALIDATION] Timestamp:', new Date().toISOString())

			const response = await apiClient.post(
				'admin/validateToken',
				{
					token: token
				}
			)

			console.log('✅ [TOKEN VALIDATION] Success! Response:', response)

			// Extract validation response data
			const validationData = response as any
			const { success, tokenExpired, refreshTokenExpired } = validationData

			// Store validation data in localStorage
			localStorage.setItem('tokenValidation', JSON.stringify({
				success: success,
				tokenExpired: tokenExpired,
				refreshTokenExpired: refreshTokenExpired
			}))

			console.log('💾 [TOKEN VALIDATION] Stored in localStorage:', {
				success: success,
				tokenExpired: tokenExpired,
				refreshTokenExpired: refreshTokenExpired
			})

			// Determine action based on validation response
			if (tokenExpired === false && refreshTokenExpired === false) {
				// Token is still valid
				console.log('✅ [TOKEN VALIDATION] Token is valid - no action needed')
				return { isValid: true, shouldRefresh: false, shouldLogout: false }
			} else if (tokenExpired === true && refreshTokenExpired === false) {
				// Token expired but refresh token is valid - need to refresh
				console.log('🔄 [TOKEN VALIDATION] Token expired but refresh token valid - need to refresh')
				return { isValid: false, shouldRefresh: true, shouldLogout: false }
			} else if (tokenExpired === true && refreshTokenExpired === true) {
				// Both tokens expired - need to logout
				console.log('❌ [TOKEN VALIDATION] Both tokens expired - need to logout')
				return { isValid: false, shouldRefresh: false, shouldLogout: true }
			} else {
				// Unexpected state
				console.log('⚠️ [TOKEN VALIDATION] Unexpected validation state')
				return { isValid: false, shouldRefresh: false, shouldLogout: true }
			}
		} catch (error: any) {
			console.error('❌ [TOKEN VALIDATION] Failed:', error)
			console.error('❌ [TOKEN VALIDATION] Error details:', {
				message: error.message,
				status: error.status,
				data: error.data
			})
			return { isValid: false, shouldRefresh: false, shouldLogout: true }
		}
	}

	// Refresh token using your backend
	const refreshTokenWithBackend = async (refreshToken: string): Promise<{ access_token?: string; refresh_token?: string } | null> => {
		try {
			console.log('🔄 [BACKEND REFRESH] Starting backend token refresh...')
			console.log('🔄 [BACKEND REFRESH] Refresh token:', refreshToken.substring(0, 20) + '...')
			console.log('🔄 [BACKEND REFRESH] API Endpoint: ' + API_BASE_URL + 'admin/refreshToken')
			console.log('🔄 [BACKEND REFRESH] Timestamp:', new Date().toISOString())

			const response = await apiClient.post(
				'admin/refreshToken',
				{
					refreshToken: refreshToken
				}
			)

			console.log('✅ [BACKEND REFRESH] Success! Response:', response)

			return response as any
		} catch (error: any) {
			console.error('❌ [BACKEND REFRESH] Failed:', error)
			console.error('❌ [BACKEND REFRESH] Error details:', {
				message: error.message,
				status: error.status,
				data: error.data
			})
			return null
		}
	}

	// Refresh token using your backend
	const refreshToken = async (): Promise<boolean> => {
		try {
			console.log('🔄 [TOKEN REFRESH] Starting token refresh process...')
			console.log('🔄 [TOKEN REFRESH] Current refresh token:', session?.refresh_token?.substring(0, 20) + '...')
			console.log('🔄 [TOKEN REFRESH] Timestamp:', new Date().toISOString())

			if (!session?.refresh_token) {
				console.log('❌ [TOKEN REFRESH] No refresh token available')
				return false
			}

			// Use your backend to refresh the token
			console.log('🔄 [TOKEN REFRESH] Calling backend refresh endpoint...')
			const refreshData = await refreshTokenWithBackend(session?.refresh_token || '')
			console.log('🔄 [TOKEN REFRESH] Backend refresh response:', refreshData)
			console.log('🔄 [TOKEN REFRESH] Backend refresh access_token:', refreshData?.access_token)

			if (!refreshData || !refreshData.access_token) {
				console.error('❌ [TOKEN REFRESH] Backend refresh failed or no new token received')
				return false
			}

			console.log('✅ [TOKEN REFRESH] Backend refresh successful!')
			console.log('✅ [TOKEN REFRESH] New access token:', refreshData.access_token.substring(0, 20) + '...')
			console.log('✅ [TOKEN REFRESH] New refresh token:', refreshData.refresh_token?.substring(0, 20) + '...')

			// Create updated session with new tokens
			const updatedSession = {
				...session,
				access_token: refreshData.access_token,
				refresh_token: refreshData.refresh_token || session?.refresh_token,
				// Let backend handle expiration - don't set expires_at in frontend
			} as Session

			// Update session with new tokens
			setSession(updatedSession)

			// Store updated session in localStorage
			localStorage.setItem('auth_session', JSON.stringify(updatedSession))
			console.log('💾 [TOKEN REFRESH] Session updated and stored in localStorage')

			// Validate new token with backend
			console.log('🔍 [TOKEN REFRESH] Validating new token with backend...')
			const validationResult = await validateTokenWithBackend(refreshData.access_token)
			if (!validationResult.isValid) {
				console.log('❌ [TOKEN REFRESH] Refreshed token validation failed - signing out')
				signOut()
				return false
			}

			console.log('✅ [TOKEN REFRESH] New token validated successfully!')
			return true
		} catch (error) {
			console.error('❌ [TOKEN REFRESH] Unexpected error:', error)
			return false
		}
	}

	// Sign in function that uses your backend API for login
	const signIn = async (username: string, password: string) => {
		try {
			console.log('🔐 [LOGIN] Starting login process...')
			console.log('🔐 [LOGIN] Username:', username)
			const baseUrl = 'https://api.bilit4u.com/admin/api/v1/'
			console.log('🔐 [LOGIN] Backend API: ' + baseUrl + 'admin/loginwithchallenge')
			console.log('🔐 [LOGIN] Timestamp:', new Date().toISOString())

			// First, authenticate with your backend API using the new endpoint
			const response = await fetch(baseUrl + 'admin/loginwithchallenge', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					user: {
						username,
						password
					}
				})
			})

			if (!response.ok) {
				// Get error details from backend response
				let errorMessage = 'خطا در ورود. لطفا مجددا تلاش کنید.'
				try {
					const errorData = await response.json()
					if (errorData.detail) {
						errorMessage = errorData.detail
					} else if (errorData.message) {
						errorMessage = errorData.message
					}
				} catch (e) {
					// If can't parse JSON, keep default message
				}
				const error: any = new Error(errorMessage)
				error.status = response.status
				throw error
			}

			const responseData = await response.json()

			console.log('✅ [LOGIN] Backend response received!')
			console.log('🔍 [LOGIN] ===== FULL LOGIN RESPONSE =====')
			console.log('🔍 [LOGIN] Complete response:', JSON.stringify(responseData, null, 2))
			console.log('🔍 [LOGIN] Response type:', typeof responseData)
			console.log('🔍 [LOGIN] Response keys:', Object.keys(responseData || {}))
			console.log('🔍 [LOGIN] ================================')

			const backendData = responseData as any

			// Check for nested response structure
			let actualData = backendData
			if (backendData.data) {
				console.log('🔍 [LOGIN] Found nested data structure, using responseData.data')
				actualData = backendData.data
			}

			// Check if challenge token is returned (OTP required)
			console.log('🔍 [LOGIN] Checking for challengeToken:', actualData.challengeToken)
			if (actualData.challengeToken) {
				console.log('📱 [LOGIN] Challenge token received - OTP required')

				// Store the challenge token for OTP verification
				const challengeTokenValue = actualData.challengeToken
				setChallengeToken(challengeTokenValue)
				localStorage.setItem('challenge_token', challengeTokenValue)
				setNeedsOtp(true)
				console.log('💾 [LOGIN] Challenge token stored for OTP verification')
				return {
					error: null,
					needsOtp: true,
					challengeToken: challengeTokenValue
				}
			}

			// If no challenge token, check for direct authentication
			console.log('🔍 [LOGIN] Checking for direct token:', actualData.accessToken || actualData.token)
			if (responseData && (actualData.accessToken || actualData.token)) {
				// Create a mock user object
				const mockUser = {
					id: (actualData as any).user_id || '1',
					email: username,
					user_metadata: {},
					app_metadata: {},
					aud: 'authenticated',
					created_at: new Date().toISOString(),
				} as User

				// Get the JWT token from response (support both accessToken and token)
				const jwtToken = actualData.accessToken || actualData.token;

				// Create a mock session with the actual JWT token from login response
				const mockSession = {
					access_token: jwtToken,
					refresh_token: actualData.refreshToken || actualData.refresh_token,
					token_type: 'bearer',
					user: mockUser,
				} as Session

				// Ensure we have a valid JWT token
				if (!mockSession.access_token) {
					console.error('❌ [LOGIN] No valid JWT token received from backend!')
					return { error: { message: 'No JWT token received from backend' } as AuthError }
				}

				console.log('👤 [LOGIN] Created user object:', mockUser)
				console.log('🎫 [LOGIN] Created session with access token:', mockSession.access_token ? mockSession.access_token.substring(0, 20) + '...' : 'NOT FOUND')

				// Set the session manually
				setSession(mockSession)
				setUser(mockUser)

				// Store session in localStorage for persistence
				localStorage.setItem('auth_session', JSON.stringify(mockSession))
				console.log('💾 [LOGIN] Session stored in localStorage')

				console.log('✅ [LOGIN] Login successful! User will be redirected to dashboard.')
				return { error: null, needsOtp: false }
			}

			// If we reach here, something went wrong
			console.log('❌ [LOGIN] No challengeToken or accessToken/token found in response')
			console.log('❌ [LOGIN] Available response keys:', Object.keys(actualData || {}))
			console.log('❌ [LOGIN] Full response data:', actualData)
			return { error: { message: 'Authentication failed - no accessToken or challengeToken received' } as AuthError }
		} catch (error: any) {
			console.error('❌ [LOGIN] Login failed:', error)
			console.error('❌ [LOGIN] Error details:', {
				message: error.message,
				status: error.status,
				data: error.data
			})

			// Use error message from backend or default message
			let errorMessage = error.message || 'خطا در ورود. لطفا مجددا تلاش کنید.'

			// Handle network errors
			if (error.message === 'Failed to fetch') {
				errorMessage = 'خطا در اتصال به سرور. لطفا اتصال اینترنت خود را بررسی کنید.'
			}

			return {
				error: {
					message: errorMessage
				} as AuthError
			}
		}
	}

	// Send OTP function
	const sendOtp = async () => {
		try {
			console.log('📤 [SEND OTP] Starting OTP send process...')
			const baseUrl = 'https://api.bilit4u.com/admin/api/v1/'
			console.log('📤 [SEND OTP] Backend API: ' + baseUrl + 'admin/sendotp')
			console.log('📤 [SEND OTP] Timestamp:', new Date().toISOString())

			const storedChallengeToken = challengeToken || localStorage.getItem('challenge_token')
			if (!storedChallengeToken) {
				console.error('❌ [SEND OTP] No challenge token found')
				return { error: { message: 'No challenge token found' } as AuthError }
			}

			// Send OTP request to backend
			const response = await fetch(baseUrl + 'admin/sendotp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					user: {
						challengeToken: storedChallengeToken
					}
				})
			})

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const responseData = await response.json()

			console.log('✅ [SEND OTP] Backend response received!')
			console.log('🔍 [SEND OTP] ===== FULL SEND OTP RESPONSE =====')
			console.log('🔍 [SEND OTP] Complete response:', JSON.stringify(responseData, null, 2))
			console.log('🔍 [SEND OTP] ================================')

			if (responseData) {
				console.log('✅ [SEND OTP] OTP sent successfully!')
				return { error: null }
			}

			return { error: { message: 'Failed to send OTP' } as AuthError }
		} catch (error: any) {
			console.error('❌ [SEND OTP] Send OTP failed:', error)
			console.error('❌ [SEND OTP] Error details:', {
				message: error.message,
				status: error.status,
				data: error.data
			})
			return {
				error: {
					message: error.data?.message || error.message || 'خطا در ارسال کد. لطفا مجددا تلاش کنید.'
				} as AuthError
			}
		}
	}

	// Verify OTP function
	const verifyOtp = async (otp: string) => {
		try {
			console.log('📱 [OTP] ===== STARTING OTP VERIFICATION =====')
			console.log('📱 [OTP] OTP:', otp)
			console.log('📱 [OTP] Timestamp:', new Date().toISOString())
			const baseUrl = 'https://api.bilit4u.com/admin/api/v1/'
			console.log('📱 [OTP] Backend API: ' + baseUrl + 'admin/loginwithotp')

			const storedChallengeToken = challengeToken || localStorage.getItem('challenge_token')
			if (!storedChallengeToken) {
				console.error('❌ [OTP] No challenge token found for OTP verification')
				return { error: { message: 'No challenge token found' } as AuthError }
			}

			// Verify OTP with backend
			const response = await fetch(baseUrl + 'admin/loginwithotp', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					user: {
						challengeToken: storedChallengeToken,
						otp: otp
					}
				})
			})

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const responseData = await response.json()

			console.log('✅ [OTP] Backend response received!')
			console.log('🔍 [OTP] ===== FULL OTP RESPONSE =====')
			console.log('🔍 [OTP] Complete response:', JSON.stringify(responseData, null, 2))
			console.log('🔍 [OTP] ================================')

			const backendData = responseData as any

			// Check for nested response structure in OTP verification too
			let actualOtpData = backendData
			if (backendData.data) {
				console.log('🔍 [OTP] Found nested data structure, using responseData.data')
				actualOtpData = backendData.data
			}

			console.log('🔍 [OTP] Checking for accessToken/token:', actualOtpData.accessToken || actualOtpData.token)
			if (responseData && (actualOtpData.accessToken || actualOtpData.token)) {
				// Create a mock user object
				const mockUser = {
					id: (actualOtpData as any).user_id || '1',
					email: (actualOtpData as any).email || 'admin@bilit4u.com',
					user_metadata: {},
					app_metadata: {},
					aud: 'authenticated',
					created_at: new Date().toISOString(),
				} as User

				// Get the JWT token from response (support both accessToken and token)
				const jwtToken = actualOtpData.accessToken || actualOtpData.token;

				// Create a mock session with the actual JWT token from OTP response
				const mockSession = {
					access_token: jwtToken,
					refresh_token: actualOtpData.refreshToken || actualOtpData.refresh_token,
					token_type: 'bearer',
					user: mockUser,
				} as Session

				// Ensure we have a valid JWT token
				if (!mockSession.access_token) {
					console.error('❌ [OTP] No valid JWT token received from backend!')
					return { error: { message: 'No JWT token received from backend' } as AuthError }
				}

				console.log('👤 [OTP] Created user object:', mockUser)
				console.log('🎫 [OTP] Created session with access token:', mockSession.access_token ? mockSession.access_token.substring(0, 20) + '...' : 'NOT FOUND')

				// Set the session manually
				setSession(mockSession)
				setUser(mockUser)
				setNeedsOtp(false)
				setChallengeToken(null)

				// Store session in localStorage for persistence
				localStorage.setItem('auth_session', JSON.stringify(mockSession))
				localStorage.removeItem('challenge_token')
				console.log('💾 [OTP] Session stored in localStorage')

				// Validate the token immediately after OTP verification
				console.log('🔍 [OTP] Validating token immediately after OTP verification...')
				const validationResult = await validateTokenWithBackend(jwtToken)

				if (!validationResult.isValid) {
					console.error('❌ [OTP] Token validation failed after OTP verification')
					return { error: { message: 'Token validation failed' } as AuthError }
				}

				console.log('✅ [OTP] Token validated successfully! User will be redirected to dashboard.')
				return { error: null }
			}

			// If we reach here, OTP verification failed
			console.log('❌ [OTP] No accessToken or token found in OTP response')
			console.log('❌ [OTP] Available response keys:', Object.keys(actualOtpData || {}))
			console.log('❌ [OTP] Full OTP response data:', actualOtpData)
			return { error: { message: 'OTP verification failed - no accessToken received' } as AuthError }
		} catch (error: any) {
			console.error('❌ [OTP] OTP verification failed:', error)
			console.error('❌ [OTP] Error details:', {
				message: error.message,
				status: error.status,
				data: error.data
			})
			return {
				error: {
					message: error.data?.message || error.message || 'خطا در تایید کد. لطفا مجددا تلاش کنید.'
				} as AuthError
			}
		}
	}

	const signOut = async () => {
		// Clear the session and user
		setSession(null)
		setUser(null)
		setNeedsOtp(false)
		setChallengeToken(null)
		// Clear from localStorage
		localStorage.removeItem('auth_session')
		localStorage.removeItem('challenge_token')
	}

	useEffect(() => {
		// Check for existing session in localStorage
		const checkExistingSession = () => {
			try {
				const storedSession = localStorage.getItem('auth_session')
				if (storedSession) {
					const session = JSON.parse(storedSession)

					console.log('🔄 [SESSION CHECK] Checking stored session on page refresh...')
					console.log('🔄 [SESSION CHECK] Found stored session, restoring user session')
					console.log('🔄 [SESSION CHECK] Access token:', session.access_token ? session.access_token.substring(0, 20) + '...' : 'NOT FOUND')
					console.log('🔄 [SESSION CHECK] Refresh token:', session.refresh_token ? session.refresh_token.substring(0, 20) + '...' : 'NOT FOUND')

					// If we have tokens, restore the session
					// Backend will handle token validation and refresh
					if (session.access_token && session.refresh_token) {
						console.log('✅ [SESSION CHECK] Valid tokens found, restoring user session')
						setSession(session)
						setUser(session.user)
					} else {
						console.log('❌ [SESSION CHECK] Missing tokens, clearing session')
						localStorage.removeItem('auth_session')
					}
				}
			} catch (error) {
				console.error('Error checking existing session:', error)
				localStorage.removeItem('auth_session')
			}
			setLoading(false)
		}

		checkExistingSession()
	}, []) // Empty dependency array - only run once on mount

	// Separate useEffect for token validation and refresh
	useEffect(() => {
		if (!session?.access_token) {
			console.log('⏸️ [TOKEN INTERVAL] No access token, skipping interval setup')
			return
		}

		console.log('⏰ [TOKEN INTERVAL] Setting up token validation interval (every 1 minute)')
		console.log('⏰ [TOKEN INTERVAL] Current access token:', session.access_token.substring(0, 20) + '...')
		console.log('⏰ [TOKEN INTERVAL] Interval will start in 1 minute...')

		// Set up token validation and refresh interval (every 1 minute for testing)
		const refreshInterval = setInterval(async () => {
			console.log('⏰ [TOKEN INTERVAL] 1-minute interval triggered!')
			console.log('⏰ [TOKEN INTERVAL] Current time:', new Date().toISOString())

			const validationResult = await validateTokenWithBackend(session.access_token)

			if (validationResult.isValid) {
				console.log('✅ [TOKEN INTERVAL] Token is valid - no action needed')
			} else if (validationResult.shouldRefresh) {
				console.log('🔄 [TOKEN INTERVAL] Token expired but refresh token valid - attempting refresh...')

				// Try to refresh the token
				const refreshSuccess = await refreshToken()
				if (!refreshSuccess) {
					console.log('❌ [TOKEN INTERVAL] Token refresh failed, signing out')
					signOut()
				} else {
					console.log('✅ [TOKEN INTERVAL] Token refreshed successfully')
				}
			} else if (validationResult.shouldLogout) {
				console.log('❌ [TOKEN INTERVAL] Both tokens expired - signing out and redirecting to login')
				signOut()
			}
		}, 1 * 60 * 1000) // 1 minute for testing

		return () => {
			console.log('🛑 [TOKEN INTERVAL] Clearing token validation interval')
			clearInterval(refreshInterval)
		}
	}, [session?.access_token]) // Only depend on the access token

	const value = {
		user,
		session,
		loading,
		needsOtp,
		challengeToken,
		signIn,
		sendOtp,
		verifyOtp,
		signOut,
		validateTokenWithBackend,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
