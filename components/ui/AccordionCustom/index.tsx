import React, { Dispatch, FunctionComponent, SetStateAction } from "react";
import { cx } from "class-variance-authority";
import ChevronDown from "@/components/ui/icons_custom/ChevronDown";
import ChevronUp from "@/components/ui/icons_custom/ChevronUp";

interface AccordionProps {
  title: string;
  description: string;
  active?: number;
  id: number;
  setActive: Dispatch<SetStateAction<number | undefined>>;
}
const AccordionCustom: FunctionComponent<AccordionProps> = ({
  title,
  description,
  id,
  active,
  setActive,
}) => {
  return (
    <>
      <div
        className={cx([
          "w-full rounded-md border flex flex-col gap-y-4 p-6",
          active === id
            ? " bg-[#0D5990] text-white border-primary"
            : "border-secondary",
        ])}
      >
        <div className="flex justify-between items-center w-full">
          {active === id ? (
            <ChevronUp
              className="text-white cursor-pointer"
              onClick={() => setActive(undefined)}
            />
          ) : (
            <ChevronDown
              className="text-dark cursor-pointer"
              onClick={() => setActive(id)}
            />
          )}
          <div
            className={cx(
              "font-IranYekanBold xl:text-lg lg:text-base md:text-base sm:text-sm xs:text-sm xs:text-right sm:text-right ",
              [active === id ? "text-white" : "text-black"]
            )}
          >
            {title}
          </div>
        </div>
        {active === id && (
          <div

            className="font-IranYekanRegular xl:text-lg lg:text-base md:text-base sm:text-sm xs:text-xs text-white w-full text-justify"
          >
            {description}
          </div>
        )}
      </div>
    </>
  );
};

export default AccordionCustom;
