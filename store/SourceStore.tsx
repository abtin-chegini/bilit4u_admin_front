import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SearchResult {
  cityID: string;
  name: string;
}

interface SourceState {
  // Search functionality
  query: string;
  setQuery: (query: string) => void;
  value: string;
  setValue: (value: string) => void;
  results: SearchResult[];
  setResults: (results: SearchResult[]) => void;

  // Source city information with expiration
  sourceID: string | null;
  sourceCity: string | null;
  lastUpdated: number;
  wasManuallyCleared: boolean;

  // Source city actions
  setSourceCity: (cityID: string, cityName: string) => void;
  clearSourceCity: () => void;
  isSourceValid: () => boolean;
  getTimeRemaining: () => { hours: number, minutes: number, seconds: number };
}

// 24 hours in milliseconds (1000ms * 60s * 60m * 24h)
const ONE_DAY = 1000 * 60 * 60 * 24;

export const useSourceStore = create<SourceState>()(
  persist(
    (set, get) => ({
      // Search functionality - unchanged
      query: "",
      setQuery: (query) => set({ query }),
      value: "",
      setValue: (value) => set({ value }),
      results: [],
      setResults: (results) => set({ results }),

      // Source city with expiration
      sourceID: null,
      sourceCity: null,
      lastUpdated: Date.now(),
      wasManuallyCleared: false,

      // Set source city with ID and name
      setSourceCity: (cityID: string, cityName: string) => {
        console.log("Setting source city:", { cityID, cityName });
        set({
          sourceID: cityID,
          sourceCity: cityName,
          lastUpdated: Date.now(),
          wasManuallyCleared: false
        });

        // Also update localStorage for backward compatibility
        localStorage.setItem("sourceCityId", cityID);
        localStorage.setItem("sourceCityName", cityName);
      },

      // Clear source city
      clearSourceCity: () => {
        console.log("Manually clearing source city");
        set({
          sourceID: null,
          sourceCity: null,
          wasManuallyCleared: true,
          lastUpdated: Date.now()
        });

        // Also clear from localStorage
        localStorage.removeItem("sourceCityId");
        localStorage.removeItem("sourceCityName");

        // Verify state
        setTimeout(() => {
          const state = get();
          console.log("After clearSourceCity:", {
            sourceID: state.sourceID,
            sourceCity: state.sourceCity,
            wasManuallyCleared: state.wasManuallyCleared
          });
        }, 0);
      },

      // Check if source city is valid
      isSourceValid: () => {
        const { sourceID, lastUpdated, wasManuallyCleared } = get();

        // console.log("Checking source city validity:", {
        //   sourceID,
        //   wasManuallyCleared,
        //   lastUpdatedAgo: lastUpdated ? `${Math.round((Date.now() - lastUpdated) / 1000 / 60 / 60)}h ago` : null
        // });

        // If manually cleared or no ID, it's not valid
        if (wasManuallyCleared === true) {
          console.log("Source invalid: manually cleared");
          return false;
        }

        if (!sourceID) {
          console.log("Source invalid: no ID");
          return false;
        }

        // Check for expiration - now using ONE_DAY instead of ONE_MINUTE
        const now = Date.now();
        if (now - lastUpdated > ONE_DAY) {
          console.log("Source invalid: expired after 24 hours");
          // Expire the source without touching wasManuallyCleared flag
          set(state => ({
            ...state,
            sourceID: null,
            sourceCity: null
          }));

          // Also clear from localStorage
          localStorage.removeItem("sourceCityId");
          localStorage.removeItem("sourceCityName");

          return false;
        }

        return true;
      },

      // Get time remaining before expiration - updated to include hours
      getTimeRemaining: () => {
        const { lastUpdated, sourceID, wasManuallyCleared } = get();

        // If no source or manually cleared, no time remaining
        if (!sourceID || wasManuallyCleared) return { hours: 0, minutes: 0, seconds: 0 };
        if (!lastUpdated) return { hours: 0, minutes: 0, seconds: 0 };

        const now = Date.now();
        const elapsed = now - lastUpdated;
        const remainingMs = ONE_DAY - elapsed;

        if (remainingMs <= 0) {
          // If expired, clear the source without touching wasManuallyCleared flag
          set(state => ({
            ...state,
            sourceID: null,
            sourceCity: null
          }));

          // Also clear from localStorage
          localStorage.removeItem("sourceCityId");
          localStorage.removeItem("sourceCityName");

          return { hours: 0, minutes: 0, seconds: 0 };
        }

        // Convert to hours, minutes and seconds
        const totalSeconds = Math.floor(remainingMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return { hours, minutes, seconds };
      }
    }),
    {
      name: "source-city-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        sourceID: state.sourceID,
        sourceCity: state.sourceCity,
        lastUpdated: state.lastUpdated,
        wasManuallyCleared: state.wasManuallyCleared
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("Rehydrating source city state:", {
            sourceID: state.sourceID,
            sourceCity: state.sourceCity,
            wasManuallyCleared: state.wasManuallyCleared,
            lastUpdatedAgo: state.lastUpdated ? `${Math.round((Date.now() - state.lastUpdated) / 1000 / 60 / 60)}h ago` : null
          });

          // Initialize wasManuallyCleared if undefined
          if (state.wasManuallyCleared === undefined) {
            state.wasManuallyCleared = false;
          }

          // If source was manually cleared, make sure it stays null
          if (state.wasManuallyCleared === true) {
            console.log("Source was manually cleared, keeping it null");
            state.sourceID = null;
            state.sourceCity = null;
          }
          // Check expiration only if not manually cleared - now using ONE_DAY
          else if (state.sourceID && Date.now() - state.lastUpdated > ONE_DAY) {
            console.log("Source expired during rehydration (24 hour limit)");
            state.sourceID = null;
            state.sourceCity = null;

            // Also clear from localStorage
            localStorage.removeItem("sourceCityId");
            localStorage.removeItem("sourceCityName");
          }
          // Backward compatibility - check localStorage if store is empty
          else if (!state.sourceID) {
            const sourceCityId = localStorage.getItem("sourceCityId");
            const sourceCityName = localStorage.getItem("sourceCityName");

            if (sourceCityId && sourceCityName) {
              console.log("Found source city in localStorage, migrating to store");
              state.sourceID = sourceCityId;
              state.sourceCity = sourceCityName;
              state.lastUpdated = Date.now();
              state.wasManuallyCleared = false;
            }
          }
        }
      }
    }
  )
);