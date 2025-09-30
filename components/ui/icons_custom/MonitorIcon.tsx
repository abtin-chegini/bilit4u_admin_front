import * as React from "react";
import { SVGProps } from "react";

const MonitorIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="21"
    viewBox="0 0 22 21"
    fill="none"
    {...props}
  >
    <path
      d="M20 0.5H2C0.9 0.5 0 1.4 0 2.5V14.5C0 15.6 0.9 16.5 2 16.5H9V18.5H7V20.5H15V18.5H13V16.5H20C21.1 16.5 22 15.6 22 14.5V2.5C22 1.4 21.1 0.5 20 0.5ZM20 14.5H2V2.5H20V14.5Z"
      fill="currentColor"
    />
  </svg>
);
export default MonitorIcon;
