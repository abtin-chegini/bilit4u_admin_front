"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSourceStore } from "@/store/SourceStore";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  HubConnectionBuilder,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";
import { Icon } from "@iconify/react/dist/iconify.js";

const SourceSearchBox: React.FC = () => {
  // Get everything we need from the Source store
  const {
    query,
    setQuery,
    value,
    setValue,
    results,
    setResults,
    sourceID,
    sourceCity,
    setSourceCity,
    isSourceValid,
    lastUpdated,
    wasManuallyCleared
  } = useSourceStore();

  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [englishConnection, setEnglishConnection] = useState<any>(null);
  const [persianConnection, setPersianConnection] = useState<any>(null);
  const [isPreMadeSelection, setIsPreMadeSelection] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Pre-made city list
  const preMadeList = [
    { cityID: "11320000", name: "تهران" },
    { cityID: "31310000", name: "مشهد" },
    { cityID: "21310000", name: "اصفهان" },
    { cityID: "41310000", name: "شیراز" },
    { cityID: "26310000", name: "تبریز" },
  ];

  // Initialize with data from store or fallback to localStorage on component mount
  useEffect(() => {
    // Check if we have a valid source city in the store
    if (isSourceValid() && sourceCity) {
      setValue(sourceCity);
      // console.log("Using valid source city from store:", sourceCity);
    } else {
      // If store doesn't have valid data, try localStorage (for backward compatibility)
      const storedCityName = localStorage.getItem("sourceCityName");
      const storedCityId = localStorage.getItem("sourceCityId");

      if (storedCityName && storedCityId) {
        console.log("Found source city in localStorage, migrating to store");
        // Migrate data from localStorage to our store
        setValue(storedCityName);
        setSourceCity(storedCityId, storedCityName);
      } else {
        // No valid source city found anywhere
        setValue("شهر مبداء");
      }
    }

    // Set up an interval to periodically check validity
    const checkInterval = setInterval(() => {
      const valid = isSourceValid();
      if (!valid && sourceCity) {
        // If source city expired, update the UI
        setValue("شهر مبداء");
        console.log("Source city expired, UI refreshed");
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [setValue, setSourceCity, sourceCity, isSourceValid]);

  // SignalR connection setup
  useEffect(() => {
    const englishConn = new HubConnectionBuilder()
      .withUrl("https://socket.bilit4u.com/searchEnHub", {
        // .withUrl("http://localhost:5063/searchEnHub", {
        transport: HttpTransportType.WebSockets,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    const persianConn = new HubConnectionBuilder()
      .withUrl("https://socket.bilit4u.com/searchFaHub", {
        // .withUrl("http://localhost:5063/searchFaHub", {
        transport: HttpTransportType.WebSockets,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    setEnglishConnection(englishConn);
    setPersianConnection(persianConn);

    englishConn
      .start()
      .catch((err) => console.error("Error starting English connection:", err));
    persianConn
      .start()
      .catch((err) => console.error("Error starting Persian connection:", err));

    englishConn.on("ReceiveSearchResultsEN", (results) => {
      console.log(`📥 Received ${results.length} English search results:`, results);

      setResults(results);
    });

    persianConn.on("ReceiveSearchResultsFA", (results) => {
      setResults(results);
    });

    // Return cleanup function
    return () => {
      // Connection cleanup handled by useEffect's cleanup function
    };
  }, [setResults]);

  const handleInputChange = (query: string) => {
    setQuery(query);
    debouncedSearch(query); // Trigger debounced search
  };

  const performSearch = async (query: string) => {
    if (query.trim() === "") {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const language = detectLanguage(query);
      if (language === "Persian" && persianConnection) {
        await persianConnection.invoke("SearchFA", query);
      } else if (language === "English" && englishConnection) {
        await englishConnection.invoke("SearchEN", query);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const debounce = (func: Function, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  };

  const debouncedSearch = debounce(performSearch, 300);

  const detectLanguage = (query: string) => {
    return /[آ-ی]/.test(query) ? "Persian" : "English";
  };

  // Handle selection with store update
  const handleSelect = (currentValue: string, cityID: string) => {
    setValue(currentValue);

    // Use our store to set the source city (this also updates localStorage)
    setSourceCity(cityID, currentValue);

    setOpen(false);
    console.log("Selected source city:", { name: currentValue, id: cityID });
  };

  const handleSelectForPremade = (
    currentValue: string,
    cityID: string,
    isPreMade: boolean = false
  ) => {
    setValue(currentValue);

    // Use our store to set the source city
    setSourceCity(cityID, currentValue);

    setIsPreMadeSelection(isPreMade);
    setOpen(false);
    console.log("Selected pre-made source city:", { name: currentValue, id: cityID });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="xl:w-[220px] xs:w-[250px] sm:w-[400px] xl:h-[48px] xs:h-[48px] lg:w-[200px] lg:h-[37px] md:w-[124px] md:h-[31px]   justify-end text-center"
        >
          <p className="font-IranYekanRegular">{value}</p>

          <Icon icon="proicons:location" width="24" height="24" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={5}
        alignOffset={0}
        avoidCollisions={false}
        className="xl:w-[220px] xs:w-[250px] sm:w-[400px] lg:w-[200px] md:w-[124px] p-0">
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            className="text-center"
            value={query}
            onValueChange={(e) => handleInputChange(e)}
          />
          <CommandList>
            <ScrollArea className="h-[220px] overflow-y-auto">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center h-[250px] gap-2">
                  <div className="w-6 h-6 border-2 border-[#0D5990] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 font-IranYekanRegular">
                    در حال جستجو...
                  </p>
                </div>
              ) : results.length === 0 && query.trim() === "" ? (
                <>
                  {/* Popular Cities Banner */}
                  <div dir="rtl" className="px-3  py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-IranYekanBold text-gray-600 ">
                      شهرهای پر طرفدار
                    </p>
                  </div>

                  {/* Popular Cities List */}
                  <CommandGroup>
                    {preMadeList.map((item, index) => (
                      <CommandItem
                        key={`${item.cityID}-${item.name}-${index}`}
                        className={cn(
                          "text-center justify-center font-IranYekanRegular text-sm cursor-pointer hover:cursor-pointer py-2",
                          value === item.name && "bg-gray-100"
                        )}
                        value={item.name}
                        onSelect={() =>
                          handleSelectForPremade(item.name, item.cityID, true)
                        }
                      >
                        {item.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              ) : results.length === 0 ? (
                <CommandEmpty className="text-center text-sm pt-5 text-red-500">
                  نتیجه ای یافت نشد
                </CommandEmpty>
              ) : (
                <>
                  {/* Search Results Banner */}
                  <div dir="rtl" className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-IranYekanBold text-gray-600">
                      نتایج جستجو
                    </p>
                  </div>

                  {/* Search Results List */}
                  <CommandGroup>
                    {results.map((result, index) => (
                      <CommandItem
                        key={`${result.cityID}-${result.name}-${index}`}
                        className={cn(
                          "text-center justify-center font-IranYekanRegular text-sm cursor-pointer hover:cursor-pointer py-2",
                          value === result.name && "bg-gray-100"
                        )}
                        value={result.name}
                        onSelect={() =>
                          handleSelect(result.name, result.cityID)
                        }
                      >
                        {result.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SourceSearchBox;