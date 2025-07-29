# Creating Deployment Packages - Quick Guide

## When You Make Changes

After making any code changes (like the popup modal), follow these steps to create a new deployment package:

### 1. Build the Updated Code
```bash
npm run build
esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production-server.js
```

### 2. Create New Deployment Package
```bash
cd production-deployment
cp -r ../dist .
tar -czf ../truckflow-v1.4.4-production.tar.gz *
```

### 3. Version the Package
Update the version number in the filename:
- `v1.4.4` = Latest version with popup modal feature
- `v1.4.3` = Previous version with email duplicate fix

## What Gets Included

Each deployment package contains:
- **Frontend**: Built React app in `dist/public/`
- **Backend**: Bundled Node.js server in `dist/production-server.js`
- **PM2 Config**: `ecosystem.config.js` for environment variables
- **Deployment Script**: `deploy-production.sh` for automated setup

## Quick Commands

**One-liner to build and package:**
```bash
npm run build && esbuild server/production-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production-server.js && cd production-deployment && cp -r ../dist . && tar -czf ../truckflow-latest.tar.gz *
```

**Check package size:**
```bash
ls -lh truckflow-*.tar.gz
```

## For Your EC2 Deployment

1. **Download** the new `truckflow-v1.4.4-production.tar.gz`
2. **Extract** on your EC2 server
3. **Edit** `ecosystem.config.js` with your API keys
4. **Run** `./deploy-production.sh`

## Version History

- **v1.4.4** - Added load request detail popup modal
- **v1.4.3** - Email duplicate prevention fix
- **v1.4.2** - Recording download retry mechanism
- **v1.4.1** - Phone number masking fix

That's it! Your changes are now packaged and ready for deployment.