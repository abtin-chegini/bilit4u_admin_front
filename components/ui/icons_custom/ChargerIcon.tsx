import * as React from "react";
import { SVGProps } from "react";

const ChargerIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="19"
    viewBox="0 0 12 19"
    fill="none"
    {...props}
  >
    <path
      d="M10 6.5V11.16L6.5 14.67V16.5H5.5V14.67L2 11.15V6.5H10ZM10 0.5H8V4.5H4V0.5H2V4.5H1.99C0.9 4.49 0 5.39 0 6.48V12L3.5 15.5V18.5H8.5V15.5L12 11.99V6.5C12 5.4 11.1 4.5 10 4.5V0.5Z"
      fill="currentColor"
    />
  </svg>
);
export default ChargerIcon;
