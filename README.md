# TxMonitor - ระบบดูยอดฝาก-ถอนเงิน

ระบบ Dashboard สำหรับดูยอดฝาก-ถอนเงินแบบ Real-time พร้อมระบบ Login/Register และจัดการ Database หลายเว็บ

## Features

- 🔐 **ระบบ Login/Register** - แยก User แต่ละคนเข้าใช้งาน
- 📊 **Dashboard** - ดูภาพรวมยอดฝาก-ถอนทุก Database พร้อมแสดงกำไร/ขาดทุน
- 💰 **ยอดฝาก** - ดูรายการฝากเงินทั้งหมด พร้อมกรองตามเงื่อนไข
- 💸 **ยอดถอน** - ดูรายการถอนเงินทั้งหมด พร้อมกรองตามเงื่อนไข
- 🗄️ **หลาย Database** - รองรับเชื่อมต่อหลายเว็บพร้อมกัน (แยกตาม User)
- 📝 **หมายเหตุ Database** - เพิ่ม note สำหรับแต่ละ Database เพื่อง่ายต่อการจำ

## ตัวกรองข้อมูล

- 👤 **ค้นหา User** - พิมพ์เบอร์โทรหรือ username พร้อม autocomplete
- 🏦 **ประเภทการชำระ**: ธนาคาร (PromptPay) / TrueMoney Wallet / Manual
- 🤖 **Auto / Manual** - กรองรายการอัตโนมัติ หรือ ที่ admin ทำเอง
- 📅 **วันที่** - เลือกช่วงเวลา
- ✅ **สถานะ** - สำเร็จ / รอดำเนินการ

## ติดตั้ง

### 1. สร้าง Database สำหรับระบบ

```bash
mysql -u root -p < database/schema.sql
```

หรือ import ไฟล์ `database/schema.sql` ผ่าน phpMyAdmin

### 2. ตั้งค่า Environment Variables

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
# Database Configuration (สำหรับระบบ Auth)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tx_monitor

# JWT Secret
JWT_SECRET=your-super-secret-key

# App Configuration
NEXT_PUBLIC_APP_NAME=TxMonitor
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. ติดตั้ง Dependencies

```bash
npm install
```

### 4. รันเซิร์ฟเวอร์

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm run start
```

### 5. เข้าใช้งาน

เปิด `http://localhost:3000`

**Default Admin:**
- Username: `admin`
- Password: `admin123`

## Table Structure

### ระบบ TxMonitor (tx_monitor database)

ดู `database/schema.sql`

### Transactions Table (ของเว็บที่เชื่อมต่อ)

```sql
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `amount` double NOT NULL,
  `bonus` double DEFAULT '0',
  `type_tran` enum('deposit','withdraw') NOT NULL,
  `tmw` int(1) DEFAULT '0',           -- 1=TrueMoney, -6=PromptPay/Bank, 0=Manual
  `isAuto` int(1) DEFAULT '1',        -- 1=Auto, 0=Manual
  `status` int(11) NOT NULL DEFAULT '0', -- 1=Success, 0=Pending
  PRIMARY KEY (`id`)
);
```

## การใช้งาน

### Login / Register
- สมัครสมาชิกใหม่ หรือใช้ admin เริ่มต้น
- แต่ละ User จะมี Database เป็นของตัวเอง

### Dashboard
- แสดงภาพรวมยอดฝาก-ถอนทุก Database
- แสดงกำไร/ขาดทุนรวม
- แยกแสดงทีละ Database พร้อมรายละเอียด

### หน้ายอดฝาก / ยอดถอน
- เลือก Database จาก dropdown
- ค้นหา User โดยพิมพ์เบอร์โทร
- กรองตามประเภทการชำระ
- กรองตาม Auto/Manual
- กรองตามสถานะ
- เลือกช่วงวันที่

### จัดการ Database
- เพิ่ม Database ใหม่ พร้อมใส่ชื่อเว็บและหมายเหตุ
- ระบบทดสอบการเชื่อมต่อก่อนบันทึก
- แก้ไข / ลบ Database

## Tech Stack

- **Next.js 16** - React Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **MySQL2** - Database Connection
- **bcryptjs** - Password Hashing
- **jsonwebtoken** - JWT Authentication
- **js-cookie** - Cookie Management
- **SweetAlert2** - Beautiful Alerts
- **date-fns** - Date Formatting
- **Lucide React** - Icons

## Security

- Password hashing with bcrypt (12 rounds)
- JWT token with 7-day expiry
- Per-user database isolation
- Token-based API authentication
