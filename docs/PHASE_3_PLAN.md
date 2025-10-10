# Phase 3 Implementation Plan: UI Integration

## 🎯 Objective
Integrate Phase 2 contract hooks and file storage into existing UI components, replacing mock data with real blockchain data.

---

## 📋 Current State Analysis

### Existing Components
1. **PatientDashboard.tsx** (944 lines) - Uses mock data
2. **ProviderDashboard.tsx** (985 lines) - Uses mock data
3. **PatientDashboardIntegrated.tsx** (924 lines) - Uses old API hooks
4. **ProviderDashboardIntegrated.tsx** - Uses old API hooks

### Available Hooks (Phase 2)
✅ **Identity**: useIdentityContract, useRegisterIdentityContract, etc.
✅ **Consent**: useConsentContract, useGrantConsentContract, etc.
✅ **Records**: useRegisterRecordWithFile, useViewRecord, usePatientRecordsDetailed
✅ **Billing**: useCreateInvoiceWithAttachment, useProcessPaymentWithHBAR, usePatientInvoicesDetailed
✅ **Claims**: useSubmitClaimWithDocuments, useClaimWithDocuments, useClaimantClaimsDetailed
✅ **File Storage**: useFileUpload, useFileDownload, useMultiFileUpload

---

## 🔄 Phase 3 Tasks

### Task 1: Create Reusable UI Components ✅ (Start Here)
**Priority**: HIGH
**Files to Create**:
1. `FileUploadComponent.tsx` - Medical record file upload with preview
2. `FileDownloadComponent.tsx` - File download with decryption
3. `TransactionStatusModal.tsx` - Transaction progress modal
4. `LoadingSpinner.tsx` - Consistent loading states
5. `ErrorAlert.tsx` - Error display component

**Features**:
- Drag & drop file upload
- Progress bars for uploads/downloads
- File preview (images, PDFs)
- Transaction status tracking
- Error handling UI

---

### Task 2: Update PatientDashboard with Contract Hooks
**Priority**: HIGH
**File**: `PatientDashboard.tsx`

**Changes Required**:

#### Overview Tab
- Replace mock stats with real data from contract queries
- Use `usePatientInvoicesDetailed()` for billing stats
- Use `usePatientConsentsContract()` for consent stats
- Use `usePatientRecordsDetailed()` for records count

#### Medical Records Tab
- Replace with `usePatientRecordsDetailed()`
- Add file upload using `useRegisterRecordWithFile()`
- Add file download using `useViewRecord()`
- Show encryption status
- Progress tracking for uploads

#### Consents Tab
- Replace with `usePatientConsentsContract()` and detailed variant
- Use `useGrantConsentContract()` for granting consent
- Use `useRevokeConsentContract()` for revoking
- Real-time consent status

#### Billing Tab
- Replace with `usePatientInvoicesDetailed()`
- Use `useProcessPaymentWithHBAR()` for payments
- Show HBAR conversion with `useHbarConversion()`
- Download invoice attachments
- Real payment history

#### Insurance Tab
- Replace with `useClaimantClaimsDetailed()`
- Use `useSubmitClaimWithDocuments()` for new claims
- Multi-file document upload
- Claim status tracking
- Document viewer for submitted claims

---

### Task 3: Update ProviderDashboard with Contract Hooks
**Priority**: HIGH
**File**: `ProviderDashboard.tsx`

**Changes Required**:

#### Overview Tab
- Provider statistics from real data
- Use `useProviderInvoicesDetailed()` for revenue stats
- Use `useProviderConsentsContract()` for consent tracking

#### Patients Tab
- Keep patient list (can come from Identity contracts later)
- Link to patient records

#### Records Tab
- Use `useRegisterRecordWithFile()` for creating records
- File upload for medical reports
- Encryption for sensitive data
- View patient records with consent checks

#### Billing Tab
- Use `useCreateInvoiceWithAttachment()` for new invoices
- Attach invoice PDFs
- Use `useProviderInvoicesDetailed()` for invoice list
- Invoice approval workflow
- Payment tracking

#### Consents Tab
- Use `useProviderConsentsContract()` for received consents
- Consent verification before accessing records
- Access logging with `useLogRecordAccessContract()`

---

### Task 4: Create New Integrated Components
**Priority**: MEDIUM
**Files to Create**:

1. **`MedicalRecordViewer.tsx`**
   - View record metadata
   - Download encrypted files
   - Preview images/PDFs
   - Access history display

2. **`InvoiceCreator.tsx`**
   - Create invoice form
   - Attach PDF
   - HBAR amount calculator
   - Currency selection

3. **`ClaimSubmitter.tsx`**
   - Claim form
   - Multi-file upload
   - Document type selection
   - Progress tracking

4. **`ConsentManager.tsx`**
   - Grant/revoke consent
   - Scope selection
   - Expiration date picker
   - Active consents list

---

### Task 5: Add Transaction Status System
**Priority**: HIGH
**Features**:
- Modal showing transaction progress
- Steps: "Uploading", "Signing", "Submitting", "Confirming"
- Success/error states
- Transaction ID display
- Link to HashScan explorer

**Implementation**:
```typescript
// TransactionContext.tsx
interface TransactionState {
  step: 'idle' | 'uploading' | 'signing' | 'submitting' | 'confirming' | 'success' | 'error';
  progress: number;
  message: string;
  transactionId?: string;
  error?: string;
}
```

