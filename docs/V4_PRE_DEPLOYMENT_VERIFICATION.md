# ✅ V4 Pre-Deployment Verification Checklist

## 🎯 Tujuan

Memverifikasi semua fungsi kontrak dan app berjalan dengan mulus **SEBELUM** deploy kontrak baru untuk workflow `claimReward` yang dioptimasi.

**Kenapa pendekatan ini lebih baik:**
- ✅ Lebih aman (tidak mengubah banyak hal sekaligus)
- ✅ Lebih mudah debug (jika ada masalah, tahu sumbernya)
- ✅ Tidak lebih rumit (hanya perlu 1 deploy tambahan setelah verifikasi)
- ✅ Lebih terpercaya (memastikan foundation solid sebelum upgrade)

---

## 📋 Checklist: Fungsi Kontrak V4 Saat Ini

### 1. ✅ **createReminder** (Creator Flow)

**Fungsi Kontrak:**
```solidity
function createReminder(
    uint256 totalAmount,
    uint256 reminderTime,
    string memory description,
    string memory farcasterUsername
) external returns (uint256)
```

**Yang Perlu Di-verify:**
- [ ] Wallet dapat connect dengan baik
- [ ] Form input validation bekerja (description, amount, deadline)
- [ ] Token approval flow bekerja (jika belum approve)
- [ ] `createReminder` transaction berhasil
- [ ] 30/70 split benar (30% commitment, 70% reward pool)
- [ ] Reminder muncul di "My Feed" setelah create
- [ ] Token balance berkurang sesuai totalAmount
- [ ] Reminder ID increment dengan benar
- [ ] Event `ReminderCreated` ter-emit

**Test Steps:**
1. Connect wallet
2. Klik "+ New Reminder"
3. Isi: description = "Test Reminder", amount = "100", deadline = future time
4. Klik "Lock & Commit"
5. Approve token (jika perlu)
6. Confirm transaction
7. Verify:
   - Reminder muncul di "My Feed"
   - Balance berkurang 100 tokens
   - Reminder ID ter-assign

---

### 2. ✅ **recordReminder** (Helper Flow - Part 1)

**Fungsi Kontrak:**
```solidity
function recordReminder(
    uint256 reminderId,
    uint256 neynarScore
) external nonReentrant
```

**Yang Perlu Di-verify:**
- [ ] Button "Help to remind" enable di T-1 hour
- [ ] Button disabled sebelum T-1 hour
- [ ] Farcaster post flow bekerja (buka composer/Warpcast URL)
- [ ] Neynar post verification bekerja (`/api/reminders/record`)
- [ ] Neynar score calculation benar (0-1.0 scale)
- [ ] Score dikonversi ke 0-100 scale untuk contract (multiply by 100)
- [ ] `recordReminder` transaction berhasil
- [ ] Reward amount di-lock sesuai tier:
  - Score ≥ 0.9 (≥90) → 10% of reward pool
  - Score 0.5-0.89 (50-89) → 6% of reward pool
  - Score < 0.5 (<50) → 3% of reward pool
- [ ] Event `UserReminded` ter-emit
- [ ] Helper tidak bisa record 2x untuk reminder yang sama

**Test Steps:**
1. Buat reminder dengan deadline 2 jam dari sekarang
2. Tunggu sampai T-1 hour (1 jam sebelum deadline)
3. Sebagai helper, klik "Help to remind"
4. Post di Farcaster dengan mention creator dan app URL
5. Kembali ke app
6. Verify:
   - Post ter-verify oleh Neynar
   - Score ter-calculate
   - `recordReminder` transaction berhasil
   - Reward amount sesuai tier

---

### 3. ✅ **claimReward** (Helper Flow - Part 2) - **SAAT INI**

**Fungsi Kontrak:**
```solidity
function claimReward(uint256 reminderId) external nonReentrant {
    require(reminder.confirmed || block.timestamp > reminder.confirmationDeadline, 
        "Cannot claim yet");
    // ... rest of logic
}
```

