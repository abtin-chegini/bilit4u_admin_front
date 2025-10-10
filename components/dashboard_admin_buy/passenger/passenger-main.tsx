"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { PassengerSearch } from "./passenger-search"
import { PassengerList } from "./passenger-list"
import { AddPassengerDialog } from "./add-passenger-dialog"
import { motion } from "framer-motion"
import { passengerService } from "@/services/passengerService"
import { useToast } from "@/hooks/use-toast"
import { useUserStore } from "@/store/UserStore"

interface Passenger {
	id: number
	name: string
	family: string
	nationalId: string
	phone: string
	status: string
	gender: string
	dateOfBirth?: string
}



export function PassengerMain() {
	const { session, loading: authLoading } = useAuth()
	const { user: userProfile } = useUserStore()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState("")
	const [genderFilter, setGenderFilter] = useState("all")
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [passengers, setPassengers] = useState<Passenger[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null)

	// Extract userID from the profile data stored by AuthContext
	// The profileData contains the raw API response with userID
	const userID = userProfile?.profileData?.userID || userProfile?.profileData?.userId || null

	// Check if profile is ready for passenger operations
	const isProfileReady = Boolean(userID && typeof userID === 'number' && userID > 0)

	// Debug log to track profile loading
	useEffect(() => {
		if (userProfile) {
			console.log('👤 [PassengerMain] User profile loaded:', userProfile)
			console.log('👤 [PassengerMain] Extracted userID:', userID, 'Type:', typeof userID)
			console.log('👤 [PassengerMain] IsProfileReady:', isProfileReady)
		}
	}, [userProfile, userID, isProfileReady])

	const handleClearFilters = () => {
		setSearchTerm("")
		setGenderFilter("all")
	}

	const handleOpenAddDialog = () => {
		if (!isProfileReady) {
			toast({
				title: "خطا",
				description: "لطفاً صبر کنید تا اطلاعات پروفایل بارگذاری شود",
				variant: "destructive",
			})
			return
		}
		setEditingPassenger(null) // Clear any editing passenger
		setIsAddDialogOpen(true)
	}

	const handleCloseAddDialog = () => {
		setIsAddDialogOpen(false)
		setEditingPassenger(null) // Clear editing passenger when closing
	}

	const handleEditPassenger = (passenger: Passenger) => {
		if (!isProfileReady) {
			toast({
				title: "خطا",
				description: "لطفاً صبر کنید تا اطلاعات پروفایل بارگذاری شود",
				variant: "destructive",
			})
			return
		}
		setEditingPassenger(passenger)
		setIsAddDialogOpen(true)
	}

	// Fetch passengers from API
	const fetchPassengers = async () => {
		if (!session?.access_token) {
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)
			const apiPassengers = await passengerService.getPassengers(
				session.access_token
			)

			// Transform API response to match local Passenger interface
			const transformedPassengers: Passenger[] = apiPassengers.map((passenger, index) => ({
				id: passenger.id || (index + 1000), // Use API id if available, otherwise create unique fallback ID
				name: passenger.fName || '',
				family: passenger.lName || '',
				nationalId: passenger.nationalCode || '',
				phone: passenger.phoneNumber || '',
				status: 'حاضر',
				gender: passenger.gender ? 'مرد' : 'زن', // true = male, false = female
				dateOfBirth: passenger.dateOfBirth || ''
			}))

			setPassengers(transformedPassengers)
		} catch (err: any) {
			console.error('Error fetching passengers:', err)
			setError(err.message || 'خطا در بارگذاری مسافران')
			toast({
				title: "خطا",
				description: err.message || 'خطا در بارگذاری مسافران',
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch passengers on component mount and session change
	useEffect(() => {
		if (session) {
			fetchPassengers()
		} else if (!session && !authLoading) {
			setIsLoading(false)
			setError('لطفاً ابتدا وارد حساب کاربری خود شوید')
		}
	}, [session, authLoading])

	const handleAddPassenger = async (newPassenger: Omit<Passenger, 'id'>) => {
		if (!session?.access_token || !session?.refresh_token || !userID) {
			toast({
				title: "خطا",
				description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
				variant: "destructive",
			})
			throw new Error('Unauthorized');
		}

		// Additional validation to ensure userID is a valid number
		if (typeof userID !== 'number' || userID <= 0) {
			toast({
				title: "خطا",
				description: "شناسه کاربر نامعتبر است. لطفاً مجدداً وارد شوید",
				variant: "destructive",
			})
			throw new Error('Invalid userID');
		}

		try {
			// Prepare the passenger payload
			const passengerPayload = {
				userID: userID,
				fName: newPassenger.name,
				lName: newPassenger.family,
				gender: newPassenger.gender === 'مرد',
				nationalCode: newPassenger.nationalId,
				address: '',
				dateOfBirth: newPassenger.dateOfBirth || '',
				phoneNumber: newPassenger.phone,
				email: '',
				seatNo: '',
				seatID: ''
			}

			// Debug: Log the passenger payload being sent
			console.log('=== PassengerMain - AddPassenger ===')
			console.log('Profile userID:', userID, 'Type:', typeof userID)
			console.log('New passenger data:', newPassenger)
			console.log('Prepared payload:', JSON.stringify(passengerPayload, null, 2))
			console.log('====================================')

			await passengerService.addPassenger(
				session.access_token,
				session.refresh_token,
				passengerPayload
			)

			// Refresh list after successful add
			await fetchPassengers()

			toast({
				title: "موفق",
				description: "مسافر با موفقیت افزوده شد",
				variant: "default",
			})
		} catch (err: any) {
			console.error('Error adding passenger:', err)
			toast({
				title: "خطا",
				description: err.message || 'خطا در افزودن مسافر',
				variant: "destructive",
			})
			throw err
		}
	}

	const handleUpdatePassenger = async (updatedPassenger: Passenger) => {
		if (!session?.access_token || !session?.refresh_token || !userID) {
			toast({
				title: "خطا",
				description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
				variant: "destructive",
			})
			return
		}

		// Additional validation to ensure userID is a valid number
		if (typeof userID !== 'number' || userID <= 0) {
			toast({
				title: "خطا",
				description: "شناسه کاربر نامعتبر است. لطفاً مجدداً وارد شوید",
				variant: "destructive",
			})
			return
		}

		if (!updatedPassenger.id) {
			toast({
				title: "خطا",
				description: "شناسه مسافر یافت نشد",
				variant: "destructive",
			})
			return
		}

		// Check if this is a real API ID or a fallback ID
		if (updatedPassenger.id >= 1000) {
			toast({
				title: "خطا",
				description: "نمی‌توان مسافر بدون شناسه معتبر را ویرایش کرد",
				variant: "destructive",
			})
			return
		}

		try {
			// Prepare the update payload
			const updatePayload = {
				id: updatedPassenger.id, // Use lowercase id to match interface
				userID: userID,
				fName: updatedPassenger.name,
				lName: updatedPassenger.family,
				gender: updatedPassenger.gender === 'مرد', // Convert back to boolean
				nationalCode: updatedPassenger.nationalId,
				dateOfBirth: updatedPassenger.dateOfBirth || '',
				phoneNumber: updatedPassenger.phone,
				address: "", // Default empty for now
				email: "" // Default empty for now
			}

			// Debug: Log the update payload being sent
			console.log('=== PassengerMain - UpdatePassenger ===')
			console.log('Profile userID:', userID, 'Type:', typeof userID)
			console.log('Updated passenger data:', updatedPassenger)
			console.log('Prepared update payload:', JSON.stringify(updatePayload, null, 2))
			console.log('========================================')

			// Call the update API
			await passengerService.updatePassenger(
				session.access_token,
				session.refresh_token,
				updatedPassenger.id.toString(),
				updatePayload
			)

			// Update local state only after successful API call
			setPassengers(passengers.map(p =>
				p.id === updatedPassenger.id ? updatedPassenger : p
			))

			toast({
				title: "موفق",
				description: "اطلاعات مسافر با موفقیت ویرایش شد",
				variant: "default",
			})
		} catch (err: any) {
			console.error('Error updating passenger:', err)
			toast({
				title: "خطا",
				description: err.message || "خطا در ویرایش اطلاعات مسافر",
				variant: "destructive",
			})
		}
	}

	const handleDeletePassenger = async (passengerId: number) => {
		if (!session?.access_token || !session?.refresh_token || !userID) {
			toast({
				title: "خطا",
				description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
				variant: "destructive",
			})
			return
		}

		// Additional validation to ensure userID is a valid number
		if (typeof userID !== 'number' || userID <= 0) {
			toast({
				title: "خطا",
				description: "شناسه کاربر نامعتبر است. لطفاً مجدداً وارد شوید",
				variant: "destructive",
			})
			return
		}

		// Check if this is a real API ID or a fallback ID
		if (passengerId >= 1000) {
			toast({
				title: "خطا",
				description: "نمی‌توان مسافر بدون شناسه معتبر را حذف کرد",
				variant: "destructive",
			})
			return
		}

		try {
			// Call the delete API
			await passengerService.deletePassenger(
				session.access_token,
				session.refresh_token,
				passengerId.toString()
			)

			// Remove from local state after successful deletion
			setPassengers(passengers.filter(p => p.id !== passengerId))

			toast({
				title: "موفق",
				description: "مسافر با موفقیت حذف شد",
				variant: "default",
			})
		} catch (err: any) {
			console.error('Error deleting passenger:', err)
			toast({
				title: "خطا",
				description: err.message || "خطا در حذف مسافر",
				variant: "destructive",
			})
		}
	}

	return (
		<div className="min-h-screen bg-[#FAFAFA] p-6">
			<motion.div
				className="max-w-7xl mx-auto space-y-6"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			>
				{/* Search Component */}
				<PassengerSearch
					searchTerm={searchTerm}
					setSearchTerm={setSearchTerm}
					genderFilter={genderFilter}
					setGenderFilter={setGenderFilter}
					onClearFilters={handleClearFilters}
				/>

				{/* List Component */}
				{authLoading || isLoading ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990] mx-auto mb-4"></div>
							<p className="text-gray-600 font-IranYekanRegular">
								در حال بارگذاری مسافران...
							</p>
						</div>
					</div>
				) : !isProfileReady && session ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990] mx-auto mb-4"></div>
							<p className="text-gray-600 font-IranYekanRegular">در حال آماده‌سازی...</p>
						</div>
					</div>
				) : error ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<p className="text-red-600 font-IranYekanRegular mb-4">{error}</p>
							{session && (
								<button
									onClick={fetchPassengers}
									className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
								>
									تلاش مجدد
								</button>
							)}
						</div>
					</div>
				) : (
					<PassengerList
						passengers={passengers}
						searchTerm={searchTerm}
						genderFilter={genderFilter}
						onOpenAddDialog={handleOpenAddDialog}
						onEditPassenger={handleEditPassenger}
						onDeletePassenger={handleDeletePassenger}
						isProfileReady={isProfileReady}
					/>
				)}

				{/* Add/Edit Passenger Dialog */}
				<AddPassengerDialog
					isOpen={isAddDialogOpen}
					onClose={handleCloseAddDialog}
					onAddPassenger={handleAddPassenger}
					editPassenger={editingPassenger}
					onEditPassenger={handleUpdatePassenger}
				/>
			</motion.div>
		</div>
	)
}
