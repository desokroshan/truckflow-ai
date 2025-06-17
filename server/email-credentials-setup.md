
# Email Integration Setup

## Required Environment Variables

Add these to your Replit Secrets:

### For Gmail:
```
EMAIL_PROVIDER=gmail
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### For Outlook:
```
EMAIL_PROVIDER=outlook
OUTLOOK_EMAIL=your-email@outlook.com
OUTLOOK_PASSWORD=your-password
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this as `GMAIL_APP_PASSWORD`

## Outlook Setup Instructions

1. **Enable IMAP** in Outlook settings
2. **Use your regular email password** as `OUTLOOK_PASSWORD`
3. **For Office 365 accounts**, you may need to enable "Less secure app access"

## Features

- **Outgoing emails**: Send notifications using SMTP
- **Incoming email monitoring**: Automatically process load requests from emails
- **AI extraction**: Extract shipping details from email content
- **Real-time monitoring**: Monitor inbox for new emails continuously

## Testing

Send an email to your configured email address with shipping details like:
- Pickup location
- Delivery location  
- Cargo type
- Weight
- Customer contact info

The system will automatically create a load request from the email content.
