'use client';
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimeRangeSelectorProps {
	onTimeChange?: (timeValue: number) => void;
}
export default function TimeRangeSelector({ onTimeChange }: TimeRangeSelectorProps) {
	const [value, setValue] = useState([0]);

	// Fixed the labels array with more descriptive texts
	const labels = ["همه ساعات", "صبح (۸:۰۰ تا ۱۲:۰۰)", "عصر (۱۳:۰۰ تا ۱۸:۰۰)", "شب (۲۰:۰۰ تا ۲۳:۰۰)"];
	const shortLabels = ["همه", "صبح", "عصر", "شب"];
	const max = 3;

	const skipInterval = 1;
	const ticks = [...Array(max + 1)].map((_, i) => i);
	// Call onTimeChange on initial mount
	useEffect(() => {
		if (onTimeChange) {
			onTimeChange(value[0]);
		}
	}, []); // Empty dependency array - only run on mount
	return (
		<div className="*:not-first:mt-4 font-IranYekanRegular">
			<div>
				<Slider
					defaultValue={[0]}
					max={max}


					step={1}
					aria-label="زمان حرکت"
					value={value}
					onValueChange={(newValue) => {
						setValue(newValue);
						if (onTimeChange) {
							onTimeChange(newValue[0]);
						}
					}}
					// Add custom color for the slider
					className="[&_.slider-thumb]:bg-[#0D5990] [&_.slider-track]:bg-[#0D5990]"
				/>
				<span
					className="text-[#0D5990] mt-3 flex w-full items-center justify-between gap-1 px-2.5 text-xs font-medium"
					aria-hidden="true"
				>
					{ticks.map((tick, i) => (
						<span key={i} className="flex w-0 flex-col items-center justify-center gap-2">
							<span
								className={cn("bg-[#0D5990]/70 h-1 w-px",
									i % skipInterval !== 0 && "h-0.5")}
							/>
							<span className={cn("text-xs text-[#0D5990]", i % skipInterval !== 0 && "opacity-0")}>
								{shortLabels[i]}
							</span>
						</span>
					))}
				</span>
			</div>
		</div>
	);
}