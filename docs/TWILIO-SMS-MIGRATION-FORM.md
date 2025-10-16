# Twilio Messaging Toll-Free Verification - Form Completion Guide

## 📋 **Current SMS Implementation Summary**

### **Current Provider:** Plivo (switching to Twilio)

---

## 🎯 **FORM FIELD ANSWERS**

### **Estimated Monthly Volume**
**Answer:** `1,000` (or adjust based on your actual volume)

**Reasoning:**
- SMS sent for appointment confirmations and reminders
- Automated SMS sent 2-3 hours before appointments
- 2-way messaging with responses
- Recommend starting conservative and scaling up

---

### **Opt-in Type**
**Answer:** `Verbal`

**Evidence from code:**
```typescript
// User provides consent through UI modal
// File: packages/signers/src/Layout/TopBar/SmsConsentModal.tsx
"Do you consent to receive SMS notifications?"
- User selects Yes/No in modal
- Consent stored as: agreed_sms: "Y" or "N"
- Date tracked: agreed_sms_date
```

---

### **Messaging Use Case Categories**
**Answer:** 
- ✅ **Customer Care**
- ✅ **Account Notifications**

**Description:**
Appointment confirmations and reminders for notary signing services. Two-way communication for service coordination.

---

### **Proof of Consent (Opt-in) Collected**
**Answer:** `signers.pacdocsign.com`

**Details:**
- Consent collected via web modal when signers log in
- Modal presented if `agreed_sms === null`
- Stored in database: `signer.agreed_sms = 'Y'` with timestamp
- Can unsubscribe via SMS reply "Remove"

---

### **Use Case Description**
**Answer:**
```
PacDocSign provides notary signing services. We send SMS notifications to 
notary signing agents for:

1. Appointment confirmations - asking signers to confirm they will arrive 
   on time for borrower appointments
   
2. Job completion reminders - confirming that documents were signed

All messages are transactional, appointment-related, and sent only to 
users who have explicitly opted in via our web portal at 
signers.pacdocsign.com
```

---

### **Sample Messages**

#### **Reminder/Confirmation Message:**
```
PacDocSign: Please Reply 'Yes' to confirm you will be on time for Borrower 
[LastName] at [Time]; or Reply No with the Reason; or Reply 'Remove' to 
Unsubscribe
```

#### **Completion Confirmation:**
```
Please Reply 'Yes' if Borrower [LastName] signed all documents? Or Reply No 
with the Reason or Reply 'Remove' to Unsubscribe.
```

#### **Auto-Responses (Bot Replies):**
```
# On "Yes" response:
PacDocSign. Thank you for your response.

# On "Remove" keyword:
PacDocSign. You have successfully Unsubscribed.
```

---

### **Additional Information** (Optional)
**Answer:**
```
Two-way messaging system for appointment coordination. Users can:
- Reply 'Yes' to confirm appointments
- Reply 'No' with reason to decline
- Reply 'Remove' to unsubscribe (removes from database preference)

Multiple toll-free numbers used to avoid rate limiting (rotating pool).
Consent tracked in database with opt-in date. Industry: Legal/Notary Services
```

---

### **E-mail for Notifications**
**Answer:** `omid.halavi@pacdocsign.com`

---

### **Opt-In Confirmation Message** (Optional)
Leave blank or add:
```
Welcome to PacDocSign SMS notifications. You will receive appointment 
confirmations and reminders. Reply REMOVE to unsubscribe anytime.
```

---

### **Help Message Sample** (Optional)
```
PacDocSign Help: Reply YES to confirm appointments, NO to decline with 
reason, or REMOVE to unsubscribe. For support, contact support@pacdocsign.com
```

---

### **Privacy Policy URL** (Optional)
```
https://signers.pacdocsign.com/privacy-policy.html
```

**Note:** Comprehensive HTML privacy policy available at `/privacy-policy.html`  
PDF version also available at: `https://signers.pacdocsign.com/static/privacy_agreement.pdf`

### **Terms & Conditions URL** (Optional)
```
https://signers.pacdocsign.com/terms-of-service.html
```

**Note:** Terms of Service HTML page created at `/packages/signers/public/terms-of-service.html`

---

## 🔧 **IMPLEMENTATION NOTES**

### **Current Architecture:**
- **Provider:** Plivo (`packages/api/Cloud Functions/sms-service/service/sms.ts`)
- **Phone Numbers:** Multiple toll-free numbers (stored in `process.env.FROM_PHONE_NO`)
- **Logic:** Rotating phone numbers to avoid rate limits
- **Database:** MySQL table `sms` tracking all messages

### **Twilio Migration Checklist:**

1. ✅ **Update SMS Service** (`packages/api/Cloud Functions/sms-service/service/sms.ts`):
```typescript
// Replace Plivo with Twilio
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (params: any) => {
  const { message, to, from } = params;
  const messageRes = await client.messages.create({
    body: message,
    from: from,  // Your Twilio toll-free number
    to: to
  });
  return messageRes;
};
```

2. ✅ **Update Environment Variables:**
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
FROM_PHONE_NO=+18885551234  # Your verified toll-free number(s)
```

3. ✅ **Update Webhook for Incoming SMS:**
   - Configure Twilio webhook to point to: `[your-api]/sms/receive`
   - Current endpoint: `SMSController.receiveSMS`

4. ✅ **Test Messages:**
   - Confirmation messages
   - Reminder messages
   - Opt-out flow
   - Auto-responses

---

## 📊 **MESSAGE FLOW**

### **Outgoing Messages:**
1. **Reminder SMS** (2 hours before appointment)
   - Query: Appointments with `preferred_comm_value="Text message"`
   - Status: `confirmation_call_status <> "RSS"`
   - Message: Confirmation request

2. **Confirmation SMS** (2.5 hours before to 0.5 hours after)
   - Query: Assigned appointments needing completion confirmation
   - Message: Document signing confirmation

### **Incoming Messages:**
1. **"Yes"/"Y" Response** → Status: "confirmed"
2. **"No" Response** → Status: "rejected"
3. **"Remove" Keyword** → Unsubscribe user, update database

---

## ⚠️ **COMPLIANCE NOTES**

### **Current Opt-in Flow:**
1. ✅ User logs in to signers.pacdocsign.com
2. ✅ Modal asks: "Do you consent to receive SMS notifications?"
3. ✅ User selects Yes/No
4. ✅ Consent stored with timestamp in database
5. ✅ Can opt-out anytime via "Remove" keyword

### **Twilio Requirements Met:**
- ✅ Explicit verbal consent collected
- ✅ Opt-out mechanism (REMOVE keyword)
- ✅ Transactional/notification use case
- ✅ Industry-appropriate messaging
- ✅ Two-way messaging support

---

## 📱 **RECOMMENDED TWILIO SETUP**

1. **Number Type:** Toll-Free (for brand trust and higher throughput)
2. **Use Case:** Account Notifications + Customer Care
3. **Monthly Volume:** Start with 1,000, scale as needed
4. **Features Needed:**
   - Two-way messaging
   - Webhook support for incoming messages
   - Message logging/history

---

## 🚀 **NEXT STEPS AFTER VERIFICATION**

1. Get Twilio toll-free number verified
2. Update code to use Twilio SDK
3. Update environment variables
4. Configure webhooks
5. Test in staging
6. Deploy to production
7. Monitor delivery rates

---

**Form Ready!** Use the answers above to complete your Twilio toll-free verification form.

