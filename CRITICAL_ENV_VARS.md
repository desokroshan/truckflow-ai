# Critical Environment Variables - Quick Reference

## 🔥 MUST HAVE (Application Won't Work Without These)

### OpenAI API Key
```bash
OPENAI_API_KEY="sk-..." # Get from platform.openai.com
```
**Why Critical**: Required for voice transcription and data extraction
**How to Get**: Visit https://platform.openai.com/api-keys
**Cost**: ~$0.02 per minute of audio + $0.06 per 1K tokens for GPT-4

### Twilio Credentials
```bash
TWILIO_ACCOUNT_SID="AC..." # From Twilio Console
TWILIO_AUTH_TOKEN="..." # From Twilio Console  
TWILIO_PHONE_NUMBER="+1234567890" # Purchase from Twilio
```
**Why Critical**: Required for phone system to receive calls
**How to Get**: Visit https://console.twilio.com/
**Cost**: ~$1/month for phone number + $0.0085 per minute

### Database Connection
```bash
DATABASE_URL="postgresql://user:password@host:5432/truckflow"
```
**Why Critical**: Application uses PostgreSQL for data persistence
**How to Get**: Set up PostgreSQL server or use cloud provider
**Cost**: $0-20/month depending on provider

### Security Secrets
```bash
SESSION_SECRET="your-very-long-random-secret-key"
JWT_SECRET="your-jwt-secret-key"
```
**Why Critical**: Required for user authentication and session security
**How to Get**: Generate random strings (use: `openssl rand -hex 32`)
**Cost**: Free

---

## ⚠️ IMPORTANT (Notifications Won't Work Without These)

### Email Configuration
```bash
EMAIL_PROVIDER="gmail" # or "outlook"
EMAIL_USER="business@company.com"
EMAIL_PASSWORD="app-specific-password"
EMAIL_NOTIFICATION_RECIPIENT="owner@company.com"
```
**Why Important**: Required for load notifications
**How to Get**: Use existing Gmail/Outlook + app password
**Cost**: Free with existing email

---

## 📊 OPTIONAL (Nice to Have)

### Google Sheets Integration
```bash
GOOGLE_SHEETS_ENABLED="true"
GOOGLE_SHEETS_SPREADSHEET_ID="1ABC123..."
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_CLIENT_EMAIL="service@project.iam.gserviceaccount.com"
```
**Why Optional**: Backup data sync and reporting
**How to Get**: Create Google Cloud Project + Service Account
**Cost**: Free

### Address Validation (Multiple FREE Options)
```bash
# Option 1: USPS API (Completely Free - Recommended)
USPS_USER_ID="your-usps-user-id-here"

# Option 2: Radar API (100K requests/month free - Backup)  
RADAR_API_KEY="your-radar-api-key-here"

# Option 3: Google Maps API (Optional - $200 monthly credit)
GOOGLE_MAPS_API_KEY="your-google-maps-api-key-here"
```
**Why Recommended**: Validates pickup/delivery addresses for accuracy
**How to Get**: 
- USPS: Register at usps.com/business/web-tools-apis/ (FREE)
- Radar: Sign up at radar.com (100K requests/month FREE)
- Google: Enable API in Google Cloud Console ($200 credit available)
**Cost**: FREE with USPS or Radar APIs!

---

## 🚀 Quick Setup Priority Order

1. **First**: Set up OpenAI API key and test
2. **Second**: Configure Twilio phone system  
3. **Third**: Set up production database
4. **Fourth**: Configure email notifications
5. **Fifth**: Add security secrets
6. **Last**: Optional integrations

---

## 🧪 Testing Commands

Test each service after configuration:

```bash
# Test OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Test Twilio
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Test Database
psql $DATABASE_URL -c "SELECT 1;"

# Test Email (from application)
curl -X POST "http://localhost:5000/api/test-email"
```

---

## 💰 Total Monthly Cost Estimate

- **OpenAI**: $10-50 (depends on usage)
- **Twilio**: $5-20 (phone + minutes)
- **Database**: $0-20 (depends on provider)
- **Email**: $0 (use existing)
- **Hosting**: $10-30 (depends on provider)

**Total**: $25-120/month for small-medium usage (address validation now FREE!)