"use client";

import React from "react";
import { FaBusAlt } from "react-icons/fa";
import { CountdownTimer } from "@/components/ui/countdown-timer";

// Create SVG components for each icon
const PassengerIcon = ({ color = "#9D9A9A" }) => (
    <svg width="20" height="10" viewBox="0 0 24 12" fill="none">
        <path
            d="M4 7C5.1 7 6 6.1 6 5C6 3.9 5.1 3 4 3C2.9 3 2 3.9 2 5C2 6.1 2.9 7 4 7ZM5.13 8.1C4.76 8.04 4.39 8 4 8C3.01 8 2.07 8.21 1.22 8.58C0.48 8.9 0 9.62 0 10.43V12H4.5V10.39C4.5 9.56 4.73 8.78 5.13 8.1ZM20 7C21.1 7 22 6.1 22 5C22 3.9 21.1 3 20 3C18.9 3 18 3.9 18 5C18 6.1 18.9 7 20 7ZM24 10.43C24 9.62 23.52 8.9 22.78 8.58C21.93 8.21 20.99 8 20 8C19.61 8 19.24 8.04 18.87 8.1C19.27 8.78 19.5 9.56 19.5 10.39V12H24V10.43ZM16.24 7.65C15.07 7.13 13.63 6.75 12 6.75C10.37 6.75 8.93 7.14 7.76 7.65C6.68 8.13 6 9.21 6 10.39V12H18V10.39C18 9.21 17.32 8.13 16.24 7.65ZM8.07 10C8.16 9.77 8.2 9.61 8.98 9.31C9.95 8.93 10.97 8.75 12 8.75C13.03 8.75 14.05 8.93 15.02 9.31C15.79 9.61 15.83 9.77 15.93 10H8.07ZM12 2C12.55 2 13 2.45 13 3C13 3.55 12.55 4 12 4C11.45 4 11 3.55 11 3C11 2.45 11.45 2 12 2ZM12 0C10.34 0 9 1.34 9 3C9 4.66 10.34 6 12 6C13.66 6 15 4.66 15 3C15 1.34 13.66 0 12 0Z"
            fill={color}
        />
    </svg>
);

const ConfirmIcon = ({ color = "#9D9A9A" }) => (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
        <path
            d="M10.001 4.5H15.001V6.5H10.001V4.5ZM10.001 11.5H15.001V13.5H10.001V11.5ZM16.001 0H2.00098C0.900977 0 0.000976562 0.9 0.000976562 2V16C0.000976562 17.1 0.900977 18 2.00098 18H16.001C17.101 18 18.001 17.1 18.001 16V2C18.001 0.9 17.101 0 16.001 0ZM16.001 16H2.00098V2H16.001V16ZM8.00098 3H3.00098V8H8.00098V3ZM7.00098 7H4.00098V4H7.00098V7ZM8.00098 10H3.00098V15H8.00098V10ZM7.00098 14H4.00098V11H7.00098V14Z"
            fill={color}
        />
    </svg>
);

const PaymentIcon = ({ color = "#9D9A9A" }) => (
    <svg width="16" height="12" viewBox="0 0 20 16" fill="none">
        <path
            d="M18.001 0H2.00098C0.890977 0 0.0109766 0.89 0.0109766 2L0.000976562 14C0.000976562 15.11 0.890977 16 2.00098 16H18.001C19.111 16 20.001 15.11 20.001 14V2C20.001 0.89 19.111 0 18.001 0ZM18.001 14H2.00098V8H18.001V14ZM18.001 4H2.00098V2H18.001V4Z"
            fill={color}
        />
    </svg>
);

const TicketIcon = ({ color = "#9D9A9A" }) => (
    <svg width="16" height="12" viewBox="0 0 20 16" fill="none">
        <path
            d="M20.001 6V2C20.001 0.9 19.101 0 18.001 0H2.00098C0.900977 0 0.0109768 0.9 0.0109768 2V6C1.11098 6 2.00098 6.9 2.00098 8C2.00098 9.1 1.11098 10 0.000976562 10V14C0.000976562 15.1 0.900977 16 2.00098 16H18.001C19.101 16 20.001 15.1 20.001 14V10C18.901 10 18.001 9.1 18.001 8C18.001 6.9 18.901 6 20.001 6ZM18.001 4.54C16.811 5.23 16.001 6.53 16.001 8C16.001 9.47 16.811 10.77 18.001 11.46V14H11.001H2.00098V11.46C3.19098 10.77 4.00098 9.47 4.00098 8C4.00098 6.52 3.20098 5.23 2.01098 4.54L2.00098 2H18.001V4.54ZM11.001 12V14H12.001H13.001V8.63V6V2H11.001V6V8.63V12Z"
            fill={color}
        />
    </svg>
);

