# Checkout Component

این کامپوننت صفحه نهایی خرید (Checkout) برای داشبورد PDP است.

## ویژگی‌ها

### ۱. نمایش جزئیات بلیط (TicketCardLg)
- نمایش اطلاعات کامل سفر
- مسیر، زمان حرکت و رسیدن
- امکانات اتوبوس
- قوانین استرداد

### ۲. بررسی مسافران (Passenger Review)
- نمایش لیست تمام مسافران
- شماره صندلی هر مسافر
- اطلاعات شخصی (نام، نام خانوادگی، کد ملی)
- نمایش جنسیت با آیکون‌های متمایز

### ۳. پرداخت و قیمت (Price & Checkout)
- خلاصه قیمت‌ها
- تعداد صندلی و قیمت هر صندلی
- جمع کل
- روش پرداخت: **گیف پول**
- دکمه پرداخت با لودینگ

## نحوه استفاده

```tsx
import { Checkout } from "@/components/dashboard_admin_buy/pdp/previous/checkout/checkout";
import { ServiceDetails } from "@/components/dashboard_admin_buy/pdp/previous/ticket-card-lg/index";

// در کامپوننت والد خود:
const MyCheckoutPage = () => {
  const ticketDetails: ServiceDetails = {
    ServiceNo: "12345",
    DepartDate: "20/07/1404",
    DepartTime: "10:30",
    Price: "2500000",
    FullPrice: "2500000",
    Description: null,
    LogoUrl: "https://cdn.bilit4u.com/images/logo.png",
    IsCharger: true,
    IsMonitor: true,
    IsBed: false,
    IsVIP: true,
    IsSofa: false,
    IsMono: false,
    IsAirConditionType: true,
    SrcCityCode: "1",
    DesCityCode: "3",
    SrcCityName: "تهران",
    DesCityName: "شیراز",
    Cnt: "10",
    CoName: "شرکت اتوبوسرانی نمونه",
    Group: "A",
    BusType: "VIP",
    BusTypeFull: "اتوبوس VIP با تمام امکانات",
    RequestToken: "abc123",
    TicketNo: "T12345",
    Timestamp: "1404-07-20T10:30:00",
    SrcCityId: "1",
    DesCityId: "3"
  };

  const handleBack = () => {
    // منطق بازگشت به صفحه قبل
    router.back();
  };

  return (
    <Checkout 
      ticketDetails={ticketDetails}
      onBack={handleBack}
    />
  );
};
```

## جریان کاری

۱. کاربر از صفحه انتخاب مسافر به این صفحه می‌آید
۲. اطلاعات مسافران از `PassengerStore` خوانده می‌شود
۳. اطلاعات صندلی‌ها از `TicketStore` خوانده می‌شود
۴. کاربر جزئیات را بررسی می‌کند
۵. با کلیک روی "تایید و پرداخت"، پرداخت از گیف پول انجام می‌شود
۶. در صورت موفقیت، به صفحه تیکت هدایت می‌شود

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `ticketDetails` | `ServiceDetails` | ✅ | اطلاعات کامل بلیط و سرویس |
| `onBack` | `() => void` | ❌ | تابع برای برگشت به صفحه قبل |

## State Management

این کامپوننت از Zustand stores زیر استفاده می‌کند:

- **TicketStore**: برای دریافت اطلاعات صندلی‌های انتخاب شده
- **PassengerStore**: برای دریافت اطلاعات مسافران

## API Integration

پرداخت از طریق endpoint زیر انجام می‌شود:

```
POST https://api.bilit4u.com/admin/api/v1/admin/tickets/reserve
```

با header های زیر:
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

Body:
```json
{
  "ticketId": "T12345",
  "requestToken": "abc123",
  "amount": 2500000,
  "passengers": [...],
  "paymentMethod": "giftPool"
}
```

## Styling

- از TailwindCSS استفاده می‌شود
- رنگ اصلی: `#0D5990` (آبی)
- فونت: IranYekan
- Responsive برای موبایل و دسکتاپ

## نکات مهم

۱. قبل از استفاده، مطمئن شوید که:
   - مسافران در `PassengerStore` ذخیره شده‌اند
   - صندلی‌ها در `TicketStore` انتخاب شده‌اند
   - کاربر لاگین کرده است (session موجود است)

۲. پرداخت فقط از "گیف پول" انجام می‌شود

۳. در صورت عدم موفقیت، پیام خطا با toast نمایش داده می‌شود
