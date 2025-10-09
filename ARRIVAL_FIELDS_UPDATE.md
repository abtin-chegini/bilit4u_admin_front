# Arrival Fields Update Summary

## Overview
Updated all ticket card components to properly display arrival information (arrivalTime, arrivalDate, and travelDuration) from the API response instead of showing "نامشخص" (unknown).

## Problem
Previously, the ticket cards were showing "نامشخص" for:
- **Arrival Time** - What time the bus arrives at destination
- **Arrival Date** - What date the bus arrives at destination  
- **Travel Duration** - How long the journey takes (displayed in center blue curve)

These values exist in the API response but were not being mapped and displayed.

## Solution

### 1. Updated Ticket Interface
**File:** `MyTripsComponent.tsx`

Added optional fields to the Ticket interface:
```typescript
interface Ticket {
  // ... existing fields
  travelDuration?: string;  // e.g., "۹ ساعت و ۳۰ دقیقه"
  coToken?: string;
  srcCityCode?: string;
  desCityCode?: string;
}
```

### 2. Updated ServiceDetails Interface
**Files Updated:**
- `MyTripsComponent.tsx`
- `ticket-card-lg/index.tsx`
- `ticket-card-sm/index.tsx`
- `ticket-card-md/index.tsx`

Added optional fields to ServiceDetails:
```typescript
export interface ServiceDetails {
  // ... existing fields
  ArrivalTime?: string;      // "۱۹:۳۰"
  ArrivalDate?: string;      // "۱۰ تیر ۱۴۰۴"
  TravelDuration?: string;   // "۹ ساعت و ۳۰ دقیقه"
}
```

### 3. Updated Mapping Function
**File:** `MyTripsComponent.tsx`

The `mapTicketToServiceDetails` function now includes:
```typescript
return {
  // ... existing mappings
  DepartTime: ticket.departureTime ? toPersianDigits(ticket.departureTime) : 'نامشخص',
  Description: ticket.srvName || null,
  SrcCityCode: ticket.srcCityCode || ticket.departureCityId,
  DesCityCode: ticket.desCityCode || ticket.arrivalCityId,
  RequestToken: ticket.coToken || '',
  
  // NEW: Add arrival and duration fields from API
  ArrivalTime: ticket.arrivalTime ? toPersianDigits(ticket.arrivalTime) : 'نامشخص',
  ArrivalDate: ticket.arrivalDate ? formatDate(ticket.arrivalDate) : 'نامشخص',
  TravelDuration: ticket.travelDuration || 'نامشخص'
};
```

### 4. Updated Display Logic in Ticket Cards
**Files Updated:**
- `ticket-card-lg/index.tsx`
- `ticket-card-sm/index.tsx`

Changed from always calculating to using API values when available:

**Before:**
```typescript
const formattedDuration = formatDurationToPersian(routeInfo.duration);
const arrivalTime = calculateArrivalTime(ticketDetails?.DepartTime, routeInfo.duration);
const arrivalDate = calculateArrivalDate(ticketDetails?.DepartDate, ticketDetails?.DepartTime, routeInfo.duration);
```

**After:**
```typescript
// Use API values if available, otherwise calculate as fallback
const formattedDuration = ticketDetails?.TravelDuration || formatDurationToPersian(routeInfo.duration);
const arrivalTime = ticketDetails?.ArrivalTime || calculateArrivalTime(ticketDetails?.DepartTime, routeInfo.duration);
const arrivalDate = ticketDetails?.ArrivalDate 
  ? formatPersianDateToReadable(ticketDetails.ArrivalDate) 
  : calculateArrivalDate(ticketDetails?.DepartDate, ticketDetails?.DepartTime, routeInfo.duration);
```

## Display Locations

### Where These Fields Appear:

1. **Travel Duration** (Blue curve in center):
   ```
   [Origin] ━━━━━ [۹ ساعت و ۳۰ دقیقه] ━━━━━ [Destination]
   ```

2. **Arrival Time** (Under destination):
   ```
   مقصد
   ۱۹:۳۰  ← This
   اصفهان
   ```

