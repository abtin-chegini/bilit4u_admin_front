import numberConvertor2 from "@/lib/numberConvertor2";

const useDate = (date: string) => {
  const dateList = date.split("/");
  const months = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ];
  return {
    year: dateList[0],
    month: dateList[1],
    day: dateList[2],
    monthText: months[parseInt(numberConvertor2(dateList[1])) - 1],
  };
};

export default useDate;
