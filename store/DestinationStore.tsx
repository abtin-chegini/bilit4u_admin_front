import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SearchResult {
  cityID: string;
  name: string;
}

interface DestinationState {
  // Search functionality
  query: string;
  setQuery: (query: string) => void;
  value: string;
  setValue: (value: string) => void;
  results: SearchResult[];
  setResults: (results: SearchResult[]) => void;

  // Destination city information with expiration
  destinationID: string | null;
  destinationCity: string | null;
  lastUpdated: number;
  wasManuallyCleared: boolean;

  // Destination city actions
  setDestinationCity: (cityID: string, cityName: string) => void;
  clearDestinationCity: () => void;
  isDestinationValid: () => boolean;
  getTimeRemaining: () => { hours: number, minutes: number, seconds: number };
}

// 24 hours in milliseconds (1000ms * 60s * 60m * 24h)
const ONE_DAY = 1000 * 60 * 60 * 24;

export const useDestinationStore = create<DestinationState>()(
  persist(
    (set, get) => ({
      // Search functionality - unchanged
      query: "",
      setQuery: (query) => set({ query }),
      value: "",
      setValue: (value) => set({ value }),
      results: [],
      setResults: (results) => set({ results }),

      // Destination city with expiration
      destinationID: null,
      destinationCity: null,
      lastUpdated: Date.now(),
      wasManuallyCleared: false,

      // Set destination city with ID and name
      setDestinationCity: (cityID: string, cityName: string) => {
        console.log("Setting destination city:", { cityID, cityName });
        set({
          destinationID: cityID,
          destinationCity: cityName,
          lastUpdated: Date.now(),
          wasManuallyCleared: false
        });

        // Also update localStorage for backward compatibility
        localStorage.setItem("destinationCityId", cityID);
        localStorage.setItem("destinationCityName", cityName);
      },

      // Clear destination city
      clearDestinationCity: () => {
        console.log("Manually clearing destination city");
        set({
          destinationID: null,
          destinationCity: null,
          wasManuallyCleared: true,
          lastUpdated: Date.now()
        });

        // Also clear from localStorage
        localStorage.removeItem("destinationCityId");
        localStorage.removeItem("destinationCityName");

        // Verify state
        setTimeout(() => {
          const state = get();
          console.log("After clearDestinationCity:", {
            destinationID: state.destinationID,
            destinationCity: state.destinationCity,
            wasManuallyCleared: state.wasManuallyCleared
          });
        }, 0);
      },

      // Check if destination city is valid
      isDestinationValid: () => {
        const { destinationID, lastUpdated, wasManuallyCleared } = get();

        // console.log("Checking destination city validity:", {
        //   destinationID,
        //   wasManuallyCleared,
        //   lastUpdatedAgo: lastUpdated ? `${Math.round((Date.now() - lastUpdated) / 1000 / 60 / 60)}h ago` : null
        // });

        // If manually cleared or no ID, it's not valid
        if (wasManuallyCleared === true) {
          console.log("Destination invalid: manually cleared");
          return false;
        }

        if (!destinationID) {
          console.log("Destination invalid: no ID");
          return false;
        }

        // Check for expiration - using ONE_DAY instead of ONE_MINUTE
        const now = Date.now();
        if (now - lastUpdated > ONE_DAY) {
          console.log("Destination invalid: expired after 24 hours");
          // Expire the destination without touching wasManuallyCleared flag
          set(state => ({
            ...state,
            destinationID: null,
            destinationCity: null
          }));

          // Also clear from localStorage
          localStorage.removeItem("destinationCityId");
          localStorage.removeItem("destinationCityName");

          return false;
        }

        return true;
      },

      // Get time remaining before expiration - updated to include hours
      getTimeRemaining: () => {
        const { lastUpdated, destinationID, wasManuallyCleared } = get();

        // If no destination or manually cleared, no time remaining
        if (!destinationID || wasManuallyCleared) return { hours: 0, minutes: 0, seconds: 0 };
        if (!lastUpdated) return { hours: 0, minutes: 0, seconds: 0 };

        const now = Date.now();
        const elapsed = now - lastUpdated;
        const remainingMs = ONE_DAY - elapsed;

        if (remainingMs <= 0) {
          // If expired, clear the destination without touching wasManuallyCleared flag
          set(state => ({
            ...state,
            destinationID: null,
            destinationCity: null
          }));

          // Also clear from localStorage
          localStorage.removeItem("destinationCityId");
          localStorage.removeItem("destinationCityName");

          return { hours: 0, minutes: 0, seconds: 0 };
        }

        // Convert to hours, minutes, and seconds
        const totalSeconds = Math.floor(remainingMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return { hours, minutes, seconds };
      }
    }),
    {
      name: "destination-city-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        destinationID: state.destinationID,
        destinationCity: state.destinationCity,
        lastUpdated: state.lastUpdated,
        wasManuallyCleared: state.wasManuallyCleared
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("Rehydrating destination city state:", {
            destinationID: state.destinationID,
            destinationCity: state.destinationCity,
            wasManuallyCleared: state.wasManuallyCleared,
            lastUpdatedAgo: state.lastUpdated ? `${Math.round((Date.now() - state.lastUpdated) / 1000 / 60 / 60)}h ago` : null
          });

          // Initialize wasManuallyCleared if undefined
          if (state.wasManuallyCleared === undefined) {
            state.wasManuallyCleared = false;
          }

          // If destination was manually cleared, make sure it stays null
          if (state.wasManuallyCleared === true) {
            console.log("Destination was manually cleared, keeping it null");
            state.destinationID = null;
            state.destinationCity = null;
          }
          // Check expiration only if not manually cleared - using ONE_DAY
          else if (state.destinationID && Date.now() - state.lastUpdated > ONE_DAY) {
            console.log("Destination expired during rehydration (24 hour limit)");
            state.destinationID = null;
            state.destinationCity = null;

            // Also clear from localStorage
            localStorage.removeItem("destinationCityId");
            localStorage.removeItem("destinationCityName");
          }
          // Backward compatibility - check localStorage if store is empty
          else if (!state.destinationID) {
            const destinationCityId = localStorage.getItem("destinationCityId");
            const destinationCityName = localStorage.getItem("destinationCityName");

            if (destinationCityId && destinationCityName) {
              console.log("Found destination city in localStorage, migrating to store");
              state.destinationID = destinationCityId;
              state.destinationCity = destinationCityName;
              state.lastUpdated = Date.now();
              state.wasManuallyCleared = false;
            }
          }
        }
      }
    }
  )
);

