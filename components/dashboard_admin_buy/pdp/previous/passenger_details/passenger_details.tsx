import { useRef, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle, use } from 'react';

import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AdditionalContactInfo } from '../additional_contact_info/additional_contact_info';
import { PassengerForm, toPersianDigits } from '@/components/dashboard_admin_buy/pdp/previous/passenger_form/passenger_form';
import { useTicketStore } from '@/store/TicketStore';
import { UserIcon } from 'lucide-react';
import { z } from 'zod';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js'
import { useDialogStore } from "@/store/DialogStore";
import { EnhancedPreviousPassengersDialog } from '../passenger_dialog/passenger_dialog';
import { usePassengerStore, StoredPassenger } from '@/store/PassengerStore';
import { useUserStore } from '@/store/UserStore';

// Create interface for previous passengers - FIXED: Use integer gender
interface PreviousPassenger {
	id: number | string;
	fName: string;
	lName: string;
	nationalCode: string;
	gender: 'Male' | 'Female'; // Updated to match dialog interface
	dateOfBirth?: string;
}

// API response passenger interface - FIXED: Handle API response properly
interface ApiPassenger {
	id: number;
	firstName: string;
	lastName: string;
	nationalCode: string;
	gender: boolean; // API returns boolean, we'll convert to number
	dateOfBirth: string;
}

// Helper function to format date from YYYYMMDD to YYYY-MM-DD for API
const formatDateForApi = (yyyymmdd: string): string | undefined => {
	if (!yyyymmdd || yyyymmdd.length !== 8) return undefined;

	try {
		const year = yyyymmdd.substring(0, 4);
		const month = yyyymmdd.substring(4, 6);
		const day = yyyymmdd.substring(6, 8);

		// Return in YYYY-MM-DD format
		return yyyymmdd;
	} catch (e) {
		console.error("Error formatting date for API:", e, yyyymmdd);
		return undefined;
	}
};


// Helper function to convert any birth date format to YYYYMMDD for our form
const formatBirthDateForPassengerForm = (birthDate?: string | null): string => {
	if (!birthDate || birthDate === null) return '';

	// If already in YYYYMMDD format
	if (birthDate.length === 8 && !birthDate.includes('-')) {
		return birthDate;
	}

	// If in ISO format (YYYY-MM-DDTHH:mm:ss) or YYYY-MM-DD format
	if (birthDate.includes('-')) {
		try {
			// Extract just the date part (before 'T' if present)
			const datePart = birthDate.split('T')[0];
			const [year, month, day] = datePart.split('-');
			return `${year}${month}${day}`;
		} catch (e) {
			console.error("Error converting birth date:", e);
			return '';
		}
	}

	return '';
};

interface PassengerData {
	fName: string;
	lName: string;
	gender: string;
	nationalCode: string;
	address?: string;
	dateOfBirth: string;
	phoneNumber: string;
	email?: string;
	seatNo?: string;
	seatID: number;
	previousPassengerId?: number | string;
	validationErrors?: {
		fName?: string;
		lName?: string;
		nationalCode?: string;
		phoneNumber?: string;
		email?: string;
		address?: string;
		dateOfBirth?: string;
	};
	hasInvalidNationalCode?: boolean;
}

interface PassengerDetailsFormProps {
	seats: Array<{
		id: number;
		seatNo?: string | number;
		state: string;
	}>;
	onRemovePassenger: (seatId: number) => void;
	onSeatStateChange: (seatId: number, newState?: string) => void;
	onValidationChange?: (validationData: {
		isAnyPassengerValid: boolean;
		allPassengersValid: boolean;
	}) => void;
}

// Auth data interface
interface AuthData {
	token: string;
	refreshToken: string;
}

// Validation schemas
const emailSchema = z.string().trim()
	.refine(email => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), {
		message: "لطفا یک ایمیل معتبر وارد کنید"
	});

const phoneSchema = z.string().trim()
	.refine(phone => !phone || phone.length === 11, {
		message: "شماره موبایل باید ۱۱ رقم باشد"
	});

export const PassengerDetailsForm = forwardRef<
	{
		savePassengers: () => Promise<{ success: boolean; passengers: StoredPassenger[] }>;
		restorePassengerData: (passengers: StoredPassenger[]) => void;
	},
	PassengerDetailsFormProps
