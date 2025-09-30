import Image from "next/image";
import { useRouter } from "next/navigation";

const NoData = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/");
  };

  return (
    <>
      <div className="flex flex-col items-center gap-y-5 xl:mt-[60px] lg:mt-[50px] md:mt-[40px] sm:mt-[30px] mt-[20px] ">
        <div className="xl:w-[580px] xl:h-[586px] lg:w-[486px] lg:h-[523px] md:w-[445px] md:h-[450px] sm:w-[370px] sm:h-[350px] w-[258px] h-[245px]">
          <Image
            src="/images/nodata.png"
            alt=""
            width="2000"
            height="2000"
            className="w-full"
          />
        </div>
        <div className="w-full flex justify-center  font-IranYekanRegular xl:text-xl lg:text-base md:text-base sm:text-sm xs:text-sm  ">
          متاسفانه سرویسی در بازه انتخابی شما موجود نیست
        </div>
        <div className="w-full flex justify-center xl:text-lg lg:text-base md:text-base sm:text-sm xs:text-sm  font-IranYekanRegular ">
          <div className="flex items-center gap-x-5">
            <button className="rounded-md border border-gray-200 xl:w-[263px] xl:h-[53px] lg:w-[280px] lg:h-[48px] md:w-[280px] md:h-[45px] sm:w-[250px] sm:h-[50px] xs:w-[190px] xs:h-[50px]  xl:text-lg lg:text-base md:text-base sm:text-sm xs:text-xs  text-black hover:bg-gray-100    text-center">
              نمایش نزدیکترین بلیط موجود
            </button>
            <button
              className="rounded-md border border-gray-200 text-primary  xl:w-[263px] xl:h-[53px] lg:w-[280px] lg:h-[48px] md:w-[280px] md:h-[45px] sm:w-[250px] sm:h-[50px] xs:w-[190px] xs:h-[50px]  xl:text-lg lg:text-base md:text-base sm:text-sm xs:text-xs   text-white bg-[#0D5990]   text-center hover:bg-blue-700 transition-all duration-300"
              onClick={handleClick}
            >
              بازگشت به صفحه اصلی
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoData;