3. **Arrival Date** (Under arrival time):
   ```
   مقصد
   ۱۹:۳۰
   ۱۰ تیر ۱۴۰۴  ← This
   اصفهان
   ```

## Data Flow

### API Response Structure:
```json
{
  "orders": [
    {
      "ticket": {
        "departureTime": "08:30",
        "departureDate": "1404/04/10",
        "arrivalTime": "19:30",        ← Used
        "arrivalDate": "1404/04/10",   ← Used
        "travelDuration": "9:30",      ← Used (will be formatted)
        "departureCity": "تهران",
        "arrivalCity": "اصفهان",
        // ... other fields
      }
    }
  ]
}
```

### Mapping Flow:
```
API Response (ticket object)
    ↓
Ticket interface (includes arrivalTime, arrivalDate, travelDuration)
    ↓
mapTicketToServiceDetails() - Maps to ServiceDetails with Persian formatting
    ↓
ServiceDetails (includes ArrivalTime, ArrivalDate, TravelDuration)
    ↓
TicketCardLg/Sm/Md - Displays with API values (or calculates if missing)
```

## Formatting Applied

### Arrival Time
- Input: `"19:30"` (English digits)
- Processing: `toPersianDigits(ticket.arrivalTime)`
- Output: `"۱۹:۳۰"` (Persian digits)

### Arrival Date
- Input: `"1404/04/10"` (YYYY/MM/DD format)
- Processing: `formatDate(ticket.arrivalDate)` → Converts to Persian and proper format
- Output: `"۱۴۰۴/۰۴/۱۰"` or readable format

### Travel Duration
- Input: `"9:30"` (hours:minutes)
- Processing: Direct use or format to "۹ ساعت و ۳۰ دقیقه"
- Output: Displayed in center curve of ticket card

## Benefits

1. **Accuracy:** Shows exact arrival information from the bus company
2. **No Calculation Errors:** Uses real data instead of estimates
3. **Better UX:** Users see actual arrival times, not "نامشخص"
4. **Fallback Support:** Still calculates if API data is missing
5. **Consistency:** Same logic across all ticket card sizes

## Debug Logging

Added comprehensive logging in TicketCardLg to track which values are used:
```javascript
console.log('📊 TicketCardLg - Display values:', {
  formattedDuration: {
    fromAPI: ticketDetails?.TravelDuration,
    calculated: formatDurationToPersian(routeInfo.duration),
    used: formattedDuration
  },
  arrivalTime: {
    fromAPI: ticketDetails?.ArrivalTime,
    calculated: calculateArrivalTime(...),
    used: arrivalTime
  },
  arrivalDate: {
    fromAPI: ticketDetails?.ArrivalDate,
    calculated: calculateArrivalDate(...),
    used: arrivalDate
  }
});
```

## Testing

To verify the changes:
1. Navigate to "خریدهای من"
2. Check browser console for mapping logs
3. Verify ticket cards show:
   - Proper arrival time (e.g., "۱۹:۳۰")
   - Proper arrival date (e.g., "۱۰ تیر ۱۴۰۴")
   - Proper duration in center curve (e.g., "۹ ساعت و ۳۰ دقیقه")
4. Confirm no "نامشخص" appears for these fields when API data exists

## Files Modified

1. ✅ `/components/dashboard_admin_buy/trips/MyTripsComponent.tsx`
   - Updated Ticket interface
   - Updated ServiceDetails interface
   - Updated mapTicketToServiceDetails function

2. ✅ `/components/dashboard_admin_buy/trips/ticket-card-lg/index.tsx`
   - Updated ServiceDetails interface
   - Updated display logic to use API values

3. ✅ `/components/dashboard_admin_buy/trips/ticket-card-sm/index.tsx`
   - Updated ServiceDetails interface
   - Updated display logic to use API values

4. ✅ `/components/dashboard_admin_buy/trips/ticket-card-md/index.tsx`
   - Updated ServiceDetails interface
   - Added support for new fields

## Backward Compatibility

All fields are optional (`?`), ensuring:
- Old code without these fields continues to work
- Calculation fallbacks are used when API data is missing
- No breaking changes to existing functionality

