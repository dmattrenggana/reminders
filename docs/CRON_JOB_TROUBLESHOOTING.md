# 🔧 Cron Job Troubleshooting Guide

## ✅ **Current Setup Status**

### **Configuration:**
- ✅ Cron job endpoint: `/api/cron/process-reminders`
- ✅ Schedule: Every 15 minutes (`*/15 * * * *`)
- ✅ Authentication: Via `CRON_SECRET` header
- ✅ Contract: Uses V4 ABI correctly
- ✅ Logic: Checks `confirmationDeadline` correctly

### **Required Environment Variables:**
```env
CRON_SECRET=your_secret_here
CRON_WALLET_PRIVATE_KEY=0x...
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://...
```

---

## 🔍 **How to Verify Cron Job is Working**

### **1. Check Vercel Cron Jobs Dashboard:**
1. Go to Vercel Dashboard → Your Project
2. Click "Cron Jobs" tab
3. Check `/api/cron/process-reminders` status
4. View execution logs

### **2. Manual Test:**
```bash
curl -X GET https://your-app.vercel.app/api/cron/process-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2025-01-XX...",
  "totalChecked": 10,
  "processed": 0,
  "reminders": []
}
```

### **3. Check On-Chain:**
1. Go to Basescan
2. Search cron wallet address
3. View recent transactions
4. Look for `burnMissedReminder` calls

---

## ⚠️ **Common Issues**

### **Issue 1: "Unauthorized" Error**
**Symptom:** `401 Unauthorized` response

**Cause:** Missing or incorrect `CRON_SECRET`

**Fix:**
1. Check Vercel environment variables
2. Ensure `CRON_SECRET` is set
3. Verify secret matches in request header

---

### **Issue 2: "Missing required environment variables"**
**Symptom:** `500` error with message about missing env vars

**Cause:** Missing `CRON_WALLET_PRIVATE_KEY` or `NEXT_PUBLIC_BASE_MAINNET_RPC_URL`

**Fix:**
1. Set `CRON_WALLET_PRIVATE_KEY` in Vercel
2. Set `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` in Vercel
3. Redeploy after adding env vars

---

### **Issue 3: "Failed to connect to RPC endpoint"**
**Symptom:** `500` error about RPC connection

**Cause:** RPC endpoint not available or incorrect

**Fix:**
1. Verify `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` is correct
2. Test RPC endpoint manually
3. Check QuickNode quota/status

---

### **Issue 4: Cron Job Not Running**
**Symptom:** No executions in Vercel dashboard

**Possible Causes:**
1. Cron job not enabled in Vercel
2. `vercel.json` not deployed
3. Schedule syntax incorrect

**Fix:**
1. Verify `vercel.json` is in repo root
2. Check cron job is enabled in Vercel dashboard
3. Redeploy if needed

---

### **Issue 5: "Insufficient funds" Error**
**Symptom:** Transaction fails with gas error

**Cause:** Cron wallet has no ETH for gas

**Fix:**
1. Check cron wallet balance on Basescan
2. Send ETH to cron wallet (minimum 0.01 ETH recommended)
3. Retry cron job

---

## 📊 **Monitoring**

### **Check Logs:**
1. Vercel Dashboard → Functions → `/api/cron/process-reminders`
2. View execution logs
3. Check for errors

### **Check On-Chain Activity:**
1. Basescan → Search cron wallet
2. View transactions
3. Verify `burnMissedReminder` calls

---

## 🧪 **Testing Checklist**

- [ ] `CRON_SECRET` is set in Vercel
- [ ] `CRON_WALLET_PRIVATE_KEY` is set in Vercel
- [ ] `NEXT_PUBLIC_BASE_MAINNET_RPC_URL` is set in Vercel
- [ ] Cron wallet has ETH balance (> 0.01 ETH)
- [ ] Manual test returns success
- [ ] Cron job appears in Vercel dashboard
- [ ] Cron job executes every 15 minutes
- [ ] No errors in execution logs

---

## 📝 **Notes**

- Cron job runs every 15 minutes automatically
- Only processes reminders past `confirmationDeadline`
- Skips already confirmed/burned reminders
- Returns unclaimed 70% reward pool to creator
- Burns 30% commitment tokens

---

**Last Updated:** January 2025  
**Status:** Ready for production

