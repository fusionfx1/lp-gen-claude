# LP Factory V2 — API Integration Guide
## LeadingCards + Multilogin × Ops Center

---

## 1. LeadingCards API

**Base URL:** `https://app.leadingcards.media/v1/`
**Auth:** `Token {{token}}` ใน header

### Endpoints

| หมวด | Endpoint | Method | ใช้ทำอะไรใน LP Factory |
|------|----------|--------|----------------------|
| **Cards** | `/cards/` | GET | ดูบัตรทั้งหมด (filter: tags, bin_uuid, status, search) |
| | `/cards/` | POST | สร้างบัตรใหม่สำหรับ Ads account |
| | `/cards/:uuid/` | GET | ดูรายละเอียดบัตร |
| | `/cards/:uuid/full_card_details_.../` | GET | ดูเลขบัตรเต็ม (ต้องมี team_uuid) |
| | `/cards/:uuid/block` | PUT | ระงับบัตร (เมื่อ account โดน ban) |
| | `/cards/:uuid/activate` | PUT | เปิดใช้บัตรอีกครั้ง |
| | `/cards/:uuid/change_limit` | PUT | ปรับวงเงิน |
| **Billing** | `/billing_addresses/` | GET/POST | ดู/สร้างที่อยู่สำหรับบัตร |
| | `/billing_addresses/:uuid/` | PUT/DELETE | แก้ไข/ลบ |
| **Bins** | `/cards/bins/` | GET | ดู BIN ที่ใช้ได้ (ใช้ตอนสร้างบัตร) |
| **Tags** | `/tags/` | GET | ดู tags (ใช้ filter บัตรตาม account) |
| **Transactions** | `/transactions?from_date=` | GET | ดูรายการใช้จ่าย |
| **Teams** | `/teams/` | GET | ดู team UUID (ต้องใช้กับบาง endpoint) |

### สิ่งสำคัญ
- เมื่อทำงานเป็น team → ต้องส่ง `team_uuid` ด้วย
  - POST requests → เพิ่มใน body
  - GET requests → เพิ่มเป็น query parameter `?team_uuid={UUID}`

### ตัวอย่าง: สร้างบัตรใหม่ (POST /cards/)

```json
{
  "bin_uuid": "8d347b86-5cbb-4ae5-8b21-1412141b39ce",
  "limit": 10,
  "comment": "google-ads-account-5",
  "exp_month": 9,
  "exp_year": 2025,
  "amount": 1,
  "tags": ["google-ads", "account-5"],
  "billing_address_uuid": "dbcdc121-f486-467e-869d-4a3cecb7612c"
}
```

### ตัวอย่าง: สร้างที่อยู่ (POST /billing_addresses/)

```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone_number": "0065156545",
  "address": "Baker street 221b",
  "city": "London",
  "country": "England",
  "zip": "EC1A 1BB",
  "is_default": true
}
```

### Cards List Query Parameters

| Parameter | Description |
|-----------|-------------|
| `tags` | UUIDs คั่นด้วย `,` |
| `bin_uuid` | UUIDs คั่นด้วย `,` |
| `count` | จำนวน (เช่น 150) |
| `ordering` | เรียงลำดับ เช่น `-date_entered_utc` |
| `status` | `ACTIVE` / `BLOCKED` / `ALL` |
| `q` | ค้นหา ID, last 4 digits, name |

---

## 2. Multilogin X API

**Cloud API:** `https://api.multilogin.com/`
**Local API:** `http://127.0.0.1:{port}/` (ต้องเปิด agent)
**Auth:** Bearer Token (30 นาที) หรือ Automation Token (อายุยาวกว่า)
**API Docs:** https://documenter.getpostman.com/view/28533318/2s946h9Cv9

### Endpoints หลัก

| หมวด | ทำอะไร | ใช้ใน LP Factory |
|------|--------|-----------------|
| **Sign in** | POST → ได้ Bearer Token | เชื่อมต่อ API |
| **Refresh Token** | POST `/user/refresh_token` | ต่ออายุ token |
| **Profile Create** | สร้าง browser profile + proxy + fingerprint | สร้าง profile ต่อ Ads account |
| **Profile Start** | เปิด browser → ได้ WebSocket/port | เปิด Chrome สำหรับทำงาน |
| **Profile Stop** | ปิด browser | จบ session |
| **Profile Update** | แก้ proxy, fingerprint | เปลี่ยน proxy |
| **Profile List** | ดู profiles ทั้งหมด | sync กับ Ops Center |
| **Profile Clone** | โคลน profile | สร้าง profile ซ้ำเร็ว |
| **Cookie Import/Export** | จัดการ cookies | warm-up profiles |
| **Proxy Generate** | สร้าง residential proxy | ใช้กับ profile |
| **Folder Management** | จัดกลุ่ม profiles | จัดระเบียบ |

### ตัวอย่าง: สร้าง Quick Profile

```json
{
  "browser_type": "mimic",
  "os_type": "windows",
  "parameters": {
    "proxy": {
      "host": "proxy.example.com",
      "type": "url",
      "port": 8080,
      "username": "user",
      "password": "pass"
    },
    "flags": {
      "navigator_masking": "mask",
      "audio_masking": "mask",
      "localization_masking": "mask",
      "geolocation_popup": "prompt",
      "geolocation_masking": "mask",
      "timezone_masking": "mask",
      "canvas_noise": "natural",
      "graphics_noise": "natural",
      "graphics_masking": "mask",
      "webrtc_masking": "natural",
      "fonts_masking": "mask",
      "media_devices_masking": "mask",
      "screen_masking": "mask",
      "proxy_masking": "disabled",
      "ports_masking": "mask",
      "startup_behavior": "custom"
    },
    "fingerprint": {},
    "custom_start_urls": ["https://ads.google.com"]
  }
}
```

