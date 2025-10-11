import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
} from "react";
import Skeleton from "react-loading-skeleton";
import useDate from "@/hooks/useDate";
import moment from "moment";
import { cx } from "class-variance-authority";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface TopComponentProps {
  isPending: boolean;
  activeDate: string;
  setActiveDate: Dispatch<SetStateAction<string>>;
}
const TopComponent: FunctionComponent<TopComponentProps> = ({
  isPending,
  activeDate,
  setActiveDate,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const tilesPerPage = 10; // Show 10 items at a time

  // Generate days array starting from today
  const generateDaysArray = () => {
    const days = [];
    const today = new Date();

    // Generate 30 days starting from today
    for (let i = 0; i < 30; i++) {
      const date = moment(today).add({ day: i }).toDate().toLocaleDateString("fa-IR");
      days.push(date);
    }

    return days;
  };

  const daysArray = generateDaysArray();
  const totalPages = Math.ceil(daysArray.length / tilesPerPage);

  // Get current page tiles
  const getCurrentPageTiles = () => {
    const startIndex = currentPage * tilesPerPage;
    const endIndex = startIndex + tilesPerPage;
    return daysArray.slice(startIndex, endIndex);
  };

  // Navigation functions with animation
  const goToNextPage = () => {
    if (currentPage < totalPages - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentPage(currentPage + 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentPage(currentPage - 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <div className="xl:px-16 lg:px-16 md:px-16 sm:px-5 pt-6 font-IranYekanRegular">
      <div className="w-full py-2 gap-x-4 items-center hidden sm:flex relative">
        <TooltipProvider>
          <div className="flex items-center justify-between w-full">
            {/* Left Arrow Button */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0 || isAnimating}
                  className={cx([
                    "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ml-2",
                    currentPage === 0 || isAnimating
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-[#0D5990] hover:bg-gray-100 cursor-pointer hover:scale-110 active:scale-95"
                  ])}
                >
                  <ChevronRightIcon size={24} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-gray-800 text-white text-xs font-IranYekanRegular px-2 py-1"
              >
                <p>{currentPage === 0 ? "روزهای قبلی (غیرفعال)" : "روزهای قبلی"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Days Container */}
            {isPending ? (
              <div className="flex items-center gap-x-4 overflow-hidden flex-1 justify-center">
                <Skeleton
                  count={10}
                  width={80}
                  height={60}
                  containerClassName="flex items-center gap-x-4"
                />
              </div>
            ) : (
              <div className={`flex flex-row items-center gap-x-4 flex-1 justify-center transition-all duration-300 ease-in-out ${isAnimating ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
                {getCurrentPageTiles().map((dateStr, index) => {
                  const { month, day, monthText } = useDate(dateStr);
                  const isSelected = activeDate === dateStr;

                  return (
                    <div
                      key={`day-${currentPage}-${index}`}
                      className={cx([
                        "flex flex-col items-center justify-center py-3.5 px-5 border rounded-xl cursor-pointer min-w-[80px] flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95",
                        isSelected
                          ? "text-white bg-[#0D5990] font-IranYekanRegular text-base shadow-md"
                          : "border border-[#CCD6E1] text-[#0D5990] font-IranYekanRegular text-base hover:bg-gray-50 hover:shadow-sm",
                      ])}
                      onClick={() => setActiveDate(dateStr)}
                    >
                      <div className="font-IranYekanBold text-sm">{day}</div>
                      <div className="font-IranYekanBold text-xs">{monthText}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Right Arrow Button */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1 || isAnimating}
                  className={cx([
                    "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 mr-2",
                    currentPage === totalPages - 1 || isAnimating
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-[#0D5990] hover:bg-gray-100 cursor-pointer hover:scale-110 active:scale-95"
                  ])}
                >
                  <ChevronLeftIcon size={24} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-gray-800 text-white text-xs font-IranYekanRegular px-2 py-1"
              >
                <p>{currentPage === totalPages - 1 ? "روزهای بعدی (غیرفعال)" : "روزهای بعدی"}</p>
              </TooltipContent>
            </Tooltip>


          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default TopComponent;
