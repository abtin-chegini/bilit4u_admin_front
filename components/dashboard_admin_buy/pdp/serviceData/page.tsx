"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Steps from "@/components/site/steps";
import TicketLg from "@/components/PDP/TicketLg/TicketLg";
import TicketMd from "@/components/PDP/TicketMd/TicketMd";
import BusReservationWithFlow from "@/components/PDP/bus_reservation/BusReservationWithFlow";
import MainLayout from "@/components/layouts/Mainlayout";
import { getBusTicketData, ServiceDetails } from '@/app/actions/bus-ticket';
import { CountdownTimer } from "@/components/PDP/counter_timer/counter_timer";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RouteUtils } from "@/utils/RouteUtil";
import { useTicketStore } from "@/store/TicketStore";
import { usePassengerStore, StoredPassenger } from '@/store/PassengerStore';
import { useUserStore } from '@/store/UserStore';
import { stepStorageHelpers } from '@/utils/simpleStepStorage';
import { useToast } from "@/hooks/use-toast";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TicketIssuance from "@/components/PDP/Checkout/TicketIssuance";
import { useSession } from "next-auth/react";
import { useDialogStore } from '@/store/DialogStore';
import PaymentForm from "@/components/PDP/PaymentForm/PaymentForm";
import { captureAndUploadSeatLayout } from '@/utils/seatLayoutCapture';
import { deleteSeatLayoutImage } from '@/utils/deleteSeatLayout';
import { storeUploadData, getUploadData, clearUploadData, getStoredRequestToken } from '@/utils/sessionUtils';
import axios from 'axios';

