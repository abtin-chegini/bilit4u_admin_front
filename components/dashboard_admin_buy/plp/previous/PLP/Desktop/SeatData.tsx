import React, { FunctionComponent } from "react";
import { SrvRequestResItem } from "@/constants/interfaces";
import Skeleton from "react-loading-skeleton";
import SeatIcon from "@/components/ui/icons_custom/SeatIcon";
import numberConvertor from "@/lib/numberConvertor";
import MonitorIcon from "@/components/ui/icons_custom/MonitorIcon";
import BedIcon from "@/components/ui/icons_custom/BedIcon";
import ChargerIcon from "@/components/ui/icons_custom/ChargerIcon";

interface SeatDataProps {
  data?: SrvRequestResItem;
  isPending: boolean;
}

const SeatData: FunctionComponent<SeatDataProps> = ({ data, isPending }) => {
  // Get available seats directly from data.Cnt
  const availableSeats = parseInt(data?.Cnt ?? "0");
  const totalSeats = 44; // Total capacity

  // Calculate progress bar percentage - INVERSE relationship
  const filledPercentage = ((totalSeats - availableSeats) / totalSeats * 100).toFixed(0);

  const isFullCapacity = availableSeats === 0;

  return (
    <>
      {isPending ? (
        <Skeleton height={70} style={{ borderRadius: "5px" }} />
      ) : (
        <div className="shadow-md flex justify-between items-center py-3 px-5 font-IranYekanRegular bg-white rounded border border-[#CCD6E1]">
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center gap-x-4">
              <SeatIcon className={isFullCapacity ? "text-gray-400 opacity-60" : "text-[#0D5990]"} />
              <div className={isFullCapacity ? "text-gray-400 font-semibold" : "text-[#0D5990] font-IranYekanRegular"}>
                {isFullCapacity ? (
                  "ظرفیت تکمیل"
                ) : (
                  <>
                    {numberConvertor(availableSeats.toString())}{" "}
                    صندلی خالی
                  </>
                )}
              </div>
            </div>
            {/* Always show progress bar, with full width when capacity is full */}
            <div className="bg-active shadow-1 h-2 rounded-lg">
              <div
                className={`h-full rounded-lg ${isFullCapacity ? "bg-gray-300" : "bg-[#0D5990]"}`}
                style={{
                  width: isFullCapacity ? "100%" : `${filledPercentage}%`,
                }}
              />
            </div>
          </div>
          <div className={`grid grid-cols-2 gap-4 direction-rtl ${isFullCapacity ? "opacity-70" : ""}`}>
            {data?.IsBed && (
              <div className="flex items-center gap-x-2.5">
                <BedIcon className="text-[#0D5990] text-base" />
                <div className="text-xxs">تخت خواب شو</div>
              </div>
            )}
            {data?.IsMonitor && (
              <div className="flex items-center gap-x-2.5">
                <MonitorIcon className="text-[#0D5990] text-base" />
                <div className="text-xxs">مانیتور</div>
              </div>
            )}
            {data?.IsCharger && (
              <div className="flex items-center gap-x-2.5">
                <ChargerIcon className="text-[#0D5990] text-base" />
                <div className="text-xxs">پریز شارژ</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SeatData;