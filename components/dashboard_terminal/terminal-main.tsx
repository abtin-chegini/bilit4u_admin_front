"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { TerminalSearch } from "./terminal-search"
import { TerminalList } from "./terminal-list"
import { AddTerminalDialog } from "./add-terminal-dialog"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { terminalService } from "@/services/terminalService"

interface Terminal {
	id: number
	name: string
	description: string
	address: string
	phone: string
	email: string
	webSite: string
	logo: string
	cityID: number
	countryID: number
	latitude: number
	longitude: number
	companyID?: number
	terminalID?: number
}

export function TerminalMain() {
	const { session, loading: authLoading } = useAuth()
	const { toast } = useToast()
	const [searchTerm, setSearchTerm] = useState("")
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [terminals, setTerminals] = useState<Terminal[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)

	const fetchTerminals = async () => {
		if (!session?.access_token) {
			setIsLoading(false)
			return
		}

		try {
			setIsLoading(true)
			setError(null)
			const apiTerminals = await terminalService.getTerminals(session.access_token)
			setTerminals(apiTerminals)
		} catch (err: any) {
			console.error("Error fetching terminals:", err)
			setError(err.message || "خطا در بارگذاری ترمینال‌ها")
			toast({
				title: "خطا",
				description: err.message || "خطا در بارگذاری ترمینال‌ها",
				variant: "destructive",
			})
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (session) {
			fetchTerminals()
		} else if (!session && !authLoading) {
			setIsLoading(false)
			setError("لطفاً ابتدا وارد حساب کاربری خود شوید")
		}
	}, [session, authLoading])

	const handleClearFilters = () => {
		setSearchTerm("")
		setCurrentPage(1)
	}

	useEffect(() => {
		setCurrentPage(1)
	}, [searchTerm])

	const handleOpenAddDialog = () => {
		setEditingTerminal(null)
		setIsAddDialogOpen(true)
	}

	const handleCloseAddDialog = () => {
		setIsAddDialogOpen(false)
		setEditingTerminal(null)
	}

	const handleEditTerminal = (terminal: Terminal) => {
		setEditingTerminal(terminal)
		setIsAddDialogOpen(true)
	}

	const handleAddTerminal = async (newTerminal: Omit<Terminal, "id">) => {
		if (!session?.access_token) {
			toast({
				title: "خطا",
				description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
				variant: "destructive",
			})
			throw new Error("Unauthorized")
		}

		try {
			const terminalPayload = {
				name: newTerminal.name,
				description: newTerminal.description || "",
				address: newTerminal.address || "",
				phone: newTerminal.phone || "",
				email: newTerminal.email || "",
				webSite: newTerminal.webSite || "",
				logo: newTerminal.logo || "",
				cityID: newTerminal.cityID ?? 1,
				countryID: newTerminal.countryID ?? 1,
				latitude: newTerminal.latitude ?? 0,
				longitude: newTerminal.longitude ?? 0,
				companyID: newTerminal.companyID,
				terminalID: newTerminal.terminalID,
			}

			await terminalService.addTerminal(session.access_token, terminalPayload)
			await fetchTerminals()

			toast({
				title: "موفق",
				description: "ترمینال با موفقیت افزوده شد",
				variant: "default",
			})
		} catch (err: any) {
			console.error("Error adding terminal:", err)
			toast({
				title: "خطا",
				description: err.message || "خطا در افزودن ترمینال",
				variant: "destructive",
			})
			throw err
		}
	}

	const handleUpdateTerminal = async (updatedTerminal: Terminal) => {
		if (!session?.access_token) {
			toast({
				title: "خطا",
				description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
				variant: "destructive",
			})
			return
		}

		try {
			const updatePayload = {
				id: updatedTerminal.id,
				name: updatedTerminal.name,
				description: updatedTerminal.description || "",
				address: updatedTerminal.address || "",
				phone: updatedTerminal.phone || "",
				email: updatedTerminal.email || "",
				webSite: updatedTerminal.webSite || "",
				logo: updatedTerminal.logo || "",
				cityID: updatedTerminal.cityID ?? 1,
				countryID: updatedTerminal.countryID ?? 1,
				latitude: updatedTerminal.latitude ?? 0,
				longitude: updatedTerminal.longitude ?? 0,
				companyID: updatedTerminal.companyID ?? updatedTerminal.id,
				terminalID: updatedTerminal.terminalID ?? updatedTerminal.id,
			}

			await terminalService.updateTerminal(session.access_token, updatePayload)
			await fetchTerminals()

			toast({
				title: "موفق",
				description: "اطلاعات ترمینال با موفقیت ویرایش شد",
				variant: "default",
			})
		} catch (err: any) {
			console.error("Error updating terminal:", err)
			toast({
				title: "خطا",
				description: err.message || "خطا در ویرایش اطلاعات ترمینال",
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
				<TerminalSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} onClearFilters={handleClearFilters} />

				{authLoading || isLoading ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990] mx-auto mb-4"></div>
							<p className="text-gray-600 font-IranYekanRegular">در حال بارگذاری ترمینال‌ها...</p>
						</div>
					</div>
				) : error ? (
					<div className="flex justify-center items-center py-12">
						<div className="text-center">
							<p className="text-red-600 font-IranYekanRegular mb-4">{error}</p>
							{session && (
								<button
									onClick={fetchTerminals}
									className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
								>
									تلاش مجدد
								</button>
							)}
						</div>
					</div>
				) : (
					<TerminalList
						terminals={terminals}
						searchTerm={searchTerm}
						onOpenAddDialog={handleOpenAddDialog}
						onEditTerminal={handleEditTerminal}
						currentPage={currentPage}
						itemsPerPage={itemsPerPage}
						onPageChange={setCurrentPage}
						onItemsPerPageChange={setItemsPerPage}
					/>
				)}

				<AddTerminalDialog
					isOpen={isAddDialogOpen}
					onClose={handleCloseAddDialog}
					onAddTerminal={handleAddTerminal}
					editTerminal={editingTerminal}
					onEditTerminal={handleUpdateTerminal}
				/>
			</motion.div>
		</div>
	)
}

