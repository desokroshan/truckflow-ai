module.exports = {
  apps: [{
    name: 'truckflow',
    script: './dist/production-server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      // Add your API keys here
      OPENAI_API_KEY: 'sk-your-openai-key-here',
      TWILIO_ACCOUNT_SID: 'AC-your-twilio-account-sid',
      TWILIO_AUTH_TOKEN: 'your-twilio-auth-token',
      TWILIO_PHONE_NUMBER: '+1-your-twilio-phone-number',
      
      // Optional: Google Sheets Integration
      GOOGLE_SHEETS_ID: 'your-google-sheet-id',
      GOOGLE_SHEETS_CLIENT_EMAIL: 'your-service-account@project.iam.gserviceaccount.com',
      GOOGLE_SHEETS_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----',
      
      // Optional: Email Configuration
      EMAIL_PROVIDER: 'gmail',
      EMAIL_USER: 'your-email@gmail.com',
      EMAIL_PASSWORD: 'your-app-password',
      EMAIL_NOTIFICATION_RECIPIENT: 'owner@company.com',
      
      // Database (if using PostgreSQL)
      DATABASE_URL: 'postgresql://username:password@localhost:5432/truckflow'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};