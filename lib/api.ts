import { API_BASE_URL } from './config'

// API utility functions
export class ApiClient {
	private baseURL: string

	constructor(baseURL: string = API_BASE_URL) {
		this.baseURL = baseURL
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseURL}${endpoint}`

		const config: RequestInit = {
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			...options,
		}

		try {
			const response = await fetch(url, config)

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			return await response.json()
		} catch (error) {
			console.error('API request failed:', error)
			throw error
		}
	}

	// GET request
	async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'GET' })
	}

	// POST request
	async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		})
	}

	// PUT request
	async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined,
		})
	}

	// DELETE request
	async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
		return this.request<T>(endpoint, { ...options, method: 'DELETE' })
	}

	// PATCH request
	async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
		return this.request<T>(endpoint, {
			...options,
			method: 'PATCH',
			body: data ? JSON.stringify(data) : undefined,
		})
	}
}

// Create a default API client instance
export const apiClient = new ApiClient()

// Export the base URL for direct use if needed
export { API_BASE_URL } from './config'
