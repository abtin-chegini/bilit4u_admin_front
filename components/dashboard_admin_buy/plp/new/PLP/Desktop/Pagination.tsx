import React, { Dispatch, FunctionComponent } from "react";
import ChevronLeft from "@/components/ui/icons_custom/ChevronLeft";
import ChevronRight from "@/components/ui/icons_custom/ChevronRight";
import { cx } from "class-variance-authority";
import numberConvertor from "@/lib/numberConvertor";

interface PaginationProps {
  pageNumber: number;
  setPageNumber: (page: number) => void;
  totalPages?: number;
}
const Pagination: FunctionComponent<PaginationProps> = ({
  pageNumber,
  setPageNumber,
  totalPages,
}) => {
  return (
    <div className="flex items-center justify-center gap-x-4 font-IranYekanRegular">
      {pageNumber !== 1 && (
        <div
          className="h-10 w-10 border border-secondary rounded-md cursor-pointer flex justify-center items-center"
          onClick={() => {
            document
              .getElementById("main_div")
              ?.scrollIntoView({ behavior: "smooth" });
            setPageNumber(pageNumber - 1);
          }}
        >
          <ChevronLeft className="text-dark" />
        </div>
      )}
      {Array.from({ length: totalPages! }, (v, i) => i).map((item) => (
        <div
          className={cx([
            "h-10 w-10 rounded border cursor-pointer flex justify-center items-center",
            pageNumber === item + 1
              ? " bg-[#0D5990] border-primary text-white"
              : "border-secondary text-dark",
          ])}
          key={`page-${item}`}
          onClick={() => {
            document
              .getElementById("main_div")
              ?.scrollIntoView({ behavior: "smooth" });
            setPageNumber(item + 1);
          }}
        >
          {numberConvertor((item + 1).toString())}
        </div>
      ))}
      {pageNumber !== totalPages && (
        <div
          className="h-10 w-10 border border-secondary rounded cursor-pointer flex justify-center items-center"
          onClick={() => {
            document
              .getElementById("main_div")
              ?.scrollIntoView({ behavior: "smooth" });
            setPageNumber(pageNumber + 1);
          }}
        >
          <ChevronRight className="text-dark" />
        </div>
      )}
    </div>
  );
};

export default Pagination;