export default function PassengerProfile() {
	const params = useParams();
	const router = useRouter();
	const token = params.token as string;
	const ticketid = params.ticketid as string;
	const clearSelectedSeats = useTicketStore(state => state.clearSelectedSeats);
	const selectedSeats = useTicketStore(state => state.selectedSeats);
	const setTicketInfo = useTicketStore(state => state.setTicketInfo);
	const { toast } = useToast();
	const { data: session, status } = useSession();

	// Get store functions
	const {
		addPassengers,
		clearPassengers,
		cleanupOldSessions
	} = usePassengerStore();


	// Get store data - fixed to avoid infinite loop
	const { passengers, currentSessionId } = usePassengerStore();

	// Use useMemo to properly cache filtered passengers
	const storedPassengers = useMemo(() => {
		const filtered = passengers.filter(p => p.sessionId === currentSessionId);
		console.log("Filtered passengers for current session:", {
			totalPassengers: passengers.length,
			currentSessionId,
			filteredCount: filtered.length,
			filteredPassengers: filtered
		});
		return filtered;
	}, [passengers, currentSessionId]);

	// Also memoize the mapped passengers for TicketIssuance to prevent re-renders
	const formattedPassengers = useMemo(() => {
		const mapped = storedPassengers.map(passenger => ({
			...passenger,
			seatId: passenger.seatId || 0,
			seatNo: passenger.seatNo || passenger.id // Ensure seatNo fallback
		}));
		console.log("Formatted passengers:", mapped);
		return mapped;
	}, [storedPassengers]);


	// User store for buyer information
	const { cleanupOldSessions: cleanupOldUserSessions } = useUserStore();

	// Step state - starts at 1 (seat selection) with انتخاب اتوبوس already passed
	const [activeStep, setActiveStep] = useState(1);

	// Timer state - now at the parent level to persist across steps
	const [remainingSeconds, setRemainingSeconds] = useState(900); // 15 minutes
	const [isTimerPaused, setIsTimerPaused] = useState(false);
	const [isTimerExpired, setIsTimerExpired] = useState(false);

	const [serviceData, setServiceData] = useState<ServiceDetails | null>(null);
	const [seatMap, setSeatMap] = useState<any>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// Store selected seats in step storage when they change
	useEffect(() => {
		// Only store seats if there are actual selections, avoid storing empty arrays during clearing
		if (selectedSeats && selectedSeats.length > 0) {
			const { currentSessionId: freshSessionId } = usePassengerStore.getState();
			stepStorageHelpers.storeSelectedSeats(selectedSeats, freshSessionId);
			console.log("Selected seats stored in step storage:", selectedSeats);
		}
	}, [selectedSeats]); // Remove currentSessionId to prevent loops

	const [error, setError] = useState<string | null>(null);
	const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
	const [isTimeoutDialogOpen, setIsTimeoutDialogOpen] = useState(false);
	const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
	const [isNoPassengerDialogOpen, setIsNoPassengerDialogOpen] = useState(false);
	const [isInactivityDialogOpen, setIsInactivityDialogOpen] = useState(false);
	const [isCapacityFullError, setIsCapacityFullError] = useState(false);
	const [isCapacityIssue, setIsCapacityIssue] = useState(false);
	const [isCapacityDialogOpen, setIsCapacityDialogOpen] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const hasExpiredRef = useRef(false);
	const isHandlingExpiration = useRef(false);
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const setIsDialogOpen = useDialogStore((state) => state.setIsDialogOpen);

	// Ref to the BusReservationWithFlow component
	const busReservationRef = useRef<{
		detailsFormRef: React.RefObject<{
			savePassengers: () => Promise<{ success: boolean; passengers: StoredPassenger[] }>;
			restorePassengerData?: (passengers: StoredPassenger[]) => void;
		}>;
		handleContinueClick: () => Promise<void>;
		passengerValidation?: any;
		savePassengerData?: () => Promise<any>;
		restorePassengerData?: (passengers: StoredPassenger[]) => void;
	}>(null);

	// State for submission process
	const [submissionState, setSubmissionState] = useState({
		isSubmitting: false,
		progress: 0
	});

	// State for passenger validation
	const [passengerValidation, setPassengerValidation] = useState({
		isAnyPassengerValid: false,
		allPassengersValid: false
	});

	// State to store the last saved passenger data for restoration
	const [lastSavedPassengers, setLastSavedPassengers] = useState<StoredPassenger[]>([]);

	// Initialize and manage the countdown timer at the parent level
	useEffect(() => {
		// Only start the timer if it's not expired and not paused
		if (!isTimerExpired && !isTimerPaused) {
			// Clear any existing interval
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
			}

			// Create new interval
			timerIntervalRef.current = setInterval(() => {
				setRemainingSeconds(prevTime => {
					if (prevTime <= 1) {
						// Timer expired
						clearInterval(timerIntervalRef.current!);
						setIsTimerExpired(true);
						handleTimeExpire();
						return 0;
					}
					return prevTime - 1;
				});
			}, 1000);
		}

		// Cleanup function
		return () => {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
			}
		};
	}, [isTimerPaused, isTimerExpired]);

	// Clean up old passenger data on component mount and when visibility changes
	useEffect(() => {
		// Clean up old sessions (older than 30 minutes)
		cleanupOldSessions();
		cleanupOldUserSessions();

		// Set up visibility change listener to clear data when user leaves the page
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				console.log("Page hidden - setting cleanup timeout");
				// Pause the timer when page is hidden
				setIsTimerPaused(true);

				// Set a timeout to clear data if user doesn't return soon
				const timeoutId = setTimeout(() => {
					// Only clear if page is still hidden
					if (document.visibilityState === 'hidden') {
						console.log("User didn't return - clearing passenger data");
						clearPassengers();
						clearSelectedSeats();
						// Set flag to show the inactivity dialog when user returns
						sessionStorage.setItem('showInactivityDialog', 'true');
					}
				}, 15 * 60 * 1000); // 15 minutes timeout

				// Store the timeout ID
				return () => clearTimeout(timeoutId);
			} else if (document.visibilityState === 'visible') {
				// Resume the timer when page becomes visible again
				setIsTimerPaused(false);
			}
		};

		// Add event listener with proper cleanup
		let cleanupHandler: (() => void) | undefined;
		const visibilityListener = () => {
			// Clean up previous timeout if exists
			if (cleanupHandler) {
				cleanupHandler();
				cleanupHandler = undefined;
			}

			// Setup new handler if needed
			if (document.visibilityState === 'hidden') {
				cleanupHandler = handleVisibilityChange();
			} else if (document.visibilityState === 'visible') {
				setIsTimerPaused(false);
			}
		};

		document.addEventListener('visibilitychange', visibilityListener);

		// Clean up
		return () => {
			document.removeEventListener('visibilitychange', visibilityListener);
			if (cleanupHandler) {
				cleanupHandler();
			}
		};
	}, [cleanupOldSessions, cleanupOldUserSessions, clearPassengers, clearSelectedSeats]);

	// Check for inactivity flag when component mounts or visibility changes
	useEffect(() => {
		// Check if we need to show the inactivity dialog
		if (sessionStorage.getItem('showInactivityDialog') === 'true') {
			setIsInactivityDialogOpen(true);
			sessionStorage.removeItem('showInactivityDialog');
		}

		// Also set up a listener for when the user returns to the page
		const handleVisibilityReturn = () => {
			if (document.visibilityState === 'visible' &&
				sessionStorage.getItem('showInactivityDialog') === 'true') {
				setIsInactivityDialogOpen(true);
				sessionStorage.removeItem('showInactivityDialog');
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityReturn);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityReturn);
		};
	}, []);

	// Function to update passenger validation
	const updatePassengerValidation = (validationData: {
		isAnyPassengerValid: boolean;
		allPassengersValid: boolean;
	}) => {
		setPassengerValidation(validationData);
	};

	// Function to redirect to previous search URL
	const redirectToPreviousSearch = () => {
		const previousSearchUrl = localStorage.getItem('previousSearchUrl') || '/bus';
		console.log('Redirecting to previous search URL:', previousSearchUrl);
		router.push(previousSearchUrl);
	};

	// Set ticket info and fetch data in a single effect to prevent conflicts
	useEffect(() => {
		async function fetchData() {
			if (!token || !ticketid) {
				setError('Missing required parameters: token or ticketid');
				setIsLoading(false);
				return;
			}

			// First, set ticket info and clear any previous seat selections
			console.log('Setting ticket info in store:', { token, ticketid });
			const { setTicketInfo: freshSetTicketInfo, clearSelectedSeats: freshClearSelectedSeats } = useTicketStore.getState();
			freshSetTicketInfo(ticketid, token);

			// Clear any previously selected seats to ensure fresh seat map initialization
			console.log('Clearing previous seat selections for fresh initialization');
			freshClearSelectedSeats();

			// Also clear any stored seat data from step storage to prevent restoration
			console.log('Clearing stored seat data from step storage');
			const { currentSessionId: freshSessionId } = usePassengerStore.getState();
			stepStorageHelpers.storeSelectedSeats([], freshSessionId).catch(error => {
				console.warn('Failed to clear step storage seats:', error);
			});

			// Verify the ticket info was set correctly
			const { ticketId: storedTicketId, token: storedToken } = useTicketStore.getState();
			console.log('Verification - stored ticket info:', { storedTicketId, storedToken });

			try {
				const result = await getBusTicketData(token, ticketid);

				if (result.success && result.serviceData) {
					console.log('Fetched service data:', result.serviceData);

					// Store the RequestToken in session for later use
					if (result.serviceData.RequestToken) {
						console.log('Stored RequestToken in session:', result.serviceData.RequestToken);
					}

					// Check if seatMap exists and has data
					if (!result.seatMap || typeof result.seatMap !== 'object') {
						console.log('No seat map data available - capacity may be full');
						setIsCapacityIssue(true);
						setIsCapacityDialogOpen(true);
						setServiceData(result.serviceData); // Still set the data to show ticket info

						// Store service data in step storage (non-blocking)
						stepStorageHelpers.storeServiceData(result.serviceData, currentSessionId).catch(error => {
							console.warn("Failed to store service data:", error);
						});
						console.log("Service data stored in step storage (no seat map):", result.serviceData);
					} else {
						// If we have seat data, check if any seats are available
						// This depends on how your seat map structure is organized
						// Adapt this check based on your actual data structure
						const hasAvailableSeats = checkForAvailableSeats(result.seatMap);

						if (!hasAvailableSeats) {
							console.log('No available seats - capacity is full');
							setIsCapacityIssue(true);
							setIsCapacityDialogOpen(true);
						}

						setServiceData(result.serviceData);
						setSeatMap(result.seatMap);

						// Store service data in step storage (non-blocking)
						stepStorageHelpers.storeServiceData(result.serviceData, currentSessionId).catch(error => {
							console.warn("Failed to store service data:", error);
						});
						console.log("Service data stored in step storage:", result.serviceData);
					}
				} else {
					// Check if the error is due to capacity issue (null values from API)
					if (!result.serviceData || !result.seatMap) {
						console.log('Bus capacity appears to be full - no seat data available');
						setError('ظرفیت تکمیل شده است');
						setIsCapacityFullError(true);

						// Set a timeout to redirect back to home
						redirectTimeoutRef.current = setTimeout(() => {
							redirectToPreviousSearch();
						}, 5000); // 5 seconds delay before redirecting
					} else {
						setError(result.error || 'Failed to fetch ticket data');
					}
				}
			} catch (err) {
				console.error('Error in fetchData:', err);

				// Check if error indicates empty/null response from API
				if (err instanceof Error &&
					(err.message.includes('null') ||
						err.message.includes('undefined') ||
						err.message.includes('empty'))) {
					setError('ظرفیت تکمیل شده است');
					setIsCapacityFullError(true);

					// Set a timeout to redirect back to home
					redirectTimeoutRef.current = setTimeout(() => {
						redirectToPreviousSearch();
					}, 5000); // 5 seconds delay before redirecting
				} else {
					setError(err instanceof Error ? err.message : 'An unknown error occurred');
				}
			} finally {
				setIsLoading(false);
			}
		}

		fetchData();

		// Cleanup function for the redirect timeout and uploaded image
		return () => {
			if (redirectTimeoutRef.current) {
				clearTimeout(redirectTimeoutRef.current);
			}

			// Cleanup uploaded image if it exists and component is unmounting
			const uploadData = getUploadData();
			const stateAssetId = currentAssetId;
			const assetIdToCleanup = uploadData.assetId || stateAssetId;
			const seatmapToken = uploadData.seatmapToken || '';

			if (assetIdToCleanup && seatmapToken) {
				console.log("Component unmounting, cleaning up uploaded image");
				const userToken = session?.user.accessToken || '';
				const refreshToken = session?.user.refreshToken || '';
				deleteSeatLayoutImage(assetIdToCleanup, userToken, refreshToken, seatmapToken).catch(error => {
					console.error("Error cleaning up uploaded image on unmount:", error);
				});
			}
		};
	}, [token, ticketid]); // Remove currentSessionId to prevent loops

	// Helper function to check for available seats based on your seat map structure
	function checkForAvailableSeats(seatMap: any): boolean {
		// This is a placeholder function - you need to implement this based on 
		// your actual seat map data structure

		// If seatMap is an array of seat objects
		if (Array.isArray(seatMap)) {
			return seatMap.some(seat => !seat.occupied);
		}

		// If seatMap is an object with sections or rows
		if (typeof seatMap === 'object') {
			// Check if it has a 'seats' property that's an array
			if (Array.isArray(seatMap.seats)) {
				return seatMap.seats.some((seat: { occupied: boolean }) => !seat.occupied);
			}

			// Check for rows property
			if (Array.isArray(seatMap.rows)) {
				return seatMap.rows.some((row: { seats: any[] }) =>
					Array.isArray(row.seats) && row.seats.some(seat => !seat.occupied)
				);
			}

			// If it's a more complex structure with sections
			if (seatMap.sections && Array.isArray(seatMap.sections)) {
				return seatMap.sections.some((section: { seats: any[] }) =>
					Array.isArray(section.seats) && section.seats.some(seat => !seat.occupied)
				);
			}
		}

		// If we can't determine available seats from the structure,
		// default to assuming some seats are available to avoid false positives
		console.warn('Could not determine seat availability from seatMap structure:', seatMap);
		return true;
	}

	// Handle cleanup of timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
			}
			if (redirectTimeoutRef.current) {
				clearTimeout(redirectTimeoutRef.current);
			}
		};
	}, []);

	// Restore passenger data when step changes back to 1
	useEffect(() => {
		if (activeStep === 1 && formattedPassengers.length > 0) {
			console.log("Step changed to 1, attempting to restore passenger data");
			setTimeout(() => {
				if (busReservationRef.current && typeof busReservationRef.current.restorePassengerData === 'function') {
					console.log("Restoring passenger data on step change:", formattedPassengers);
					busReservationRef.current.restorePassengerData(formattedPassengers);
				}
			}, 200);
		}
	}, [activeStep, formattedPassengers]);

	// Handle secure navigation back
	const handleSecureBack = () => {
		console.log("Attempting secure navigation back");
		console.log("Current router state:", router);
		RouteUtils.resetNavigationLock();
		RouteUtils.navigateToStoredRoute(router);
	};

	// Handle dialog close and navigation
	const handleDialogConfirm = () => {
		setIsTimeoutDialogOpen(false);
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		handleSecureBack();
	};

	// Handle inactivity dialog close
	const handleInactivityDialogClose = () => {
		setIsInactivityDialogOpen(false);
		// Navigate back to ticket selection
		handleSecureBack();
	};

	// Handle login redirect
	const handleLoginRedirect = () => {
		setIsLoginDialogOpen(false);
		// Redirect to login page
		// const setIsDialogOpen = useDialogStore((state) => state.setIsDialogOpen);
		setIsDialogOpen(true);
	};

	// Handle countdown timer expiration
	const handleTimeExpire = () => {
		if (isHandlingExpiration.current) {
			console.log("Already handling expiration");
			return;
		}

		isHandlingExpiration.current = true;
		console.log("Timer expired in parent component");

		clearSelectedSeats();
		setIsTimeoutDialogOpen(true);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			setIsTimeoutDialogOpen(false);
			handleSecureBack();

			setTimeout(() => {
				isHandlingExpiration.current = false;
			}, 1000);
		}, 10000);
	};

	// Helper function to get ticket parameters with fallback logic
	const getTicketParams = useCallback(() => {
		// First try to get from Zustand store
		const { ticketId: storedTicketId, token: storedToken } = useTicketStore.getState();
		if (storedTicketId && storedToken) {
			return { ticketId: storedTicketId, token: storedToken };
		}

		// If not in Zustand, try localStorage
		try {
			const storedData = localStorage.getItem('ticket-storage');
			if (storedData) {
				const parsedData = JSON.parse(storedData);
				const state = parsedData?.state;

				if (state && state.ticketId && state.token) {
					return { ticketId: state.ticketId, token: state.token };
				}
			}
		} catch (err) {
			console.error('Error reading from localStorage:', err);
		}

		// Try URL params
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const urlTicketId = urlParams.get('ticketid');
			const urlToken = urlParams.get('token');

			if (urlTicketId && urlToken) {
				return { ticketId: urlTicketId, token: urlToken };
			}

			// Try path segments
			const pathSegments = window.location.pathname.split('/');
			if (pathSegments.length >= 4 && pathSegments[1] === 'bus') {
				const pathToken = pathSegments[2];
				const pathTicketId = pathSegments[3];

				if (pathToken && pathTicketId) {
					return { ticketId: pathTicketId, token: pathToken };
				}
			}
		}

		return { ticketId: null, token: null };
	}, []);

	// Test function for duplicate validation API (for development/testing)
	// You can call this from browser console to test the API with current passengers
	// Example: window.testDuplicateValidation()
	const testDuplicateValidation = async () => {
		// Get current passengers from the store
		const { passengers, currentSessionId } = usePassengerStore.getState();
		const currentPassengers = passengers.filter(p => p.sessionId === currentSessionId);

		if (currentPassengers.length === 0) {
			console.log("🧪 No current passengers found to test with. Please add some passengers first.");
			return { success: false, error: "No passengers to test with" };
		}

		console.log("🧪 Testing duplicate validation API with current passengers:", currentPassengers);
		const result = await validatePassengerDuplicates(currentPassengers);
		console.log("🧪 Test result:", result);
		return result;
	};

	// Make test function available globally for testing
	if (typeof window !== 'undefined') {
		(window as any).testDuplicateValidation = testDuplicateValidation;
	}

	// Validate passenger duplicates using the API
	const validatePassengerDuplicates = async (passengers: any[]): Promise<{ success: boolean; error?: string }> => {
		try {
			console.log("🔍 Validating passenger duplicates with API...");
			console.log("Passengers to validate:", passengers);

			// Validate input
			if (!passengers || passengers.length === 0) {
				console.log("⚠️ No passengers to validate");
				return { success: true };
			}

			// Get current user information for the API
			const { user } = useUserStore.getState();
			const currentUserId = user?.userId || 1; // Use actual user ID or fallback to 1
			const userPhone = user?.phoneNumber || "";
			const userEmail = user?.email || "";

			console.log("Current user info:", { currentUserId, userPhone, userEmail });

			// Transform passengers to the API format using real data
			const apiPassengers = passengers.map((passenger, index) => ({
				userID: parseInt(currentUserId.toString()) || 1,
				fName: passenger.name || `مسافر ${index + 1}`,
				lName: passenger.family || "",
				gender: passenger.gender === 2, // Convert: 2=male=true, 1=female=false
				nationalCode: passenger.nationalId || "",
				address: "",
				dateOfBirth: passenger.birthDate || "13750629", // Use actual birth date or default
				phoneNumber: userPhone || "09122028679", // Use actual user phone or fallback
				email: userEmail || "abtin.chegini@gmail.com", // Use actual user email or fallback
				seatID: passenger.seatId?.toString() || (index + 1).toString(),
				seatNo: passenger.seatNo?.toString() || (index + 1).toString()
			}));

			console.log("API payload with real user data:", { Passengers: apiPassengers });
			console.log("📤 Sending to API:", {
				url: 'https://api.bilit4u.com/order/api/v1/passengers/validateDuplicates',
				passengerCount: apiPassengers.length,
				userID: currentUserId,
				userPhone: userPhone,
				userEmail: userEmail
			});

			// Call the duplicate validation API
			const response = await axios.post('https://api.bilit4u.com/order/api/v1/passengers/validateDuplicates', {
				Passengers: apiPassengers
			}, {
				timeout: 10000, // 10 second timeout
				headers: {
					'Content-Type': 'application/json'
				}
			});

			console.log("✅ Duplicate validation API response:", response.data);

			// Check if the API response indicates duplicates
			if (response.data && response.data.hasDuplicates) {
				return {
					success: false,
					error: response.data.message || "کد ملی تکراری در بین مسافران یافت شد"
				};
			}

			// Check for any other error indicators in the response
			if (response.data && response.data.error) {
				return {
					success: false,
					error: response.data.error
				};
			}

			return { success: true };
		} catch (error) {
			console.error("❌ Error calling duplicate validation API:", error);

			// If it's an axios error with response, try to extract error message
			if (axios.isAxiosError(error) && error.response) {
				const errorMessage = error.response.data?.message ||
					error.response.data?.error ||
					error.response.data?.detail ||
					"خطا در بررسی کدهای ملی";
				return {
					success: false,
					error: errorMessage
				};
			}

			// Handle timeout errors
			if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
				return {
					success: false,
					error: "زمان بررسی کدهای ملی به پایان رسید. لطفا دوباره تلاش کنید"
				};
			}

			// For network errors or other issues, return a generic error
			return {
				success: false,
				error: "مشکلی در بررسی کدهای ملی رخ داد. لطفا اتصال اینترنت خود را بررسی کنید"
			};
		}
	};

	// Handle continue button click - modified to handle conditional checks
	const handleSaveAndContinue = async () => {
		console.log("Save and Continue button clicked");

		// If capacity issue, show dialog and don't proceed
		if (isCapacityIssue) {
			console.log("Capacity issue detected, showing dialog");
			setIsCapacityDialogOpen(true);
			return;
		}

		// Check if user is logged in
		if (status !== "authenticated") {
			console.log("User not authenticated, showing login dialog");
			setIsLoginDialogOpen(true);
			return;
		}

		// Check if any seats selected
		if (selectedSeats.length === 0) {
			console.log("No seats selected, showing error dialog");
			setIsNoPassengerDialogOpen(true);
			return;
		}

		// Check if passenger data is valid
		if (!passengerValidation.isAnyPassengerValid) {
			console.log("No valid passenger data, showing error dialog");
			setIsNoPassengerDialogOpen(true);
			return;
		}

		// If already submitting, don't proceed
		if (submissionState.isSubmitting) {
			console.log("Already submitting, ignoring click");
			return;
		}

		setSubmissionState({ isSubmitting: true, progress: 10 });
		console.log("Starting submission with progress 10%");

		try {
			// Capture seat layout first
			setSubmissionState(prev => ({ isSubmitting: true, progress: 20 }));
			console.log("Capturing seat layout...");

			// Get the RequestToken from service data as seatmapToken
			const seatmapToken = serviceData?.RequestToken;
			console.log("SeatmapToken from service data:", seatmapToken);

			if (seatmapToken) {
				try {
					const userToken = session?.user.accessToken || '';
					const refreshToken = session?.user.refreshToken || '';

					console.log("About to call captureAndUploadSeatLayout with:", {
						seatmapToken,
						selectedSeatsCount: selectedSeats.length,
						userTokenLength: userToken.length,
						refreshTokenLength: refreshToken.length
					});

					const captureResult = await captureAndUploadSeatLayout(seatmapToken, selectedSeats, userToken, refreshToken);

					console.log("Capture result:", captureResult);

					if (captureResult.success) {
						console.log('Seat layout captured and uploaded successfully:', captureResult.imageUrl);
						console.log('Capture result assetId:', captureResult.assetId);
						console.log('Capture result seatmapToken:', captureResult.seatmapToken);

						// Store assetId, seatmapToken, and photoUrl together for deletion later
						if (captureResult.assetId && captureResult.seatmapToken) {
							console.log('Storing upload data:', {
								assetId: captureResult.assetId,
								seatmapToken: captureResult.seatmapToken,
								photoUrl: captureResult.photoUrl
							});
							storeUploadData(captureResult.assetId, captureResult.seatmapToken, captureResult.photoUrl || '');
							setCurrentAssetId(captureResult.assetId); // Also store in state as backup
						} else {
							console.warn('Missing assetId or seatmapToken in capture result:', captureResult);
						}
					} else {
						console.warn('Failed to capture seat layout:', captureResult.error);
					}
				} catch (captureError) {
					console.error('Error capturing seat layout:', captureError);
				}
			} else {
				console.warn('No seatmapToken found in service data');
			}

			// Use BusReservationWithFlow's savePassengers function through the detailsFormRef
			if (busReservationRef.current?.detailsFormRef?.current?.savePassengers) {
				setSubmissionState(prev => ({ isSubmitting: true, progress: 40 }));
				console.log("Submission progress 40% - Calling savePassengers");

				const result = await busReservationRef.current.detailsFormRef.current.savePassengers();

				if (result.success && result.passengers) {
					setSubmissionState(prev => ({ isSubmitting: true, progress: 70 }));
					console.log("Submission progress 70% - Successfully saved passenger data");
					console.log("Successfully saved passenger data:", result.passengers);

					// Store passengers in our session-aware store
					addPassengers(result.passengers);

					// Store passenger data in step storage
					await stepStorageHelpers.storePassengerData(result.passengers, currentSessionId);
					console.log("Passenger data stored in step storage:", result.passengers);

					// Store complete step 2 data
					await stepStorageHelpers.storeStep2Complete({
						passengers: result.passengers,
						selectedSeats: selectedSeats,
						serviceData: serviceData,
						seatMap: seatMap
					}, currentSessionId);

					// Call calculatePrice API when leaving bus reservation (going to review)
					console.log("💰 About to call calculatePrice API from parent...");
					try {
						const axiosResp = await axios.post('https://api.bilit4u.com/order/api/v1/tickets/calculatePrice', {
							Request: { TicketNo: ticketid, Token: token }
						});

						const responseData = axiosResp.data;
						console.log('✅ Price API response from parent:', responseData);

						// Store only quoteId in localStorage
						if (responseData?.quoteId) {
							localStorage.setItem('quoteId', responseData.quoteId);
							console.log('✅ QuoteId stored in localStorage from parent:', responseData.quoteId);
						} else {
							console.warn('⚠️ No quoteId found in response from parent');
						}
					} catch (e) {
						console.error('❌ Price calculate API error from parent:', e);
						// Don't fail the whole process if price calculation fails
					}
					console.log("Complete step 2 data stored in step storage");

					// Also store locally for restoration
					setLastSavedPassengers(result.passengers);
					console.log("Stored passengers locally for restoration:", result.passengers);

					setSubmissionState(prev => ({ isSubmitting: true, progress: 85 }));
					console.log("Submission progress 85% - Validating passenger duplicates");

					// Validate passenger duplicates before proceeding to step 2
					try {
						console.log("🔍 Starting duplicate validation for passengers:", result.passengers.length);
						const duplicateValidationResult = await validatePassengerDuplicates(result.passengers);

						if (!duplicateValidationResult.success) {
							console.log("❌ Duplicate validation failed:", duplicateValidationResult.error);
							toast({
								title: "کد ملی تکراری",
								description: duplicateValidationResult.error || "کد ملی تکراری در بین مسافران یافت شد. لطفاً کدهای ملی را بررسی کنید.",
								variant: "destructive"
							});
							setSubmissionState({ isSubmitting: false, progress: 0 });
							return;
						}

						console.log("✅ Duplicate validation passed - no duplicates found");
						setSubmissionState(prev => ({ isSubmitting: true, progress: 90 }));
						console.log("Submission progress 90% - Proceeding to next step");

						setTimeout(() => {
							goToNextStep();
							setSubmissionState({ isSubmitting: false, progress: 0 });
							console.log("Submission complete - Moving to next step");
						}, 500);
					} catch (duplicateError) {
						console.error("❌ Error validating duplicates:", duplicateError);
						toast({
							title: "خطا در بررسی کدهای ملی",
							description: "مشکلی در بررسی کدهای ملی رخ داد. لطفا دوباره تلاش کنید",
							variant: "destructive"
						});
						setSubmissionState({ isSubmitting: false, progress: 0 });
						return;
					}
				} else {
					throw new Error("Failed to save passenger data");
				}
			} else {
				// Something is wrong with the ref
				throw new Error("Cannot access BusReservationWithFlow methods");
			}
		} catch (error) {
			console.error("Error in save process:", error);
			toast({
				title: "خطا در ذخیره اطلاعات",
				description: "مشکلی در ذخیره اطلاعات مسافران رخ داد. لطفا دوباره تلاش کنید",
				variant: "destructive"
			});
			setSubmissionState({ isSubmitting: false, progress: 0 });
		}
	};

	// Navigate to the next step
	const goToNextStep = async () => {
		if (activeStep < 4) {  // Now we have 4 total steps (0-based index)
			// If moving from step 2 to step 3, DON'T clear the uploaded data since we need it for PDF generation
			if (activeStep === 2) {
				console.log("Moving from step 2 to step 3, keeping uploaded image and assetId for PDF generation");
				// Don't clear upload data - we need the assetId for the PDF
				// clearUploadData(); // REMOVED - this was clearing the assetId needed for PDF
				// setCurrentAssetId(null); // REMOVED - this was clearing the assetId needed for PDF
			}
			setActiveStep(activeStep + 1);
		}
	};

	// Navigate to the previous step
	const goToPreviousStep = async () => {
		console.log("iam here ");
		//  console.log("Current active step before going back:", activeStep);
		if (activeStep > 1) {
			// If coming back from step 2 to step 1 (ticket issuance to seat selection)
			if (activeStep === 2) {
				console.log("Going back from step 2 to step 1, will restore passenger data and delete uploaded image");

				// Delete the uploaded seat layout image if it exists
				console.log("About to get upload data...");
				const uploadData = getUploadData();
				const stateAssetId = currentAssetId;
				console.log("uploadData:", uploadData);
				console.log("stateAssetId:", stateAssetId);

				// Use localStorage data first, fallback to state
				const assetIdToDelete = uploadData.assetId || stateAssetId;
				const seatmapToken = uploadData.seatmapToken || '';
				console.log("AssetID to delete:", assetIdToDelete);
				console.log("SeatmapToken for deletion:", seatmapToken);

				if (assetIdToDelete && seatmapToken) {
					try {
						console.log("Deleting uploaded seat layout image with asset ID:", assetIdToDelete);

						const userToken = session?.user.accessToken || '';
						const refreshToken = session?.user.refreshToken || '';

						const deleteResult = await deleteSeatLayoutImage(assetIdToDelete, userToken, refreshToken, seatmapToken);

						if (deleteResult.success) {
							console.log("Successfully deleted uploaded seat layout image");
							clearUploadData(); // Clear the stored data
							setCurrentAssetId(null); // Clear from state too
						} else {
							console.warn("Failed to delete uploaded seat layout image:", deleteResult.error);
						}
					} catch (error) {
						console.error("Error deleting uploaded seat layout image:", error);
					}
				} else {
					console.log("No uploaded data found to delete:", { assetIdToDelete, seatmapToken });
				}

				// Restore passenger data immediately after step change
				// Use a longer timeout to ensure the component is fully rendered
				setTimeout(() => {
					if (busReservationRef.current && typeof busReservationRef.current.restorePassengerData === 'function') {
						console.log("Calling restorePassengerData with:", formattedPassengers);
						console.log("Number of passengers to restore:", formattedPassengers.length);
						console.log("Last saved passengers:", lastSavedPassengers);

						// Try multiple sources for passenger data
						let passengersToRestore = formattedPassengers;

						if (passengersToRestore.length === 0) {
							console.warn("No passengers in formattedPassengers, trying store...");
							const storePassengers = passengers.filter(p => p.sessionId === currentSessionId);
							if (storePassengers.length > 0) {
								passengersToRestore = storePassengers.map(passenger => ({
									...passenger,
									seatId: passenger.seatId || 0,
									seatNo: passenger.seatNo || passenger.id
								}));
								console.log("Using passengers from store:", storePassengers);
							} else {
								console.warn("No passengers in store, trying last saved passengers...");
								if (lastSavedPassengers.length > 0) {
									passengersToRestore = lastSavedPassengers.map(passenger => ({
										...passenger,
										seatId: passenger.seatId || 0,
										seatNo: passenger.seatNo || passenger.id
									}));
									console.log("Using last saved passengers:", lastSavedPassengers);
								} else {
									console.error("No passengers found in any source to restore");
									return;
								}
							}
						}

						// Restore the passenger data
						console.log("Restoring passenger data:", passengersToRestore);

						// Ensure passenger data has the correct format
						const formattedPassengersToRestore = passengersToRestore.map(passenger => ({
							...passenger,
							seatId: passenger.seatId || 0,
							seatNo: passenger.seatNo || passenger.id
						}));

						busReservationRef.current.restorePassengerData(formattedPassengersToRestore);
					} else {
						console.error("Cannot restore passenger data - method not available");
					}
				}, 100); // Increased timeout to ensure component is ready
			}

			// Update the active step
			setActiveStep(activeStep - 1);
		}
	};

	// Loading state
	if (isLoading) {
		return (
			<MainLayout>
				<div className="max-w-[1200px] mx-auto mt-6 p-8 text-center">
					<div className="animate-pulse flex flex-col items-center">
						<div className="h-10 w-64 bg-gray-200 rounded mb-4"></div>
						<div className="h-64 w-full bg-gray-200 rounded-md"></div>
						<p className="mt-4 text-gray-600 font-IranYekanRegular">در حال بارگذاری اطلاعات...</p>
					</div>
				</div>
			</MainLayout>
		);
	}

	// Error state with special handling for capacity error
	if (error) {
		return (
			<MainLayout>
				<div className="max-w-[1200px] mx-auto mt-6 p-8 text-center">
					{isCapacityFullError ? (
						<div className="border border-red-300 rounded-lg bg-red-50 p-6">
							<div className="flex flex-col items-center justify-center">
								<div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
									<svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
											d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
									</svg>
								</div>
								<h3 className="text-xl font-IranYekanBold text-red-700 mb-2">ظرفیت تکمیل شده است</h3>
								<p className="text-red-600 font-IranYekanRegular mb-6">
									متأسفانه صندلی‌های این اتوبوس پر شده است. در حال انتقال به صفحه جستجو...
								</p>
								<div className="relative h-1 w-64 bg-gray-200 rounded-full overflow-hidden mt-2">
									<div className="absolute inset-0 bg-red-500 animate-capacity-redirect"></div>
								</div>
							</div>
						</div>
					) : (
						<div className="border border-red-300 rounded-md bg-red-50 p-6">
							<h3 className="text-lg font-IranYekanBold text-red-700 mb-2">خطا در بارگذاری</h3>
							<p className="text-red-600 font-IranYekanRegular">{error}</p>
							<button
								className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-IranYekanRegular"
								onClick={() => window.location.reload()}
							>
								تلاش مجدد
							</button>
						</div>
					)}
				</div>
			</MainLayout>
		);
	}

	// Breadcrumb labels based on active step
	const getBreadcrumbLabel = () => {
		switch (activeStep) {
			case 1: return "انتخاب صندلی";
			case 2: return "تأیید اطلاعات";
			case 3: return "پرداخت";
			case 4: return "صدور بلیط";
			default: return "انتخاب صندلی";
		}
	};

	return (
		<MainLayout>
			{/* Capacity Issue Dialog */}
			<Dialog open={isCapacityDialogOpen} onOpenChange={setIsCapacityDialogOpen}>
				<DialogContent className="max-w-md w-[90%] p-0 overflow-hidden focus:outline-none border-0">
					{/* Header with warning icon */}
					<div className="bg-gradient-to-r from-[#FF5C5C] to-[#FF8A8A] text-white p-6 text-center relative">
						<div className="h-16 w-16 mx-auto mb-3 bg-white/20 p-3 rounded-full flex items-center justify-center">
							<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
						</div>
						<DialogTitle className="text-[20px] font-IranYekanBold mb-2">
							ظرفیت تکمیل شده است
						</DialogTitle>
						<p className="text-sm text-white/90 font-IranYekanLight">
							متأسفانه صندلی‌های این اتوبوس پر شده است
						</p>
					</div>

					{/* Content section */}
					<div className="p-6">
						<div className="mb-6 text-center">
							<p className="text-gray-600 font-IranYekanRegular mb-4">
								همه صندلی‌های این اتوبوس قبلاً رزرو شده‌اند. لطفاً به صفحه جستجو بازگردید و اتوبوس دیگری انتخاب کنید.
							</p>

							<div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
								<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<p className="text-sm text-gray-500 font-IranYekanLight text-right sm:text-right flex-1">
									این اتفاق معمولاً زمانی رخ می‌دهد که مسافران دیگر در حال خرید همین بلیط بوده‌اند و زودتر از شما آن را رزرو کرده‌اند.
								</p>
							</div>
						</div>

						{/* Action button */}
						<div className="flex justify-center">
							<button
								className="px-5 py-3 bg-[#0D5990] text-white rounded-md font-IranYekanRegular text-[14px] hover:bg-[#0A4A7A] transition-colors w-full"
								onClick={() => {
									setIsCapacityDialogOpen(false);
									redirectToPreviousSearch();
								}}
							>
								بازگشت به صفحه جستجو
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Inactivity Dialog */}
			<Dialog open={isInactivityDialogOpen} onOpenChange={setIsInactivityDialogOpen}>
				<DialogContent className="max-w-md w-[90%] p-0 overflow-hidden focus:outline-none border-0">
					{/* Header with clock icon */}
					<div className="bg-gradient-to-r from-[#FF5C5C] to-[#FF8A8A] text-white p-6 text-center relative">
						<div className="h-16 w-16 mx-auto mb-3 bg-white/20 p-3 rounded-full flex items-center justify-center">
							<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								<path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
						<DialogTitle className="text-[20px] font-IranYekanBold mb-2">
							زمان زیادی گذشته است
						</DialogTitle>
						<p className="text-sm text-white/90 font-IranYekanLight">
							به دلیل عدم فعالیت طولانی، صندلی‌های انتخابی شما پاک شده‌اند
						</p>
					</div>

					{/* Content section */}
					<div className="p-6">
						<div className="mb-6 text-center">
							<p className="text-gray-600 font-IranYekanRegular mb-4">
								برای ادامه فرایند خرید، لازم است دوباره صندلی‌های مورد نظر خود را انتخاب کنید.
							</p>

							<div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
								<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</div>
								<p className="text-sm text-gray-500 font-IranYekanLight text-right sm:text-right flex-1">
									صندلی‌های رزرو نشده پس از مدتی به صورت خودکار آزاد می‌شوند تا دیگر مسافران بتوانند از آن‌ها استفاده کنند.
								</p>
							</div>
						</div>

						{/* Action button */}
						<div className="flex justify-center">
							<button
								className="px-5 py-3 bg-[#0D5990] text-white rounded-md font-IranYekanRegular text-[14px] hover:bg-[#0A4A7A] transition-colors w-full"
								onClick={handleInactivityDialogClose}
							>
								متوجه شدم، بازگشت به صفحه انتخاب بلیط
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Timeout Dialog */}
			<Dialog
				open={isTimeoutDialogOpen}
				onOpenChange={(open) => {
					if (open === false) {
						setIsTimeoutDialogOpen(false);
						handleSecureBack();
					}
				}}
			>
				<DialogContent className="sm:max-w-[425px]" dir="rtl">
					<DialogHeader>
						<DialogTitle className="text-lg text-center font-IranYekanBold text-red-500">
							پایان زمان انتخاب صندلی
						</DialogTitle>
						<DialogDescription className="text-sm font-IranYekanRegular">
							زمان شما به پایان رسید و صندلی‌های انتخابی حذف شدند.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4">
						<Button
							onClick={handleDialogConfirm}
							className="bg-[#0D5990] hover:bg-[#0D4570] text-white w-full"
						>
							بازگشت به صفحه انتخاب بلیط
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Login Dialog */}
			<Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
				<DialogContent className="max-w-md w-[90%] p-0 overflow-hidden focus:outline-none border-0">
					{/* Banner header with gradient background */}
					<div className="bg-gradient-to-r from-[#0D5990] to-[#1A74B4] text-white p-6 text-center relative">
						<div className="h-12 w-12 mx-auto mb-3 bg-white/20 p-2 rounded-full flex items-center justify-center">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="white" />
								<path d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z" fill="white" />
							</svg>
						</div>
						<DialogTitle className="text-[18px] font-IranYekanBold mb-2">
							ورود به حساب کاربری
						</DialogTitle>
						<p className="text-sm text-white/80 font-IranYekanLight">
							برای ادامه فرایند، باید وارد حساب کاربری خود شوید
						</p>
					</div>

					{/* Content section */}
					<div className="p-6">
						<p className="text-gray-700 font-IranYekanRegular leading-relaxed mb-2" dir='rtl'>
							با ورود به حساب کاربری می‌توانید:
						</p>
						<div className="mb-6 text-right" dir='rtl'>
							<ul className="text-sm text-gray-600 font-IranYekanLight space-y-2 mb-6">
								<li className="flex items-center gap-2 rtl">
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
										<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#E6F0F9" />
										<path d="M5.64 10.1599L3.84 8.35986L3.2 8.99986L5.64 11.4399L12.64 4.43986L12 3.79986L5.64 10.1599Z" fill="#0D5990" />
									</svg>
									<span>ذخیره اطلاعات مسافران را انجام دهید</span>
								</li>
								<li className="flex items-center gap-2 rtl">
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
										<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#E6F0F9" />
										<path d="M5.64 10.1599L3.84 8.35986L3.2 8.99986L5.64 11.4399L12.64 4.43986L12 3.79986L5.64 10.1599Z" fill="#0D5990" />
									</svg>
									<span>سابقه سفرهای خود را مشاهده کنید</span>
								</li>
								<li className="flex items-center gap-2 rtl">
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
										<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#E6F0F9" />
										<path d="M5.64 10.1599L3.84 8.35986L3.2 8.99986L5.64 11.4399L12.64 4.43986L12 3.79986L5.64 10.1599Z" fill="#0D5990" />
									</svg>
									<span>بلیط خود را دریافت کنید</span>
								</li>
							</ul>
						</div>

						{/* Action buttons */}
						<div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
							<button
								className="order-2 sm:order-1 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 font-IranYekanRegular text-[14px] hover:bg-gray-50 transition-colors w-full sm:w-auto"
								onClick={() => setIsLoginDialogOpen(false)}
							>
								بستن پنجره
							</button>
							<button
								className="order-1 sm:order-2 px-4 py-2.5 bg-[#0D5990] text-white rounded-md font-IranYekanRegular text-[14px] hover:bg-[#0A4A7A] transition-colors w-full sm:w-auto flex justify-center items-center gap-2"
								onClick={handleLoginRedirect}
							>
								<span>ورود به حساب کاربری</span>
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 8.66667H6.66667V10.6667L3.33333 8.00001L6.66667 5.33334V7.33334H12V8.66667Z" fill="white" />
									<path d="M1.33333 12.6667V3.33334C1.33333 2.59334 1.92667 2.00001 2.66667 2.00001H8V3.33334H2.66667V12.6667H8V14H2.66667C1.92667 14 1.33333 13.4067 1.33333 12.6667Z" fill="white" />
								</svg>
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* No Passenger Dialog */}
			<Dialog open={isNoPassengerDialogOpen} onOpenChange={setIsNoPassengerDialogOpen}>
				<DialogContent className="sm:max-w-[425px]" dir="rtl">
					<DialogHeader className="text-center">
						<DialogTitle className="text-lg font-IranYekanBold text-red-500 text-center">
							اطلاعات مسافر ناقص
						</DialogTitle>
						<DialogDescription className="text-sm font-IranYekanRegular text-center mt-2">
							{selectedSeats.length === 0
								? "لطفا حداقل یک صندلی انتخاب کنید."
								: "شما باید حداقل اطلاعات یک مسافر را تکمیل نمایید."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4">
						<Button
							onClick={() => setIsNoPassengerDialogOpen(false)}
							className="bg-[#0D5990] hover:bg-[#0D4570] text-white w-full"
						>
							متوجه شدم
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="max-w-[1200px] mx-auto relative" dir="rtl">
				{/* Desktop Breadcrumb */}
				<div className="hidden sm:block absolute top-4 right-4 z-10">
					<Breadcrumb>
						<BreadcrumbList className="flex-wrap">
							<BreadcrumbItem>
								<BreadcrumbLink className="text-xs sm:text-sm font-IranYekanBold text-[#0D5990]">
									{getBreadcrumbLabel()}
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />

							{/* Show previous steps as clickable links if on a later step */}
							{activeStep >= 2 && (
								<>
									<BreadcrumbItem>
										<BreadcrumbLink
											onClick={goToPreviousStep}

											className="text-xs sm:text-sm font-IranYekanRegular text-gray-500 cursor-pointer hover:text-[#0D5990] transition-colors"
										>
											انتخاب صندلی
										</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator />
								</>
							)}

							<BreadcrumbItem>
								<BreadcrumbLink
									onClick={handleSecureBack}
									className="text-xs sm:text-sm font-IranYekanRegular text-gray-500 cursor-pointer hover:text-[#0D5990] transition-colors"
								>
									انتخاب بلیط
								</BreadcrumbLink>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				{/* Mobile Breadcrumb */}
				<div className="sm:hidden pt-3 px-2 pr-6">
					<div className="w-[468px] max-w-full flex justify-start">
						<Breadcrumb>
							<BreadcrumbList className="flex-wrap">
								<BreadcrumbItem>
									<BreadcrumbLink className="text-xs font-IranYekanBold text-[#0D5990]">
										{getBreadcrumbLabel()}
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />

								{/* Show previous steps as clickable links if on a later step */}
								{activeStep >= 2 && (
									<>
										<BreadcrumbItem>
											<BreadcrumbLink
												onClick={goToPreviousStep} // Use goToPreviousStep instead of setActiveStep(1)
												className="text-xs font-IranYekanRegular text-gray-500 cursor-pointer hover:text-[#0D5990] transition-colors"
											>
												انتخاب صندلی
											</BreadcrumbLink>
										</BreadcrumbItem>
										<BreadcrumbSeparator />
									</>
								)}

								<BreadcrumbItem>
									<BreadcrumbLink
										onClick={handleSecureBack}
										className="text-xs font-IranYekanRegular text-gray-500 cursor-pointer hover:text-[#0D5990] transition-colors"
									>
										انتخاب بلیط
									</BreadcrumbLink>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</div>
				{/* Content with responsive padding */}
				<div className="pt-2 sm:pt-10 px-2 sm:px-0">
					{/* Steps component */}
					<div className="flex justify-center w-full mb-5 sm:mb-8">
						<Steps active={activeStep} />
					</div>

					{/* Countdown timer - right aligned, cleaner design */}
					<div className="flex justify-start w-full mb-4">
						<div className="flex items-center gap-1.5 text-gray-600">
							<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							<span className="text-sm font-IranYekanRegular">زمان باقیمانده:</span>
							<CountdownTimer
								initialSeconds={remainingSeconds}
								currentSeconds={remainingSeconds}
								onExpire={handleTimeExpire}
								isPaused={isTimerPaused}
							/>
						</div>
					</div>

					{/* Step content */}
					<div className="flex justify-center sm:block mt-5">
						<div className="w-[468px] max-w-full sm:w-full">
							{/* Step 1: Bus Seat Selection (with passenger details included) */}
							{activeStep === 1 && (
								<div>
									{/* Capacity Warning Banner */}
									{isCapacityIssue && (
										<div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
											<div className="w-10 h-10 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center text-red-500">
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
												</svg>
											</div>
											<div>
												<h4 className="font-IranYekanBold text-red-700 text-sm mb-1">ظرفیت تکمیل شده است</h4>
												<p className="text-xs text-red-600 font-IranYekanRegular">
													متأسفانه صندلی‌های این اتوبوس قبلاً رزرو شده‌اند. لطفاً اتوبوس دیگری انتخاب کنید.
												</p>
												<button
													onClick={() => setIsCapacityDialogOpen(true)}
													className="text-xs text-red-800 bg-red-100 hover:bg-red-200 px-2 py-1 rounded mt-2 transition-colors"
												>
													بازگشت به جستجو
												</button>
											</div>
										</div>
									)}

									{/* Ticket section for step 1 */}
									<div className="mb-6">
										{serviceData && (
											<>
												{/* Desktop view */}
												<div className="hidden sm:block">
													<TicketLg ticketDetails={serviceData} />
												</div>
												{/* Mobile view */}
												<div className="block sm:hidden">
													<TicketMd
														ticketDetails={serviceData}
														busCapacity={44}
													/>
												</div>
											</>
										)}
									</div>

									{/* Bus Reservation Component - passing the ref and onValidationChange callback */}
									<BusReservationWithFlow
										ref={busReservationRef}
										onTimeExpire={handleTimeExpire}
										seatPriceServiceDetail={serviceData?.FullPrice}
										onValidationChange={updatePassengerValidation}
										hideContinueButton={true} // Hide the continue button in the component
									/>

									{/* Next button - Improved mobile responsive design */}
									<div className="flex justify-end mt-6">
										<Button
											onClick={handleSaveAndContinue}
											disabled={isCapacityIssue}
											className={`w-full sm:w-auto ${isCapacityIssue
												? "bg-gray-400 cursor-not-allowed"
												: "bg-[#0D5990] hover:bg-[#0D4570]"
												} text-white relative overflow-hidden px-3 py-2.5 sm:px-5 sm:py-3 text-[14px] font-IranYekanBold rounded-md min-h-[48px]`}
										>
											{submissionState.isSubmitting ? (
												<>
													{/* Progress bar background */}
													<div className="absolute inset-0 bg-[#0D5990] bg-opacity-70"></div>

													{/* Moving progress indicator */}
													<div
														className="absolute left-0 top-0 bottom-0 bg-[#0D5990] transition-all duration-300"
														style={{ width: `${submissionState.progress}%` }}
													></div>

													{/* Progress text */}
													<div className="relative z-10 flex items-center justify-center">
														<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
														</svg>
														<span className="text-[13px] sm:text-[14px]">در حال پردازش...</span>
													</div>
												</>
											) : (
												<div className="flex items-center justify-center">
													{isCapacityIssue ? (
														<>
															<svg className="ml-2 w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
															</svg>
															<span className="text-[13px] sm:text-[14px]">ظرفیت تکمیل شده است</span>
														</>
													) : (
														<>
															<span className="text-[13px] sm:text-[14px]">ذخیره اطلاعات و ادامه</span>
															<svg className="mr-2 w-4 h-4" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
																<path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
															</svg>
														</>
													)}
												</div>
											)}
										</Button>
									</div>
								</div>
							)}

							{/* Step 2: Ticket Issuance */}
							{activeStep === 2 && (
								<div>
									{serviceData && (
										<>
											<TicketIssuance
												passengers={formattedPassengers}
												ticketDetails={serviceData}
												onContinue={() => goToNextStep()}
											/>

											{/* Navigation buttons for second step */}
											<div className="flex flex-col-reverse sm:flex-row justify-between gap-3 sm:gap-4 mt-6">
												<Button
													variant="outline"
													onClick={goToPreviousStep}
													className="border-[#0D5990] text-[#0D5990] hover:bg-[#E6F0F9] transition-colors flex items-center justify-center whitespace-nowrap px-3 sm:px-4 py-2.5 text-[13px] sm:text-[14px]"
												>
													<svg className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
														<path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
													</svg>
													<span className="truncate">بازگشت به انتخاب صندلی</span>
												</Button>

												<Button
													onClick={goToNextStep}
													className="bg-[#0D5990] hover:bg-[#0D4570] text-white flex items-center justify-center whitespace-nowrap px-3 sm:px-4 py-2.5 text-[13px] sm:text-[14px]"
												>
													<span className="truncate">ادامه به مرحله پرداخت</span>
													<svg className="mr-1.5 sm:mr-2 w-3.5 h-3.5 sm:w-4 sm:h-4" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
														<path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
													</svg>
												</Button>
											</div>
										</>
									)}
								</div>
							)}

							{/* Step 3: Payment */}
							{activeStep === 3 && (
								<PaymentForm
									serviceData={serviceData}
									onComplete={goToNextStep}
									onBack={goToPreviousStep}
									token={token}
									ticketId={ticketid}
								/>
							)}

							{/* Step 4: Ticket Generation */}
							{activeStep === 4 && (
								<div className="text-center p-8 border border-gray-200 rounded-lg bg-white">
									<div className="flex justify-center mb-6">
										<svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
										</svg>
									</div>
									<h2 className="text-xl font-IranYekanBold mb-4">بلیط شما با موفقیت صادر شد</h2>
									<p className="text-gray-600 mb-6">می‌توانید بلیط خود را از طریق ایمیل و پیامک دریافت کنید.</p>
									<div className="flex flex-col sm:flex-row gap-4 justify-center">
										<Button variant="outline" className="border-[#0D5990] text-[#0D5990]">
											دانلود بلیط
										</Button>
										<Button
											className="bg-[#0D5990] hover:bg-[#0D4570] text-white"
											onClick={handleSecureBack}
										>
											بازگشت به صفحه اصلی
										</Button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}