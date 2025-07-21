#!/bin/bash
# TruckFlow AWS Deployment Script

echo "🚀 Preparing TruckFlow for AWS deployment..."

# Build the application
echo "📦 Building application..."
npm run build

# Create deployment package
echo "📋 Creating deployment package..."
rm -f truckflow-deployment.zip

# Create a temporary deployment directory
rm -rf deployment-temp
mkdir deployment-temp

# Copy necessary files
cp -r dist deployment-temp/
cp package.json deployment-temp/
cp package-lock.json deployment-temp/
cp -r .ebextensions deployment-temp/
cp -r migrations deployment-temp/

# Copy other necessary files
cp drizzle.config.ts deployment-temp/
cp README.md deployment-temp/

echo "📁 Files included in deployment:"
ls -la deployment-temp/

# Create ZIP file
cd deployment-temp
zip -r ../truckflow-deployment.zip . -x "*.DS_Store" "node_modules/*" ".git/*" ".env"
cd ..

# Cleanup
rm -rf deployment-temp

echo "✅ Deployment package created: truckflow-deployment.zip"
echo "📏 Package size:"
ls -lh truckflow-deployment.zip

echo ""
echo "🎯 Next Steps:"
echo "1. Upload truckflow-deployment.zip to AWS Elastic Beanstalk"
echo "2. Create RDS PostgreSQL database"
echo "3. Configure environment variables in Beanstalk"
echo "4. Update Twilio webhooks with your new domain"
echo ""
echo "💡 See AWS_DEPLOYMENT_GUIDE.md for detailed instructions"