**Yang Perlu Di-verify (Workflow Saat Ini):**
- [ ] Helper **TIDAK BISA** claim langsung setelah `recordReminder`
- [ ] Helper bisa claim setelah `reminder.confirmed = true` (creator confirm)
- [ ] Helper bisa claim setelah `block.timestamp > confirmationDeadline`
- [ ] Reward amount yang di-claim sesuai dengan yang di-lock di `recordReminder`
- [ ] Token transfer ke helper berhasil
- [ ] Helper tidak bisa claim 2x (check `record.claimed`)
- [ ] Event `RewardClaimed` ter-emit
- [ ] `reminder.rewardsClaimed` update dengan benar

**Test Steps (Scenario 1: After Creator Confirms):**
1. Helper sudah record reminder (step 2)
2. Creator klik "Confirm Reminder" di T-1 hour atau setelah deadline
3. Helper klik claim reward (atau auto-trigger jika diimplement)
4. Verify:
   - Transaction berhasil
   - Helper mendapat token sesuai reward amount
   - Reminder marked as `confirmed`

**Test Steps (Scenario 2: After Deadline Passed):**
1. Helper sudah record reminder (step 2)
2. Tunggu sampai `confirmationDeadline` lewat (deadline + 1 hour)
3. Helper klik claim reward
4. Verify:
   - Transaction berhasil
   - Helper mendapat token sesuai reward amount

**Catatan Saat Ini:**
- ⚠️ Helper **HARUS TUNGGU** sampai reminder confirmed atau deadline lewat
- ⚠️ Ini adalah behavior yang akan diubah di contract baru

---

### 4. ✅ **confirmReminder** (Creator Flow)

**Fungsi Kontrak:**
```solidity
function confirmReminder(uint256 reminderId) external nonReentrant {
    require(block.timestamp >= reminder.reminderTime - 1 hours, "Too early");
    require(block.timestamp <= reminder.confirmationDeadline, "Deadline passed");
    // Returns 30% commitment
}
```

**Yang Perlu Di-verify:**
- [ ] Button "Confirm Reminder" enable di T-1 hour
- [ ] Button disabled sebelum T-1 hour
- [ ] Button disabled setelah `confirmationDeadline`
- [ ] Creator bisa confirm dari "Public Feed" dan "My Feed"
- [ ] `confirmReminder` transaction berhasil
- [ ] 30% commitment dikembalikan ke creator
- [ ] `reminder.confirmed = true`
- [ ] `reminder.confirmationTime` ter-set
- [ ] Event `ReminderConfirmed` ter-emit
- [ ] Reminder status berubah jadi "Confirmed"
- [ ] Time detail di card hilang (karena confirmed)
- [ ] "Completed" count di dashboard increment

**Test Steps:**
1. Buat reminder dengan deadline 2 jam dari sekarang
2. Tunggu sampai T-1 hour
3. Klik "Confirm Reminder"
4. Confirm transaction
5. Verify:
   - 30% commitment dikembalikan
   - Reminder status = "Confirmed"
   - Time detail hilang
   - Completed count increment

---

### 5. ✅ **reclaimReminder** (Creator Flow - Alternative)

**Fungsi Kontrak:**
```solidity
function reclaimReminder(uint256 reminderId) external nonReentrant {
    require(block.timestamp >= reminder.reminderTime - 1 hours, "Too early");
    require(block.timestamp < reminder.reminderTime, "Deadline passed");
    // Returns 30% commitment + unclaimed 70% reward pool
}
```

**Yang Perlu Di-verify:**
- [ ] Dipanggil otomatis jika creator confirm di T-1 hour (sebelum deadline)
- [ ] Dipanggil melalui `confirmReminder` logic (check waktu)
- [ ] `reclaimReminder` transaction berhasil jika di T-1 hour (before deadline)
- [ ] 30% commitment dikembalikan
- [ ] Unclaimed 70% reward pool dikembalikan
- [ ] `reminder.burned = true` (marked as resolved)
- [ ] Event `ReminderReclaimed` ter-emit
- [ ] Reminder status berubah jadi "Confirmed" (di UI)
- [ ] Time detail di card hilang
- [ ] "Completed" count increment

**Test Steps:**
1. Buat reminder dengan deadline 2 jam dari sekarang
2. Tunggu sampai T-1 hour (masih sebelum deadline)
3. Klik "Confirm Reminder"
4. Verify:
   - `reclaimReminder` dipanggil (bukan `confirmReminder`)
   - 30% + unclaimed 70% dikembalikan
   - Reminder status = "Confirmed"

---

### 6. ✅ **burnMissedReminder** (Cron Job)

