// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.bilit4u.com/admin/api/v1/'

// Supabase Configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:9999'
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'me3tFmURnToauArTWWeKkxxThigsp3kvXn9kyjkvj4jLezqXimqeX4FVntgpActxmEVb3Xhe7FX3TEhxuqfEP3ikTp7YdTmbVWXA'

// API Endpoints
export const API_ENDPOINTS = {
	// Add your specific endpoints here
	// Example:
	// AUTH: `${API_BASE_URL}auth`,
	// USERS: `${API_BASE_URL}users`,
	// DASHBOARD: `${API_BASE_URL}dashboard`,
} as const
