"use client";
import {
  HTMLMotionProps,
  motion,
} from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import SourceSearchBox from "@/components/ui/SourceSearchbox/SourceSearchbox";
import DestinationSearchBox from "@/components/ui/DestinationSearchbox/DestinationSearchbox";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useRouter } from "next/navigation";
import DatePickerBig from "../DatePickerBig/DatePickerBig";
import { useTravelDateStore } from "@/store/TravelDateStore";
import { Circle, LoaderCircleIcon } from "lucide-react"
import { cityMapping } from "@/lib/utils";
import moment from "jalali-moment";
const ErrorDialog = lazy(() => import('@/components/ui/Searchbox/ErrorDialog'));
import { useAnimationStore } from "@/store/AnimationStore";
import { useSourceStore } from "@/store/SourceStore";
import { useDestinationStore } from "@/store/DestinationStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const categories = [
  {
    name: "primary",
    displayName: "اتوبوس",
    accentColor: "#ECF4FC",
    icon: "solar:bus-linear",
  },
  // {
  //   name: "train",
  //   displayName: "قطار",
  //   accentColor: "#ECF4FC",
  //   icon: "hugeicons:train-01",
  // },
  // {
  //   name: "airplane",
  //   displayName: "هواپیما",
  //   accentColor: "#ECF4FC",
  //   icon: "hugeicons:airplane-mode",
  // },

  // {
  //   name: "hotel",
  //   displayName: "هتل",
  //   accentColor: "#ECF4FC",
  //   icon: "solar:buildings-2-linear",
  // },
  // {
  //   name: "house",
  //   displayName: "اقامتگاه",
  //   accentColor: "#ECF4FC",
  //   icon: "solar:home-linear",
  // },
  // {
  //   name: "tour",
  //   displayName: "تور",
  //   accentColor: "#ECF4FC",
  //   icon: "solar:suitcase-tag-linear",
  // },
];

