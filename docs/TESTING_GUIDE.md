# 🧪 AfriHealth Testing Guide

## Quick Start

### Prerequisites
- ✅ Backend running on `http://localhost:3001`
- ✅ Frontend running on `http://localhost:5173`
- ✅ HashPack wallet installed
- ⏳ Smart contracts deployed to Hedera Testnet

---

## Testing Workflow

### 1. **Identity Registration**

**Patient Registration:**
```typescript
// Navigate to: http://localhost:5173
// Click "Patient Portal"
// Should trigger: useRegisterIdentity hook

Expected API Call:
POST /api/identity/register
Body: {
  identityType: 0,  // 0 = Patient
  licenseNumber: null,
  specialization: null
}

Expected Response:
{
  success: true,
  transactionId: "0.0.123456@1696543210.123456789",
  message: "Identity registered successfully"
}
```

**Provider Registration:**
```typescript
// Navigate to: http://localhost:5173
// Click "Provider Portal"
// Should trigger: useRegisterIdentity hook

Expected API Call:
POST /api/identity/register
Body: {
  identityType: 1,  // 1 = Provider
  licenseNumber: "MD123456",
  specialization: "Cardiology"
}
```

---

### 2. **Consent Management**

**Grant Consent:**
```typescript
// Patient Dashboard → Consents Tab → "Grant New Consent"

Expected API Call:
POST /api/consent/grant
Body: {
  provider: "0.0.987654",
  scopes: ["read_records", "write_records"],
  expirationTime: 1728144000,
  purpose: "General checkup"
}

Expected Response:
{
  success: true,
  transactionId: "0.0.123456@1696543210.123456789"
}
```

**Check Patient Consents:**
```typescript
// Auto-triggered on Patient Dashboard load
// Hook: usePatientConsents(accountId)

Expected API Call:
GET /api/consent/patient/0.0.123456

Expected Response:
{
  success: true,
  data: {
    consents: [
      {
        id: "consent_1",
        patientId: "0.0.123456",
        providerId: "0.0.987654",
        scopes: ["read_records"],
        status: "active",
        grantedAt: "2025-10-05T12:00:00Z",
        expiresAt: "2025-11-05T12:00:00Z"
      }
    ]
  }
}
```

---

### 3. **Medical Records**

**Create Medical Record:**
```typescript
// Provider Dashboard → Records Tab → "Create Record"

Expected API Call:
POST /api/records/create
Body: {
  patient: "0.0.123456",
  recordType: "consultation",
  dataHash: "QmX...",
  fileHash: "QmY...",
  metadata: '{"diagnosis":"Hypertension","treatment":"Medication"}'
}

Expected Response:
{
  success: true,
  transactionId: "0.0.123456@1696543210.123456789",
  message: "Record created successfully"
}
```

**Fetch Patient Records:**
```typescript
// Auto-triggered on Patient Dashboard → Records Tab
// Hook: usePatientRecords(accountId)

Expected API Call:
GET /api/records/patient/0.0.123456

Expected Response:
{
  success: true,
  data: {
    records: [
      {
        id: "record_1",
        patientId: "0.0.123456",
        providerId: "0.0.987654",
        type: "consultation",
        title: "Annual Checkup",
        description: "Routine examination",
        date: "2025-10-05T12:00:00Z",
        providerName: "Dr. Smith"
      }
    ]
  }
}
```

---

### 4. **Billing & Payments**

**Create Invoice:**
```typescript
// Provider Dashboard → Billing Tab → "Create Invoice"

Expected API Call:
POST /api/billing/invoice/create
Body: {
  patient: "0.0.123456",
  amount: 5000,  // in smallest unit (tinybars)
  serviceDescription: "Consultation and lab tests",
  dueDate: 1728144000,
  metadata: '{"items":[{"code":"99213","desc":"Office visit","price":150}]}'
}

Expected Response:
{
  success: true,
  transactionId: "0.0.123456@1696543210.123456789",
  message: "Invoice created successfully"
}
```

**Pay Invoice:**
```typescript
// Patient Dashboard → Billing Tab → Invoice Card → "Approve & Pay"

Expected API Call:
POST /api/billing/invoice/pay
Body: {
  invoiceId: "invoice_1",
  paymentMethod: 0  // 0 = HBAR
}

Expected Response:
{
  success: true,
  transactionId: "0.0.123456@1696543210.123456789",
  message: "Payment processed successfully"
}
```

---

### 5. **Insurance Claims**

