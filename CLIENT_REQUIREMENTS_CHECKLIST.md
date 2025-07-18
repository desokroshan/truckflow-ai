# TruckFlow AI - Client Requirements Checklist

## Required Information from Client

### 1. Company Information
- [ ] **Company Name**: ________________________________
- [ ] **Company Logo**: (High-resolution PNG/SVG file)
- [ ] **Primary Contact Name**: ________________________________
- [ ] **Primary Contact Email**: ________________________________
- [ ] **Primary Contact Phone**: ________________________________
- [ ] **Company Address**: ________________________________
- [ ] **Business Hours**: ________________________________

### 2. Phone System Requirements
- [ ] **Preferred Phone Number**: ________________________________
  - Format: +1-XXX-XXX-XXXX
  - Will be used for customer calls
- [ ] **Call Forwarding Number**: ________________________________
  - Backup number for emergencies
- [ ] **Custom Greeting Message**: ________________________________
  - Example: "Thank you for calling [Company Name]. I'm your AI assistant..."
- [ ] **Maximum Call Duration**: ________________ (default: 5 minutes)

### 3. Email Configuration
- [ ] **Business Email Address**: ________________________________
  - Will receive load notifications
- [ ] **Email Provider**: Gmail / Outlook / Other: ________________
- [ ] **Email App Password**: ________________________________
  - For Gmail: Generate app-specific password
  - For Outlook: Use app password or OAuth
- [ ] **Notification Preferences**:
  - [ ] New load requests
  - [ ] Urgent loads
  - [ ] Daily summaries
  - [ ] System alerts

### 4. SMS Notifications
- [ ] **SMS Phone Number**: ________________________________
  - Will receive urgent alerts
- [ ] **SMS Preferences**:
  - [ ] New urgent loads only
  - [ ] All new loads
  - [ ] System alerts
  - [ ] Daily summaries

### 5. Business Rules & Workflows
- [ ] **Service Areas**: ________________________________
  - States/regions you operate in
- [ ] **Load Types**: ________________________________
  - Flatbed, Dry Van, Refrigerated, etc.
- [ ] **Weight Limits**: ________________________________
  - Maximum weight per truck
- [ ] **Approval Workflow**:
  - [ ] Auto-approve loads under $______
  - [ ] Manual approval required for loads over $______
  - [ ] Require approval for loads outside service area
- [ ] **Business Hours**: ________________________________
  - When to process calls vs. send to voicemail

### 6. Fleet Information
- [ ] **Number of Trucks**: ________________________________
- [ ] **Number of Drivers**: ________________________________
- [ ] **Truck Details** (for each truck):
  - Truck ID: ________________
  - Truck Type: ________________
  - Capacity: ________________
  - Current Location: ________________
- [ ] **Driver Details** (for each driver):
  - Driver Name: ________________
  - License Class: ________________
  - Phone Number: ________________
  - Preferred Routes: ________________

### 7. Integration Preferences
- [ ] **Google Sheets Integration**:
  - [ ] Yes, create master spreadsheet
  - [ ] No, use dashboard only
- [ ] **Existing TMS System**: ________________________________
  - Name of current system (if any)
  - Integration requirements
- [ ] **Accounting System**: ________________________________
  - QuickBooks, SAP, etc.
  - Integration requirements

### 8. Reporting Requirements
- [ ] **Daily Reports**:
  - [ ] Load summary
  - [ ] Driver utilization
  - [ ] Revenue tracking
- [ ] **Weekly Reports**:
  - [ ] Performance metrics
  - [ ] Customer satisfaction
  - [ ] System usage
- [ ] **Monthly Reports**:
  - [ ] Business analytics
  - [ ] Cost savings analysis
  - [ ] Growth metrics

### 9. User Accounts & Access
- [ ] **Admin Users** (full access):
  - Name: ________________ Email: ________________
  - Name: ________________ Email: ________________
- [ ] **Dispatcher Users** (load management):
  - Name: ________________ Email: ________________
  - Name: ________________ Email: ________________
- [ ] **Driver Users** (view assignments):
  - Name: ________________ Email: ________________
  - Name: ________________ Email: ________________

### 10. Compliance & Legal
- [ ] **DOT Number**: ________________________________
- [ ] **MC Number**: ________________________________
- [ ] **Insurance Information**: ________________________________
- [ ] **Call Recording Consent**: ________________________________
  - Legal requirements for call recording in your state
- [ ] **Data Retention Policy**: ________________________________
  - How long to keep call recordings and data

---

## Production Environment Variables

### Required API Keys & Credentials

