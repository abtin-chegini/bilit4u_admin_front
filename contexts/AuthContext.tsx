"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

interface AuthContextType {
	user: User | null
	session: Session | null
	loading: boolean
	signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
	signOut: () => Promise<void>
	validateTokenWithBackend: (token: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)

	// Validate token with your backend
	const validateTokenWithBackend = async (token: string): Promise<{ isValid: boolean; shouldRefresh: boolean; shouldLogout: boolean }> => {
		try {
			console.log('🔍 [TOKEN VALIDATION] Starting token validation...')
			console.log('🔍 [TOKEN VALIDATION] JWT Token from login response:', token.substring(0, 20) + '...')
			console.log('🔍 [TOKEN VALIDATION] API Endpoint: http://localhost:5001/adminauth/api/v1/admin/validateToken')
			console.log('🔍 [TOKEN VALIDATION] Request Body: { "token": "' + token.substring(0, 20) + '..." }')
			console.log('🔍 [TOKEN VALIDATION] Timestamp:', new Date().toISOString())

			const response = await axios.post(
				'http://localhost:5001/adminauth/api/v1/admin/validateToken',
				{
					token: token
				},
				{
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)

			console.log('✅ [TOKEN VALIDATION] Success! Status:', response.status)
			console.log('✅ [TOKEN VALIDATION] Response:', response.data)

			// Extract validation response data
			const validationData = response.data
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
		} catch (error) {
			console.error('❌ [TOKEN VALIDATION] Failed:', error)
			console.error('❌ [TOKEN VALIDATION] Error details:', {
				message: error.message,
				status: error.response?.status,
				data: error.response?.data
			})
			return { isValid: false, shouldRefresh: false, shouldLogout: true }
		}
	}

	// Refresh token using your backend
	const refreshTokenWithBackend = async (refreshToken: string): Promise<{ access_token?: string; refresh_token?: string } | null> => {
		try {
			console.log('🔄 [BACKEND REFRESH] Starting backend token refresh...')
			console.log('🔄 [BACKEND REFRESH] Refresh token:', refreshToken.substring(0, 20) + '...')
			console.log('🔄 [BACKEND REFRESH] API Endpoint: http://localhost:5001/admin/refreshToken')
			console.log('🔄 [BACKEND REFRESH] Timestamp:', new Date().toISOString())

			const response = await axios.post(
				'http://localhost:5001/admin/refreshToken',
				{
					refreshToken: refreshToken
				},
				{
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)

			console.log('✅ [BACKEND REFRESH] Success! Status:', response.status)
			console.log('✅ [BACKEND REFRESH] Response:', response.data)

			return response.data
		} catch (error) {
			console.error('❌ [BACKEND REFRESH] Failed:', error)
			console.error('❌ [BACKEND REFRESH] Error details:', {
				message: error.message,
				status: error.response?.status,
				data: error.response?.data
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
			const refreshData = await refreshTokenWithBackend(session.refresh_token)
			console.log('🔄 [TOKEN REFRESH] Backend refresh response:', refreshData)
			console.log('🔄 [TOKEN REFRESH] Backend refresh access_token:', refreshData.newToken
				
			)
			if (!refreshData || !refreshData.newToken) {
				console.error('❌ [TOKEN REFRESH] Backend refresh failed or no new token received')
				return false
			}

			console.log('✅ [TOKEN REFRESH] Backend refresh successful!')
			console.log('✅ [TOKEN REFRESH] New access token:', refreshData.newToken.substring(0, 20) + '...')
			console.log('✅ [TOKEN REFRESH] New refresh token:', refreshData.refreshToken?.substring(0, 20) + '...')

			// Create updated session with new tokens
			const updatedSession = {
				...session,
				access_token: refreshData.newToken,
				refresh_token: refreshData.refreshToken || session.refreshToken,
				expires_at: Math.floor(Date.now() / 1000) + 360, // 6 minutes from now
			}

			// Update session with new tokens
			setSession(updatedSession)

			// Store updated session in localStorage
			localStorage.setItem('auth_session', JSON.stringify(updatedSession))
			console.log('💾 [TOKEN REFRESH] Session updated and stored in localStorage')

			// Validate new token with backend
			console.log('🔍 [TOKEN REFRESH] Validating new token with backend...')
			const validationResult = await validateTokenWithBackend(refreshData.newToken)
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
	const signIn = async (email: string, password: string) => {
		try {
			console.log('🔐 [LOGIN] Starting login process...')
			console.log('🔐 [LOGIN] Email:', email)
			console.log('🔐 [LOGIN] Backend API: http://localhost:5001/adminauth/api/v1/password/login')
			console.log('🔐 [LOGIN] Timestamp:', new Date().toISOString())

			// First, authenticate with your backend API
			const response = await axios.post('http://localhost:5001/adminauth/api/v1/password/login', {
				email,
				password
			})

			console.log('✅ [LOGIN] Backend response received!')
			console.log('✅ [LOGIN] Status:', response.status)
			console.log('🔍 [LOGIN] ===== FULL LOGIN RESPONSE =====')
			console.log('🔍 [LOGIN] Complete response.data:', JSON.stringify(response.data, null, 2))
			console.log('🔍 [LOGIN] ================================')

			// Log the JWT token fields from backend response
			const backendData = response.data
			console.log('🔍 [LOGIN] Looking for JWT token in backend response...')
			console.log('🔍 [LOGIN] backendData.access_token:', backendData.access_token ? backendData.access_token.substring(0, 20) + '...' : 'NOT FOUND')
			console.log('🔍 [LOGIN] backendData.token:', backendData.token ? backendData.token.substring(0, 20) + '...' : 'NOT FOUND')
			console.log('🔍 [LOGIN] backendData.jwt:', backendData.jwt ? backendData.jwt.substring(0, 20) + '...' : 'NOT FOUND')
			console.log('🔍 [LOGIN] backendData.accessToken:', backendData.accessToken ? backendData.accessToken.substring(0, 20) + '...' : 'NOT FOUND')
			console.log('🔍 [LOGIN] backendData.jwtToken:', backendData.jwtToken ? backendData.jwtToken.substring(0, 20) + '...' : 'NOT FOUND')
			console.log('🔍 [LOGIN] All backend response keys:', Object.keys(backendData))

			// Check each key-value pair to find JWT-like tokens
			console.log('🔍 [LOGIN] ===== CHECKING ALL FIELDS FOR JWT TOKENS =====')
			Object.entries(backendData).forEach(([key, value]) => {
				if (value && typeof value === 'string' && value.length > 50) {
					console.log(`🔍 [LOGIN] Field "${key}" contains long string (possibly JWT):`, value.substring(0, 20) + '...')
				} else {
					console.log(`🔍 [LOGIN] Field "${key}":`, value)
				}
			})
			console.log('🔍 [LOGIN] ==============================================')

			if (response.status === 200) {
				// If backend authentication succeeds, create a session manually
				const backendData = response.data

				// Create a mock user object
				const mockUser = {
					id: backendData.user_id || '1',
					email: email,
					user_metadata: {},
					app_metadata: {},
					aud: 'authenticated',
					created_at: new Date().toISOString(),
				} as User

				// Find the JWT token from various possible field names
				const jwtToken = backendData.token;

				console.log('🔍 [LOGIN] Selected JWT token field:', jwtToken ? jwtToken.substring(0, 20) + '...' : 'NOT FOUND')

				// Create a mock session with the actual JWT token from login response
				const mockSession = {
					access_token: jwtToken,
					refresh_token: backendData.refreshToken,
					expires_in: 360, // 6 minutes
					expires_at: Math.floor(Date.now() / 1000) + 360,
					token_type: 'bearer',
					user: mockUser,
				} as Session

				// Ensure we have a valid JWT token
				if (!mockSession.access_token) {
					console.error('❌ [LOGIN] No valid JWT token received from backend!')
					console.error('❌ [LOGIN] Backend response keys:', Object.keys(backendData))
					console.error('❌ [LOGIN] Available fields:', Object.entries(backendData).map(([k, v]) => `${k}: ${typeof v}`))
					return { error: { message: 'No JWT token received from backend' } as AuthError }
				}

				console.log('👤 [LOGIN] Created user object:', mockUser)
				console.log('🎫 [LOGIN] Created session with access token:', mockSession.access_token ? mockSession.access_token.substring(0, 20) + '...' : 'NOT FOUND')
				console.log('🎫 [LOGIN] Created session with refresh token:', mockSession.refresh_token ? mockSession.refresh_token.substring(0, 20) + '...' : 'NOT FOUND')
				console.log('🎫 [LOGIN] Session expires at:', new Date(mockSession.expires_at * 1000).toISOString())

				// Set the session manually
				setSession(mockSession)
				setUser(mockUser)

				// Store session in localStorage for persistence
				localStorage.setItem('auth_session', JSON.stringify(mockSession))
				console.log('💾 [LOGIN] Session stored in localStorage')

				console.log('✅ [LOGIN] Login successful! User will be redirected to dashboard.')
				return { error: null }
			} else {
				console.log('❌ [LOGIN] Backend returned non-200 status:', response.status)
				return { error: { message: 'Authentication failed' } as AuthError }
			}
		} catch (error: any) {
			console.error('❌ [LOGIN] Login failed:', error)
			console.error('❌ [LOGIN] Error details:', {
				message: error.message,
				status: error.response?.status,
				data: error.response?.data
			})
			return {
				error: {
					message: error.response?.data?.message || 'خطا در ورود. لطفا مجددا تلاش کنید.'
				} as AuthError
			}
		}
	}

	const signOut = async () => {
		// Clear the session and user
		setSession(null)
		setUser(null)
		// Clear from localStorage
		localStorage.removeItem('auth_session')
	}

	useEffect(() => {
		// Check for existing session in localStorage
		const checkExistingSession = () => {
			try {
				const storedSession = localStorage.getItem('auth_session')
				if (storedSession) {
					const session = JSON.parse(storedSession)
					const now = Math.floor(Date.now() / 1000)

					// Check if session is still valid
					if (session.expires_at > now) {
						setSession(session)
						setUser(session.user)
					} else {
						// Session expired, clear it
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
		signIn,
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
