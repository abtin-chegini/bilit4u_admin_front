"use client";

import { UserIcon, SearchIcon, CheckCircleIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js'
import axios from 'axios';

// Define the PreviousPassenger interface
export interface PreviousPassenger {
  id: number | string;
  fName: string;
  lName: string;
  nationalCode: string;
  gender: 'Male' | 'Female';
  dateOfBirth?: string;
}

export interface EnhancedPreviousPassengersDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSelect: () => void;
  selectedPassengers: (number | string)[];
  toggleSelection: (id: number | string) => void;
  activeSeatNumber: string | null;
  assignedPassengerIds: (number | string)[];
}

export function EnhancedPreviousPassengersDialog({
  isOpen,
  onClose,
  onSelect,
  selectedPassengers,
  toggleSelection,
  activeSeatNumber,
  assignedPassengerIds
}: EnhancedPreviousPassengersDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [passengers, setPassengers] = useState<PreviousPassenger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // Function to fetch passengers from admin API
  const fetchPassengers = async () => {
    if (!session?.access_token) {
      setErrorMessage("لطفا ابتدا وارد حساب کاربری خود شوید");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log('🔍 Fetching passengers from admin API...');

      const response = await fetch('https://api.bilit4u.com/admin/api/v1/admin/passengers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 API Response Status:', response.status, response.ok ? '✅' : '❌');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 API Response Data:', data);
      console.log('🔍 Raw passengers from API:', data.passengers?.map((p: any) => ({
        name: `${p.fName} ${p.lName}`,
        gender: p.gender,
        genderType: typeof p.gender
      })));

      if (data.success && data.passengers) {
        // Map the API response to PreviousPassenger format
        const mappedPassengers: PreviousPassenger[] = data.passengers.map((passenger: any, index: number) => {
          // Database: true=male, false=female → API returns "2"=male (true), "1"=female (false)
          const isMale = passenger.gender === 2 || passenger.gender === '2';

          // Detailed logging for gender mapping
          console.log('🔍 Gender mapping for passenger:', passenger.gender, passenger.lName);
          console.log(`🔍 PASSENGER ${index + 1} - ${passenger.fName} ${passenger.lName}:`);
          console.log(`   📊 Raw gender value: ${passenger.gender}`);
          console.log(`   📊 Gender type: ${typeof passenger.gender}`);
          console.log(`   📊 Is number 2 (male/true)? ${passenger.gender === 2}`);
          console.log(`   📊 Is number 1 (female/false)? ${passenger.gender === 1}`);
          console.log(`   📊 Is string '2' (male/true)? ${passenger.gender === '2'}`);
          console.log(`   📊 Is string '1' (female/false)? ${passenger.gender === '1'}`);
          console.log(`   📊 Final isMale result: ${isMale}`);
          console.log(`   📊 Final gender string: ${isMale ? 'Male' : 'Female'}`);
          console.log(`   📊 Display text: ${isMale ? 'آقا' : 'خانم'}`);
          console.log('   ───────────────────────────────────────────');

          return {
            id: passenger.id,
            fName: passenger.fName || '',
            lName: passenger.lName || '',
            nationalCode: passenger.nationalCode || '',
            gender: isMale ? 'Male' : 'Female',
            dateOfBirth: passenger.dateOfBirth
          };
        });

        console.log('🔍 Mapped passengers:', mappedPassengers);
        setPassengers(mappedPassengers);
      } else {
        setErrorMessage("هیچ مسافری برای این کاربر وجود ندارد");
        setPassengers([]);
      }
    } catch (error) {
      console.error('Error fetching passengers:', error);
      setErrorMessage("خطا در دریافت لیست مسافران");
      setPassengers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to load passengers when dialog opens
  useEffect(() => {
    if (isOpen && passengers.length === 0 && !isLoading && !errorMessage) {
      fetchPassengers();
    }
  }, [isOpen]);

  // Filter passengers based on search query
  const filteredPassengers = passengers.filter(passenger => {
    if (!searchQuery.trim()) return true;

    const fullName = `${passenger.fName} ${passenger.lName}`.toLowerCase();
    const nationalId = passenger.nationalCode.toLowerCase();
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || nationalId.includes(query);
  });

  // Handle single-select mode (radio button style)
  const handleToggleSelection = (passengerId: number | string) => {
    // If already selected, do nothing (don't allow deselection)
    if (selectedPassengers.includes(passengerId)) {
      return;
    }

    // Otherwise, select only this passenger (clear any previous selection)
    toggleSelection(passengerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredPassengers.length === 1) {
      // If Enter is pressed and there's exactly one result, select it
      handleToggleSelection(filteredPassengers[0].id);
    }
    else if (e.key === 'Escape') {
      // If Escape is pressed, clear search
      setSearchQuery("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95%] p-0 focus:outline-none border-0 overflow-hidden rounded-xl">
        {/* Header with decoration and title */}
        <div className="relative">
          {/* Top decorative wave pattern */}
          <div className="absolute top-0 left-0 w-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-12 transform scale-y-[-1]">
              <path fill="#0D5990" fillOpacity="0.1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,165.3C960,149,1056,139,1152,149.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>

          {/* Header content */}
          <div className="pt-8 pb-3 px-5">
            <div className="flex justify-center mb-1">
              <div className="bg-[#EBF5FF] h-12 w-12 flex items-center justify-center rounded-full">
                <UserIcon className="h-6 w-6 text-[#0D5990]" />
              </div>
            </div>
            <DialogTitle className="text-center text-[18px] font-IranYekanBold text-[#0D5990]">
              انتخاب مسافر
              {activeSeatNumber && (
                <span className="text-[#4B5259]"> برای صندلی {activeSeatNumber}</span>
              )}
            </DialogTitle>

            <p className="text-center text-[13px] text-gray-500 mt-1 font-IranYekanRegular">
              مسافر مورد نظر خود را از لیست زیر انتخاب کنید
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            {/* Input with RTL support */}
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-IranYekanRegular text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0D5990] focus:border-[#0D5990] text-right"
              placeholder="جستجو نام، نام خانوادگی یا کد ملی..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              dir="rtl"
              autoFocus
            />
            {/* Search icon positioned on the left side for RTL */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>

            {/* Clear search button */}
            {searchQuery && (
              <div
                className="absolute inset-y-0 right-0 pr-2 flex items-center cursor-pointer"
                onClick={() => setSearchQuery("")}
              >
                <div className="h-4 w-4 text-gray-400 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                  <span className="text-[10px] leading-none">×</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="max-h-[50vh] overflow-auto px-5 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-[#0D5990] animate-spin mb-3"></div>
              <p className="text-gray-500 text-[14px] font-IranYekanRegular">در حال دریافت لیست مسافران...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <div className="mb-3 h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
                <UserIcon className="h-6 w-6" />
              </div>
              <p className="text-gray-500 text-[14px] font-IranYekanBold mb-1 text-center">{errorMessage}</p>

              {!session ? (
                <div className="text-center">
                  <p className="text-gray-400 text-[12px] font-IranYekanRegular mb-3">
                    برای مشاهده مسافران قبلی، لطفا وارد حساب کاربری خود شوید.
                  </p>
                  <button
                    className="bg-[#0D5990] text-white px-5 py-2 rounded-lg text-[13px] font-IranYekanBold hover:bg-[#064272] transition-colors"
                    onClick={() => {
                      onClose(false);
                      // You can add login dialog opening logic here
                    }}
                  >
                    ورود به حساب کاربری
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-[12px] text-center font-IranYekanRegular">
                  لیست مسافران قبلی شما خالی است. بعد از خرید اولین بلیط، مسافران در این قسمت نمایش داده می‌شوند.
                </p>
              )}
            </div>
          ) : filteredPassengers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <div className="mb-3 h-12 w-12 text-gray-400 flex items-center justify-center rounded-full bg-gray-100">
                <SearchIcon className="h-6 w-6" />
              </div>
              <p className="text-gray-500 text-[14px] font-IranYekanBold mb-1">نتیجه‌ای یافت نشد</p>
              <p className="text-gray-400 text-[12px] text-center font-IranYekanRegular">
                مسافری با مشخصات وارد شده یافت نشد. لطفا جستجوی دیگری انجام دهید.
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredPassengers.map((passenger, index) => {
                // Check if this passenger is already assigned
                const isAssigned = assignedPassengerIds.includes(passenger.id);
                const isSelected = selectedPassengers.includes(passenger.id);

                // If assigned to the current seat we're editing, don't consider it "assigned"
                const isAssignedElsewhere = isAssigned && !isSelected;

                return (
                  <div
                    key={`passenger-${passenger.id || index}`}
                    className={`
                      relative flex items-center p-3 rounded-lg transition-all
                      ${isSelected
                        ? 'bg-[#EBF5FF] border border-[#0D5990]'
                        : isAssignedElsewhere
                          ? 'bg-gray-50 border border-gray-200 opacity-60'
                          : 'bg-white border border-gray-200 hover:border-gray-300'
                      }
                      ${isAssignedElsewhere ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    onClick={() => {
                      if (!isAssignedElsewhere) {
                        handleToggleSelection(passenger.id);
                      }
                    }}
                  >
                    {/* Selection indicator */}
                    <div className="absolute left-2 top-3">
                      {isSelected && (
                        <CheckCircleIcon className="h-5 w-5 text-[#0D5990]" />
                      )}
                    </div>

                    {/* User icon or initials */}
                    <div
                      className={`
                        h-10 w-10 rounded-full flex items-center justify-center text-white font-IranYekanBold text-[14px]
                        ${isSelected ? 'bg-[#0D5990]' : 'bg-gray-400'}
                        mr-4 ml-5
                      `}
                    >
                      {(() => {
                        // Debug only if there's an issue
                        if (!passenger.fName || !passenger.lName) {
                          console.log('⚠️ Passenger dialog - missing name data:', {
                            passenger,
                            fName: passenger.fName,
                            lName: passenger.lName
                          });
                        }

                        const fName = passenger.fName || '';
                        const lName = passenger.lName || '';

                        return (fName.charAt(0) || 'N').toUpperCase() + (lName.charAt(0) || 'A').toUpperCase();
                      })()}
                    </div>

                    {/* Passenger info */}
                    <div className="flex-1 mr-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-IranYekanBold text-[14px] text-gray-800">
                          {passenger.fName} {passenger.lName}
                        </h3>
                        {isAssignedElsewhere && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-IranYekanRegular">
                            قبلاً انتخاب شده
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        <p className="text-[12px] text-gray-500 font-IranYekanRegular">
                          کد ملی: {passenger.nationalCode}
                        </p>
                        <span className="mx-2 text-gray-300">|</span>
                        <p className="text-[12px] text-gray-500 font-IranYekanRegular">
                          {passenger.gender === 'Male' ? 'آقا' : 'خانم'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
            <button
              className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-IranYekanRegular text-[13px] hover:bg-gray-50 transition-colors"
              onClick={() => onClose(false)}
            >
              انصراف
            </button>

            <button
              className={`
                w-full sm:w-auto px-5 py-2.5 rounded-lg font-IranYekanBold text-[13px] flex justify-center items-center gap-2
                ${selectedPassengers.length > 0
                  ? 'bg-gradient-to-l from-[#0D5990] to-[#1A74B4] text-white hover:from-[#094370] hover:to-[#155c91]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                transition-all
              `}
              onClick={() => onSelect()}
              disabled={selectedPassengers.length === 0}
            >
              <span>انتخاب مسافر</span>
              {selectedPassengers.length > 0 && (
                <div className="bg-white bg-opacity-20 text-white h-5 w-5 flex items-center justify-center rounded-full text-[11px]">
                  {selectedPassengers.length}
                </div>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}