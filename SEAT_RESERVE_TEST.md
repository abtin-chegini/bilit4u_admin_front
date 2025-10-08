# Seat Reserve API Test Setup

## Overview
This document describes the hardcoded test setup for testing the seat reservation failure scenario.

## Test Configuration

### Location
`/components/dashboard_admin_buy/pdp/new/BusReservationWithStepper.tsx` (Lines 756-788)

### Test Purpose
To test the behavior when the seat reservation API returns `success: false`, simulating the scenario where seats are already reserved by another user.

## Hardcoded Test Payload

```javascript
const reservationPayload = {
  srvNo: "727273-3",
  coToken: "11214-21",
  seats: "1,2",
  contactPhone: "09122028679",
  passengersJson: "[{\"FirstName\":\"آبتین\",\"LastName\":\"چگینی\",\"NationalCode\":\"0016141075\",\"Bdate\":\"13720513\",\"Gender\":2},{\"FirstName\":\"یگانه\",\"LastName\":\"حشمت\",\"NationalCode\":\"0019440308\",\"Bdate\":\"13750629\",\"Gender\":1}]",
  callBackUrl: "https://example.com/callback",
  paymentType: 1
};
```

### Dynamic Headers
Only the `Token` header is set dynamically from the user's session:
```javascript
headers: {
  'Token': session.access_token,
  'Content-Type': 'application/json'
}
```

## Expected Behavior

### When API Returns `success: false`

1. **User stays in Step 1**: The user is prevented from proceeding to the payment step
2. **Dialog is shown**: A ShadCN dialog appears with the message: "صندلی در حال حاضر رزرو شده است"
3. **No progression**: The `return` statement prevents calling `nextStep()`
4. **Console logging**: Detailed logs show the failure

### Code Flow

```javascript
// Check if reservation was successful
if (reservationResponse.data.success === false) {
  console.warn('⚠️ Seat reservation failed - Seats are occupied');
  
  // Show dialog for occupied seats
  setOccupiedMessage('صندلی در حال حاضر رزرو شده است');
  setShowSeatsOccupiedDialog(true);
  return; // Don't proceed to next step - keep user in step 1
}
```

## Dialog Implementation

The dialog is already implemented in the component (Lines 1283-1312):

```tsx
<Dialog open={showSeatsOccupiedDialog} onOpenChange={setShowSeatsOccupiedDialog}>
  <DialogContent className="sm:max-w-md" dir="rtl">
    <DialogHeader>
      <DialogTitle className="text-xl font-IranYekanBold text-red-600 flex items-center gap-2">
        <svg>...</svg>
        صندلی‌ها رزرو شده
      </DialogTitle>
      <DialogDescription className="text-base text-gray-700 font-IranYekanRegular mt-4">
        {occupiedMessage}
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="mt-6">
      <Button
        onClick={() => {
          setShowSeatsOccupiedDialog(false);
          router.push('/dashboard');
        }}
        className="w-full bg-[#0D5990] hover:bg-[#0A4A7A] text-white font-IranYekanBold"
      >
        بازگشت به انتخاب صندلی
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Testing Steps

1. **Navigate to PDP page**: Go to the product detail page for bus ticket booking
2. **Select seats**: Choose any seats from the bus layout
3. **Enter passenger details**: Fill in the passenger information form
4. **Click "تایید و ادامه"**: Click the continue button
5. **API call is made**: The hardcoded test payload is sent to the API
6. **Observe behavior**:
   - If API returns `success: false`: Dialog appears, user stays in Step 1
   - If API returns `success: true`: User proceeds to Step 2 (Payment)

## Error Handling

The code handles two scenarios:

### 1. Direct Response with `success: false`
```javascript
if (reservationResponse.data.success === false) {
  setOccupiedMessage('صندلی در حال حاضر رزرو شده است');
  setShowSeatsOccupiedDialog(true);
  return;
}
```

### 2. Exception Caught in Catch Block
```javascript
catch (reservationError) {
  if (axios.isAxiosError(reservationError)) {
    if (reservationError.response?.data?.success === false) {
      setOccupiedMessage('صندلی در حال حاضر رزرو شده است');
      setShowSeatsOccupiedDialog(true);
      return;
    }
  }
}
```

## Console Logs

Watch for these console logs during testing:

```
🎫 Calling seat reservation API...
📤 Seat Reservation API Request (HARDCODED TEST):
🔗 URL: https://api.bilit4u.com/admin/api/v1/orders/seat/reserve
📦 Payload: {...}
🔑 Headers: {...}
🧪 Testing with hardcoded data to simulate seat reservation failure
📥 Seat Reservation API Response:
✅ Full Response: {...}
✅ Success: false (or true)
✅ Message: {...}
⚠️ Seat reservation failed - Seats are occupied (if success: false)
```

## Switching Back to Production

To switch back to production mode with dynamic payload, replace the hardcoded payload section with:

```javascript
// Get user data
const { user } = useUserStore.getState();

// Prepare seats (comma-separated seat numbers)
const seats = selectedSeats.map(s => s.seatNo).join(',');

// Prepare passengers JSON
const passengersArray = result.passengers.map((p: any) => ({
  FirstName: p.name,
  LastName: p.family,
  NationalCode: p.nationalId,
  Bdate: p.birthDate,
  Gender: p.gender
}));
const passengersJson = JSON.stringify(passengersArray);

// Prepare payload
const reservationPayload = {
  srvNo: urlTicketId || ticketId,
  coToken: urlToken || token,
  seats: seats,
  contactPhone: user?.phoneNumber || '09122028679',
  passengersJson: passengersJson,
  callBackUrl: typeof window !== 'undefined' ? `${window.location.origin}/invoice` : '',
  paymentType: 1
};
```

## API Endpoint

```
POST https://api.bilit4u.com/admin/api/v1/orders/seat/reserve
```

### Request Headers
```
Token: <session.access_token>
Content-Type: application/json
```

### Response Format
```json
{
  "success": true/false,
  "message": "...",
  "redisKey": "..." (only present if success: true)
}
```

## Notes

- The test payload uses hardcoded passenger data for آبتین چگینی and یگانه حشمت
- The `Token` header is the only dynamic value, ensuring proper authentication
- The dialog message is in Persian: "صندلی در حال حاضر رزرو شده است"
- User remains on Step 1 (seat selection and passenger details) when reservation fails
- The dialog provides a button to return to the dashboard

