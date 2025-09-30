import * as React from "react";
import { SVGProps } from "react";

const ChevronLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="19"
    viewBox="0 0 12 19"
    fill="none"
    {...props}
  >
    <path
      d="M10.1675 1.0769L1.12489 9.22042"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M1 9.35181L9.63818 17.9297"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
export default ChevronLeft;
