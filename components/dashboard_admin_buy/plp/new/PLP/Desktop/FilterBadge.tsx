import React, { FunctionComponent } from "react";
import { cx } from "class-variance-authority";

interface FilterBadgeProps {
  title: string;
  active: boolean;
  onClick: () => void;
}
const FilterBadge: FunctionComponent<FilterBadgeProps> = ({
  title,
  active = false,
  onClick,
}) => {
  return (
    <>
      <div
        onClick={() => onClick()}
        className={cx([
          "rounded-full px-5 border cursor-pointer py-1 font-IranYekanRegular text-right",
          active
            ? "bg-active text-primary font-IranYekanRegular border-primary"
            : "bg-third text-deactive border-deactive",
        ])}
      >
        {title}
      </div>
    </>
  );
};

export default FilterBadge;
