import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import ChevronUp from "@/components/ui/icons_custom/ChevronUp";
import ChevronDown from "@/components/ui/icons_custom/ChevronDown";
import Skeleton from "react-loading-skeleton";
import TimeRangeSelector from "./TimeRangeSelector";

interface RightCardProps {
  title: string;
  setValue: Dispatch<SetStateAction<string>>;
  onTimeFilterChange?: (timeValue: number) => void;

  // fetchData: (date: string) => void;
  isPending: boolean;
  // activeDate: string;
}
const RightCard: FunctionComponent<RightCardProps> = ({
  onTimeFilterChange,
  // leftTitle,
  // rightTitle,
  // centerTitle,
  // allTitle,
  // min,
  // max,
  // price = false,
  // value,
  // setValue,
  isPending,
  title,
  // fetchData,
  // activeDate,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleTimeChange = (timeValue: number) => {
    if (onTimeFilterChange) {
      onTimeFilterChange(timeValue);
    }
  };
  // useEffect(() => {
  //   if (!isExpanded) {
  //     setValue(undefined);
  //   }
  // }, [isExpanded]);
  // const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setValue(event.target.value);
  //   fetchData(activeDate);
  // };
  return (
    <>
      <div className="bg-white border border-secondary rounded-md flex flex-col px-4 py-2.5 gap-y-2.5 shadow-1 font-IranYekanRegular">
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
            <div className="direction-rtl text-black text-sm">{title}</div>
          </div>
        )}

        {isExpanded && (
          <>
            {isPending ? (
              <div className="flex items-center justify-between">
                <Skeleton
                  width={79}
                  height={20}
                  style={{ borderRadius: "5px" }}
                />
                <Skeleton
                  width={79}
                  height={20}
                  style={{ borderRadius: "5px" }}
                />
              </div>
            ) : (
              <div className="mt-2.5">

              </div>
            )}
            {isPending ? (
              <Skeleton
                width={209}
                height={20}
                style={{ borderRadius: "5px" }}
                containerClassName="flex justify-center w-full items-center"
              />
            ) : (
              <div className="w-full relative pb-8">

                {/* <RangePicker
                  min={min}
                  max={max}
                  price={price}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                /> */}

                <TimeRangeSelector onTimeChange={handleTimeChange} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default RightCard;
