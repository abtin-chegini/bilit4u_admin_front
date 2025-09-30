import React, { FunctionComponent } from "react";
import { SrvRequestResItem } from "@/constants/interfaces";
import Skeleton from "react-loading-skeleton";

interface DestinationDataProps {
  data?: SrvRequestResItem;
  isPending: boolean;
}
const DestinationData: FunctionComponent<DestinationDataProps> = ({
  data,
  isPending,
}) => {
  return (
    <>
      <div className="flex flex-col items-center gap-y-1.5 w-1/4 font-IranYekanRegular">
        {isPending ? (
          <Skeleton width={39} height={9} style={{ borderRadius: "5px" }} />
        ) : (
          <div className="text-deactive font-IranYekanRegular text-xxs">
            مقصد
          </div>
        )}
        {isPending ? (
          <Skeleton width={54} height={14} style={{ borderRadius: "5px" }} />
        ) : (
          <div className="font-IranYekanRegular  text-black text-base">
            ۱۹ : ۳۰
          </div>
        )}

        {isPending ? (
          <Skeleton width={70} height={14} style={{ borderRadius: "5px" }} />
        ) : (
          <div className="text-dark text-xxs font-IranYekanRegular">
            {" "}
            ۳۰ فروردین{" "}
          </div>
        )}

        {isPending ? (
          <Skeleton width={104} height={14} style={{ borderRadius: "5px" }} />
        ) : (
          <div className="text-deactive text-xxs">{data?.DesCityName}</div>
        )}
      </div>
    </>
  );
};

export default DestinationData;
