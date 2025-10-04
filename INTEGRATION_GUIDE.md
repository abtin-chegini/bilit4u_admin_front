# Bus Reservation System Integration Guide

## Overview
This guide explains how the new stepper-based bus reservation system is integrated with the existing PLP (Product Listing Page) "خرید بلیط" button.

## Integration Flow

### 1. PLP Button Click
- **Location**: `components/dashboard_admin_buy/plp/previous/PLP/Desktop/MainCard.tsx`
- **Button**: "خرید بلیط" (Buy Ticket)
- **Action**: `handleBuyTicket()` function

### 2. Navigation
- **Route**: `/ticket/[token]/[ticketId]`
- **Implementation**: `app/ticket/[token]/[ticketId]/page.tsx`
- **Parameters**: 
  - `token`: Service token from PLP data
  - `ticketId`: Service number from PLP data

### 3. Data Flow
```typescript
// PLP Data → Ticket Route → Stepper System
{
  token: data.Token,
  ticketid: data.ServiceNo,
  companyName: data.CoName,
  fullPrice: data.FullPrice,
  sourceCity: data.SrcCityName,
  destinationCity: data.DesCityName,
  // ... other ticket data
}
```

### 4. Stepper System
- **Component**: `BusReservationWithStepper`
- **Location**: `components/dashboard_admin_buy/pdp/new/BusReservationWithStepper.tsx`
- **Steps**: 5-step process with individual components

## File Structure

```
app/
├── ticket/[token]/[ticketId]/page.tsx    # Main ticket route
└── demo-ticket/page.tsx                  # Demo/test page

components/dashboard_admin_buy/
├── pdp/new/                              # New stepper system
│   ├── BusReservationWithStepper.tsx     # Main stepper component
│   ├── index.tsx                         # Export file
│   └── steps/                            # Individual step components
│       ├── SeatSelectionStep.tsx         # Step 1: Seat selection
│       ├── PassengerDetailsStep.tsx      # Step 2: Passenger details
│       ├── ConfirmationStep.tsx          # Step 3: Confirmation
│       ├── PaymentStep.tsx               # Step 4: Payment
│       └── TicketIssueStep.tsx           # Step 5: Ticket issue
└── plp/previous/PLP/Desktop/             # Existing PLP components
    └── MainCard.tsx                      # Contains "خرید بلیط" button

store/
├── TicketStore.tsx                       # Ticket data management
└── FlowSessionStore.tsx                  # Flow session management (updated)
```

## Key Features

### 1. Seamless Integration
- PLP button works without any changes
- Automatic navigation to new stepper system
- Data passed through URL parameters and stores

### 2. Step-by-Step Process
1. **Seat Selection**: Choose seats using existing bus layout components
2. **Passenger Details**: Fill passenger information using existing form
3. **Confirmation**: Review all information before payment
4. **Payment**: Process payment with multiple options
5. **Ticket Issue**: Generate and download ticket

### 3. State Management
- **TicketStore**: Manages ticket data and selected seats
- **PassengerStore**: Manages passenger information
- **FlowSessionStore**: Manages step progression and session data

### 4. Responsive Design
- Works on mobile, tablet, and desktop
- Uses existing responsive components
- Persian RTL support throughout

## Usage

### For Testing
1. Navigate to `/demo-ticket`
2. Click "تست سیستم رزرو بلیط"
3. Experience the full stepper flow

### For Production
1. User clicks "خرید بلیط" in PLP
2. System automatically navigates to stepper
3. User completes 5-step process
4. Ticket is generated and ready for download

## Benefits

1. **Better UX**: Clear step-by-step process
2. **Progress Tracking**: Visual progress indicator
3. **Error Prevention**: Validation at each step
4. **Flexibility**: Easy to modify individual steps
5. **Maintainability**: Modular component structure
6. **Integration**: Seamless with existing PLP system

## Technical Notes

- Uses Next.js dynamic routes: `[token]/[ticketId]`
- Integrates with existing Zustand stores
- Maintains session state throughout the process
- Supports Persian language and RTL layout
- Responsive design for all screen sizes
- Error handling and loading states included

## Future Enhancements

1. Real API integration for ticket data
2. Payment gateway integration
3. Email/SMS notifications
4. Ticket management system
5. Analytics and tracking
6. Multi-language support
