# 📦 How to Create AWS Deployment Package

## 🛠 Method 1: Using the Build Script (Easiest)

### Step 1: Run the deployment script
```bash
./deploy.sh
```
This automatically:
- Builds your application 
- Creates deployment directory
- Packages everything into `truckflow-deployment.tar.gz`

### Step 2: Download the package
- Find `truckflow-deployment.tar.gz` in your file list
- Right-click → Download

## 🔧 Method 2: Manual Creation

### Step 1: Build the application
```bash
npm run build
```

### Step 2: Create deployment directory
```bash
mkdir deployment-package
cd deployment-package
```

### Step 3: Copy required files
```bash
# Copy built application
cp -r ../dist .

# Copy package files
cp ../package.json .
cp ../package-lock.json .

# Copy AWS configuration
cp -r ../.ebextensions .
cp -r ../.platform .

# Copy database files
cp -r ../migrations .
cp ../drizzle.config.ts .
```

### Step 4: Create the package
```bash
# Create tar.gz file
tar -czf ../truckflow-new-deployment.tar.gz *

# Go back to main directory
cd ..

# Check package size
ls -lh truckflow-new-deployment.tar.gz
```

## 📋 What Gets Included in the Package

**Essential Files:**
- `dist/` - Built application (frontend + backend)
- `package.json` - Dependencies and scripts
- `package-lock.json` - Exact dependency versions
- `.ebextensions/` - AWS Elastic Beanstalk configuration
- `.platform/` - AWS platform hooks
- `migrations/` - Database migration files
- `drizzle.config.ts` - Database configuration

**NOT Included:**
- `node_modules/` - Will be installed on AWS
- `.env` - Environment variables set in AWS console
- Source code files (`client/`, `server/`, `shared/`)

## ⚡ Quick Commands

### Create new package right now:
```bash
# Build and package in one command
npm run build && \
mkdir -p new-deployment && \
cd new-deployment && \
cp -r ../dist ../package.json ../package-lock.json ../.ebextensions ../.platform ../migrations ../drizzle.config.ts . && \
tar -czf ../truckflow-latest.tar.gz * && \
cd .. && \
echo "Package created: truckflow-latest.tar.gz"
```

### Verify package contents:
```bash
tar -tzf truckflow-latest.tar.gz | head -20
```

## 🔄 When to Create New Package

Create a new deployment package when you:
- Make code changes to your application
- Update dependencies in package.json
- Modify AWS configuration (.ebextensions)
- Add new database migrations
- Fix deployment issues

## 📁 Package File Structure

Your deployment package should contain:
```
dist/
├── index.js (built server)
└── public/ (built frontend)
package.json
package-lock.json
.ebextensions/
├── nodejs.config
.platform/
├── hooks/
    └── prebuild/
migrations/
├── 0000_windy_mentor.sql
drizzle.config.ts
```

The package will be ~200-300KB and ready for AWS deployment.