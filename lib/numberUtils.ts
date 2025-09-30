// lib/numberUtils.js
export const toPersianNumbers = (number: { toString: () => string; }) => {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return number.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};
// Add this function at the top of your file, outside the component
export const convertPersianToEnglishNumbers = (str: string): string => {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  // const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let result = str;

  // Replace Persian numbers with English
  persianNumbers.forEach((num, index) => {
    result = result.replace(new RegExp(num, 'g'), englishNumbers[index]);
  });

  // Replace Arabic numbers with English
  // arabicNumbers.forEach((num, index) => {
  //   result = result.replace(new RegExp(num, 'g'), englishNumbers[index]);
  // });

  return result;
};
