import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "http://localhost:9999"
const supabaseAnonKey = "me3tFmURnToauArTWWeKkxxThigsp3kvXn9kyjkvj4jLezqXimqeX4FVntgpActxmEVb3Xhe7FX3TEhxuqfEP3ikTp7YdTmbVWXA"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