**Fungsi Kontrak:**
```solidity
function burnMissedReminder(uint256 reminderId) external nonReentrant {
    require(block.timestamp > reminder.confirmationDeadline, "Deadline not passed");
    // Burns 30% commitment, returns unclaimed 70% reward pool
}
```

**Yang Perlu Di-verify:**
- [ ] Cron job berjalan setiap 15 menit (`*/15 * * * *`)
- [ ] Cron job check `reminderTime` dan `confirmationDeadline` dengan benar
- [ ] `burnMissedReminder` dipanggil setelah `confirmationDeadline` lewat
- [ ] 30% commitment di-burn (transfer ke `0xdead`)
- [ ] Unclaimed 70% reward pool dikembalikan ke creator
- [ ] `reminder.burned = true`
- [ ] Event `TokensBurned` dan `RewardPoolReturned` ter-emit
- [ ] Reminder tidak muncul lagi di active reminders
- [ ] "Burned" count di dashboard increment

**Test Steps:**
1. Buat reminder dengan deadline 5 menit dari sekarang
2. Jangan confirm atau reclaim
3. Tunggu sampai `confirmationDeadline` lewat (deadline + 1 hour)
4. Trigger cron job manual atau tunggu automatic
5. Verify:
   - Cron job memanggil `burnMissedReminder`
   - 30% di-burn
   - Unclaimed 70% dikembalikan
   - Reminder status = "Burned"

---

### 7. ✅ **View Functions**

**Fungsi Kontrak:**
```solidity
function getHelpersFor(uint256 reminderId) external view returns (address[] memory)
function getUserReminders(address user) external view returns (uint256[] memory)
function canRemind(uint256 reminderId) external view returns (bool)
function getActiveReminders() external view returns (uint256[] memory)
```

**Yang Perlu Di-verify:**
- [ ] `getHelpersFor` return list helpers yang benar
- [ ] `getUserReminders` return list reminders creator dengan benar
- [ ] `canRemind` return `true` hanya di T-1 hour window
- [ ] `canRemind` return `false` jika reminder confirmed/burned
- [ ] `getActiveReminders` return reminders yang belum confirmed/burned
- [ ] Semua view functions return data yang konsisten dengan state

---

## 📋 Checklist: Fungsi App yang Berinteraksi

### 1. ✅ **Token Balance Display**

**Yang Perlu Di-verify:**
- [ ] Balance ditampilkan dengan benar di header
- [ ] Balance update setelah create reminder
- [ ] Balance update setelah claim reward (helper)
- [ ] Balance update setelah confirm/reclaim (creator)
- [ ] Balance format benar (dengan desimal)
- [ ] Loading state ditampilkan saat fetch
- [ ] Error handling jika fetch gagal

**Files:**
- `hooks/use-token-balance.ts`
- `components/dashboard/HeaderWallet.tsx`

---

### 2. ✅ **Reminder List Display**

**Yang Perlu Di-verify:**
- [ ] Reminders fetch dari contract dengan benar
- [ ] "Public Feed" menampilkan semua active reminders
- [ ] "My Feed" menampilkan hanya reminders creator
- [ ] Status badge benar (Active, Confirmed, Burned)
- [ ] Time display benar (relative dan absolute)
- [ ] Time detail hilang jika confirmed
- [ ] Creator username ditampilkan di top-left
- [ ] Creator username clickable (link ke Warpcast)
- [ ] Layout rapi dan tidak overlap

**Files:**
- `hooks/useReminders.ts`
- `components/reminders/reminder-card.tsx`

---

### 3. ✅ **T-1 Hour Logic**

**Yang Perlu Di-verify:**
- [ ] Button "Help to remind" enable di T-1 hour (helper)
- [ ] Button "Confirm Reminder" enable di T-1 hour (creator)
- [ ] Button disabled sebelum T-1 hour
- [ ] Button disabled setelah deadline (untuk confirm)
- [ ] Time calculation benar (T-1 hour = reminderTime - 3600)
- [ ] Timezone handling benar

**Files:**
- `hooks/useReminders.ts` (canInteract logic)
- `components/reminders/reminder-card.tsx` (button enable/disable)

---

### 4. ✅ **Farcaster Integration**

