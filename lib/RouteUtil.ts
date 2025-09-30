// Define a type for our secure route storage
interface SecureRoute {
	path: string;
	timestamp: number;
	signature: string;
}

// Global flag to prevent multiple navigations
let isNavigating = false;

// Utility functions for secure route handling
export const RouteUtils = {

	// Generate a signature for route verification
	generateSignature: (path: string, timestamp: number): string => {
		// In production, use a more secure hashing method and store secret in env vars
		const secret = "bilit4u_secret_key_DO_NOT_EXPOSE";
		const data = `${path}:${timestamp}:${secret}`;

		// Simple hash function for demonstration
		let hash = 0;
		for (let i = 0; i < data.length; i++) {
			const char = data.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash.toString(36);
	},

	// Save current route information securely
	saveRoute: (path: string): Promise<boolean> => {
		return new Promise((resolve) => {
			try {
				console.log("📌 Saving route:", path);

				// Validate path before saving
				if (!path || typeof path !== 'string' || path.length < 1) {
					console.error("❌ Invalid path provided to saveRoute:", path);
					resolve(false);
					return;
				}

				const timestamp = Date.now();
				const signature = RouteUtils.generateSignature(path, timestamp);

				const routeData: SecureRoute = {
					path,
					timestamp,
					signature
				};

				// Try to use IndexedDB (more secure) with fallback to localStorage
				if ('indexedDB' in window) {
					const request = indexedDB.open("bilit4u_navigation", 1);

					request.onupgradeneeded = () => {
						const db = request.result;
						if (!db.objectStoreNames.contains('routes')) {
							db.createObjectStore('routes', { keyPath: 'id' });
						}
					};

					request.onsuccess = () => {
						try {
							const db = request.result;
							const transaction = db.transaction(['routes'], 'readwrite');
							const store = transaction.objectStore('routes');
							const putRequest = store.put({ id: 'lastBusRoute', ...routeData });

							putRequest.onsuccess = () => {
								console.log("✅ Route saved to IndexedDB:", path);
								resolve(true);
							};

							putRequest.onerror = (e: any) => {
								console.error("⚠️ Failed to save to IndexedDB, using localStorage:", e.target?.error);
								try {
									localStorage.setItem('bilit4u_last_route', JSON.stringify(routeData));
									console.log("✅ Route saved to localStorage as fallback:", path);
									resolve(true);
								} catch (localErr) {
									console.error("❌ Failed to save to localStorage:", localErr);
									resolve(false);
								}
							};

							// Add transaction error handling
							transaction.onerror = (e: any) => {
								console.error("❌ IndexedDB transaction error:", e.target?.error);
								resolve(false);
							};
						} catch (dbErr) {
							console.error("❌ Error in IndexedDB transaction:", dbErr);
							try {
								localStorage.setItem('bilit4u_last_route', JSON.stringify(routeData));
								console.log("✅ Route saved to localStorage after DB error:", path);
								resolve(true);
							} catch (localErr) {
								console.error("❌ Failed to save to localStorage:", localErr);
								resolve(false);
							}
						}
					};

					request.onerror = (e: any) => {
						// Fall back to localStorage
						console.error("⚠️ Failed to open IndexedDB:", e.target?.error);
						try {
							localStorage.setItem('bilit4u_last_route', JSON.stringify(routeData));
							console.log("✅ Route saved to localStorage after open error:", path);
							resolve(true);
						} catch (localErr) {
							console.error("❌ Failed to save to localStorage:", localErr);
							resolve(false);
						}
					};
				} else {
					try {
						localStorage.setItem('bilit4u_last_route', JSON.stringify(routeData));
						console.log("✅ Route saved to localStorage (IndexedDB unavailable):", path);
						resolve(true);
					} catch (localErr) {
						console.error("❌ Failed to save to localStorage:", localErr);
						resolve(false);
					}
				}
			} catch (err) {
				console.error("❌ General error saving route information:", err);
				resolve(false);
			}
		});
	},

	// Navigate to the stored route with verification
	navigateToStoredRoute: (router: any): void => {
		// Guard against multiple navigation attempts
		if (isNavigating) {
			console.log("⚠️ Already navigating, ignoring duplicate call");
			return;
		}

		console.log("🚀 Starting navigation to stored route");
		isNavigating = true;

		// Reset the navigation lock after a timeout in case something goes wrong
		const resetTimeout = setTimeout(() => {
			console.log("🔄 Resetting navigation lock (safety timeout)");
			isNavigating = false;
		}, 20000); // 20 seconds timeout

		// First try IndexedDB
		try {
			if ('indexedDB' in window) {
				console.log("⭐ Using IndexedDB to get route");
				const request = indexedDB.open("bilit4u_navigation", 1);

				request.onsuccess = () => {
					try {
						const db = request.result;
						console.log("✅ IndexedDB opened successfully", db);
						const transaction = db.transaction(['routes'], 'readonly');
						console.log("✅ Transaction created");
						const store = transaction.objectStore('routes');
						console.log("✅ Store accessed");
						const getRequest = store.get('lastBusRoute');
						console.log("✅ Get request initiated");

						getRequest.onsuccess = () => {
							clearTimeout(resetTimeout);
							try {
								console.log("✅ Get request completed successfully");
								if (getRequest.result) {
									console.log("✅ Retrieved route from IndexedDB:", getRequest.result);
									verifyAndNavigate(getRequest.result, router);
								} else {
									console.error("⚠️ No route found in IndexedDB, going to default route");
									// Navigate to default route
									router.push('/');

									// Reset navigation lock
									setTimeout(() => {
										isNavigating = false;
									}, 500);
								}
							} catch (resultErr) {
								console.error("❌ Error processing IndexedDB result:", resultErr);
								console.error("Result stack trace:", new Error().stack);

								// Navigate to default route
								router.push('/bus');

								// Reset navigation lock
								setTimeout(() => {
									isNavigating = false;
								}, 500);
							}
						};

						getRequest.onerror = (e: any) => {
							clearTimeout(resetTimeout);
							console.error("❌ Error getting route from IndexedDB:", e.target?.error);
							tryLocalStorageRoute(router);
						};

						transaction.onerror = (e: any) => {
							clearTimeout(resetTimeout);
							console.error("❌ IndexedDB transaction error:", e.target?.error);
							tryLocalStorageRoute(router);
						};
					} catch (dbErr) {
						clearTimeout(resetTimeout);
						console.error("❌ Error in IndexedDB transaction setup:", dbErr);
						tryLocalStorageRoute(router);
					}
				};

				request.onerror = (e: any) => {
					clearTimeout(resetTimeout);
					console.error("❌ Error opening IndexedDB:", e.target?.error);
					tryLocalStorageRoute(router);
				};
			} else {
				clearTimeout(resetTimeout);
				console.log("⚠️ IndexedDB not available, trying localStorage");
				tryLocalStorageRoute(router);
			}
		} catch (err) {
			clearTimeout(resetTimeout);
			console.error("❌ General error in navigateToStoredRoute:", err);
			console.error("Navigation stack trace:", new Error().stack);

			// Navigate to default route
			router.push('/bus');

			// Reset navigation lock
			setTimeout(() => {
				isNavigating = false;
			}, 500);
		}
	},

	// Reset the navigation lock - can be called from outside to force reset
	resetNavigationLock: (): void => {
		console.log("🔄 Manually resetting navigation lock");
		isNavigating = false;
	},

	// Check if we're currently in a navigation process
	isCurrentlyNavigating: (): boolean => {
		return isNavigating;
	}
};

// Helper function for localStorage fallback
function tryLocalStorageRoute(router: any): void {
	try {
		const storedData = localStorage.getItem('bilit4u_last_route');
		if (storedData) {
			try {
				const routeData = JSON.parse(storedData);
				console.log("✅ Retrieved route from localStorage:", routeData);
				verifyAndNavigate(routeData, router);
			} catch (parseErr) {
				console.error("❌ Error parsing localStorage route data:", parseErr);

				// Navigate to fallback route
				router.push('/bus');

				// Reset navigation lock
				setTimeout(() => {
					isNavigating = false;
				}, 500);
			}
		} else {
			console.log("⚠️ No route found in localStorage");

			// Navigate to fallback route
			router.push('/bus');

			// Reset navigation lock
			setTimeout(() => {
				isNavigating = false;
			}, 500);
		}
	} catch (err) {
		console.error("❌ Error accessing localStorage route:", err);
		console.error("localStorage error stack trace:", new Error().stack);

		// Navigate to fallback route
		router.push('/bus');

		// Reset navigation lock
		setTimeout(() => {
			isNavigating = false;
		}, 500);
	}
}

// Helper function to safely navigate, releasing the lock appropriately
function safeNavigate(path: string, router: any): void {
	try {
		console.log(`🔄 Safe navigating to: ${path}`);

		// Actually navigate for all routes including /bus
		router.push(path);
	} catch (err) {
		console.error("❌ Error during navigation:", err);
		console.error("Navigation stack trace:", new Error().stack);

		// Fallback using window.location for critical errors
		try {
			window.location.href = path;
		} catch (locErr) {
			console.error("❌ Even window.location navigation failed:", locErr);
		}
	} finally {
		// Reset the navigation lock after a short delay to allow the router to work
		setTimeout(() => {
			console.log("🔄 Resetting navigation lock after navigation");
			isNavigating = false;
		}, 500);
	}
}

// Helper function to verify route data and navigate
function verifyAndNavigate(routeData: SecureRoute, router: any): void {
	try {
		// Verify the data has all required fields
		if (!routeData || !routeData.path || !routeData.timestamp || !routeData.signature) {
			console.error("⚠️ Invalid route data, missing fields:", routeData);
			// Navigate to fallback route
			router.push('/bus');
			return;
		}

		// Verify the timestamp is recent (within 24 hours)
		const isRecent = (Date.now() - routeData.timestamp) < 24 * 60 * 60 * 1000;
		if (!isRecent) {
			console.error("⚠️ Route data expired (older than 24 hours)");
			// Navigate to fallback route
			router.push('/');
			return;
		}

		// Verify the signature
		const expectedSignature = RouteUtils.generateSignature(routeData.path, routeData.timestamp);
		const isValid = expectedSignature === routeData.signature;
		if (!isValid) {
			console.error("⚠️ Invalid route signature");
			// Navigate to fallback route
			router.push('/bus');
			return;
		}

		// Show details of route info before navigating
		console.log("📋 Full route data:", {
			path: routeData.path,
			timestamp: routeData.timestamp,
			timestamp_date: new Date(routeData.timestamp).toLocaleString(),
			age_in_hours: (Date.now() - routeData.timestamp) / (1000 * 60 * 60),
			signature: routeData.signature,
			expected_signature: expectedSignature
		});

		// All checks passed - ACTUALLY NAVIGATE to the verified route
		console.log("✅ Navigating to verified route:", routeData.path);
		safeNavigate(routeData.path, router);
	} catch (err) {
		console.error("❌ Error in route verification:", err);
		console.error("Verification stack trace:", new Error().stack);

		// Navigate to fallback route on error
		router.push('/bus');

		// Reset navigation lock
		setTimeout(() => {
			isNavigating = false;
		}, 500);
	}
}