**Submit Claim:**
```typescript
// Patient Dashboard → Insurance Tab → "Submit New Claim"

Expected API Call:
POST /api/claims/submit
Body: {
  poolId: "pool_1",
  amount: 3000,
  claimType: "medical_procedure",
  description: "Hip replacement surgery",
  supportingDocuments: ["QmA...", "QmB..."]
}

Expected Response:
{
  success: true,
  transactionId: "0.0.123456@1696543210.123456789",
  message: "Claim submitted successfully"
}
```

**Fetch User Claims:**
```typescript
// Auto-triggered on Insurance Tab load
// Hook: usePatientClaims(accountId)

Expected API Call:
GET /api/claims/user/0.0.123456

Expected Response:
{
  success: true,
  data: {
    claims: [
      {
        id: "claim_1",
        claimNumber: "CLM-2025-001",
        patientId: "0.0.123456",
        providerId: "0.0.987654",
        claimAmount: 3000,
        status: "pending",
        submittedAt: "2025-10-05T12:00:00Z"
      }
    ]
  }
}
```

---

## Browser DevTools Checklist

### Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Perform action in UI
5. Verify:
   - ✅ Request URL matches `/api/...`
   - ✅ Request method (POST/GET)
   - ✅ Request payload correct
   - ✅ Response status 200
   - ✅ Response data has expected structure

### Console Tab
1. Check for errors (should be zero)
2. Look for API client logs
3. Verify hook state updates
4. Check transaction IDs

---

## Backend Logs

```bash
# Watch backend logs in real-time
tail -f /tmp/afrihealth-backend.log

# Or check recent logs
tail -100 /tmp/afrihealth-backend.log
```

**Expected Log Output:**
```
🏥 AfriHealth Ledger API Server
🚀 Server running on port 3001
POST /api/identity/register
✓ Identity registered: 0.0.123456
POST /api/consent/grant
✓ Consent granted: consent_abc123
GET /api/records/patient/0.0.123456
✓ Fetched 5 records
```

---

## Error Testing

### Test Invalid Data
```typescript
// Try creating invoice with negative amount
Expected: 400 Bad Request with error message

// Try accessing without account ID
Expected: 401 Unauthorized

// Try revoking non-existent consent
Expected: 404 Not Found
```

### Test Network Errors
```bash
# Stop backend
pkill -f "node dist/server"

# Try action in UI
Expected: Error message displayed
Hook error state: "Failed to connect to API"
```

---

## Performance Testing

### Load Times
- Patient Dashboard load: < 2s
- Provider Dashboard load: < 2s
- API call response: < 500ms (without blockchain)
- With blockchain: < 3s

### Memory Usage
```javascript
// In browser console
performance.memory.usedJSHeapSize / 1024 / 1024
// Should be < 50 MB
```

---

## Hedera Explorer Verification

1. **Get Transaction ID** from API response
2. **Visit HashScan:** https://hashscan.io/testnet
3. **Search** transaction ID
4. **Verify:**
   - ✅ Transaction success
   - ✅ Contract called correctly
   - ✅ Gas fees reasonable
   - ✅ Events emitted

---

## Common Issues & Solutions

### Issue: "Cannot read property 'data' of undefined"
**Solution:** Backend not running or contract not deployed
```bash
# Check backend
curl http://localhost:3001/health

# Check .env
cat backend/.env | grep DIAMOND_CONTRACT_ADDRESS
```

### Issue: "Network Error"
**Solution:** CORS or backend connection issue
```bash
# Check if backend accepts requests from frontend origin
# backend/src/server.ts should have cors() middleware
```

### Issue: "Transaction failed"
**Solution:** Contract not deployed or insufficient HBAR
```bash
# Verify contract address in .env
# Check account balance on HashScan
```

---

## Success Criteria

✅ **Identity Registration:** Transaction ID returned, identity appears on dashboard  
✅ **Consent Management:** Consents listed, can grant/revoke  
✅ **Medical Records:** Records created, displayed with correct data  
✅ **Billing:** Invoices created, payments processed  
✅ **Insurance Claims:** Claims submitted, status tracked  
✅ **Error Handling:** Friendly messages, no crashes  
✅ **Loading States:** Spinners shown during API calls  
✅ **Data Persistence:** Refresh page, data still there  

---

## Next Steps After Testing

1. **Fix any bugs found**
2. **Add file upload** for medical records
3. **Implement HCS** for real-time updates
4. **Add transaction status** tracking
5. **Deploy to production** 🚀

---

**Happy Testing! 🧪**