// Optional debug component for testing - update to show hours
// export function DebugDestinationStore() {
//   const {
//     destinationID,
//     destinationCity,
//     wasManuallyCleared,
//     clearDestinationCity,
//     setDestinationCity,
//     isDestinationValid,
//     getTimeRemaining
//   } = useDestinationStore();

//   const [time, setTime] = useState(getTimeRemaining());

//   // Update time every second
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setTime(getTimeRemaining());
//       isDestinationValid(); // Check validity to trigger expiration if needed
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [getTimeRemaining, isDestinationValid]);

//   return (
//     <div className="fixed bottom-28 right-2 bg-white p-2 border rounded shadow-md z-50 text-xs">
//       <div className="font-bold mb-1">Destination City Debug</div>
//       <div>
//         <strong>ID:</strong> {destinationID || "none"}
//       </div>
//       <div>
//         <strong>City:</strong> {destinationCity || "none"}
//       </div>
//       <div>
//         <strong>Cleared:</strong> {wasManuallyCleared ? "Yes" : "No"}
//       </div>
//       <div>
//         <strong>Valid:</strong> {isDestinationValid() ? "Yes" : "No"}
//       </div>
//       {destinationID && !wasManuallyCleared && (
//         <div>
//           <strong>Expires in:</strong> {time.hours}h {time.minutes}m {time.seconds < 10 ? `0${time.seconds}` : time.seconds}s
//         </div>
//       )}
//       <div className="flex gap-1 mt-1">
//         <button
//           className="bg-red-500 text-white px-2 py-1 rounded"
//           onClick={clearDestinationCity}
//         >
//           Clear
//         </button>
//         <button
//           className="bg-blue-500 text-white px-2 py-1 rounded"
//           onClick={() => setDestinationCity("2", "Isfahan")}
//         >
//           Set Isfahan
//         </button>
//       </div>
//     </div>
//   );
// }