**Yang Perlu Di-verify:**
- [ ] User bisa connect wallet via Farcaster miniapp
- [ ] Username dan profile picture ditampilkan di header
- [ ] Farcaster user data fetch dari Neynar API
- [ ] Helper post verification bekerja
- [ ] Creator username fetch untuk reminder cards
- [ ] FID lookup by address bekerja

**Files:**
- `hooks/use-farcaster-user.ts`
- `components/providers/farcaster-provider.tsx`
- `app/api/farcaster/fid-by-address/route.ts`
- `app/api/reminders/record/route.ts`

---

### 5. ✅ **Neynar Score & Reward Calculation**

**Yang Perlu Di-verify:**
- [ ] Neynar User Quality Score fetch dari API
- [ ] Score calculation benar (0-1.0 scale)
- [ ] Score dikonversi ke 0-100 untuk contract (multiply by 100)
- [ ] Reward tier sesuai:
  - Score ≥ 0.9 → 10% of reward pool
  - Score 0.5-0.89 → 6% of reward pool
  - Score < 0.5 → 3% of reward pool
- [ ] Estimated reward ditampilkan ke user
- [ ] Actual reward match dengan estimated reward

**Files:**
- `app/api/reminders/record/route.ts`
- `app/api/farcaster/user/route.ts`
- `app/api/neynar/score/route.ts`

---

### 6. ✅ **Dashboard Statistics**

**Yang Perlu Di-verify:**
- [ ] "Active" count = reminders yang belum confirmed/burned
- [ ] "Completed" count = reminders yang confirmed
- [ ] "Burned" count = reminders yang burned (missed deadline)
- [ ] Count update setelah create/confirm/reclaim/burn
- [ ] Count akurat dan konsisten dengan contract state

**Files:**
- `components/dashboard-client.tsx` (dashboard stats calculation)

---

## 🧪 Testing Workflow Lengkap

### **Scenario 1: Happy Path (Creator Confirms)**

1. **Creator creates reminder**
   - [ ] Reminder created dengan 100 tokens
   - [ ] 30 tokens → commitment, 70 tokens → reward pool
   - [ ] Reminder muncul di "My Feed"

2. **Helper helps at T-1 hour**
   - [ ] Button "Help to remind" enable
   - [ ] Helper post di Farcaster
   - [ ] Post verified oleh Neynar
   - [ ] Score calculated (misalnya 0.95 → tier high)
   - [ ] `recordReminder` berhasil
   - [ ] Reward locked: 10% of 70 = 7 tokens

3. **Creator confirms**
   - [ ] Button "Confirm Reminder" enable
   - [ ] Creator klik confirm
   - [ ] `confirmReminder` atau `reclaimReminder` dipanggil
   - [ ] 30% commitment dikembalikan (30 tokens)
   - [ ] Reminder status = "Confirmed"

4. **Helper claims reward**
   - [ ] Helper bisa claim setelah confirmed
   - [ ] `claimReward` berhasil
   - [ ] Helper mendapat 7 tokens
   - [ ] Helper tidak bisa claim 2x

**Expected Results:**
- Creator: 100 - 100 (create) + 30 (confirm) = 30 tokens net (kehilangan 70 untuk helper)
- Helper: 7 tokens earned
- Contract: 30 tokens di-burn (commitment), 7 tokens dikeluarkan (reward), 63 tokens unclaimed dikembalikan ke creator

---

### **Scenario 2: Creator Reclaims at T-1 Hour**

1. **Creator creates reminder**
   - [ ] Reminder created dengan 100 tokens
   - [ ] 30 tokens → commitment, 70 tokens → reward pool

2. **Helper helps at T-1 hour**
   - [ ] Helper record reminder
   - [ ] Reward locked: 7 tokens

3. **Creator reclaims at T-1 hour (before deadline)**
   - [ ] Creator klik "Confirm Reminder" (masih di T-1 hour, sebelum deadline)
   - [ ] `reclaimReminder` dipanggil
   - [ ] 30% commitment dikembalikan (30 tokens)
   - [ ] Unclaimed 70% dikembalikan (70 - 7 = 63 tokens)
   - [ ] Total: 30 + 63 = 93 tokens dikembalikan

4. **Helper claims reward (after deadline)**
   - [ ] Helper tunggu sampai confirmationDeadline lewat
   - [ ] Helper claim reward
   - [ ] Helper mendapat 7 tokens

