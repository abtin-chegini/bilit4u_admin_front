const numberConvertor = (value: string) => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  return value
    .replace(/0/g, persianDigits[0])
    .replace(/1/g, persianDigits[1])
    .replace(/2/g, persianDigits[2])
    .replace(/3/g, persianDigits[3])
    .replace(/4/g, persianDigits[4])
    .replace(/5/g, persianDigits[5])
    .replace(/6/g, persianDigits[6])
    .replace(/7/g, persianDigits[7])
    .replace(/8/g, persianDigits[8])
    .replace(/9/g, persianDigits[9]);
};

export default numberConvertor;
