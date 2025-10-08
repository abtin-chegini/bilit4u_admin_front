# LocalForage Integration Documentation

## Overview

This document describes the implementation of LocalForage storage for seat selection, passenger data, and service ticket (srvTicket) information in the Bilit4u Admin application.

## Features Implemented

### 1. **Seat Selection Storage**
- Automatically saves seat data to localforage whenever a seat is selected, updated, or removed
- Stores seat number, seat ID, and gender selection (male/female)
- Maintains session-based storage to prevent data conflicts

### 2. **Passenger Data Storage**
- Saves passenger information to localforage when passengers are added or updated
- Stores complete passenger details including name, national code, birth date, etc.
- Automatically syncs with localforage on every passenger change

### 3. **Service Ticket (srvTicket) Storage**
- Saves service ticket details when fetched from API
- Includes all ticket information such as service number, company name, departure details, etc.
- Persists across page refreshes and browser sessions

## Implementation Details

### Modified Files

#### 1. `store/TicketStore.tsx`
**New Features:**
- Added `sessionId` field to track user sessions
- Added `srvTicket` field to store service ticket data
- Added `setSrvTicket()` method to update srvTicket data
- Added `saveToLocalForage()` method for automatic data persistence
- Integrated localforage saving in all seat-related methods:
  - `setTicketInfo()` - saves when ticket info is set
  - `updateSeatState()` - saves when seat state changes
  - `handleSeatClick()` - saves on every seat click
  - `removeSelectedSeat()` - saves when seat is removed
  - `clearSelectedSeats()` - saves when all seats are cleared
  - `setServiceData()` - saves when service data is updated
  - `setSeatMap()` - saves when seat map is updated

**Data Structure Saved:**
```typescript
{
  sessionId: string,
  userId: string,
  ticketData: {
    ticketId: string | null,
    token: string | null,
    selectedSeats: Seat[],
    serviceData: any,
    seatMap: any,
    srvTicket: any
  },
  flowData: {
    currentStep: 'seat-selection',
    selectedSeatsData: [{
      seatId: number,
      seatNo: string | number,
      gender: 'male' | 'female',
      state: SeatState
    }],
    srvTicketData: any
  }
}
```

#### 2. `store/PassengerStore.tsx`
**New Features:**
- Added `saveToLocalForage()` method for passenger data persistence
- Integrated localforage saving in all passenger-related methods:
  - `addPassenger()` - saves when a passenger is added
  - `addPassengers()` - saves when multiple passengers are added
  - `removePassenger()` - saves when a passenger is removed
  - `clearPassengers()` - saves when passengers are cleared

**Data Structure Saved:**
```typescript
{
  stepId: 'passenger-details',
  stepName: 'Passenger Information',
  data: {
    passengers: StoredPassenger[],
    passengerCount: number,
    timestamp: number
  },
  completed: boolean,
  timestamp: number
}
```

#### 3. `components/dashboard_admin_buy/pdp/new/BusReservationWithStepper.tsx`
**New Features:**
- Integrated `setSrvTicket()` call when service details are fetched from API
- Saves srvTicket data both from API response and store fallback
- Automatic persistence of service ticket information

## Usage Examples

### Accessing Stored Data

#### Get Session Data:
```typescript
import { localForageManager } from '@/services/LocalForageManager';

// Get all session data
const sessionId = 'your-session-id';
const session = await localForageManager.getSession(sessionId);
console.log('Session data:', session);
```

#### Get Seat Selection Data:
```typescript
import { useTicketStore } from '@/store/TicketStore';

// In your component
const { selectedSeats, srvTicket, sessionId } = useTicketStore();

console.log('Selected seats:', selectedSeats);
console.log('Service ticket:', srvTicket);
console.log('Session ID:', sessionId);
```

#### Get Passenger Data:
```typescript
import { usePassengerStore } from '@/store/PassengerStore';

// In your component
const { passengers, getSessionPassengers } = usePassengerStore();

const currentSessionPassengers = getSessionPassengers();
console.log('Current session passengers:', currentSessionPassengers);
```

### Restoring Data

The stores use Zustand's persist middleware, so data is automatically restored on page load. For localforage data:

