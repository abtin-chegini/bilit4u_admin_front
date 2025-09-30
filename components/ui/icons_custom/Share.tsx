import { SVGProps } from "react";
import * as React from "react";

const ShareIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <g clipPath="url(#clip0_1_498)">
      <path
        d="M7 8V5L0 12L7 19V16L3 12L7 8ZM13 9V5L6 12L13 19V14.9C18 14.9 21.5 16.5 24 20C23 15 20 10 13 9Z"
        fill="currentColor"
      />
    </g>
    <defs>
      <clipPath id="clip0_1_498">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default ShareIcon;