#### OpenAI Configuration
```bash
OPENAI_API_KEY="sk-..." # Required for AI processing
OPENAI_MODEL="gpt-4" # AI model for data extraction
OPENAI_WHISPER_MODEL="whisper-1" # For voice transcription
```

#### Twilio Configuration
```bash
TWILIO_ACCOUNT_SID="AC..." # Twilio Account SID
TWILIO_AUTH_TOKEN="..." # Twilio Auth Token
TWILIO_PHONE_NUMBER="+1234567890" # Your Twilio phone number
TWILIO_WEBHOOK_URL="https://yourdomain.com/api/twilio" # Webhook URL
```

#### Email Configuration
```bash
EMAIL_PROVIDER="gmail" # gmail or outlook
EMAIL_USER="your-email@gmail.com" # Business email
EMAIL_PASSWORD="app-password" # App-specific password
EMAIL_NOTIFICATION_RECIPIENT="owner@company.com" # Who gets notifications
```

#### Database Configuration
```bash
DATABASE_URL="postgresql://user:password@host:5432/truckflow" # PostgreSQL connection
DB_HOST="localhost" # Database host
DB_PORT="5432" # Database port
DB_NAME="truckflow" # Database name
DB_USER="username" # Database user
DB_PASSWORD="password" # Database password
```

#### Security Configuration
```bash
SESSION_SECRET="your-very-long-random-secret-key" # Session encryption key
JWT_SECRET="your-jwt-secret-key" # JWT signing key
CORS_ORIGIN="https://yourdomain.com" # Allowed origins
```

#### Application Configuration
```bash
NODE_ENV="production" # Production environment
PORT="5000" # Server port
BASE_URL="https://yourdomain.com" # Your domain
```

#### Google Sheets Integration (Optional)
```bash
GOOGLE_SHEETS_ENABLED="true" # Enable Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID="1ABC..." # Spreadsheet ID
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..." # Service account key
GOOGLE_CLIENT_EMAIL="service@project.iam.gserviceaccount.com" # Service account email
```

#### SMS Configuration
```bash
SMS_ENABLED="true" # Enable SMS notifications
SMS_PHONE_NUMBER="+1234567890" # Number to send SMS to
```

#### File Storage Configuration
```bash
UPLOAD_PATH="/app/uploads" # File upload directory
MAX_FILE_SIZE="10MB" # Maximum file upload size
RECORDING_RETENTION_DAYS="30" # How long to keep recordings
```

---

## Client Onboarding Timeline

### Week 1: Information Gathering
- [ ] **Day 1-2**: Collect all client requirements
- [ ] **Day 3-4**: Set up API accounts and credentials
- [ ] **Day 5**: Configure environment variables

### Week 2: System Setup
- [ ] **Day 1-2**: Database setup and data migration
- [ ] **Day 3-4**: Client-specific customization
- [ ] **Day 5**: Initial testing and validation

### Week 3: Testing & Training
- [ ] **Day 1-2**: User acceptance testing
- [ ] **Day 3-4**: User training and documentation
- [ ] **Day 5**: Production deployment

### Week 4: Go-Live & Support
- [ ] **Day 1**: Launch and monitoring
- [ ] **Day 2-5**: Daily check-ins and adjustments

---

## Pre-Pilot Verification Checklist

### Technical Verification
- [ ] All environment variables configured and tested
- [ ] Database connection established
- [ ] Twilio phone system operational
- [ ] OpenAI API responding correctly
- [ ] Email notifications working
- [ ] SMS alerts functional
- [ ] File uploads working
- [ ] All integrations tested

### Business Verification
- [ ] Client company information updated
- [ ] Custom greeting message recorded
- [ ] Fleet information entered
- [ ] User accounts created
- [ ] Business rules configured
- [ ] Approval workflows tested
- [ ] Reporting system operational

### Training Verification
- [ ] All users trained on system
- [ ] User guides provided
- [ ] Support procedures documented
- [ ] Escalation process defined
- [ ] Emergency contacts established

---

## Support & Maintenance Plan

### Daily Monitoring
- [ ] System uptime and performance
- [ ] Call processing accuracy
- [ ] Error rates and issues
- [ ] User activity and adoption

### Weekly Reviews
- [ ] Performance metrics
- [ ] User feedback
- [ ] System optimizations
- [ ] Feature requests

### Monthly Assessments
- [ ] Business impact analysis
- [ ] Cost savings calculation
- [ ] System expansion planning
- [ ] User satisfaction survey

---

*This checklist ensures all client requirements are gathered and configured before pilot launch. Each item should be verified and signed off by both the client and technical team before proceeding to production deployment.*