### Authentication Flow

```
1. POST /user/signin → { email, password } → ได้ Bearer Token (30 min)
2. POST /user/refresh_token → ต่ออายุ token
3. ใช้ Automation Token แทนได้ (อายุยาวกว่า, rate limit สูงกว่า)
```

### Rate Limits (ตาม plan)

- Starter: ต่ำสุด
- Solo/Team/Custom: สูงกว่า
- ใช้ Automation Token จะได้ rate limit สูงกว่า regular token
- Team members แชร์ rate limit ร่วมกัน

---

## 3. ผูกกับ LP Factory Ops Center

### Architecture

```
LP Factory V2 Ops Center
├── 💳 Payments tab    ←→  LeadingCards: สร้าง/ดู/block บัตร
├── 📊 Accounts tab    ←→  LeadingCards: tag บัตรกับ account
├── 🖥️ Profiles tab    ←→  Multilogin: สร้าง/เปิด/ปิด browser profile
├── 🌐 Domains tab     ←→  ผูก domain กับ profile + card
├── ⚠️ Risk Detection  ←→  LeadingCards transactions + ตรวจบัตรซ้ำ
└── 📈 Dashboard       ←→  สรุปค่าใช้จ่ายจาก transactions
```

### Flow: สร้าง Ads Account ใหม่ (End-to-End)

```
Step 1: LeadingCards → สร้างบัตรใหม่ + tag "account-5"
Step 2: Multilogin  → สร้าง profile ใหม่ + proxy ที่ไม่ซ้ำ
Step 3: LP Factory  → บันทึก account + ผูก card UUID + profile ID
Step 4: Multilogin  → เปิด browser → ไปสมัคร Google Ads
Step 5: LP Factory  → deploy LP + ตั้ง campaign
Step 6: LeadingCards → ดู transactions + ปรับ limit ตาม spend
```

### Flow: Account โดน Ban

```
Step 1: LP Factory  → Risk Detection แจ้งเตือน
Step 2: LeadingCards → Block บัตรที่ผูกกับ account นั้น
Step 3: Multilogin  → Stop profile + archive
Step 4: LP Factory  → อัพเดท status = suspended
Step 5: LeadingCards → สร้างบัตรใหม่ (BIN ต่างจากเดิม)
Step 6: Multilogin  → สร้าง profile ใหม่ (fingerprint + proxy ใหม่)
Step 7: LP Factory  → สร้าง account ใหม่ + ผูก card + profile ใหม่
```

### Flow: ตรวจสอบ Risk

```
Risk Detection ดึงข้อมูลจาก:
├── LeadingCards /cards/ → ตรวจบัตรที่ใช้ payment_id ซ้ำกัน
├── LeadingCards /transactions/ → ตรวจ spend ผิดปกติ
├── Multilogin profiles → ตรวจ proxy IP ซ้ำ / ใกล้กัน
└── Ops Domains → ตรวจ registrar กระจุกตัว
```

---

## 4. D1 Schema เพิ่มเติม (สำหรับ Integration)

### ตาราง ops_accounts (เพิ่ม fields)

```sql
ALTER TABLE ops_accounts ADD COLUMN card_uuid TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN card_last4 TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN card_status TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN profile_id TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN proxy_ip TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN monthly_spend REAL DEFAULT 0;
```

### ตาราง ops_profiles (เพิ่ม fields)

```sql
ALTER TABLE ops_profiles ADD COLUMN ml_profile_id TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN ml_folder_id TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_host TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_port TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_user TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN fingerprint_os TEXT DEFAULT 'windows';
ALTER TABLE ops_profiles ADD COLUMN browser_type TEXT DEFAULT 'mimic';
```

### ตาราง ops_payments (เพิ่ม fields)

```sql
ALTER TABLE ops_payments ADD COLUMN lc_card_uuid TEXT DEFAULT '';
ALTER TABLE ops_payments ADD COLUMN lc_bin_uuid TEXT DEFAULT '';
ALTER TABLE ops_payments ADD COLUMN card_limit REAL DEFAULT 0;
ALTER TABLE ops_payments ADD COLUMN card_expiry TEXT DEFAULT '';
ALTER TABLE ops_payments ADD COLUMN total_spend REAL DEFAULT 0;
```

---

## 5. Settings ที่ต้องเพิ่มใน LP Factory

| Key | Description |
|-----|-------------|
| `lcToken` | LeadingCards API Token |
| `lcTeamUuid` | LeadingCards Team UUID |
| `mlEmail` | Multilogin login email |
| `mlPassword` | Multilogin login password |
| `mlAutomationToken` | Multilogin Automation Token (แนะนำ) |
| `mlFolderId` | Default folder สำหรับ profiles ใหม่ |
| `defaultProxyProvider` | ผู้ให้บริการ proxy (Multilogin/custom) |
| `defaultBinUuid` | BIN เริ่มต้นสำหรับสร้างบัตร |
| `defaultBillingUuid` | Billing address เริ่มต้น |

---

## 6. API Reference Quick Links

- **LeadingCards Postman Collection:** https://shorturl.at/PFxRE
- **Multilogin X API Docs:** https://documenter.getpostman.com/view/28533318/2s946h9Cv9
- **Multilogin Help Center:** https://multilogin.com/help/en_US/api
