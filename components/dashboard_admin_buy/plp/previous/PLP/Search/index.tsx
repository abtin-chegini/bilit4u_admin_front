"use client";
import React, {
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import animationData from "@/../../public/Preloader.json";
import TopComponent from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/TopComponent";
import RightCard from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/RightCard";
import FilterBadge from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/FilterBadge";
import RightCheckCard from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/RightCheckCard";
import MainCard from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/MainCard";
import { useSrvRequest } from "@/hooks/srvRequest";
import { SrvRequestRes, SrvRequestResItem } from "@/constants/interfaces";
import Skeleton from "react-loading-skeleton";
import numberConvertor from "@/lib/numberConvertor";
import FAQ from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/FAQ";
import Pagination from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/Pagination";
import NoData from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/NoData";
import CompaniesFilter from "@/components/dashboard_admin_buy/plp/previous/PLP/Desktop/CompaniesFilter";
import useDebounce from "@/hooks/useDebounce";
import moment from "jalali-moment";
import SearchMobileHeader from "../Responsive/SearchMobileHeader";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLayoutStore } from "@/store/LayoutStore"; // You'll need to create this store
import {
  cityMapping,
  convertDateToNumber,
  getCityFarsiByID,
  getCityNameById,
} from "@/lib/utils";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";

interface SearchComponentProps {
  SourceCity: string;
  DestinationCity: string;
  TravelDate: string;
}
const SearchComponent: FunctionComponent<SearchComponentProps> = ({
  SourceCity,
  DestinationCity,
  TravelDate,
}) => {

  const isMobile = useMediaQuery("(max-width: 768px)");
  const { setHideNavbar } = useLayoutStore(); //

  const router = useRouter();

  const getCityValue = (cityProp: string, localStorageKey: string) => {
    if (cityProp && cityProp !== "") return cityProp;

    // Fallback to localStorage
    const localValue = localStorage.getItem(localStorageKey);
    return localValue || "";
  };





  const convertToPersianDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return new Date().toLocaleDateString("fa-IR");

    try {
      // Extract year, month, and day from TravelDate (format: jYYYYjMMjDD)
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);

      // Create moment-jalaali date and format it
      const date = moment(`${year}/${month}/${day}`, "jYYYY/jMM/jDD");
      return date.format("jYYYY/jM/jD").replace(/\d/g, d =>
        ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'][parseInt(d)]
      );
    } catch (error) {
      console.error("Error converting date:", error);
      return new Date().toLocaleDateString("fa-IR");
    }
  };
  const convertToTravelDateFormat = (persianDateStr: string) => {
    try {
      // Remove any non-numeric characters
      const parts = persianDateStr.split('/');
      if (parts.length !== 3) return null;

      // Convert Persian digits to English if necessary
      const convertToEnglish = (str: string) => {
        return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
      };

      const year = convertToEnglish(parts[0].padStart(4, '0'));
      const month = convertToEnglish(parts[1].padStart(2, '0'));
      const day = convertToEnglish(parts[2].padStart(2, '0'));
      console.log(year, month, day);
      return `${year}${month}${day}`;
    } catch (error) {
      console.error("Error converting date format:", error);
      return null;
    }
  };

  const [sort, setSort] = useState<"cheap" | "expensive" | "fastest">(
    "fastest"
  );
  ///////////////
  // All fetched services
  const [allServices, setAllServices] = useState<SrvRequestResItem[]>([]);

  // Total number of items
  const [totalItems, setTotalItems] = useState<number>(0);

  // Items per page
  const [itemsPerPage] = useState<number>(15);

  // Current page number
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Current page's data
  const [currentPageData, setCurrentPageData] = useState<SrvRequestResItem[]>([]);
  ////////////////////
  const [company, setCompany] = useState<string>();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [timeFilter, setTimeFilter] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const [isBed, setIsBed] = useState<boolean>(false);
  const [isMonitor, setIsMonitor] = useState<boolean>(false);
  const [isCharger, setIsCharger] = useState<boolean>(false);

  const [maxFullPrice, setMaxFullPrice] = useState<string>("20000000");

  const [time, setTime] = useState<string>("30");



  const [activeDate, setActiveDate] = useState<string>(
    convertToPersianDate(TravelDate) ||
    new Date().toLocaleDateString("fa-IR")
  );

  const [data, setData] = useState<SrvRequestRes>();

  const { mutate, isPending } = useSrvRequest();

  const { debouncedValue } = useDebounce(maxFullPrice);
  const { debouncedValue: debounceTime } = useDebounce(time);
  const [drawerFilters, setDrawerFilters] = useState({
    time: "30",
    company: "",
    isBed: false,
    isMonitor: false,
    isCharger: false,
    timeFilter: 0
  });

  // Sync drawer filters with main state when component mounts
  useEffect(() => {
    setDrawerFilters(prev => ({
      ...prev,
      company: company || "",
      isBed: isBed,
      isMonitor: isMonitor,
      isCharger: isCharger,
      timeFilter: timeFilter
    }));
  }, []); // Only run on mount

  const LottiePreloader = () => (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-[#FAFAFA] bg-opacity-80">
      <div className="w-40 h-40 relative">
        <Lottie
          animationData={animationData}
          loop={true}
        />
      </div>
    </div>
  );
  useEffect(() => {
    if (isMobile) {
      setHideNavbar(true);
    }

    // Cleanup function to restore navbar when unmounting
    return () => {
      setHideNavbar(false);
    };
  }, [isMobile, setHideNavbar]);

  useEffect(() => {
    const persianDate = convertToPersianDate(TravelDate);
    // console.log(persianDate);
    // console.log(TravelDate);
    setActiveDate(persianDate);
    // console.log("TravelDate:", TravelDate);
    setInitialLoading(true);
    fetchData(TravelDate);
  }, [TravelDate]);

  const handleTimeFilterChange = (timeValue: number) => {
    if (timeValue !== timeFilter) {
      setTimeFilter(timeValue);

    }
    // setTimeFilter(timeValue);

    // If using client-side filtering, apply filters immediately
    // if (allServices.length > 0) {
    //   applyFiltersAndSort(allServices);
    // }
  };


  const handleClientPagination = (page: number, services?: SrvRequestResItem[]) => {
    // Use provided services or the state
    const servicesList = services || allServices;
    // console.log(servicesList);
    // Calculate start and end indices
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Get current page items
    const pageItems = servicesList.slice(startIndex, endIndex);

    // Update state
    setCurrentPage(page);
    setCurrentPageData(pageItems);

    // Calculate total pages for pagination component
    const calculatedTotalPages = Math.ceil(servicesList.length / itemsPerPage);
    setData(prev => ({
      ...prev!,
      Services: pageItems,
      TotalPages: calculatedTotalPages
    }));
  };



  const fetchData = (date: string, sortBy: string = "maxFullPrice") => {
    const sourceCityValue = getCityValue(SourceCity, "sourceCityId");
    const destinationCityValue = getCityValue(DestinationCity, "destinationCityId");

    if (!sourceCityValue || !destinationCityValue) {
      console.error("Missing source or destination city");
      setInitialLoading(false); // Turn off loading on error

      return;
    }

    // Get all data at once with minimal parameters
    mutate(
      {
        sCityCode: sourceCityValue,
        dCityCode: destinationCityValue,
        sDate: date,
        reqtime: "1",
        // Don't include pagination params since we're handling pagination client-side
      },
      {
        onSuccess: (res: SrvRequestRes) => {
          // console.log("API Response:", res);
          // Store original, unfiltered data
          const allData = res.Services || [];
          // console.log(allData);
          handleClientPagination(1, allData);
          setAllServices(allData);
          setTotalItems(res.AllItems || 0);
          setInitialLoading(false); // Turn off loading on error


          // Apply any active filters
          // applyFiltersAndSort(allData);
        },
        onError: () => {
          setInitialLoading(false); // Turn off loading on error
        }
      }
    );
  };

  const applyFiltersAndSort = (data: SrvRequestResItem[]) => {
    // Start with all data
    let filteredData = [...data];

    // Apply company filter - either single company or multiple selected companies
    if (selectedCompanies.length > 0) {
      // Filter by selected companies (multiple selection)
      filteredData = filteredData.filter(item =>
        // Match the CoGroup field with any of the selected company IDs
        selectedCompanies.includes(item.CoGroup)
      );
    } else if (company && company !== '0' && company !== '') {
      // Filter by single company selection
      filteredData = filteredData.filter(item =>
        // Match the CoGroup field with the selected company ID
        item.CoGroup === company
      );
    }
    // If neither selectedCompanies nor company is set, show all companies (no filtering)

    if (timeFilter > 0) { // 0 means "all times"
      filteredData = filteredData.filter(item => {
        // Extract hours from DepartTime (assuming format like "14:30")
        const departTimeParts = item.DepartTime.split(':');
        const departTimeHour = parseInt(departTimeParts[0]);

        switch (timeFilter) {
          case 1: // Morning (8:00-12:00)
            return departTimeHour >= 8 && departTimeHour < 12;
          case 2: // Afternoon (13:00-18:00)
            return departTimeHour >= 13 && departTimeHour < 18;
          case 3: // Evening (20:00-23:00)
            return departTimeHour >= 20 && departTimeHour <= 23;
          default:
            return true;
        }
      });
    }


    // Apply filters
    if (isMonitor) {
      filteredData = filteredData.filter(item => item.IsMonitor);
    }

    if (isBed) {
      filteredData = filteredData.filter(item => item.IsBed);
    }

    if (isCharger) {
      filteredData = filteredData.filter(item => item.IsCharger);
    }

    if (maxFullPrice) {
      filteredData = filteredData.filter(item =>
        parseInt(item.FullPrice) <= parseInt(maxFullPrice)
      );
    }

    // Apply sorting - fix to properly parse FullPrice to number
    if (sort === "cheap") {
      filteredData.sort((a, b) => {
        const priceA = parseInt(a.FullPrice) || 0;
        const priceB = parseInt(b.FullPrice) || 0;
        return priceA - priceB;
      });
    } else if (sort === "expensive") {
      filteredData.sort((a, b) => {
        const priceA = parseInt(a.FullPrice) || 0;
        const priceB = parseInt(b.FullPrice) || 0;
        return priceB - priceA;
      });
    }

    // Update the filtered data
    setCurrentPage(1); // Reset to first page when filters change
    handleClientPagination(1, filteredData);
  };


  // Add this effect to apply filters whenever they change
  useEffect(() => {
    // Skip processing if we don't have data yet
    if (!allServices || allServices.length === 0) return;

    // Create a new filtered array without modifying original data
    let filteredData = [...allServices];

    // Apply company filter - either single company or multiple selected companies
    if (selectedCompanies.length > 0) {
      // Filter by selected companies (multiple selection)
      filteredData = filteredData.filter(item =>
        // Match the CoGroup field with any of the selected company IDs
        selectedCompanies.includes(item.CoGroup)
      );
    } else if (company && company !== '0' && company !== '') {
      // Filter by single company selection
      filteredData = filteredData.filter(item => item.CoGroup === company);
    }
    // If neither selectedCompanies nor company is set, show all companies (no filtering)

    // Apply time filter
    if (timeFilter > 0) {
      filteredData = filteredData.filter(item => {
        try {
          const departTimeParts = item.DepartTime?.split(':') || [];
          if (!departTimeParts[0]) return true; // Skip invalid times

          const departTimeHour = parseInt(departTimeParts[0]);

          switch (timeFilter) {
            case 1: return departTimeHour >= 8 && departTimeHour < 12;
            case 2: return departTimeHour >= 13 && departTimeHour < 18;
            case 3: return departTimeHour >= 20 && departTimeHour <= 23;
            default: return true;
          }
        } catch (e) {
          console.error("Error filtering time:", e);
          return true; // Skip invalid entries
        }
      });
    }

    // Apply amenity filters
    if (isMonitor) filteredData = filteredData.filter(item => item.IsMonitor);
    if (isBed) filteredData = filteredData.filter(item => item.IsBed);
    if (isCharger) filteredData = filteredData.filter(item => item.IsCharger);

    // Apply price filter
    if (maxFullPrice) {
      filteredData = filteredData.filter(item => {
        try {
          return parseInt(item.FullPrice) <= parseInt(maxFullPrice);
        } catch {
          return true;
        }
      });
    }

    // Apply sorting
    if (sort === "cheap") {
      filteredData.sort((a, b) => {
        const priceA = parseInt(a.FullPrice || "0");
        const priceB = parseInt(b.FullPrice || "0");
        return priceA - priceB;
      });
    } else if (sort === "expensive") {
      filteredData.sort((a, b) => {
        const priceA = parseInt(a.FullPrice || "0");
        const priceB = parseInt(b.FullPrice || "0");
        return priceB - priceA;
      });
    }

    // Update the current page data directly without calling handleClientPagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredData.slice(startIndex, endIndex);

    setCurrentPageData(pageItems);
    setData(prev => ({
      ...prev!,
      Services: pageItems,
      TotalPages: Math.ceil(filteredData.length / itemsPerPage)
    }));

  }, [isMonitor, isBed, isCharger, maxFullPrice, company, selectedCompanies, sort, timeFilter, allServices]);

  const getCityID = (cityProp: string, localStorageKey: string) => {
    if (cityProp && cityProp !== "") return cityProp;
    return localStorage.getItem(localStorageKey) || "";
  };
  const handleDateChange = (value: SetStateAction<string>) => {
    const newDate = typeof value === 'function' ? value(activeDate) : value;
    setActiveDate(newDate);

    // Convert the Persian date to TravelDate format
    const newTravelDate = convertToTravelDateFormat(newDate);

    if (newTravelDate) {
      // Get source and destination city IDs with localStorage fallback
      const sourceCityID = getCityID(SourceCity, "sourceCityId");
      const destinationCityID = getCityID(DestinationCity, "destinationCityId");

      // Convert IDs back to city names for the URL
      const sourceCityName = Object.keys(cityMapping).find(key =>
        cityMapping[key] === sourceCityID
      ) || "";

      const destinationCityName = Object.keys(cityMapping).find(key =>
        cityMapping[key] === destinationCityID
      ) || "";

      // Only redirect if we have both values
      if (sourceCityName && destinationCityName) {
        // Update URL with city NAMES (not IDs) and the new date
        router.push(`/bus/${sourceCityName}/${destinationCityName}/${newTravelDate}`);
      }

      // Save TravelDate to localStorage for persistence
      localStorage.setItem("TravelDate", newTravelDate);

      // Fetch data with the new date using city IDs
      fetchData(newDate, sort === "cheap" ? "minFullPrice" : sort === "expensive" ? "maxFullPrice" : "");
    }
  };

  const handleSortClick = (sortKey: "cheap" | "expensive") => {
    // Toggle sorting: if clicking the active sort, return to "fastest"
    const newSort = sort === sortKey ? "fastest" : sortKey;
    setSort(newSort);

    // Apply the sort to existing data - no need to refetch from API
    if (allServices.length > 0) {
      applyFiltersAndSort(allServices);
    } else {
      // If no data yet, fetch with the new sort
      fetchData(
        activeDate,
        newSort === "cheap" ? "minFullPrice" : "maxFullPrice"
      );
    }
  };
  // const handleResetFilter = () => {
  //   setCompany("0");
  //   fetchData(activeDate);
  // };
  const handleResetFilter = () => {
    // Reset filters
    setCompany("0"); // Set to "0" or empty string depending on your default
    setIsBed(false);
    setIsMonitor(false);
    setIsCharger(false);
    setMaxFullPrice("20000000");

    // In mobile mode, also set selectedCompanies to include "0" (همه ی شرکت ها)
    // This ensures the mobile dialog shows the correct selection
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSelectedCompanies(["0"]);
    } else {
      // In desktop mode, clear selected companies
      setSelectedCompanies([]);
    }

    // Reset to original data and first page
    if (allServices.length > 0) {
      handleClientPagination(1, allServices);
    } else {
      fetchData(activeDate);
    }
  };
  const handleDrawerSubmit = () => {
    // Create a single batch of state updates
    const newFilters = {
      company: drawerFilters.company,
      isBed: drawerFilters.isBed,
      isMonitor: drawerFilters.isMonitor,
      isCharger: drawerFilters.isCharger,
      timeFilter: drawerFilters.timeFilter
    };

    // Use React batching to update all state at once
    React.startTransition(() => {
      setCompany(newFilters.company);
      setIsBed(newFilters.isBed);
      setIsMonitor(newFilters.isMonitor);
      setIsCharger(newFilters.isCharger);
      setTimeFilter(newFilters.timeFilter);
    });

    // Close drawer immediately without waiting for state updates
    setOpen(false);
  };
  return (
    <>
      {isMobile && (
        <SearchMobileHeader
          showBackButton={true}
          showTitle={true}
          sourceCity={getCityFarsiByID(SourceCity)}
          destinationCity={getCityFarsiByID(DestinationCity)}
          date={activeDate}
          activeDate={activeDate}
          handleDateChange={handleDateChange}
        />
      )}
      <div className="min-h-full w-full bg-[#FAFAFA] relative overflow-auto">
        <TopComponent
          isPending={isPending}
          activeDate={activeDate}
          setActiveDate={handleDateChange}
        />
        {initialLoading && <LottiePreloader />}

        <div
          className={`mt-7 grid grid-cols-4 gap-x-7 px-4 lg:px-16 ${isMobile ? 'pt-20' : ''}`}
          id="main_div"
        >
          <div className="col-span-4 lg:col-span-3 gap-y-7 flex flex-col">
            {isPending ? (
              <Skeleton
                width={600}
                height={24}
                containerClassName="text-lg text-black direction-rtl hidden lg:block"
                style={{ borderRadius: "25px" }}
              />
            ) : (
              <div className="text-lg text-black direction-rtl hidden lg:block font-IranYekanRegular">
                تعداد {numberConvertor(totalItems?.toString() ?? "")}{" "}
                سرویس&nbsp; از&nbsp; &nbsp;
                {getCityFarsiByID(SourceCity)}&nbsp; تا&nbsp; &nbsp;
                {getCityFarsiByID(DestinationCity)} در تاریخ {activeDate} از
                ساعت ۰۰:۱۵ تا ساعت ۲۳:۵۹ یافت شد
              </div>
            )}

            <div className="direction-rtl gap-x-4 items-center hidden lg:flex">
              <div className="text-black">نمایش بر اساس :</div>
              {isPending ? (
                <Skeleton
                  count={3}
                  width={107}
                  height={24}
                  containerClassName="flex items-center gap-x-4"
                  style={{ borderRadius: "25px" }}
                />
              ) : (
                <div className="flex items-center gap-x-4">
                  <FilterBadge
                    title="ارزان ترین"
                    active={sort === "cheap"}
                    onClick={() => handleSortClick("cheap")}
                  />
                  <FilterBadge
                    title="گران ترین"
                    active={sort === "expensive"}
                    onClick={() => handleSortClick("expensive")}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-y-2 sm:gap-y-7 pb-6 sm:pt-5 xs:pt-5">
              {isPending || initialLoading ? (
                <>
                  <MainCard />
                  <MainCard />
                  <MainCard />
                  <MainCard />
                </>
              ) : (
                currentPageData.length > 0 ? (
                  <>
                    {currentPageData.map((item: SrvRequestResItem, index: number) => (
                      <MainCard
                        data={item}
                        key={`main-card-${index}`}
                        isPending={isPending}
                      />
                    ))}

                    {Math.ceil(allServices.length / itemsPerPage) > 1 && (
                      <Pagination
                        pageNumber={currentPage}
                        setPageNumber={(page: number) => handleClientPagination(page)}
                        totalPages={Math.ceil(allServices.length / itemsPerPage)}
                      />
                    )}
                  </>
                ) : (
                  <NoData />
                )
              )}
            </div>
          </div>
          <div className="hidden lg:flex flex-col gap-y-2.5 w-full sticky top-0">

            <RightCard
              onTimeFilterChange={handleTimeFilterChange}

              setValue={setTime}
              // value={time}
              isPending={isPending}
              title="زمان حرکت"
            // activeDate={""}
            />
            <CompaniesFilter
              isPending={isPending}
              setCompany={setCompany}
              company={company}
              selectedCompanies={selectedCompanies}
              setSelectedCompanies={setSelectedCompanies}
            />

            <RightCheckCard
              isPending={isPending}
              isMonitor={isMonitor}
              setIsMonitor={setIsMonitor}
              isBed={isBed}
              setIsBed={setIsBed}
              isCharger={isCharger}
              setIsCharger={setIsCharger}
            />
            {isPending ? (
              <Skeleton
                count={3}
                width={107}
                height={24}
                containerClassName="flex items-center gap-x-4"
                style={{ borderRadius: "25px" }}
              />
            ) : (
              <button
                className="bg-[#0D5990] text-white rounded-md px-4 py-2 mt-2 font-IranYekanRegular"
                onClick={handleResetFilter}
              >
                حدف تمامی فیلتر ها
              </button>
            )}
          </div>
        </div>

        <FAQ />
        <div className="fixed bottom-0 w-full rounded-t-md bg-[#2E5F9D] p-4 flex items-center justify-between lg:hidden">
          <Drawer>
            <DrawerTrigger>
              <div className="bg-white text-[#0D5990] cursor-pointer rounded-md sm:rounded-xl px-6 sm:px-12 py-2  font-IranYekanRegular hover:bg-[#0D5990] hover:text-white">
                نمایش فیلتر ها
              </div>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="font-IranYekanBold">
                  {" "}
                  انتخاب فیلترهای جستجو
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-y-4 w-full px-4">
                <RightCard
                  onTimeFilterChange={(timeValue) => {
                    // Update drawer state with the time filter value
                    if (drawerFilters.timeFilter !== timeValue) { // Prevent unnecessary updates
                      setDrawerFilters((prev) => ({
                        ...prev,
                        timeFilter: timeValue
                      }));
                    }
                  }}
                  setValue={(value) =>
                    setDrawerFilters((prev) => ({
                      ...prev,
                      time: typeof value === "function" ? value(prev.time) : value,
                    }))
                  }
                  isPending={isPending}
                  title="زمان حرکت"
                />
                <CompaniesFilter
                  isPending={isPending}
                  setCompany={(value) => {
                    // Update both drawer state and main state immediately
                    setDrawerFilters((prev) => ({
                      ...prev,
                      company: String(value ?? ""),
                    }));
                    setCompany(value);
                  }}
                  company={drawerFilters.company}
                  selectedCompanies={selectedCompanies}
                  setSelectedCompanies={setSelectedCompanies}
                />
                <RightCheckCard
                  isPending={isPending}
                  isMonitor={drawerFilters.isMonitor}
                  setIsMonitor={(value) =>
                    setDrawerFilters((prev) => ({
                      ...prev,
                      isMonitor: typeof value === "function" ? value(prev.isMonitor) : value,
                    }))
                  }
                  isBed={drawerFilters.isBed}
                  setIsBed={(value) =>
                    setDrawerFilters((prev) => ({
                      ...prev,
                      isBed: typeof value === "function" ? value(prev.isBed) : value,
                    }))
                  }
                  isCharger={drawerFilters.isCharger}
                  setIsCharger={(value) =>
                    setDrawerFilters((prev) => ({
                      ...prev,
                      isCharger: typeof value === "function" ? value(prev.isCharger) : value,
                    }))
                  }
                />
              </div>
              <div className="w-full flex flex-row items-center justify-center mt-3 px-4">
                <div
                  className="flex flex-row items-center justify-center bg-white border border-gray-300 text-[#0D5990] 
            rounded-md sm:rounded-xl xs:w-full xs:h-[40px] sm:px-12 py-2 font-IranYekanRegular
            hover:bg-[#0D5990] hover:text-white cursor-pointer"
                  onClick={() =>
                    setDrawerFilters({
                      time: "30",
                      company: "",
                      isBed: false,
                      isMonitor: false,
                      isCharger: false,
                      timeFilter: 0
                      // timeFilter: 0 // Add timeFilter reset
                    })
                  }
                >
                  حدف تمامی فیلتر ها
                </div>
              </div>
              <DrawerFooter>
                <button
                  className="flex flex-row items-center justify-center bg-[#E8F2FC] border border-gray-300 text-[#0D5990] 
            rounded-md sm:rounded-xl xs:w-full xs:h-[40px] sm:px-12 py-2 font-IranYekanRegular
            hover:bg-[#0D5990] hover:text-white cursor-pointer"
                  onClick={handleDrawerSubmit}
                >
                  {" "}
                  اعمال فیلترها
                </button>
                <DrawerClose>
                  <div className="bg-white text-[#0D5990] rounded-md sm:rounded-xl px-6 sm:px-12 py-2 font-IranYekanRegular hover:bg-[#0D5990] hover:text-white border border-gray-300">
                    بستن صفحه
                  </div>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <Drawer>
            <DrawerTrigger>
              <div
                // variant="outline"
                className="bg-white text-[#0D5990] rounded-md sm:rounded-xl px-6 sm:px-12 py-2  font-IranYekanRegular hover:bg-[#0D5990] hover:text-white"
              >
                ترتیب نمایش
              </div>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="font-IranYekanRegular">
                  ترتیب نمایش اطلاعات
                </DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-4 px-4">
                <button
                  className={`w-full py-3 px-4 rounded-md font-IranYekanRegular transition-all duration-300 ${sort === "cheap"
                    ? "bg-[#0D5990] text-white"
                    : "bg-white text-[#0D5990] border border-gray-300 hover:bg-[#E8F2FC]"
                    }`}
                  onClick={() => handleSortClick("cheap")}
                >
                  ارزان‌ترین
                </button>
                <button
                  className={`w-full py-3 px-4 rounded-md font-IranYekanRegular transition-all duration-300 ${sort === "expensive"
                    ? "bg-[#0D5990] text-white"
                    : "bg-white text-[#0D5990] border border-gray-300 hover:bg-[#E8F2FC]"
                    }`}
                  onClick={() => handleSortClick("expensive")}
                >
                  گران‌ترین
                </button>
              </div>
              <DrawerFooter>


                <DrawerClose>
                  <div className="bg-white text-[#0D5990] rounded-md sm:rounded-xl px-6 sm:px-12 py-2  font-IranYekanRegular hover:bg-[#0D5990] hover:text-white">
                    بستن
                  </div>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </>
  );
};

export default SearchComponent;
