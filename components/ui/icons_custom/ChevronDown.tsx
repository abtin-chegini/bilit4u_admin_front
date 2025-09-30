import * as React from "react";
import { SVGProps } from "react";

const ChevronDown = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="9"
    viewBox="0 0 14 9"
    fill="none"
    {...props}
  >
    <path
      d="M1 1.57568L6.95716 7.58801"
      stroke="currentColor"
      strokeLinecap="round"
    />
    <path
      d="M7.05029 7.66943L12.7073 1.36812"
      stroke="currentColor"
      strokeLinecap="round"
    />
  </svg>
);
export default ChevronDown;