const stepsData = [
    {
        label: "انتخاب صندلی و مشخصات مسافران",
        icon: ({ color }: { color: string }) => <FaBusAlt color={color} size={16} />,
        component: <div>انتخاب صندلی و مشخصات مسافران Component</div>,
    },
    {
        label: "تأیید اطلاعات",
        icon: ConfirmIcon,
        component: <div>تأیید اطلاعات Component</div>,
    },
    {
        label: "پرداخت",
        icon: PaymentIcon,
        component: <div>پرداخت Component</div>,
    },
    {
        label: "صدور بلیط",
        icon: TicketIcon,
        component: <div>صدور بلیط Component</div>,
    },
];

interface StepsProps {
    active?: number; // 0-based index of the active step (0 for first step, etc)
    onTimeUp?: () => void;
}

export default function Steps({ active = 1, onTimeUp }: StepsProps) {
    return (
        <div className="w-full p-6" dir="rtl">
            {/* Desktop View - Steps from right to left with progress bar below labels */}
            <div className="hidden sm:block">
                <div className="relative">
                    {/* Steps */}
                    <div className="flex justify-between items-center mb-4">
                        {stepsData.map((step, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = index < active;
                            const isActive = index === active;
                            const Icon = step.icon;

                            return (
                                <div
                                    key={index}
                                    className="flex flex-col items-center text-center min-w-[120px]"
                                >
                                    <div
                                        className={`
                                        w-8 h-8 flex items-center justify-center rounded-lg mb-2
                                        ${isCompleted ? "bg-[#0D5990] text-white" :
                                                isActive ? "bg-white border-2 border-[#0D5990]" : "bg-gray-100"}
                                    `}
                                    >
                                        {isCompleted ? (
                                            <svg width="16" height="12" viewBox="0 0 19 14" fill="none">
                                                <path d="M6.50088 11.1996L2.30088 6.99961L0.900879 8.39961L6.50088 13.9996L18.5009 1.99961L17.1009 0.599609L6.50088 11.1996Z" fill="white" />
                                            </svg>
                                        ) : (
                                            <Icon color={isActive ? "#0D5990" : "#9D9A9A"} />
                                        )}
                                    </div>

                                    <div
                                        className={`
                                        text-[13px] font-IranYekanRegular whitespace-nowrap text-center
                                        ${isActive || isCompleted ? "text-[#0D5990]" : "text-gray-500"}
                                    `}
                                    >
                                        {step.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress bar below the labels */}
                    <div className="relative w-full h-1 bg-gray-200 rounded-full">
                        <div
                            className="absolute top-0 left-0 h-full bg-[#0D5990] rounded-full transition-all duration-300 ease-in-out"
                            style={{
                                width: `${(active / (stepsData.length - 1)) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>


            {/* Timer using your countdown component */}
            <div className="mt-6">
                <CountdownTimer
                    initialTime={900} // 15 minutes
                    onTimeUp={onTimeUp}
                />
            </div>

            {/* Mobile View - Simplified */}
            <div className="block sm:hidden">
                <div className="flex items-center justify-between bg-white rounded-lg py-2 px-3 shadow-sm border border-[#CCD6E1] w-full mx-auto">
                    {/* Step dots */}
                    <div className="flex items-center gap-1.5">
                        {stepsData.map((_, index) => {
                            const isActive = index === active;
                            const isCompleted = index < active;

                            return (
                                <div
                                    key={index}
                                    className={`rounded-full ${isActive ? "bg-[#0D5990] w-2 h-2" :
                                        isCompleted ? "bg-[#0D5990]/60 w-1.5 h-1.5" :
                                            "bg-gray-300 w-1.5 h-1.5"
                                        }`}
                                ></div>
                            );
                        })}
                    </div>

                    {/* Current step */}
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-white shadow-sm rounded flex items-center justify-center">
                            {stepsData[active].icon({ color: "#0D5990" })}
                        </div>
                        <span className="text-[#0D5990] font-IranYekanRegular text-[10px]">
                            {stepsData[active].label}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}