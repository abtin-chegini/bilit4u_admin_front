import * as React from "react";
import { SVGProps } from "react";

const ChevronUp = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="9"
    viewBox="0 0 14 9"
    fill="none"
    {...props}
  >
    <path
      d="M13 7.3772L7.04284 1.36487"
      stroke="currentColor"
      strokeLinecap="round"
    />
    <path
      d="M6.94971 1.2832L1.29271 7.58452"
      stroke="currentColor"
      strokeLinecap="round"
    />
  </svg>
);
export default ChevronUp;
