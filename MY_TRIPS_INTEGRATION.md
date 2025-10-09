# My Trips Integration Summary

## Overview
Successfully created a new "خریدهای من" (My Purchases) section in the dashboard that displays user's purchased tickets with search, filter, and pagination capabilities.

## Components Created

### 1. MyTripsComponent.tsx
**Location:** `/components/dashboard_admin_buy/trips/MyTripsComponent.tsx`

**Purpose:** 
Displays all tickets purchased by the authenticated user with comprehensive search and filtering capabilities.

**Features:**
- ✅ Fetches user profile to get userId
- ✅ Loads all orders for the user
- ✅ Displays tickets using the existing TicketCardLg component
- ✅ Full search functionality (company, city, passenger name, seat number, national code)
- ✅ Filter by status (all, upcoming, past, refunded)
- ✅ Sort by date, price, company, city
- ✅ Pagination support
- ✅ Refresh capability
- ✅ Loading and error states
- ✅ Persian digit conversion
- ✅ Responsive design

## Integration with Dashboard

### 2. Updated dashboard-layout.tsx
**Location:** `/components/dashboard_main/dashboard-layout.tsx`

**Changes:**
1. Added new menu item:
   ```typescript
   { icon: FileText, label: "خریدهای من", id: "my-purchases" }
   ```

2. Imported MyTripsComponent:
   ```typescript
   import MyTripsComponent from "@/components/dashboard_admin_buy/trips/MyTripsComponent"
   ```

3. Added conditional rendering based on activeSection:
   ```tsx
   {activeSection === "my-purchases" && (
     <motion.div>
       <MyTripsComponent />
     </motion.div>
   )}
   ```

## API Integration

### Profile API
**Endpoint:** `GET https://api.bilit4u.com/admin/api/v1/admin/profile`

**Headers:**
```javascript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Purpose:** Get the userId for the authenticated user

**Response:**
```json
{
  "userId": 17,
  // ... other profile fields
}
```

### Orders API
**Endpoint:** `GET https://api.bilit4u.com/admin/api/v1/orders/user/{userId}`

**Headers:**
```javascript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

**Purpose:** Get all orders for the user

**Response:**
```json
{
  "orders": [
    {
      "orderId": 123,
      "refNum": "REF123456",
      "creationDate": "2024-01-15T10:30:00",
      "isVerified": true,
      "lastStatus": "DONE",
      "ticket": {
        "srvNo": "727273-3",
        "companyName": "شرکت واحد",
        "departureCity": "تهران",
        "arrivalCity": "اصفهان",
        "departureDate": "1404/04/10",
        "departureTime": "08:30",
        "price": 2500000,
        "logoUrl": "...",
        // ... other ticket fields
      },
      "passengers": [
        {
          "id": 1,
          "fName": "آبتین",
          "lName": "چگینی",
          "nationalCode": "0016141075",
          "gender": 2,
          "seatNo": "1"
          // ... other passenger fields
        }
      ],
      "payment": {
        "refNum": "REF123456",
        "status": "DONE",
        "amount": 2500000
        // ... other payment fields
      }
    }
  ]
}
```

## Data Flow

```
1. User clicks "خریدهای من" in sidebar
   ↓
2. activeSection changes to "my-purchases"
   ↓
3. MyTripsComponent mounts
   ↓
4. Component calls fetchUserProfile()
   → GET /admin/api/v1/admin/profile
   → Extracts userId
   ↓
5. Component calls fetchOrdersWithFilter()
   → GET /admin/api/v1/orders/user/{userId}
   → Receives orders array
   ↓
6. Orders are converted to ticket format
   → mapTicketToServiceDetails()
   → convertOrdersToTickets()
   ↓
7. TicketManager displays tickets with:
   → Search functionality
   → Filters (all, upcoming, past, refunded)
   → Sorting options
   → Pagination
   → Ticket cards (TicketCardLg/TicketCardSm)
