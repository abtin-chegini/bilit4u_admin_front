const numberConvertor2 = (value: string) => {
  const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return value
    .replace(/۰/g, digits[0])
    .replace(/۱/g, digits[1])
    .replace(/۲/g, digits[2])
    .replace(/۳/g, digits[3])
    .replace(/۴/g, digits[4])
    .replace(/۵/g, digits[5])
    .replace(/۶/g, digits[6])
    .replace(/۷/g, digits[7])
    .replace(/۸/g, digits[8])
    .replace(/۹/g, digits[9]);
};

export default numberConvertor2;
