import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
} from "react";
import ChevronUp from "@/components/ui/icons_custom/ChevronUp";
import ChevronDown from "@/components/ui/icons_custom/ChevronDown";
import Skeleton from "react-loading-skeleton";

interface RightCardCheckProps {
  isPending: boolean;
  isMonitor: boolean;
  setIsMonitor: Dispatch<SetStateAction<boolean>>;
  isBed: boolean;
  setIsBed: Dispatch<SetStateAction<boolean>>;
  isCharger: boolean;
  setIsCharger: Dispatch<SetStateAction<boolean>>;
}
const RightCheckCard: FunctionComponent<RightCardCheckProps> = ({
  isPending,
  isMonitor,
  setIsMonitor,
  isCharger,
  setIsCharger,
  isBed,
  setIsBed,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <>
      <div className="bg-white border border-secondary rounded-md font-IranYekanRegular flex flex-col px-4 py-2.5 gap-y-2.5 shadow-1">
        {isPending ? (
          <div className="flex items-center justify-between">
            <Skeleton width={20} height={20} style={{ borderRadius: "5px" }} />
            <Skeleton width={155} height={20} style={{ borderRadius: "5px" }} />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {isExpanded ? (
              <ChevronUp
                className="text-dark cursor-pointer"
                onClick={() => setIsExpanded((prevState) => !prevState)}
              />
            ) : (
              <ChevronDown
                className="text-dark cursor-pointer"
                onClick={() => setIsExpanded((prevState) => !prevState)}
              />
            )}
            <div className="direction-rtl text-black text-sm">امکانات</div>
          </div>
        )}
        {isExpanded && (
          <>
            {isPending ? (
              <Skeleton
                count={3}
                width={100}
                height={20}
                style={{ borderRadius: "5px" }}
                containerClassName="self-end"
              />
            ) : (
              <>
                <div className="direction-rtl flex items-center gap-x-2">
                  <input
                    type="checkbox"
                    checked={isMonitor}
                    onChange={(e) => setIsMonitor(e.target.checked)}
                  />
                  <div className="text-sm text-dark">مانیتور دار</div>
                </div>
                <div className="direction-rtl flex items-center gap-x-2">
                  <input
                    type="checkbox"
                    checked={isCharger}
                    onChange={(e) => setIsCharger(e.target.checked)}
                  />
                  <div className="text-sm text-dark">پریز شارژ</div>
                </div>
                <div className="direction-rtl flex items-center gap-x-2">
                  <input
                    type="checkbox"
                    checked={isBed}
                    onChange={(e) => setIsBed(e.target.checked)}
                  />
                  <div className="text-sm text-dark">تخت خواب شو</div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default RightCheckCard;
