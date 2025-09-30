import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
} from "react";
import Skeleton from "react-loading-skeleton";
import useDate from "@/hooks/useDate";
import moment from "moment";
import { cx } from "class-variance-authority";


interface TopComponentProps {
  isPending: boolean;
  activeDate: string;
  setActiveDate: Dispatch<SetStateAction<string>>;
}
const TopComponent: FunctionComponent<TopComponentProps> = ({
  isPending,
  activeDate,
  setActiveDate,
}) => {
  return (
    <div className="xl:px-16 lg:px-16 md:px-16 sm:px-5 pt-6">
      <div className="rounded-md border border-[#CCD6E1] bg-white w-full py-2 gap-x-4 items-center hidden sm:flex px-6">

        {isPending ? (
          <Skeleton
            count={8}
            width={100}
            height={100}
            containerClassName="flex items-center gap-x-4 overflow-hidden"
          />
        ) : (
          <div className="flex flex-row-reverse items-center gap-x-4 overflow-auto py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((_, index) => {
              const today = new Date();
              let today2 = moment(today).add({ day: index }).toDate().toLocaleDateString("fa-IR");
              // console.log("today2", today2);
              const { month, day, monthText } = useDate(
                today2
              );

              return (
                <div
                  key={`day-${index}`}
                  className={cx([
                    "flex flex-col items-center justify-center py-3.5 px-5 border rounded-xl cursor-pointer",
                    activeDate === today2
                      ? " text-white bg-[#0D5990] font-IranYekanRegular text-base"
                      : "border border-[#CCD6E1]  text-[#0D5990] font-IranYekanRegular text-base",
                  ])}
                  onClick={() =>
                    setActiveDate(today2)
                  }
                >
                  <div className="font-IranYekanBold">{day}</div>
                  <div className="font-IranYekanBold">{monthText}</div>
                </div>
              );
            })}
          </div>
        )}
        {/* <ChevronRight className="text-primary cursor-pointer" /> */}
      </div>
    </div>
  );
};

export default TopComponent;
// import React, { Dispatch, FunctionComponent, SetStateAction } from "react";
// import { Swiper, SwiperSlide } from "swiper/react";
// import "swiper/css";
// import "swiper/css/navigation";
// import { Navigation } from "swiper/modules";
// import ChevronLeft from "@/components/icons/ChevronLeft";
// import ChevronRight from "@/components/icons/ChevronRight";
// import Skeleton from "react-loading-skeleton";
// import useDate from "@/lib/hooks/useDate";
// import moment from "moment";
// import { cx } from "class-variance-authority";

// interface TopComponentProps {
//   isPending: boolean;
//   activeDate: string;
//   setActiveDate: Dispatch<SetStateAction<string>>;
// }

// const TopComponent: FunctionComponent<TopComponentProps> = ({
//   isPending,
//   activeDate,
//   setActiveDate,
// }) => {
//   var slides = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
//   return (
//     <div className="xl:px-16 lg:px-16 md:px-16 sm:px-5 pt-6">
//       <div className="rounded-md border border-[#CCD6E1] bg-white w-full py-2 gap-x-4 items-center hidden sm:flex px-6">
//         {isPending ? (
//           <Skeleton
//             count={8}
//             width={100}
//             height={100}
//             containerClassName="flex items-center gap-x-4 overflow-hidden"
//           />
//         ) : (
//           <Swiper
//             // initialSlide={slides.length - 1}
//             // initialSlide={1}
//             modules={[Navigation]}
//             navigation={{
//               prevEl: ".swiper-button-prev",
//               nextEl: ".swiper-button-next",
//             }}
//             spaceBetween={3}
//             slidesPerView={10}
//             // slidesPerView="auto"
//             className="w-full .swiper-wrapper"
//           >
//             <div className="swiper-button-next">
//               <ChevronRight className="text-primary cursor-pointer" />
//             </div>
//             <div className="swiper-button-prev">
//               <ChevronLeft className="text-primary cursor-pointer" />
//             </div>
//             {slides.map((_, index) => {
//               const today = new Date();
//               let today2 = moment(today).add({ day: index }).toDate();
//               const { month, day, monthText } = useDate(
//                 today2.toLocaleDateString("fa-IR")
//               );
//               return (
//                 <SwiperSlide key={`day-${index}`}>
//                   <div
//                     className={cx([
//                       "flex flex-col items-center justify-center w-[60px] h-[50px] border rounded-xl cursor-pointer",
//                       activeDate === today2.toLocaleDateString("fa-IR")
//                         ? "text-white bg-[#0D5990] font-IranYekanRegular text-base"
//                         : "border border-[#CCD6E1] text-[#0D5990] font-IranYekanRegular text-base",
//                     ])}
//                     onClick={() =>
//                       setActiveDate(today2.toLocaleDateString("fa-IR"))
//                     }
//                   >
//                     <div className="font-IranYekanBold">{day}</div>
//                     <div className="font-IranYekanBold">{monthText}</div>
//                   </div>
//                 </SwiperSlide>
//               );
//             })}
//           </Swiper>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TopComponent;
// import React, { Dispatch, FunctionComponent, SetStateAction } from "react";
// import Skeleton from "react-loading-skeleton";
// import CustomCarousel from "@/components/ui/customCarousel/CustomCarousel"; // Import the CustomCarousel component

// interface TopComponentProps {
//   isPending: boolean;
//   activeDate: string;
//   setActiveDate: Dispatch<SetStateAction<string>>;
// }

// const TopComponent: FunctionComponent<TopComponentProps> = ({
//   isPending,
//   activeDate,
//   setActiveDate,
// }) => {
//   return (
//     <div className="xl:px-16 lg:px-16 md:px-16 sm:px-5 pt-6">
//       <div className="rounded-md border border-[#CCD6E1] bg-white w-full py-2 gap-x-4 items-center hidden sm:flex px-6">
//         {isPending ? (
//           <Skeleton
//             count={8}
//             width={100}
//             height={100}
//             containerClassName="flex items-center gap-x-4 overflow-hidden"
//           />
//         ) : (
//           <CustomCarousel
//             activeDate={activeDate}
//             setActiveDate={setActiveDate}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default TopComponent;
