import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
		// The refresh endpoint will be automatically constructed as:
		// {supabaseUrl}/auth/v1/token?grant_type=refresh_token
		// Which becomes: http://localhost:9999/auth/v1/token?grant_type=refresh_token
		// Set JWT lifetime to 6 minutes (360 seconds)
		// jwtLifetime: 360,
		// Set refresh token lifetime to 4 days (345600 seconds)
		// refreshTokenLifetime: 345600,
	}
})