**Expected Results:**
- Creator: 100 - 100 (create) + 93 (reclaim) = -7 tokens net (kehilangan 7 untuk helper)
- Helper: 7 tokens earned
- Contract: 7 tokens dikeluarkan (reward)

---

### **Scenario 3: Missed Deadline (Cron Job)**

1. **Creator creates reminder**
   - [ ] Reminder created dengan 100 tokens
   - [ ] 30 tokens → commitment, 70 tokens → reward pool

2. **Helper helps at T-1 hour**
   - [ ] Helper record reminder
   - [ ] Reward locked: 7 tokens

3. **Deadline lewat tanpa confirm/reclaim**
   - [ ] Cron job check setelah confirmationDeadline lewat
   - [ ] `burnMissedReminder` dipanggil
   - [ ] 30% commitment di-burn (30 tokens → 0xdead)
   - [ ] Unclaimed 70% dikembalikan (70 - 7 = 63 tokens)
   - [ ] Reminder status = "Burned"

4. **Helper claims reward (after deadline)**
   - [ ] Helper claim reward setelah deadline lewat
   - [ ] Helper mendapat 7 tokens

**Expected Results:**
- Creator: 100 - 100 (create) + 63 (return) = -37 tokens net (kehilangan 37: 30 burned + 7 untuk helper)
- Helper: 7 tokens earned
- Contract: 30 tokens di-burn, 7 tokens dikeluarkan (reward), 63 tokens dikembalikan ke creator

---

## 📝 Catatan Penting

### **Behavior Saat Ini yang Akan Diubah di Contract Baru:**

1. **claimReward Current Behavior:**
   - ⚠️ Helper **HARUS TUNGGU** sampai reminder confirmed atau deadline lewat
   - ⚠️ Tidak bisa claim langsung setelah `recordReminder`

2. **claimReward New Behavior (After Contract Upgrade):**
   - ✅ Helper bisa claim **LANGSUNG** setelah `recordReminder`
   - ✅ Tidak perlu tunggu confirmed atau deadline
   - ✅ Asalkan helper sudah record dan reminder belum burned/reclaimed

### **Yang TIDAK Berubah:**

- ✅ Semua fungsi lain tetap sama
- ✅ Workflow create, confirm, reclaim tetap sama
- ✅ Reward calculation tetap sama
- ✅ Tier system tetap sama
- ✅ T-1 hour logic tetap sama

---

## ✅ Next Steps Setelah Verifikasi

1. **Setelah semua checklist di atas ter-verify:**
   - [ ] Document semua test results
   - [ ] List any bugs atau issues yang ditemukan
   - [ ] Fix bugs sebelum deploy contract baru

2. **Prepare Contract Changes:**
   - [ ] Modify `claimReward` function di contract
   - [ ] Add safety checks (e.g., `!reminder.burned`)
   - [ ] Test contract changes di local/testnet
   - [ ] Verify logic benar

3. **Deploy Contract New:**
   - [ ] Deploy ke Base Mainnet
   - [ ] Verify contract di Basescan
   - [ ] Update environment variables
   - [ ] Update contract address di app

4. **Update App (Minimal Changes):**
   - [ ] Update `helpRemind` function untuk auto-claim setelah record
   - [ ] Remove waiting logic untuk claimReward
   - [ ] Test workflow baru
   - [ ] Deploy app

---

## 🎯 Kesimpulan

**Proses ini TIDAK lebih rumit, malah lebih baik karena:**

1. ✅ **Incremental Approach**: Test satu per satu, bukan semua sekaligus
2. ✅ **Clear Baseline**: Tahu fungsi mana yang sudah bekerja sebelum upgrade
3. ✅ **Easier Debugging**: Jika ada masalah setelah upgrade, tahu perubahan apa yang menyebabkan
4. ✅ **Lower Risk**: Hanya 1 perubahan utama (claimReward behavior), sisanya tetap sama
5. ✅ **Better Testing**: Bisa test thoroughly sebelum dan sesudah

**Yang perlu dilakukan:**
1. Verifikasi semua checklist di atas (1-2 hari testing)
2. Fix any bugs yang ditemukan
3. Prepare contract changes (1 hari)
4. Deploy contract baru (1 hari)
5. Update app untuk auto-claim (1 hari)
6. Test workflow baru (1 hari)

**Total: ~5-7 hari untuk complete process**

