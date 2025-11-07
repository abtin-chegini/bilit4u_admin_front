"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Plus, Building2 } from "lucide-react"
import { AddCompanyDialog } from "./add-company-dialog"
import { motion } from "framer-motion"

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

interface CompanyListProps {
  companies: Company[]
  searchTerm: string
  onOpenAddDialog: () => void
  onEditCompany: (company: Company) => void
  onDeleteCompany: (companyId: number) => void
}

export function CompanyList({ companies, searchTerm, onOpenAddDialog, onEditCompany, onDeleteCompany }: CompanyListProps) {
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

  // Handle delete confirmation
  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company)
  }

  const confirmDelete = () => {
    if (companyToDelete) {
      onDeleteCompany(companyToDelete.id)
      setCompanyToDelete(null)
    }
  }

  const cancelDelete = () => {
    setCompanyToDelete(null)
  }

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = searchTerm === '' ||
      company.name.includes(searchTerm) ||
      company.description.includes(searchTerm) ||
      company.id.toString().includes(searchTerm)

    return matchesSearch
  })

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-6">
            <motion.h2
              className="text-xl font-IranYekanBold text-[#323232] mb-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              لیست شرکت‌ها
            </motion.h2>

            <motion.div
              className="flex justify-end mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                onClick={onOpenAddDialog}
                className="w-full md:w-auto flex items-center justify-center gap-2 font-IranYekanMedium bg-gradient-to-r from-[#0D5990] to-[#1A74B4] hover:from-[#0b4d7a] hover:to-[#155a8a] text-white"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">افزودن شرکت جدید</span>
                <span className="sm:hidden">افزودن شرکت</span>
              </Button>
            </motion.div>
          </div>

          {/* Data Grid */}
          <motion.div
            className="overflow-x-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="min-w-full">
              {/* Table Header */}
              <motion.div
                className="grid grid-cols-4 md:grid-cols-5 gap-4 p-4 bg-[#e6f0fa] rounded-t-lg text-sm font-IranYekanMedium text-[#323232]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="text-center">لوگو</div>
                <div className="text-center">نام</div>
                <div className="text-center hidden md:block">توضیحات</div>
                <div className="text-center hidden md:block">شناسه</div>
                <div className="text-center">عملیات</div>
              </motion.div>

              {/* Table Body */}
              <div className="space-y-1">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      className={`grid grid-cols-4 md:grid-cols-5 gap-4 p-4 text-sm font-IranYekanRegular items-center ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
                        } hover:bg-[#e8f2fc] transition-colors`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                    >
                      {/* Logo */}
                      <div className="text-center flex justify-center items-center">
                        {company.logo && !imageErrors.has(company.id) ? (
                          <div className="relative w-16 h-16 bg-white rounded-lg border border-[#e6f0fa] flex items-center justify-center overflow-hidden">
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="object-contain max-w-full max-h-full w-full h-full"
                              onError={() => {
                                setImageErrors(prev => new Set(prev).add(company.id))
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-[#f6f9ff] rounded-lg border border-[#e6f0fa] flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-[#ccd6e1]" />
                          </div>
                        )}
                      </div>
                      
                      {/* Name */}
                      <div className="text-center text-[#323232] font-IranYekanMedium">{company.name}</div>
                      
                      {/* Description */}
                      <div className="text-center text-[#767676] hidden md:block text-xs">{company.description || '-'}</div>
                      
                      {/* ID */}
                      <div className="text-center text-[#767676] hidden md:block font-mono text-xs">{company.id}</div>
                      
                      {/* Actions */}
                      <div className="flex justify-center gap-1 md:gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditCompany(company)}
                          className="h-8 w-8 md:h-8 md:w-8 p-0 text-[#0d5990] hover:bg-[#0d5990] hover:text-white"
                        >
                          <Edit className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(company)}
                          className="h-8 w-8 md:h-8 md:w-8 p-0 text-[#ae3232] hover:bg-[#ae3232] hover:text-white"
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="text-center py-8 text-[#767676]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-[#ccd6e1]" />
                    <p className="text-lg font-IranYekanMedium mb-2">هیچ شرکتی یافت نشد</p>
                    <p className="text-sm font-IranYekanRegular">فیلترها را تغییر دهید یا شرکت جدیدی اضافه کنید</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      {companyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-IranYekanBold text-gray-900 mb-2">
                حذف شرکت
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                آیا مطمئن هستید که می‌خواهید شرکت{' '}
                <span className="font-IranYekanMedium text-gray-900">
                  {companyToDelete.name}
                </span>{' '}
                را حذف کنید؟
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-IranYekanMedium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-IranYekanMedium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

