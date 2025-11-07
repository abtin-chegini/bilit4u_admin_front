"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { CompanySearch } from "./company-search"
import { CompanyList } from "./company-list"
import { AddCompanyDialog } from "./add-company-dialog"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { companyService } from "@/services/companyService"

interface Company {
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
}

export function CompanyMain() {
  const { session, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  // Fetch companies from API
  const fetchCompanies = async () => {
    if (!session?.access_token) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const apiCompanies = await companyService.getCompanies(session.access_token)
      setCompanies(apiCompanies)
    } catch (err: any) {
      console.error('Error fetching companies:', err)
      setError(err.message || 'خطا در بارگذاری شرکت‌ها')
      toast({
        title: "خطا",
        description: err.message || 'خطا در بارگذاری شرکت‌ها',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch companies on component mount and session change
  useEffect(() => {
    if (session) {
      fetchCompanies()
    } else if (!session && !authLoading) {
      setIsLoading(false)
      setError('لطفاً ابتدا وارد حساب کاربری خود شوید')
    }
  }, [session, authLoading])

  const handleClearFilters = () => {
    setSearchTerm("")
  }

  const handleOpenAddDialog = () => {
    setEditingCompany(null) // Clear any editing company
    setIsAddDialogOpen(true)
  }

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false)
    setEditingCompany(null) // Clear editing company when closing
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setIsAddDialogOpen(true)
  }

  const handleAddCompany = async (newCompany: Omit<Company, 'id'>) => {
    if (!session?.access_token) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
        variant: "destructive",
      })
      throw new Error('Unauthorized');
    }

    try {
      // Prepare the company payload
      const companyPayload = {
        name: newCompany.name,
        description: newCompany.description || '',
        address: newCompany.address || '',
        phone: newCompany.phone || '',
        email: newCompany.email || '',
        webSite: newCompany.webSite || '',
        logo: newCompany.logo || '',
        cityID: newCompany.cityID || 1,
        countryID: newCompany.countryID || 1,
        latitude: newCompany.latitude || 0,
        longitude: newCompany.longitude || 0
      }

      await companyService.addCompany(session.access_token, companyPayload)

      // Refresh list after successful add
      await fetchCompanies()

      toast({
        title: "موفق",
        description: "شرکت با موفقیت افزوده شد",
        variant: "default",
      })
    } catch (err: any) {
      console.error('Error adding company:', err)
      toast({
        title: "خطا",
        description: err.message || 'خطا در افزودن شرکت',
        variant: "destructive",
      })
      throw err
    }
  }

  const handleUpdateCompany = async (updatedCompany: Company) => {
    if (!session?.access_token) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
        variant: "destructive",
      })
      return
    }

    try {
      // Prepare the update payload
      const updatePayload = {
        name: updatedCompany.name,
        description: updatedCompany.description || '',
        address: updatedCompany.address || '',
        phone: updatedCompany.phone || '',
        email: updatedCompany.email || '',
        webSite: updatedCompany.webSite || '',
        logo: updatedCompany.logo || '',
        cityID: updatedCompany.cityID || 1,
        countryID: updatedCompany.countryID || 1,
        latitude: updatedCompany.latitude || 0,
        longitude: updatedCompany.longitude || 0
      }

      await companyService.updateCompany(session.access_token, updatedCompany.id, updatePayload)

      // Refresh list after successful update
      await fetchCompanies()

      toast({
        title: "موفق",
        description: "اطلاعات شرکت با موفقیت ویرایش شد",
        variant: "default",
      })
    } catch (err: any) {
      console.error('Error updating company:', err)
      toast({
        title: "خطا",
        description: err.message || "خطا در ویرایش اطلاعات شرکت",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCompany = async (companyId: number) => {
    if (!session?.access_token) {
      toast({
        title: "خطا",
        description: "لطفاً ابتدا وارد حساب کاربری خود شوید",
        variant: "destructive",
      })
      return
    }

    try {
      await companyService.deleteCompany(session.access_token, companyId)

      // Refresh list after successful deletion
      await fetchCompanies()

      toast({
        title: "موفق",
        description: "شرکت با موفقیت حذف شد",
        variant: "default",
      })
    } catch (err: any) {
      console.error('Error deleting company:', err)
      toast({
        title: "خطا",
        description: err.message || "خطا در حذف شرکت",
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
        <CompanySearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onClearFilters={handleClearFilters}
        />

        {/* List Component */}
        {authLoading || isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990] mx-auto mb-4"></div>
              <p className="text-gray-600 font-IranYekanRegular">
                در حال بارگذاری شرکت‌ها...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <p className="text-red-600 font-IranYekanRegular mb-4">{error}</p>
              {session && (
                <button
                  onClick={fetchCompanies}
                  className="bg-[#0D5990] text-white px-4 py-2 rounded-lg font-IranYekanMedium hover:bg-[#0b4d7a] transition-colors"
                >
                  تلاش مجدد
                </button>
              )}
            </div>
          </div>
        ) : (
          <CompanyList
            companies={companies}
            searchTerm={searchTerm}
            onOpenAddDialog={handleOpenAddDialog}
            onEditCompany={handleEditCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        )}

        {/* Add/Edit Company Dialog */}
        <AddCompanyDialog
          isOpen={isAddDialogOpen}
          onClose={handleCloseAddDialog}
          onAddCompany={handleAddCompany}
          editCompany={editingCompany}
          onEditCompany={handleUpdateCompany}
        />
      </motion.div>
    </div>
  )
}

