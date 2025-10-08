# راهنمای یکپارچه‌سازی صفحه Checkout

## خلاصه تغییرات

یک صفحه Checkout کامل ایجاد شد که شامل ۳ بخش اصلی است:

### ۱. بخش اطلاعات سفر (TicketCardLg) 
- نمایش کامل جزئیات بلیط
- مسیر، زمان حرکت، زمان رسیدن
- امکانات اتوبوس
- قوانین استرداد

### ۲. بخش بررسی مسافران (Passenger Review)
- لیست تمام مسافران با جزئیات
- نمایش شماره صندلی هر مسافر
- نمایش جنسیت با رنگ‌بندی مناسب (آبی برای آقا، سبز برای خانم)
- نمایش کد ملی مسافران

### ۳. بخش پرداخت (Payment Section)
- خلاصه قیمت‌ها
- محاسبه خودکار قیمت کل
- روش پرداخت: **گیف پول**
- دکمه پرداخت با لودینگ استیت

## فایل‌های ایجاد شده

1. **checkout.tsx** - کامپوننت اصلی Checkout
2. **README.md** - مستندات کامپوننت
3. **CheckoutPage.example.tsx** - نمونه‌های یکپارچه‌سازی
4. **INTEGRATION.md** - این فایل (راهنمای یکپارچه‌سازی)

## مسیر فایل‌ها

```
/components/dashboard_admin_buy/pdp/previous/checkout/
  ├── checkout.tsx                    # کامپوننت اصلی
  ├── README.md                       # مستندات
  ├── CheckoutPage.example.tsx        # نمونه‌های کاربردی
  └── INTEGRATION.md                  # این فایل
```

## نحوه یکپارچه‌سازی با جریان موجود

### گزینه ۱: استفاده از State Management (پیشنهادی)

```tsx
// در فایل والد که seat selection و checkout را مدیریت می‌کند
import { useState } from "react";
import BusReservationWithFlow from "@/components/dashboard_admin_buy/pdp/previous/bus_reservation/BusReservationWithFlow";
import { Checkout } from "@/components/dashboard_admin_buy/pdp/previous/checkout/checkout";

const ParentComponent = () => {
  const [step, setStep] = useState<"seats" | "checkout">("seats");
  const [ticketDetails, setTicketDetails] = useState(null);

  const handleContinueToCheckout = () => {
    setStep("checkout");
  };

  const handleBackToSeats = () => {
    setStep("seats");
  };

  return (
    <>
      {step === "seats" && (
        <BusReservationWithFlow
          onContinue={handleContinueToCheckout}
        />
      )}
      
      {step === "checkout" && ticketDetails && (
        <Checkout
          ticketDetails={ticketDetails}
          onBack={handleBackToSeats}
        />
      )}
    </>
  );
};
```

### گزینه ۲: استفاده از Next.js Routing

```
ساختار مسیرها:
/ticket/[token]/[ticketId]/             # صفحه انتخاب صندلی
/ticket/[token]/[ticketId]/checkout     # صفحه چک‌اوت
```

#### ایجاد فایل page.tsx برای checkout:

```tsx
// app/ticket/[token]/[ticketId]/checkout/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { Checkout } from "@/components/dashboard_admin_buy/pdp/previous/checkout/checkout";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [ticketDetails, setTicketDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        const response = await fetch(
          `https://api.bilit4u.com/admin/api/v1/tickets/${params.ticketId}`,
          {
            headers: {
              'Authorization': `Bearer ${params.token}`,
            }
          }
        );
        const data = await response.json();
        setTicketDetails(data.ticket);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D5990]"></div>
      </div>
    );
  }

  return (
    <Checkout
      ticketDetails={ticketDetails}
      onBack={() => router.back()}
    />
  );
}
```

## تغییرات مورد نیاز در BusReservationWithFlow

برای اتصال به صفحه checkout، کد زیر را به تابع `handleContinueClick` اضافه کنید:

```tsx
const handleContinueClick = async () => {
  // ... کد موجود برای validation و save ...
  
  const result = await savePassengerData();
  
  if (result.success) {
    toast({
      title: "اطلاعات مسافران ذخیره شد",
      description: "در حال انتقال به صفحه پرداخت...",
    });

    setTimeout(() => {
      // گزینه ۱: با state management
      if (onContinue) {
        onContinue(selectedSeats);
      }
      
      // یا گزینه ۲: با routing
      // router.push(`/ticket/${token}/${ticketId}/checkout`);
    }, 300);
  }
};
```

## Data Flow (جریان داده)

```
1. Seat Selection Page (BusReservationWithFlow)
   ↓
   - User selects seats
   - User fills passenger details
   - User clicks "ذخیره اطلاعات و ادامه"
   ↓