function SearchBox() {
  const setAnimationFromCategory = useAnimationStore(state => state.setAnimationFromCategory);

  const [isOpen, setIsOpen] = useState(false);
  const [sourceCityId, setSourceCityId] = useState<string | null>(
    localStorage.getItem("sourceCityId")
  );
  const [destinationCityId, setDestinationCityId] = useState<string | null>(
    localStorage.getItem("destinationCityId")
  );

  const { travelDate, isDateValid, getTravelDateAsMoment } = useTravelDateStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Get source and destination store functions
  const {
    sourceID,
    sourceCity,
    setSourceCity,
    setValue: setSourceValue,
    value: sourceValue
  } = useSourceStore();

  const {
    destinationID,
    destinationCity,
    setDestinationCity,
    setValue: setDestinationValue,
    value: destinationValue
  } = useDestinationStore();

  // const allEmails = getAllEmails();
  // const [emails, setEmails] = useState<Email[]>(allEmails);
  const [activeCategory, setActiveCategory] = useState("primary");
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setAnimationFromCategory(category);
  };

  const router = useRouter();
  useEffect(() => {
    // Check if there's a valid date in the Zustand store
    if (!travelDate || !isDateValid()) {
      // Try to get from localStorage first
      const localStorageDate = localStorage.getItem("TravelDate");

      if (localStorageDate) {
        // If found in localStorage, update the store
        console.log("Found date in localStorage, updating store:", localStorageDate);
        // You'd need to have a setTravelDate function in your store to do this
        // setTravelDate(localStorageDate);
      } else {
        // If not in localStorage either, set to today
        console.log("No date found, setting to today");
        // setToToday();
      }
    }
  }, []);
  interface SearchResult {
    cityId: string;
    name: string;
  }
  useEffect(() => {
    if (!isDialogOpen) {
      setIsSearching(false);
    }
  }, [isDialogOpen]);

  // Handle switching source and destination
  const handleSwitchCities = () => {
    // Trigger rotation animation
    setIsRotating(true);

    // Get current values from stores
    const tempSourceID = sourceID;
    const tempSourceCity = sourceCity;
    const tempSourceValue = sourceValue;

    const tempDestID = destinationID;
    const tempDestCity = destinationCity;
    const tempDestValue = destinationValue;

    // Check if we have valid values to swap
    if (tempSourceCity && tempSourceCity !== "شهر مبداء" &&
      tempDestCity && tempDestCity !== "شهر مقصد") {

      // Swap the values
      setSourceCity(tempDestID || "", tempDestCity);
      setSourceValue(tempDestCity);

      setDestinationCity(tempSourceID || "", tempSourceCity);
      setDestinationValue(tempSourceCity);

      console.log("Cities swapped:", {
        newSource: tempDestCity,
        newDestination: tempSourceCity
      });
    }

    // Reset rotation after animation completes
    setTimeout(() => {
      setIsRotating(false);
    }, 300);
  };

  const handleRedirect = () => {
    const sourceCityId = localStorage.getItem("sourceCityId");
    const destinationCityId = localStorage.getItem("destinationCityId");
    setIsSearching(true);

    // const travelDate = localStorage.getItem("TravelDate") || moment().format("jYYYYjMMjDD");
    let currentTravelDate;
    let searchDate;

    // Check if we have a valid date in the store
    if (travelDate && isDateValid()) {
      searchDate = travelDate;
      console.log("Using date from Zustand store:", searchDate);
    } else {
      // Fallback to localStorage
      searchDate = localStorage.getItem("TravelDate");
      console.log("Using date from localStorage:", searchDate);
    }
    if (!searchDate) {
      searchDate = moment().format("jYYYYjMMjDD");
      console.log("No date found, using today:", searchDate);
    }

    // Helper function to safely parse searchDate
    const parseSearchDate = (dateString: string): string => {
      try {
        // First, try to parse as JSON
        const parsed = JSON.parse(dateString);
        // If it's an object with a value property, return the value
        if (parsed && typeof parsed === 'object' && parsed.value) {
          return parsed.value;
        }
        // If it's not an object with value property, return the original string
        return dateString;
      } catch (error) {
        // If JSON parsing fails, it's a simple string, return as is
        return dateString;
      }
    };

    // Parse the searchDate safely to ensure it's always a string
    const TrueDate = parseSearchDate(searchDate);
    console.log("Parsed date:", TrueDate);

    // Check if the selected date is in the past
    const today = moment().startOf('day');
    const selectedDate = moment.from(TrueDate, 'fa', 'YYYYMMDD').startOf('day');

    // Check if date is in the past
    if (selectedDate.isBefore(today)) {
      setIsDialogOpen(true);
      setErrorTitle("شما مجاز به انتخاب روزهای گذشته نیستید");
      setIsSearching(false); // Reset loading state on error
      return;
    }

    // Check if date is more than 15 days in the future
    const maxAllowedDate = moment().add(15, 'days').startOf('day');
    if (selectedDate.isAfter(maxAllowedDate)) {
      setIsDialogOpen(true);
      setErrorTitle("اطلاعات بیش از ۱۵ روز موجود نیست");
      setIsSearching(false); // Reset loading state
      return;
    }

    if (sourceCityId && destinationCityId) {
      const sourceCity = Object.keys(cityMapping).find(
        (key) => cityMapping[key] === sourceCityId
      );
      const destinationCity = Object.keys(cityMapping).find(
        (key) => cityMapping[key] === destinationCityId
      );

      console.log("sourceCity:", TrueDate);
      if (sourceCity && destinationCity) {
        router.push(`/bus/${sourceCity}/${destinationCity}/${TrueDate}`);
      } else {
        setIsDialogOpen(true);
        setErrorTitle("شهرهای انتخاب شده یافت نشد");
        setIsSearching(false); // Reset loading state
      }
    } else {
      setIsDialogOpen(true);
      setErrorTitle("لطفا شهرهای مبدا و مقصد را انتخاب کنید");
      setIsSearching(false); // Reset loading state
    }
  };
  return (
    <div className="z-20">
      {/* // <div className="flex flex-col min-h-screen p-8 pb-20 gap-0 sm:p-20 max-w-[1080px] mx-auto font-IranYekanRegular "> */}
      <motion.div className="flex gap-0 flex-row-reverse" layout>
        {categories.map((category) => (
          <CategoryBadge
            id={category.name}
            key={category.name}
            isActive={activeCategory === category.name}
            accentColor={category.accentColor}
            onClick={() => handleCategoryChange(category.name)}
          >
            <motion.span data-slot="label" className="font-IranYekanRegular">{category.displayName}</motion.span>
            <motion.div layout>
              <Icon icon={category.icon} width="24" height="24"></Icon>
            </motion.div>
          </CategoryBadge>
        ))}
      </motion.div>
      {activeCategory === "primary" && (
        <div className="bg-[#ECF4FC] xl:w-[1048px] xl:h-[100px] lg:w-[960px] lg:h-[60px] md:w-[711px] md:h-[49px]  z-0  flex flex-col  justify-center rounded-b-lg shadow-md  relative">
          <div className=" h-20 flex flex-row-reverse gap-2 items-center mr-3  ">
            <div className=" ">
              <SourceSearchBox />
            </div>

            {/* Switch Button with Tooltip */}
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <button
                      onClick={handleSwitchCities}
                      className={`
                        xl:w-[48px] xl:h-[48px] 
                        lg:w-[37px] lg:h-[37px] 
                        md:w-[31px] md:h-[31px]
                        rounded-md bg-white border border-gray-200
                        hover:bg-gray-50 hover:border-gray-300
                        active:bg-gray-100
                        transition-all duration-200
                        flex items-center justify-center
                        shadow-sm hover:shadow-md
                        ${isRotating ? 'animate-spin' : ''}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      disabled={
                        !sourceCity || sourceCity === "شهر مبداء" ||
                        !destinationCity || destinationCity === "شهر مقصد"
                      }
                    >
                      <Icon
                        icon="tabler:arrows-exchange-2"
                        className="xl:w-5 xl:h-5 lg:w-4 lg:h-4 md:w-3.5 md:h-3.5 text-gray-600"
                      />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-gray-800 text-white text-xs font-IranYekanRegular px-2 py-1"
                >
                  <p>جابه جایی مبدا و مقصد</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className=" ">
              <DestinationSearchBox />
            </div>
            <div className=" ">
              <DatePickerBig />
            </div>
            <div className="mr-6 ">
              <button
                className="xl:w-[185px] xl:h-[48px] lg:w-[185px] lg:h-[37px] md:w-[135px] md:h-[32px] rounded-md justify-center items-center hover:bg-blue-700 border border-gray-200 flex flex-row gap-1 bg-[#0D5990] disabled:opacity-70 disabled:hover:bg-[#0D5990]"
                onClick={handleRedirect}
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <LoaderCircleIcon className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
                    <p className="xl:text-sm lg:text-xs font-IranYekanRegular text-[#FFFFFF]">
                      در حال جستجو...
                    </p>
                  </>
                ) : (
                  <p className="xl:text-sm lg:text-xs font-IranYekanRegular text-[#FFFFFF]">
                    جستجو
                  </p>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeCategory === "airplane" && (
        <div className="bg-[#ECF4FC] xl:w-[1048px] xl:h-[100px] lg:w-[960px] lg:h-[60px] md:w-[711px] md:h-[49px] z-0 flex flex-col justify-center rounded-b-lg shadow-md relative">
          <div className="h-20 flex flex-row-reverse gap-2 items-center mr-3">
            <p className="text-xs font-IranYekanRegular"> به زودی </p>
          </div>
        </div>
      )}
      {activeCategory === "train" && (
        <div className="bg-[#ECF4FC] xl:w-[1048px] xl:h-[100px] lg:w-[960px] lg:h-[60px] md:w-[711px] md:h-[49px] z-0 flex flex-col justify-center rounded-b-lg shadow-md relative">
          <div className="h-20 flex flex-row-reverse gap-2 items-center mr-3">
            <p className="text-xs font-IranYekanRegular"> به زودی </p>
          </div>
        </div>
      )}
      {activeCategory === "hotel" && (
        <div className="bg-[#ECF4FC] xl:w-[1048px] xl:h-[100px] lg:w-[960px] lg:h-[60px] md:w-[711px] md:h-[49px] z-0 flex flex-col justify-center rounded-b-lg shadow-md relative">
          <div className="h-20 flex flex-row-reverse gap-2 items-center mr-3">
            <p className="text-xs font-IranYekanRegular"> به زودی </p>
          </div>
        </div>
      )}
      {activeCategory === "house" && (
        <div className="bg-[#ECF4FC] xl:w-[1048px] xl:h-[100px] lg:w-[960px] lg:h-[60px] md:w-[711px] md:h-[49px] z-0 flex flex-col justify-center rounded-b-lg shadow-md relative">
          <div className="h-20 flex flex-row-reverse gap-2 items-center mr-3">
            <p className="text-xs font-IranYekanRegular"> به زودی </p>
          </div>
        </div>
      )}
      {activeCategory === "tour" && (
        <div className="bg-[#ECF4FC] xl:w-[1048px] xl:h-[100px] lg:w-[960px] lg:h-[60px] md:w-[711px] md:h-[49px] z-0 flex flex-col justify-center rounded-b-lg shadow-md relative">
          <div className="h-20 flex flex-row-reverse gap-2 items-center mr-3">
            <p className="text-xs font-IranYekanRegular"> به زودی </p>
          </div>
        </div>
      )}

      {/* <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setIsSearching(false); // Reset loading state when dialog closes
      }}>
        <DialogContent>
          <DialogHeader className="flex flex-row justify-center">
            <DialogTitle className="text-red-400 text-right font-IranYekanRegular mt-4">
              {errorTitle}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-start">

          </DialogFooter>
        </DialogContent>
      </Dialog> */}
      {isDialogOpen && (
        <Suspense fallback={<div className="hidden">Loading...</div>}>
          <ErrorDialog
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            errorTitle={errorTitle}
            setIsSearching={setIsSearching}
          />
        </Suspense>
      )}
    </div>
  );
}
const CategoryBadge = ({
  isActive = false,
  accentColor,
  children,
  id,
  ...props
}: {
  isActive?: boolean;
  accentColor: string;
} & HTMLMotionProps<"div">) => {
  return (
    <motion.div
      className={`flex justify-center rounded-t-lg  gap-2 xl:py-4 lg:py-2 md:py-2 px-6 shadow-md font-semibold transition-colors [&>[data-slot=label]]: transition-all [&>[data-slot=label]]: text-black ${isActive
        ? "flex xl:w-40 lg:w-30 md:w-30"
        : "[&>[data-slot=label]]:hidden"
        } `}
      style={{
        backgroundColor: isActive ? accentColor : "#FFFFFF",
        color: isActive ? "black" : "inherit",
      }}
      layoutId={id}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default SearchBox;