>(({
	seats,
	onRemovePassenger,
	onSeatStateChange,
	onValidationChange,
}, ref) => {
	const { setUser, updateUserField, user } = useUserStore();

	// Debug function to show current UserStore state
	const debugUserStore = () => {
		const currentUser = useUserStore.getState().user;
		return currentUser;
	};
	const captureRef = useRef<HTMLDivElement>(null);
	const [passengerMap, setPassengerMap] = useState<Record<number, PassengerData>>({});
	const [additionalEmail, setAdditionalEmail] = useState('');
	const [additionalPhone, setAdditionalPhone] = useState('');
	const [showAdditionalContact, setShowAdditionalContact] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [loginDialogOpen, setLoginDialogOpen] = useState(false);
	const [selectedPrevPassengers, setSelectedPrevPassengers] = useState<(number | string)[]>([]);
	const [previousPassengers, setPreviousPassengers] = useState<PreviousPassenger[]>([]);
	const [isLoadingPassengers, setIsLoadingPassengers] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [activeSeatId, setActiveSeatId] = useState<number | null>(null);
	const [assignedPassengerIds, setAssignedPassengerIds] = useState<(number | string)[]>([]);
	const [phoneNumberDialogOpen, setPhoneNumberDialogOpen] = useState(false);
	const [hasPhoneNumber, setHasPhoneNumber] = useState<boolean | null>(null);

	const directlyUpdateSeatGender = useTicketStore(state => state.directlyUpdateSeatGender);
	const { toast } = useToast();
	const router = useRouter();
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
	const setIsDialogOpen = useDialogStore((state) => state.setIsDialogOpen);
	const [isSavingPassengers, setIsSavingPassengers] = useState(false);
	const { addPassengers } = usePassengerStore();

	// Store the user info here so it's accessible throughout the component

	// Add ref for previous validation result to prevent unnecessary updates
	const prevValidationResultRef = useRef<{
		isAnyPassengerValid: boolean;
		allPassengersValid: boolean;
	}>({
		isAnyPassengerValid: false,
		allPassengersValid: false
	});

	// Filter to include only selected seats
	const selectedSeats = useMemo(() => seats.filter(
		(s) => s.state.includes("selected")
	), [seats]);

	// Initialize additional contact info from UserStore on component mount
	useEffect(() => {
		// Initialize additional contact info if available
		if (user?.additionalEmail) {
			setAdditionalEmail(user.additionalEmail);
		}
		if (user?.additionalPhone) {
			setAdditionalPhone(user.additionalPhone);
		}

		// Show additional contact section if user has additional contact info
		if (user?.additionalEmail || user?.additionalPhone) {
			setShowAdditionalContact(true);
		}
	}, [user?.additionalEmail, user?.additionalPhone]);

	// Additional effect to restore state when component remounts
	useEffect(() => {
		// Always check and restore additional contact info from UserStore when component mounts
		const currentUser = useUserStore.getState().user;

		if (currentUser?.additionalEmail && !additionalEmail) {
			setAdditionalEmail(currentUser.additionalEmail);
		}

		if (currentUser?.additionalPhone && !additionalPhone) {
			setAdditionalPhone(currentUser.additionalPhone);
		}

		// Auto-show section if we have data
		if ((currentUser?.additionalEmail || currentUser?.additionalPhone) && !showAdditionalContact) {
			setShowAdditionalContact(true);
		}
	}, []); // Only run on mount

	// Get user profile to retrieve user ID
	const getUserProfile = async (token: string, refreshToken: string): Promise<string | null> => {
		try {
			const profileResponse = await axios.get(
				'https://api.bilit4u.com/admin/api/v1/admin/profile',
				{
					headers: {
						'Authorization': `Bearer ${token}`,
						'x-refresh-token': refreshToken
					}
				}
			);
			// New admin API response structure
			const profileData = profileResponse.data;

			// Check if user has phone number (new API doesn't include phoneNumber)
			// Since the new API doesn't have phoneNumber, we'll set it to false
			setHasPhoneNumber(false);

			setUser({
				firstName: profileData.name,
				phoneNumber: '', // New API doesn't provide phoneNumber
				email: profileData.email,
				profileData: profileData
			});

			return "success";

		} catch (error) {
			return null;
		}
	};

	// FIXED: Initialize passenger data for each selected seat with correct gender handling
	useEffect(() => {
		const newMap: Record<number, PassengerData> = {};
		selectedSeats.forEach((s) => {
			const existing = passengerMap[s.id];
			// Convert seat state to string gender value
			const genderValue = s.state.includes("female") ? "Female" : "Male";
			if (existing) {
				newMap[s.id] = { ...existing, gender: genderValue, seatNo: s.seatNo?.toString() };
			} else {
				newMap[s.id] = {
					fName: "",
					lName: "",
					gender: genderValue,
					nationalCode: "",
					address: "",
					dateOfBirth: "",
					phoneNumber: "",
					email: "",
					seatNo: s.seatNo?.toString(),
					seatID: s.id,
					previousPassengerId: undefined,
					validationErrors: {},
					hasInvalidNationalCode: false
				};
			}
		});
		setPassengerMap(newMap);
	}, [seats, selectedSeats]);

	// Fetch user profile when session changes
	useEffect(() => {
		const fetchUserProfile = async () => {
			if (session?.access_token && session?.refresh_token) {
				await getUserProfile(
					session.access_token,
					session.refresh_token
				);
			}
		};

		fetchUserProfile();
	}, [session]);

	// Effect to track which previous passengers are used in forms
	useEffect(() => {
		const newAssignedIds: (number | string)[] = [];

		Object.values(passengerMap).forEach(passenger => {
			if (passenger.previousPassengerId) {
				newAssignedIds.push(passenger.previousPassengerId);
			}
		});

		setAssignedPassengerIds(newAssignedIds);
	}, [passengerMap]);

	// Validate additional contact info
	const validateAdditionalContact = useCallback(() => {
		if (!showAdditionalContact) return true;

		try {
			emailSchema.parse(additionalEmail);
			phoneSchema.parse(additionalPhone);
			return true;
		} catch (error) {
			return false;
		}
	}, [additionalEmail, additionalPhone, showAdditionalContact]);

	// Memoized validation function
	const validateForm = useCallback(() => {
		if (selectedSeats.length === 0) {
			return {
				isAnyPassengerValid: false,
				allPassengersValid: false
			};
		}

		const hasDuplicateNationalId = Object.values(passengerMap).some(
			passenger => passenger.hasInvalidNationalCode === true
		);

		if (hasDuplicateNationalId) {
			return {
				isAnyPassengerValid: true,
				allPassengersValid: false
			};
		}

		const isAnyPassengerValid = Object.values(passengerMap).some(passenger => (
			passenger.fName?.trim() !== '' &&
			passenger.lName?.trim() !== '' &&
			passenger.nationalCode?.length === 10
		));

		const allPassengersValid = Object.values(passengerMap).every(passenger => (
			passenger.fName?.trim() !== '' &&
			passenger.lName?.trim() !== '' &&
			passenger.nationalCode?.length === 10
		));

		const additionalContactValid = validateAdditionalContact();

		return {
			isAnyPassengerValid: isAnyPassengerValid && additionalContactValid,
			allPassengersValid: allPassengersValid && additionalContactValid
		};
	}, [passengerMap, selectedSeats, validateAdditionalContact]);

	// Effect to handle validation changes
	useEffect(() => {
		if (!onValidationChange) return;

		const validationResult = validateForm();
		const prevResult = prevValidationResultRef.current;
		if (
			prevResult.isAnyPassengerValid !== validationResult.isAnyPassengerValid ||
			prevResult.allPassengersValid !== validationResult.allPassengersValid
		) {
			prevValidationResultRef.current = validationResult;
			onValidationChange(validationResult);
		}
	}, [passengerMap, onValidationChange, validateForm]);

	// Update validation when additional contact info changes
	useEffect(() => {
		if (!onValidationChange) return;

		const validationResult = validateForm();
		const prevResult = prevValidationResultRef.current;
		if (
			prevResult.isAnyPassengerValid !== validationResult.isAnyPassengerValid ||
			prevResult.allPassengersValid !== validationResult.allPassengersValid
		) {
			prevValidationResultRef.current = validationResult;
			onValidationChange(validationResult);
		}
	}, [additionalEmail, additionalPhone, showAdditionalContact, onValidationChange, validateForm]);

	// Check auth status and fetch passengers
	const handlePreviousPassengersClick = async (seatId: number) => {
		setActiveSeatId(seatId);
		setSelectedPrevPassengers([]);


		if (session?.access_token && session?.refresh_token) {
			setIsLoadingPassengers(true);

			try {

				// Check if user is logged in using the admin profile API
				const response = await fetch('https://api.bilit4u.com/admin/api/v1/admin/profile', {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${session.access_token}`,
						'Content-Type': 'application/json'
					}
				});

				const profileData = await response.json();

				// Check if the API call was successful
				if (response.ok && profileData.success !== false) {
					// User is authenticated, fetch passengers from new API
					try {

						const passengersResponse = await fetch('https://api.bilit4u.com/admin/api/v1/admin/passengers', {
							method: 'GET',
							headers: {
								'Authorization': `Bearer ${session.access_token}`,
								'Content-Type': 'application/json'
							}
						});


						const passengersData = await passengersResponse.json();

						if (passengersResponse.ok && passengersData.success) {
							// Map the API response to the expected format
							const mappedPassengers = passengersData.passengers.map((passenger: any) => ({
								id: passenger.id,
								fName: passenger.fName,
								lName: passenger.lName,
								gender: passenger.gender === 'Male' ? 'male' : 'female',
								nationalCode: passenger.nationalCode,
								address: passenger.address,
								dateOfBirth: passenger.dateOfBirth,
								phoneNumber: passenger.phoneNumber,
								email: passenger.email,
								seatNo: passenger.seatNo,
								seatID: passenger.seatID,
								createdAt: passenger.createdAt,
								updatedAt: passenger.updatedAt
							}));

							// Set the passengers data and open dialog
							setPreviousPassengers(mappedPassengers);
							setDialogOpen(true);
						} else {
							// If passengers API fails, show error
							toast({
								title: "خطا در دریافت مسافران",
								description: "مشکلی در دریافت لیست مسافران قبلی رخ داد",
								variant: "destructive"
							});
						}
					} catch (passengersError) {
						console.error('Error fetching passengers:', passengersError);
						toast({
							title: "خطا در دریافت مسافران",
							description: "مشکلی در دریافت لیست مسافران قبلی رخ داد",
							variant: "destructive"
						});
					}
				} else {
					// User is not authenticated, show login dialog
					setLoginDialogOpen(true);
				}
			} catch (error) {
				console.error('Error checking authentication:', error);
				// If API call fails, show login dialog
				setLoginDialogOpen(true);
			}

			setIsLoadingPassengers(false);
		} else {
			setLoginDialogOpen(true);
		}
	};

	// FIXED: Fetch previous passengers with correct gender conversion
	const fetchPreviousPassengers = async (authData: AuthData) => {
		try {
			setIsLoadingPassengers(true);
			setErrorMessage(null);


			const response = await axios.get(
				'https://api.bilit4u.com/admin/api/v1/admin/passengers',
				{
					headers: {
						'Authorization': `Bearer ${authData.token}`,
						'Content-Type': 'application/json'
					}
				}
			);


			if (!response.data ||
				!response.data.success ||
				!response.data.passengers ||
				response.data.passengers.length === 0) {

				setPreviousPassengers([]);
				setErrorMessage("هیچ مسافری برای این کاربر وجود ندارد");
				return;
			}

			// Process passengers with correct gender conversion for admin API

			const passengers = response.data.passengers
				.filter((passenger: any) => passenger.id !== undefined && passenger.id !== null)
				.map((passenger: any, index: number) => {
					// Debug only if there's an issue with fName/lName
					if (!passenger.fName || !passenger.lName) {
					}

					return {
						id: passenger.id !== undefined ? passenger.id : `generated-${index}`,
						name: passenger.fName || '',
						family: passenger.lName || '',
						nationalId: passenger.nationalCode || '',
						// Convert string gender from admin API to integer (Male=male=2, Female=female=1)
						gender: passenger.gender === 'Male' ? 2 : 1,
						birthDate: formatBirthDateForPassengerForm(passenger.dateOfBirth)
					};
				});

			setPreviousPassengers(passengers);

		} catch (error) {
			console.error("Error fetching passengers:", error);
			setPreviousPassengers([]);

			if (error instanceof Error) {
				setErrorMessage(error.message);
			} else {
				setErrorMessage("هیچ مسافری برای این کاربر وجود ندارد");
			}

			if (axios.isAxiosError(error) && error.response?.status === 401) {
				toast({
					title: "خطا در احراز هویت",
					description: "لطفا دوباره وارد شوید",
					variant: "destructive"
				});

				setLoginDialogOpen(true);
				setDialogOpen(false);
			}
		} finally {
			setIsLoadingPassengers(false);
		}
	};

	// Handle passenger field changes
	const handleChange = (seatId: number, field: string, value: string) => {
		// Map old field names to new field names
		const fieldMapping: Record<string, string> = {
			'name': 'fName',
			'family': 'lName',
			'nationalId': 'nationalCode',
			'phone': 'dateOfBirth' // Form sends birth date as 'phone' field
		};

		const mappedField = fieldMapping[field] || field;

		if (mappedField === 'nationalCode' && value.length === 10) {
			const duplicateSeat = Object.entries(passengerMap).find(
				([id, passenger]) =>
					Number(id) !== seatId &&
					passenger.nationalCode === value
			);

			if (duplicateSeat) {
				setPassengerMap((prev) => ({
					...prev,
					[seatId]: {
						...prev[seatId],
						[mappedField]: value,
						validationErrors: {
							...(prev[seatId].validationErrors || {}),
							nationalCode: `این کد ملی قبلاً برای مسافر صندلی ${duplicateSeat[1].seatNo} استفاده شده است`
						},
						hasInvalidNationalCode: true
					}
				}));
				return;
			}

			if (passengerMap[seatId]?.validationErrors?.nationalCode?.includes('قبلاً برای مسافر')) {
				setPassengerMap((prev) => {
					const { validationErrors, ...passenger } = prev[seatId];
					const newValidationErrors = { ...validationErrors };
					delete newValidationErrors.nationalCode;

					return {
						...prev,
						[seatId]: {
							...passenger,
							[mappedField]: value,
							validationErrors: Object.keys(newValidationErrors).length > 0 ? newValidationErrors : undefined,
							hasInvalidNationalCode: false
						}
					};
				});
				return;
			}
		}

		setPassengerMap((prev) => ({
			...prev,
			[seatId]: {
				...prev[seatId],
				[mappedField]: value,
			},
		}));
	};

	// Handle passenger removal
	const handleRemovePassenger = (seatId: number) => {

		const passengerToRemove = passengerMap[seatId];

		if (passengerToRemove?.previousPassengerId) {
			setAssignedPassengerIds(prev =>
				prev.filter(id => id !== passengerToRemove.previousPassengerId)
			);
		}

		onSeatStateChange(seatId, "default");

		setPassengerMap((prev) => {
			const newMap = { ...prev };
			delete newMap[seatId];
			return newMap;
		});

		onRemovePassenger(seatId);
	};

	// Handle gender changes with string values
	const handleGenderChange = (seatId: number, gender: string) => {

		// Update passenger map
		setPassengerMap((prev) => ({
			...prev,
			[seatId]: {
				...prev[seatId],
				gender,
			},
		}));

		// Convert string gender to lowercase for seat state
		const genderString = gender.toLowerCase() as "male" | "female";
		directlyUpdateSeatGender(seatId, genderString);
	};

	// Toggle additional contact info section
	const handleCheckboxChange = (checked: boolean) => {
		setShowAdditionalContact(checked);
		// Don't clear the values when unchecking - keep them in UserStore for persistence
		// The values will remain available when the user checks the box again
	};

	// Handle validation change from AdditionalContactInfo component
	const handleAdditionalContactValidationChange = (isValid: boolean) => {
		const validationResult = validateForm();
		const prevResult = prevValidationResultRef.current;
		if (
			prevResult.isAnyPassengerValid !== validationResult.isAnyPassengerValid ||
			prevResult.allPassengersValid !== validationResult.allPassengersValid
		) {
			prevValidationResultRef.current = validationResult;
			if (onValidationChange) {
				onValidationChange(validationResult);
			}
		}
	};

	// Toggle selection of previous passengers
	const togglePrevPassengerSelect = (id: number | string, event?: React.MouseEvent) => {
		if (event) {
			event.stopPropagation();
		}

		setSelectedPrevPassengers(prev => {
			if (prev.includes(id)) {
				return [];
			} else {
				return [id];
			}
		});
	};

	// FIXED: Apply selected previous passenger with correct gender handling
	const applySelectedPassengers = () => {
		if (activeSeatId === null || selectedPrevPassengers.length === 0) {
			setDialogOpen(false);
			return;
		}

		const selectedPassengerId = selectedPrevPassengers[0];
		const selectedPassenger = previousPassengers.find(p => p.id === selectedPassengerId);

		if (!selectedPassenger) {
			setDialogOpen(false);
			return;
		}

		if (assignedPassengerIds.includes(selectedPassengerId)) {
			const seatWithPassenger = Object.entries(passengerMap).find(
				([_, passenger]) => passenger.previousPassengerId === selectedPassengerId
			);

			if (seatWithPassenger && Number(seatWithPassenger[0]) !== activeSeatId) {
				const confirmMove = window.confirm(
					`این مسافر قبلاً به صندلی ${seatWithPassenger[1].seatNo} اختصاص داده شده است. آیا می‌خواهید آن را به صندلی ${passengerMap[activeSeatId].seatNo} منتقل کنید؟`
				);

				if (!confirmMove) {
					setDialogOpen(false);
					return;
				}

				setPassengerMap(prev => ({
					...prev,
					[seatWithPassenger[0]]: {
						...prev[Number(seatWithPassenger[0])],
						fName: "",
						lName: "",
						gender: "Male",
						nationalCode: "",
						address: "",
						dateOfBirth: "",
						phoneNumber: "",
						email: "",
						seatNo: prev[Number(seatWithPassenger[0])].seatNo,
						seatID: Number(seatWithPassenger[0]),
						previousPassengerId: undefined,
						validationErrors: {},
						hasInvalidNationalCode: false
					}
				}));
			}
		}

		// Update passenger map with correct field names from dialog

		setPassengerMap(prev => ({
			...prev,
			[activeSeatId]: {
				...prev[activeSeatId],
				fName: selectedPassenger.fName,
				lName: selectedPassenger.lName,
				nationalCode: selectedPassenger.nationalCode,
				dateOfBirth: selectedPassenger.dateOfBirth || "",
				phoneNumber: "", // Admin API doesn't provide phoneNumber, so keep it empty
				gender: selectedPassenger.gender, // Already in correct format from dialog
				previousPassengerId: selectedPassenger.id
			}
		}));

		// Convert string gender to lowercase for seat update
		const genderString = selectedPassenger.gender.toLowerCase() as "male" | "female";
		directlyUpdateSeatGender(activeSeatId, genderString);

		setAssignedPassengerIds(prev => {
			const filtered = prev.filter(id => id !== selectedPassenger.id);
			return [...filtered, selectedPassenger.id];
		});

		toast({
			title: "مسافر انتخاب شد",
			description: `اطلاعات ${selectedPassenger.fName} ${selectedPassenger.lName} با موفقیت به صندلی ${passengerMap[activeSeatId].seatNo} اضافه شد`,
			variant: "default"
		});

		setDialogOpen(false);
		setSelectedPrevPassengers([]);
		setActiveSeatId(null);
	};

	// Redirect to login dialog
	const handleLoginRedirect = () => {
		setLoginDialogOpen(false);
		setIsDialogOpen(true);
	};

	const hasSelectedSeats = selectedSeats.length > 0;

	// Expose the savePassengers method
	useImperativeHandle(ref, () => ({
		savePassengers: async () => {

			if (isSavingPassengers) {
				return { success: false, passengers: [] };
			}

			if (session && hasPhoneNumber === false) {
				setPhoneNumberDialogOpen(true);
				return { success: false, passengers: [] };
			}

			const hasDuplicateNationalId = Object.values(passengerMap).some(
				passenger => passenger.hasInvalidNationalCode === true
			);

			if (hasDuplicateNationalId) {
				toast({
					title: "کد ملی تکراری",
					description: "لطفاً کد ملی تکراری را اصلاح کنید. هر مسافر باید کد ملی منحصر به فرد داشته باشد.",
					variant: "destructive"
				});
				return { success: false, passengers: [] };
			}

			const validation = validateForm();

			if (!validation.allPassengersValid) {
				toast({
					title: "اطلاعات ناقص",
					description: "لطفاً همه فیلدهای اجباری را پر کنید",
					variant: "destructive"
				});
				return { success: false, passengers: [] };
			}

			setIsSavingPassengers(true);

			try {
				const { user } = useUserStore.getState();
				const buyerInfo = user ? {
					firstName: user.firstName || "",
					lastName: user.lastName || "",
					phoneNumber: user.phoneNumber || "",
					email: user.email || "",
					additionalEmail: additionalEmail || user.email || "",
					additionalPhone: additionalPhone || user.phoneNumber || ""
				} : null;


				const newPassengers = [];
				const modifiedPrevPassengers = [];
				const storedPassengers: StoredPassenger[] = [];


				// Process passengers with correct field mapping
				for (const passenger of Object.values(passengerMap)) {
					const formattedBirthDate = formatDateForApi(passenger.dateOfBirth);

					const isFromPrevious = !!passenger.previousPassengerId;

					// Convert string gender to integer format for StoredPassenger
					const genderInt = passenger.gender === "Female" ? 1 : 2;
					const storedPassenger: StoredPassenger = {
						id: isFromPrevious ? passenger.previousPassengerId! : `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
						name: passenger.fName,
						family: passenger.lName,
						nationalId: passenger.nationalCode,
						gender: genderInt, // Convert string to integer format
						birthDate: passenger.dateOfBirth || '',
						isFromPreviousPassengers: isFromPrevious,
						hasBeenModified: false,
						seatId: passenger.seatID,
						seatNo: passenger.seatNo || 0
					};

					if (isFromPrevious) {
						const originalPassenger = previousPassengers.find(p => p.id === passenger.previousPassengerId);

						if (originalPassenger) {
							const isModified =
								passenger.fName !== originalPassenger.fName ||
								passenger.lName !== originalPassenger.lName ||
								passenger.nationalCode !== originalPassenger.nationalCode ||
								passenger.gender !== originalPassenger.gender ||
								passenger.dateOfBirth !== originalPassenger.dateOfBirth;

							if (isModified) {
								// Convert string gender to boolean for API
								modifiedPrevPassengers.push({
									id: passenger.previousPassengerId,
									fName: passenger.fName,
									lName: passenger.lName,
									nationalCode: passenger.nationalCode,
									gender: passenger.gender === "Male", // Convert: "Male"=true, "Female"=false
									dateOfBirth: formattedBirthDate,
									seatNo: passenger.seatNo?.toString() || '',
									seatId: passenger.seatID.toString() || ''
								});

								storedPassenger.hasBeenModified = true;
							}
						}
					} else {
						// Convert string gender to boolean for API
						newPassengers.push({
							FName: passenger.fName,
							LName: passenger.lName,
							NationalCode: passenger.nationalCode,
							Gender: passenger.gender === "Male", // Convert: "Male"=true, "Female"=false
							DateOfBirth: formattedBirthDate,
							seatNo: passenger.seatNo?.toString() || '',
							seatId: passenger.seatID.toString() || ''
						});
					}

					storedPassengers.push(storedPassenger);
				}


				// Handle API calls if authenticated
				if (session?.access_token && session?.refresh_token) {
					// Add new passengers
					if (newPassengers.length > 0) {
						try {
							const response = await axios.post(
								'https://api.bilit4u.com/admin/api/v1/admin/passengers/bulk',
								{
									Passengers: newPassengers
								},
								{
									headers: {
										'Authorization': `Bearer ${session.access_token}`,
										'Content-Type': 'application/json'
									}
								}
							);

							if (response.data?.passengers) {
								response.data.passengers.forEach((serverPassenger: any) => {
									const matchIndex = storedPassengers.findIndex(
										p => !p.isFromPreviousPassengers && p.nationalId === serverPassenger.nationalCode
									);

									if (matchIndex !== -1 && serverPassenger.id) {
										storedPassengers[matchIndex].id = serverPassenger.id;
										storedPassengers[matchIndex].isFromPreviousPassengers = true;
									}
								});
							}
						} catch (error) {
							console.error("Error adding new passengers:", error);
						}
					}

					// Update modified passengers
					if (modifiedPrevPassengers.length > 0) {
						try {
							for (const passenger of modifiedPrevPassengers) {
								await axios.put(
									'https://api.bilit4u.com/admin/api/v1/admin/passenger',
									{
										PassengerId: passenger.id,
										Passenger: passenger
									},
									{
										headers: {
											'Authorization': `Bearer ${session.access_token}`,
											'Content-Type': 'application/json'
										}
									}
								);
							}
						} catch (error) {
							console.error("Error updating previous passengers:", error);
						}
					}
				}

				addPassengers(storedPassengers);

				return {
					success: true,
					passengers: storedPassengers,
					buyerInfo: buyerInfo
				};

			} catch (error) {
				console.error("Error in passenger save process:", error);

				toast({
					title: "خطا در ذخیره اطلاعات",
					description: "مشکلی در ذخیره اطلاعات مسافران رخ داد. لطفا دوباره تلاش کنید",
					variant: "destructive"
				});

				return { success: false, passengers: [] };
			} finally {
				setIsSavingPassengers(false);
			}
		},

		// FIXED: Restore passenger data with correct gender handling
		restorePassengerData: (passengers: StoredPassenger[]) => {

			if (!passengers || passengers.length === 0) return;

			const newMap: Record<number, PassengerData> = {};

			passengers.forEach(passenger => {
				if (passenger.seatId) {
					// Convert integer gender to string value
					const genderValue = typeof passenger.gender === 'number'
						? (passenger.gender === 1 ? "Female" : "Male")
						: (passenger.gender === 'female' ? "Female" : "Male");

					newMap[passenger.seatId] = {
						fName: passenger.name,
						lName: passenger.family,
						gender: genderValue,
						nationalCode: passenger.nationalId,
						address: "",
						dateOfBirth: passenger.birthDate || "",
						phoneNumber: "",
						email: "",
						seatNo: passenger.seatNo?.toString() || passenger.seatId.toString(),
						seatID: passenger.seatId,
						previousPassengerId: passenger.isFromPreviousPassengers ? passenger.id : undefined,
						validationErrors: {},
						hasInvalidNationalCode: false
					};

					// Convert string gender to lowercase for seat state
					if (passenger.gender !== undefined) {
						const genderString = typeof passenger.gender === 'number'
							? (passenger.gender === 1 ? "female" : "male")
							: (passenger.gender === "Female" ? "female" : "male");
						directlyUpdateSeatGender(passenger.seatId, genderString);
					}
				}
			});

			setPassengerMap(newMap);

			const validationResult = validateForm();
			if (onValidationChange) {
				onValidationChange(validationResult);
			}

		}
	}));

	return (
		<div>
			{hasSelectedSeats && (
				<div
					className={`
            border-0 rounded-md p-0 mt-0 
            transition-all duration-300 ease-in-out
            ${hasSelectedSeats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
          `}
					ref={captureRef}
				>
					{/* Form Header */}
					<div className="flex flex-wrap items-center justify-between gap-3 mb-6">
						<div className="flex items-center gap-3">
							<span>
								<svg width="22" height="17" viewBox="0 0 22 17" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M20.2071 1.79289C20.5976 2.18342 20.5976 2.81658 20.2071 3.20711L8.20711 15.2071C7.81658 15.5976 7.18342 15.5976 6.79289 15.2071L1.79289 10.2071C1.40237 9.81658 1.40237 9.18342 1.79289 8.79289C2.18342 8.40237 2.81658 8.40237 3.20711 8.79289L7.5 13.0858L18.7929 1.79289C19.1834 1.40237 19.8166 1.40237 20.2071 1.79289Z" fill="#4B5259" />
								</svg>
							</span>
							<h3 className="text-[15px] sm:text-[16px] font-IranYekanRegular text-[#4B5259]">
								مشخصات مسافران
							</h3>
						</div>
					</div>

					{/* Passenger Forms with correct field mapping */}
					{Object.values(passengerMap).map((passenger, index) => {

						// Create a unique key that changes when passenger data changes
						const passengerDataHash = `${passenger.fName}-${passenger.lName}-${passenger.nationalCode}-${passenger.dateOfBirth}-${passenger.previousPassengerId}`;
						const uniqueKey = `${passenger.seatID}-${passengerDataHash}`;

						return (
							<div key={uniqueKey}>
								<PassengerForm
									key={`passenger-form-${passenger.seatID}-${passenger.previousPassengerId || 'new'}-${passenger.fName}-${passenger.lName}`}
									seatId={passenger.seatID}
									seatNo={passenger.seatNo}
									gender={passenger.gender === "Female" ? "female" : "male"} // Convert to lowercase for form
									fName={passenger.fName}
									lName={passenger.lName}
									nationalCode={passenger.nationalCode}
									phoneNumber={passenger.dateOfBirth} // Form expects birth date in YYYYMMDD format in phoneNumber field
									onRemove={handleRemovePassenger}
									onChange={handleChange}
									isLastPassenger={index + 1 === Object.values(passengerMap).length}
									onCheckboxChange={handleCheckboxChange}
									showAdditionalContact={showAdditionalContact}
									onGenderChange={(seatId: number, gender: "male" | "female") => {
										// Convert to proper case
										const genderProper = gender === "female" ? "Female" : "Male";
										handleGenderChange(seatId, genderProper);
									}}
									onPrevPassengerClick={() => handlePreviousPassengersClick(passenger.seatID)}
									validationErrors={passenger.validationErrors}
								/>
								{index + 1 < Object.values(passengerMap).length && (
									<div className="w-full bg-[#B9B9B9] h-[1px] my-4" />
								)}
							</div>
						);
					})}

					{/* Previous Passengers Dialog */}
					<EnhancedPreviousPassengersDialog
						isOpen={dialogOpen}
						onClose={(open) => {
							setDialogOpen(open);
							if (!open) {
								setSelectedPrevPassengers([]);
								setActiveSeatId(null);
							}
						}}
						onSelect={applySelectedPassengers}
						selectedPassengers={selectedPrevPassengers}
						toggleSelection={togglePrevPassengerSelect}
						activeSeatNumber={activeSeatId !== null ? toPersianDigits(passengerMap[activeSeatId]?.seatNo?.toString() || '') : null}
						assignedPassengerIds={assignedPassengerIds}
					/>

					{/* Login Dialog */}
					<Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
						<DialogContent className="max-w-md w-[90%] p-0 overflow-hidden focus:outline-none border-0">
							<div className="bg-gradient-to-r from-[#0D5990] to-[#1A74B4] text-white p-6 text-center relative">
								<UserIcon className="h-12 w-12 mx-auto mb-3 bg-white/20 p-2 rounded-full" />
								<DialogTitle className="text-[18px] font-IranYekanBold mb-2">
									ورود به حساب کاربری
								</DialogTitle>
								<p className="text-sm text-white/80 font-IranYekanLight">
									برای ادامه ی فرآیند و دسترسی به مسافران قبلی باید وارد حساب کاربری شوید
								</p>
							</div>

							<div className="p-6">
								<p className="text-gray-700 font-IranYekanRegular leading-relaxed mb-2" dir='rtl'>
									با ورود به حساب کاربری می‌توانید:
								</p>
								<div className="mb-6 text-center" dir='rtl'>
									<ul className="text-right text-sm text-gray-600 font-IranYekanLight space-y-2 mb-6">
										<li className="flex items-center gap-2 rtl">
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
												<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#E6F0F9" />
												<path d="M5.64 10.1599L3.84 8.35986L3.2 8.99986L5.64 11.4399L12.64 4.43986L12 3.79986L5.64 10.1599Z" fill="#0D5990" />
											</svg>
											<span>اطلاعات مسافران قبلی خود را مشاهده کنید</span>
										</li>
										<li className="flex items-center gap-2 rtl">
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
												<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#E6F0F9" />
												<path d="M5.64 10.1599L3.84 8.35986L3.2 8.99986L5.64 11.4399L12.64 4.43986L12 3.79986L5.64 10.1599Z" fill="#0D5990" />
											</svg>
											<span>از تکمیل مجدد فرم‌ها جلوگیری کنید</span>
										</li>
										<li className="flex items-center gap-2 rtl">
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
												<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#E6F0F9" />
												<path d="M5.64 10.1599L3.84 8.35986L3.2 8.99986L5.64 11.4399L12.64 4.43986L12 3.79986L5.64 10.1599Z" fill="#0D5990" />
											</svg>
											<span>سابقه سفرهای خود را مدیریت کنید</span>
										</li>
									</ul>
								</div>

								<div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
									<button
										className="order-2 sm:order-1 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 font-IranYekanRegular text-[14px] hover:bg-gray-50 transition-colors w-full sm:w-auto"
										onClick={() => setLoginDialogOpen(false)}
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

					{/* Phone Number Dialog */}
					<Dialog open={phoneNumberDialogOpen} onOpenChange={setPhoneNumberDialogOpen}>
						<DialogContent className="max-w-md w-[90%] p-0 overflow-hidden focus:outline-none border-0">
							<div className="bg-gradient-to-r from-[#0D5990] to-[#1A74B4] text-white p-6 text-center relative">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-12 w-12 mx-auto mb-3 bg-white/20 p-2 rounded-full"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
								</svg>
								<DialogTitle className="text-[18px] font-IranYekanBold mb-2">
									شماره تماس ثبت نشده است
								</DialogTitle>
								<p className="text-sm text-white/80 font-IranYekanLight">
									برای ادامه‌ی فرآیند، لطفا شماره تماس خود را در پروفایل ثبت کنید
								</p>
							</div>

							<div className="p-6">
								<p className="text-gray-700 font-IranYekanRegular leading-relaxed mb-2" dir='rtl'>
									با ثبت شماره تماس در حساب کاربری خود:
								</p>
								<div className="mb-6 text-center" dir='rtl'>
									<ul className="text-right text-sm text-gray-600 font-IranYekanLight space-y-2 mb-6">
										<li className="flex items-center gap-2 rtl">
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
												<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#E6F0F9" />
												<path d="M5.64 10.1599L3.84 8.35986L3.2 8.99986L5.64 11.4399L12.64 4.43986L12 3.79986L5.64 10.1599Z" fill="#0D5990" />
											</svg>
											<span>اطلاعات سفر و بلیط به شماره شما ارسال می‌شود</span>
										</li>
										<li className="flex items-center gap-2 rtl">
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
												<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#E6F0F9" />
												<path d="M5.64 10.1599L3.84 8.35986L3.2 8.99986L5.64 11.4399L12.64 4.43986L12 3.79986L5.64 10.1599Z" fill="#0D5990" />
											</svg>
											<span>در صورت تغییرات سفر از طریق پیامک مطلع می‌شوید</span>
										</li>
										<li className="flex items-center gap-2 rtl">
											<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
												<path d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="#E6F0F9" />
												<path d="M5.64 10.1599L3.84 8.35986L3.2 8.99986L5.64 11.4399L12.64 4.43986L12 3.79986L5.64 10.1599Z" fill="#0D5990" />
											</svg>
											<span>دسترسی به خدمات بهتر پشتیبانی فراهم می‌شود</span>
										</li>
									</ul>
								</div>

								<div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
									<button
										className="order-2 sm:order-1 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 font-IranYekanRegular text-[14px] hover:bg-gray-50 transition-colors w-full sm:w-auto"
										onClick={() => setPhoneNumberDialogOpen(false)}
									>
										بستن پنجره
									</button>
									<button
										className="order-1 sm:order-2 px-4 py-2.5 bg-[#0D5990] text-white rounded-md font-IranYekanRegular text-[14px] hover:bg-[#0A4A7A] transition-colors w-full sm:w-auto flex justify-center items-center gap-2"
										onClick={() => {
											setPhoneNumberDialogOpen(false);
											router.push("/profile");
										}}
									>
										<span>ثبت شماره تماس</span>
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
										</svg>
									</button>
								</div>
							</div>
						</DialogContent>
					</Dialog>

					{/* Additional Contact Info */}
					{showAdditionalContact && Object.values(passengerMap).length > 0 && (
						<AdditionalContactInfo
							email={additionalEmail}
							phone={additionalPhone}
							onEmailChange={(email) => {
								setAdditionalEmail(email);
								updateUserField('additionalEmail', email);
								setTimeout(() => debugUserStore(), 100);
							}}
							onPhoneChange={(phone) => {
								setAdditionalPhone(phone);
								updateUserField('additionalPhone', phone);
								setTimeout(() => debugUserStore(), 100);
							}}
							onValidationChange={handleAdditionalContactValidationChange}
						/>
					)}
				</div>
			)}
		</div>
	);
});

PassengerDetailsForm.displayName = "PassengerDetailsForm";