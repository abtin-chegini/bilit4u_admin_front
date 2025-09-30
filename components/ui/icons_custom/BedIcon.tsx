import * as React from "react";
import { SVGProps } from "react";

const BedIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="12"
    viewBox="0 0 20 12"
    fill="none"
    {...props}
  >
    <path
      d="M3 6.5C3.78 6.5 4.55 6.2 5.14 5.6C6.3 4.41 6.28 2.52 5.1 1.36C4.51 0.79 3.75 0.5 3 0.5C2.22 0.5 1.45 0.8 0.86 1.4C-0.3 2.59 -0.28 4.48 0.9 5.64C1.49 6.21 2.25 6.5 3 6.5ZM2.29 2.8C2.48 2.61 2.73 2.5 3 2.5C3.26 2.5 3.51 2.6 3.7 2.78C4.1 3.17 4.1 3.79 3.72 4.19C3.52 4.39 3.27 4.5 3 4.5C2.74 4.5 2.49 4.4 2.3 4.22C1.9 3.82 1.9 3.2 2.29 2.8ZM16 0.5H7V6.5H20V4.5C20 2.29 18.21 0.5 16 0.5ZM9 4.5V2.5H16C17.1 2.5 18 3.4 18 4.5H9ZM0 9.5H6V11.5H14V9.5H20V7.5H0V9.5Z"
      fill="currentColor"
    />
  </svg>
);
export default BedIcon;
