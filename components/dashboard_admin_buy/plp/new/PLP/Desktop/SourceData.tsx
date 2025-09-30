import React, { FunctionComponent } from "react";
import { SrvRequestResItem } from "@/constants/interfaces";
import Skeleton from "react-loading-skeleton";
import numberConvertor from "@/../../lib/numberConvertor";

interface SourceDataProps {
  data?: SrvRequestResItem;
  isPending: boolean;
}

const SourceData: FunctionComponent<SourceDataProps> = ({
  isPending,
  data,
}) => {
  const reverseString = (str: string) => {
    const parts = str.split("/");
    const reversedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return reversedDate;
  };
  return (
    <>
      <div className="flex flex-col items-center gap-y-2 w-1/4 font-IranYekanRegular">
        {isPending ? (
          <Skeleton width={39} height={9} style={{ borderRadius: "5px" }} />
        ) : (
          <div className="text-deactive text-xxs font-IranYekanRegular">
            مبدا
          </div>
        )}
        {isPending ? (
          <Skeleton width={54} height={14} style={{ borderRadius: "5px" }} />
        ) : (
          <div className="font-IranYekanRegular text-black text-base">
            {numberConvertor(data?.DepartTime ?? "")}
          </div>
        )}

        {isPending ? (
          <Skeleton width={70} height={14} style={{ borderRadius: "5px" }} />
        ) : (
          <div className="text-dark text-xxs font-IranYekanRegular">
            {reverseString(numberConvertor(data?.DepartDate ?? ""))}
          </div>
        )}

        {isPending ? (
          <Skeleton width={104} height={14} style={{ borderRadius: "5px" }} />
        ) : (
          <div className="text-deactive text-xxs font-IranYekanRegular">
            {data?.SrcCityName}
          </div>
        )}
      </div>
    </>
  );
};

export default SourceData;
