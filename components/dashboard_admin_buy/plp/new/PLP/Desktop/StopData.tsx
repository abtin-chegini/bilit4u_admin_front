import React, { FunctionComponent } from "react";
import { SrvRequestResItem } from "@/constants/interfaces";
import Skeleton from "react-loading-skeleton";
import numberConvertor from "@/lib/numberConvertor";

interface StopDataProps {
  data?: SrvRequestResItem;
  isPending: boolean;
}
const StopData: FunctionComponent<StopDataProps> = ({ data, isPending }) => {
  return (
    <>
      <div className="flex items-center h-full w-1/2 relative font-IranYekanRegular  ">
        <div className="flex flex-col gap-y-2 absolute -top-1.5 left-28 lg:left-16 xl:left-24">
          {isPending ? (
            <Skeleton
              width={100}
              height={20}
              style={{ borderRadius: "20px" }}
            />
          ) : (
            <div className="bg-active border border-[#CCD6E1] py-0.5 px-4 font-IranYekanLight text-[#0D5990] text-sm rounded-full">
              حدود ۹ ساعت
            </div>
          )}

          {data?.OtherDestinations?.length !== 0 && (
            <>
              {isPending ? (
                <Skeleton
                  width={82}
                  height={14}
                  style={{ borderRadius: "5px" }}
                />
              ) : (
                <div className="text-dark text-xxs text-center direction-rtl">
                  {numberConvertor(
                    data?.OtherDestinations?.length.toString() ?? ""
                  )}{" "}
                  توقف در مسیر
                </div>
              )}
            </>
          )}
        </div>

        <div className="w-3 h-3 bg-[#0D5990] rounded-full px-1" />
        <hr className="border-dashed border-[#0D5990] w-full" />
        <div className="w-3 h-3 bg-[#0D5990] rounded-full px-1" />
      </div>
    </>
  );
};

export default StopData;