```

## Features Inherited from TicketManager

### Search Capabilities
Users can search by:
- Company name (نام شرکت)
- Source city (شهر مبدا)
- Destination city (شهر مقصد)
- Passenger name (نام مسافر)
- Seat number (شماره صندلی)
- National code (کد ملی)
- Reference number (شماره پیگیری)
- Order ID

### Filter Options
- **همه بلیط‌ها** (All) - Shows all tickets
- **سفرهای آینده** (Upcoming) - Future trips only
- **سفرهای گذشته** (Past) - Past trips only
- **استرداد شده** (Refunded) - Refunded tickets only

### Sort Options
- **تاریخ حرکت** - Departure date
- **تاریخ خرید** - Purchase date (default)
- **قیمت** - Price
- **نام شرکت** - Company name
- **شهر مبدا** - Source city

### Display Features
- Reference number with payment status badge
- Purchase date in Persian format
- Refund button (disabled for already refunded tickets)
- Ticket cards with full trip details
- Passenger information
- Download ticket button
- Amenities display
- Refund rules

## State Management

### Local State
```typescript
const [orders, setOrders] = useState<Order[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isRefreshing, setIsRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);
const [apiFilter, setApiFilter] = useState<string>('ALL');
const [userId, setUserId] = useState<number | null>(null);
```

### Authentication
Uses localStorage to get auth session:
```javascript
const sessionData = localStorage.getItem('auth_session');
const session = JSON.parse(sessionData);
const token = session.access_token;
```

## Error Handling

### Profile Fetch Errors
- Shows error toast
- Sets error state
- Displays error message to user

### Orders Fetch Errors
- 401 Unauthorized → "لطفاً دوباره وارد حساب کاربری خود شوید"
- Other errors → Shows specific error message
- Network errors → "خطا در ارتباط با سرور"

## UI States

### Loading State
Shows skeleton loaders for:
- Header
- Search/filter section
- Ticket cards (3 placeholders)

### Error State
Shows error card with:
- Red error icon
- Error message
- "تلاش مجدد" (Retry) button

### Empty State
Handled by TicketManager component:
- Shows "هنوز بلیطی خریداری نکرده‌اید"
- Provides link to search for tickets

### Success State
Displays tickets with full functionality

## Responsive Design

### Desktop (lg+)
- Uses TicketCardLg component
- Full-width layout with all details
- Grid-based passenger information

### Mobile (sm and below)
- Uses TicketCardSm component
- Compact layout
- Stacked information
- Touch-friendly buttons

## Testing Checklist

- [ ] Test profile API call and userId extraction
- [ ] Test orders API call with correct userId
- [ ] Verify ticket cards display correctly
- [ ] Test search functionality
- [ ] Test all filter options (all, upcoming, past, refunded)
- [ ] Test all sort options
- [ ] Test pagination
- [ ] Test refresh functionality
- [ ] Test download ticket button
- [ ] Test amenities dialog
- [ ] Test refund rules dialog
- [ ] Test responsive design on mobile/tablet/desktop
- [ ] Test error handling (network errors, auth errors)
- [ ] Test loading states
- [ ] Test empty state

## Usage

1. **Navigate to Dashboard:** User logs in and reaches dashboard
2. **Click "خریدهای من":** User clicks the menu item in sidebar
3. **View Trips:** Component automatically fetches and displays all user's tickets
4. **Search:** User can search for specific tickets using the search box
5. **Filter:** User can filter by trip status or date
6. **Sort:** User can sort tickets by various criteria
7. **View Details:** User can click on amenities, refund rules, or download tickets

## Code Structure

```
MyTripsComponent
├── fetchUserProfile() - Gets userId
├── fetchOrdersWithFilter() - Gets orders for user
├── mapTicketToServiceDetails() - Maps API data to ticket format
├── convertOrdersToTickets() - Converts orders to display format
└── Renders TicketManager
    ├── Search bar
    ├── Filter buttons
    ├── Sort dropdown
    ├── Ticket cards (TicketCardLg/TicketCardSm)
    └── Pagination
```

## Dependencies

### Required Packages
- axios - API calls
- moment & jalali-moment - Date handling
- framer-motion - Animations
- lucide-react - Icons

### Required Components
- TicketManager - Main display component
- TicketCardLg - Desktop ticket card
- TicketCardSm - Mobile ticket card
- UI components (Button, Skeleton, Dialog, etc.)

## Notes

- All dates are displayed in Persian calendar format
- All numbers are converted to Persian digits
- Component uses localStorage for auth session
- Tickets are sorted by creation date by default (newest first)
- Refunded tickets are displayed with reduced opacity
- Component handles all edge cases (no tickets, network errors, auth errors)