---

### Task 6: Add Real-Time Data Refresh
**Priority**: MEDIUM
**Features**:
- Auto-refresh every 30s for critical data
- Manual refresh button
- "Last updated" timestamp
- Loading states for refreshes

**Hooks to Update**:
- Add `refetchInterval` to query hooks
- Add refresh buttons to tabs
- Show loading states without blocking UI

---

### Task 7: Error Handling & User Feedback
**Priority**: HIGH
**Features**:
- Toast notifications for success/error
- Validation before transactions
- Gas estimation warnings
- Connection status indicator
- Wallet balance warnings

---

### Task 8: File Management UI
**Priority**: HIGH
**Components**:

1. **File Upload Zone**
   - Drag & drop area
   - File type validation
   - Size limits display
   - Encryption toggle
   - HFS vs IPFS indicator

2. **File List Display**
   - Uploaded files list
   - Progress bars
   - Cancel upload button
   - Storage type badge (HFS/IPFS)

3. **File Viewer**
   - Image preview
   - PDF viewer
   - Download button
   - Decryption indicator
   - File metadata

---

## 🏗️ Implementation Order

### Week 1: Foundation (Tasks 1, 5)
1. ✅ Create reusable UI components
2. ✅ Create transaction status system
3. ✅ File upload/download components

### Week 2: Patient Dashboard (Task 2)
1. Update Overview tab
2. Update Medical Records tab (with file upload)
3. Update Billing tab (with HBAR payments)
4. Update Insurance tab (with multi-file claims)
5. Update Consents tab

### Week 3: Provider Dashboard (Task 3)
1. Update Overview tab
2. Update Records tab (with file creation)
3. Update Billing tab (with invoice creation)
4. Update Consents tab

### Week 4: Polish & Testing (Tasks 4, 6, 7, 8)
1. Create specialized components
2. Add real-time refresh
3. Comprehensive error handling
4. File management polish
5. End-to-end testing

---

## 📦 Dependencies

### New Dependencies (if needed)
```json
{
  "react-dropzone": "^14.2.3",  // Drag & drop files
  "react-pdf": "^7.7.0",         // PDF preview
  "react-toastify": "^10.0.4",   // Toast notifications
  "date-fns": "^3.0.0"           // Date formatting
}
```

### Existing Dependencies (Already Available)
- ✅ framer-motion (animations)
- ✅ @hashgraph/sdk (HBAR operations)
- ✅ helia (IPFS)
- ✅ React 19.1.1

---

## 🎨 UI/UX Guidelines

### Design Principles
1. **Progressive Disclosure**: Show essential info first, details on expand
2. **Loading States**: Always show progress, never block UI
3. **Error Recovery**: Clear error messages with retry options
4. **Confirmation**: Confirm before irreversible actions
5. **Feedback**: Immediate feedback for all user actions

### Color Coding
- 🟢 **afrihealth-green**: Success, approved, active
- 🟠 **afrihealth-orange**: Warning, pending, action needed
- 🔴 **afrihealth-red**: Error, rejected, critical
- ⚪ **gray**: Neutral, inactive

### Transaction Flow UI
```
1. User Action (Click button)
   ↓
2. Validation (Check inputs, wallet connection)
   ↓
3. File Upload (if needed) - Show progress
   ↓
4. Transaction Modal (Show steps)
   ↓
5. Wallet Signing (HashConnect popup)
   ↓
6. Transaction Submitted (Show transaction ID)
   ↓
7. Confirmation (Show success with link to explorer)
   ↓
8. Data Refresh (Update UI with new data)
```

---

## 🧪 Testing Checklist

### Medical Records
- [ ] Upload encrypted medical record (image)
- [ ] Upload encrypted medical record (PDF)
- [ ] View medical record with decryption
- [ ] Download medical record
- [ ] Update medical record with new file
- [ ] Access control (consent required)

### Billing
- [ ] Create invoice with attachment
- [ ] Pay invoice with HBAR
- [ ] View invoice with attachment download
- [ ] HBAR/tinybar conversion accuracy
- [ ] Invoice status updates

### Claims
- [ ] Submit claim with 5 documents
- [ ] Track multi-file upload progress
- [ ] View claim with all documents
- [ ] Download individual documents
- [ ] Claim approval workflow

### Consents
- [ ] Grant consent with scope
- [ ] Revoke consent
- [ ] View consent history
- [ ] Consent expiration
- [ ] Access logging

---

## 📊 Success Metrics

### Phase 3 Complete When:
✅ All dashboards use contract hooks (no mock data)
✅ File upload/download works end-to-end
✅ HBAR payments process successfully
✅ Multi-file claims submission works
✅ Transaction status tracking works
✅ Error handling is comprehensive
✅ UI is responsive and provides feedback
✅ All builds pass without errors

---

## 🚀 Next Steps

**Immediate Task**: Start with Task 1 - Create reusable UI components

We'll build:
1. FileUploadComponent.tsx
2. TransactionStatusModal.tsx
3. Then integrate into PatientDashboard

**Goal**: One feature at a time, test thoroughly, then move to next.

---

**Phase 3 Start Date**: October 7, 2025
**Estimated Completion**: 2-3 weeks
**Current Status**: Planning Complete ✅
