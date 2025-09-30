import * as React from "react";
import { SVGProps } from "react";

const ChevronRight = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="20"
    viewBox="0 0 12 20"
    fill="none"
    {...props}
  >
    <path
      d="M1.99463 18.1379L10.6266 9.56043"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10.7451 9.4231L1.69634 1.27949"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
export default ChevronRight;
