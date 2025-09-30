"use client";

import { useEffect, useState } from "react";

const useDebounce = (value: string = "", delay: number = 1000) => {
  const [debouncedValue, setDebouncedValue] = useState<string>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return {
    debouncedValue: debouncedValue !== "" ? debouncedValue : undefined,
    setDebouncedValue,
  };
};

export default useDebounce;
