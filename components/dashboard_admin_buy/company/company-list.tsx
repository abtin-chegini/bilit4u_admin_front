"use client"

import { useState, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Plus, Building2 } from "lucide-react"
import { AddCompanyDialog } from "./add-company-dialog"
import { motion } from "framer-motion"
import ChevronLeft from "@/components/ui/icons_custom/ChevronLeft"
import ChevronRight from "@/components/ui/icons_custom/ChevronRight"
import numberConvertor from "@/lib/numberConvertor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  companyID?: number
  terminalID?: number
}

interface CompanyListProps {
  companies: Company[]
  searchTerm: string
  onOpenAddDialog: () => void
  onEditCompany: (company: Company) => void
  currentPage: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export function CompanyList({ 
  companies, 
  searchTerm, 
  onOpenAddDialog, 
  onEditCompany, 
  currentPage,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: CompanyListProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())

  // Filter companies based on search term
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = searchTerm === '' ||
        company.name.includes(searchTerm) ||
        company.description.includes(searchTerm) ||
        company.id.toString().includes(searchTerm)

      return matchesSearch
    })
  }, [companies, searchTerm])

  // Calculate pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex)

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      onPageChange(1)
    }
  }, [totalPages, currentPage, onPageChange])

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
      // Scroll to top of list
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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
                  paginatedCompanies.map((company, index) => (
                    <motion.div
                      key={company.id}
                      className={`grid grid-cols-4 md:grid-cols-5 gap-4 p-4 text-sm font-IranYekanRegular items-center ${index % 2 === 0 ? "bg-white" : "bg-[#f6f9ff]"
                        } hover:bg-[#e8f2fc] transition-colors`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + ((index % itemsPerPage) * 0.05) }}
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
                      <div className="flex justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditCompany(company)}
                          className="h-8 w-8 md:h-8 md:w-8 p-0 text-[#0d5990] hover:bg-[#0d5990] hover:text-white"
                        >
                          <Edit className="h-3 w-3 md:h-4 md:w-4" />
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

          {/* Pagination Controls */}
          {filteredCompanies.length > 0 && (
            <motion.div
              className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-IranYekanRegular text-[#767676]">
                  نمایش:
                </span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    onItemsPerPageChange(parseInt(value))
                    onPageChange(1) // Reset to first page when changing items per page
                  }}
                >
                  <SelectTrigger className="w-[80px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">۵</SelectItem>
                    <SelectItem value="10">۱۰</SelectItem>
                    <SelectItem value="20">۲۰</SelectItem>
                    <SelectItem value="50">۵۰</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm font-IranYekanRegular text-[#767676]">
                  از {numberConvertor(filteredCompanies.length.toString())} مورد
                </span>
              </div>

              {/* Pagination buttons */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {/* Previous button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-9 w-9 p-0 font-IranYekanRegular disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      
                      if (totalPages <= 5) {
                        // Show all pages if 5 or less
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // Show first 5 pages
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // Show last 5 pages
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Show pages around current page
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-9 w-9 p-0 font-IranYekanRegular ${
                            currentPage === pageNum
                              ? "bg-[#0D5990] text-white hover:bg-[#0b4d7a]"
                              : ""
                          }`}
                        >
                          {numberConvertor(pageNum.toString())}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Next button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 p-0 font-IranYekanRegular disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </Card>

    </motion.div>
  )
}