2. Save to Stores
   - Passengers → PassengerStore
   - Seats → TicketStore
   ↓
3. Navigate to Checkout
   ↓
4. Checkout Page
   - Reads from PassengerStore
   - Reads from TicketStore
   - Displays all information
   - User clicks "تایید و پرداخت"
   ↓
5. Payment Processing
   - POST to /admin/api/v1/admin/tickets/reserve
   - Payment from "گیف پول"
   ↓
6. Success/Failure
   - Success → Navigate to ticket page
   - Failure → Show error toast
```

## Required Stores

این کامپوننت از Zustand stores زیر استفاده می‌کند:

### TicketStore
```tsx
interface TicketStore {
  selectedSeats: Array<{
    id: number;
    seatNo: string | number;
    state: string;
  }>;
  ticketId: string;
  token: string;
}
```

### PassengerStore
```tsx
interface PassengerStore {
  passengers: StoredPassenger[];
  getSessionPassengers: () => StoredPassenger[];
}

interface StoredPassenger {
  id: number | string;
  seatId?: number;
  seatNo?: number | string;
  name: string;
  family: string;
  nationalId: string;
  gender: 1 | 2; // 1 = female, 2 = male
  birthDate: string;
}
```

## API Endpoint for Payment

```
POST https://api.bilit4u.com/admin/api/v1/admin/tickets/reserve

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Body:
{
  "ticketId": "T12345",
  "requestToken": "abc123",
  "amount": 2500000,
  "passengers": [
    {
      "seatId": 1,
      "seatNo": "12",
      "firstName": "علی",
      "lastName": "احمدی",
      "nationalCode": "1234567890",
      "gender": true,  // true = male, false = female
      "dateOfBirth": "13800101"
    }
  ],
  "paymentMethod": "giftPool"
}

Response (Success):
{
  "success": true,
  "ticketId": "T12345",
  "message": "بلیط با موفقیت رزرو شد"
}

Response (Error):
{
  "success": false,
  "message": "موجودی کافی نیست"
}
```

## Testing Checklist

قبل از استقرار، موارد زیر را بررسی کنید:

- [ ] صندلی‌ها در TicketStore ذخیره می‌شوند
- [ ] مسافران در PassengerStore ذخیره می‌شوند
- [ ] اطلاعات بلیط به درستی نمایش داده می‌شود
- [ ] لیست مسافران به درستی نمایش داده می‌شود
- [ ] قیمت‌ها به درستی محاسبه می‌شوند
- [ ] دکمه پرداخت در حالت loading درست کار می‌کند
- [ ] پیام‌های خطا به درستی نمایش داده می‌شوند
- [ ] Navigation بین صفحات درست کار می‌کند
- [ ] Responsive design در موبایل و تبلت کار می‌کند
- [ ] پرداخت از گیف پول به درستی انجام می‌شود

## Styling & Responsive

کامپوننت به صورت کامل responsive است:

- **Desktop (lg+)**: لیاوت ۳ ستونی با sidebar چسبان برای پرداخت
- **Tablet (md)**: لیاوت ۲ ستونی
- **Mobile (sm)**: لیاوت تک ستونی با اسکرول عمودی

## نکات مهم

1. **Authentication**: قبل از ورود به صفحه checkout، مطمئن شوید کاربر لاگین کرده است
2. **Data Validation**: قبل از نمایش صفحه، مطمئن شوید داده‌های لازم در stores موجود است
3. **Error Handling**: تمام خطاهای احتمالی API با toast نمایش داده می‌شود
4. **Payment Method**: فقط "گیف پول" پشتیبانی می‌شود
5. **Session Management**: token از localStorage خوانده می‌شود

## پشتیبانی و سوالات

اگر سوالی دارید یا به کمک نیاز دارید، به فایل‌های زیر مراجعه کنید:

- **README.md**: مستندات کامل کامپوننت
- **CheckoutPage.example.tsx**: نمونه‌های کاربردی
- **INTEGRATION.md**: این فایل (راهنمای یکپارچه‌سازی)

موفق باشید! 🚀