```typescript
import { localForageManager } from '@/services/LocalForageManager';

// Restore from localforage
const sessionId = 'your-session-id';
const session = await localForageManager.getSession(sessionId);

if (session) {
  // Restore seat data
  const ticketData = session.ticketData;
  console.log('Restored ticket data:', ticketData);
  
  // Restore passenger data
  const passengerStep = await localForageManager.getFlowStep(sessionId, 'passenger-details');
  console.log('Restored passenger data:', passengerStep);
}
```

## Session Management

### Session ID Generation
- Automatically generated when first ticket info is set
- Format: `session_${timestamp}_${randomString}`
- Persists across page refreshes

### Session Cleanup
```typescript
import { localForageManager } from '@/services/LocalForageManager';

// Clean up sessions older than 7 days (default)
const cleanedCount = await localForageManager.cleanupOldSessions();
console.log(`Cleaned ${cleanedCount} old sessions`);
```

## Storage Flow Diagram

```
User Action → Store Update → Zustand State Change → LocalForage Save
     ↓              ↓                  ↓                    ↓
Seat Click → updateSeatState() → State Updated → saveToLocalForage()
     ↓              ↓                  ↓                    ↓
Add Passenger → addPassenger() → State Updated → saveToLocalForage()
     ↓              ↓                  ↓                    ↓
Fetch Ticket → setSrvTicket() → State Updated → saveToLocalForage()
```

## Benefits

1. **Automatic Persistence**: All changes are automatically saved without manual intervention
2. **Session Isolation**: Each user session has its own isolated data
3. **Cross-Tab Support**: LocalForage supports IndexedDB which works across browser tabs
4. **Offline Support**: Data is stored locally and available even without internet
5. **Large Storage Capacity**: IndexedDB can store much more data than localStorage
6. **Type Safety**: Full TypeScript support with proper interfaces

## Data Recovery

In case of unexpected errors or page refreshes:

1. **Seat Selection**: Automatically restored from TicketStore (Zustand persist)
2. **Passenger Data**: Automatically restored from PassengerStore (Zustand persist)
3. **Service Ticket**: Can be retrieved from localforage using session ID
4. **Full Session**: Complete session data available in localforage

## Console Logs for Debugging

The implementation includes comprehensive console logging:

- `✅ Ticket data saved to localforage` - Seat data saved successfully
- `✅ Passenger data saved to localforage` - Passenger data saved successfully
- `✅ srvTicket data saved to store and localforage` - Service ticket saved successfully
- `❌ Failed to save to localforage` - Error during save operation

## Performance Considerations

- **Debouncing**: Uses `setTimeout(..., 0)` to prevent blocking UI thread
- **Selective Persistence**: Only necessary data is stored
- **Efficient Updates**: Only updates when data actually changes
- **Memory Management**: Automatic cleanup of old sessions

## Browser Compatibility

LocalForage automatically falls back through storage drivers:
1. **IndexedDB** (preferred)
2. **WebSQL**
3. **localStorage** (fallback)

This ensures compatibility across all modern browsers.

## Future Enhancements

Potential improvements for future versions:

1. Add encryption for sensitive passenger data
2. Implement data compression for large datasets
3. Add sync mechanism with backend
4. Implement conflict resolution for multi-tab scenarios
5. Add data export/import functionality
6. Implement version control for data structures

## Troubleshooting

### Data Not Saving
1. Check browser console for error messages
2. Verify IndexedDB is not disabled in browser
3. Check available storage quota
4. Verify session ID is being generated

### Data Not Loading
1. Check if session ID matches
2. Verify data exists in localforage using browser DevTools
3. Check for any migration issues between versions

### Performance Issues
1. Review data size being stored
2. Check frequency of save operations
3. Consider implementing throttling for rapid updates

## Testing

To test the implementation:

```typescript
// 1. Select seats and check console
// Expected: "✅ Ticket data saved to localforage"

// 2. Add passengers and check console  
// Expected: "✅ Passenger data saved to localforage"

// 3. Fetch service details and check console
// Expected: "✅ srvTicket data saved to store and localforage"

// 4. Refresh page and verify data persists
// Expected: All data should be restored

// 5. Check browser DevTools → Application → IndexedDB → Bilit4U_Flow
// Expected: See stored session data
```

## Summary

The LocalForage integration provides robust, automatic data persistence for the entire bus reservation flow. All seat selections, passenger information, and service ticket data are safely stored and can be recovered in case of any interruption. The implementation is transparent to the user and requires no additional code in components beyond using the existing store methods.

