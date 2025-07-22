# TruckFlow Deployment Versions

## v1.2.0 - Latest (July 22, 2025)
**File:** `truckflow-v1.2.0-production.tar.gz` (264KB)

**Improvements:**
- Fixed module dependency resolution issues
- Enhanced deployment script with full dependency installation
- Added error checking and status reporting
- Automatic public IP detection
- Better logging and troubleshooting

**Contents:**
- Complete TruckFlow application with all features
- Production server (bypasses vite dependencies)
- Database migrations and configuration
- Automated deployment script
- Full package.json with all dependencies

**Fixes:**
- Resolves "Cannot find package 'dotenv'" error
- Ensures all node modules are properly installed
- Includes comprehensive error handling

## Previous Versions

### v1.1.0 
**File:** `truckflow-production-fixed.tar.gz`
- Basic dependency fix attempt

### v1.0.0
**File:** `truckflow-production-full.tar.gz` 
- Initial production package with incomplete dependency handling

## Deployment Instructions

Always use the latest version for new deployments:

```bash
# Download latest: truckflow-v1.2.0-production.tar.gz
scp -i your-key.pem truckflow-v1.2.0-production.tar.gz ec2-user@YOUR-EC2-IP:~/

# Deploy on EC2
ssh -i your-key.pem ec2-user@YOUR-EC2-IP
tar -xzf truckflow-v1.2.0-production.tar.gz
./deploy-production.sh
```

## Version Format
`truckflow-v[MAJOR].[MINOR].[PATCH]-production.tar.gz`

- **MAJOR**: Breaking changes or major feature additions
- **MINOR**: New features, improvements, bug fixes
- **PATCH**: Small fixes, security updates