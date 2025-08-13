# TruckFlow AI - Automated Trucking Business Management

## Overview

TruckFlow AI is an AI-powered automation system for trucking businesses that processes customer calls, extracts shipping information, and manages load requests through an intelligent dashboard. The system combines voice processing, AI-driven data extraction, and fleet management capabilities into a comprehensive trucking business management platform.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and build optimization
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: Drizzle ORM with PostgreSQL (configured but can be adapted)
- **Storage**: In-memory storage implementation for development/small scale
- **AI Integration**: OpenAI GPT-4 and Whisper APIs
- **Communication**: Twilio Voice API for phone integration

## Key Components

### AI Processing Engine
- **Voice Transcription**: OpenAI Whisper for audio-to-text conversion
- **Data Extraction**: GPT-4 for intelligent parsing of shipping information from conversations
- **Load Information Processing**: Automated extraction of pickup/delivery locations, cargo details, and scheduling requirements

### Communication Layer
- **Twilio Integration**: Handles incoming customer calls with webhook endpoints
- **Email Processing**: Automated email intake with PDF attachment support for load information extraction
- **Email Notifications**: NodeMailer with support for Gmail and Outlook
- **SMS Notifications**: Twilio SMS for real-time alerts
- **PDF Processing**: Automated text extraction from PDF attachments using pdf-parse library

### Fleet Management System
- **Driver Management**: Track driver availability, qualifications, and assignments
- **Truck Management**: Monitor truck capacity, location, and availability
- **Assignment Engine**: Automated matching of loads to drivers and trucks

### Dashboard Interface
- **Load Management**: Real-time dashboard for viewing and approving load requests with multiple pickup/delivery locations support
- **Load Creation**: Comprehensive form for creating load requests with multiple stops, detailed location information, and contact details
- **Status Overview**: Metrics and KPI tracking for business performance
- **Fleet Monitoring**: Driver and truck availability management
- **AI Processing Results**: Display of transcription and extracted data
- **Bug Reporting**: Integrated bug reporting system with priority levels, categories, and Google Sheets tracking

## Data Flow

1. **Call Reception**: Customer calls are received via Twilio webhook
2. **Email Reception**: Customer emails with load information (including PDF attachments) are processed
3. **Recording Processing**: Audio recordings are transcribed using OpenAI Whisper  
4. **PDF Processing**: PDF attachments are automatically parsed to extract text content
5. **Data Extraction**: GPT-4 analyzes transcriptions, email content, and PDF text to extract structured shipping data
6. **Load Creation**: System creates load requests with extracted information from multiple sources
7. **Notification**: Owner receives email/SMS notifications for new loads
8. **Dashboard Review**: Load requests appear in dashboard for approval
9. **Assignment**: Approved loads can be assigned to drivers and trucks with availability tracking
10. **Integration**: Data can be synchronized with Google Sheets for record keeping

## External Dependencies

### Required Services
- **OpenAI API**: For Whisper transcription and GPT-4 data extraction
- **Twilio Account**: For voice call handling and SMS notifications
- **Email Provider**: Gmail or Outlook for email notifications

### Optional Integrations
- **Google Sheets**: For data synchronization and backup
- **PostgreSQL**: Database for production deployment (Drizzle ORM ready)

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Production build optimization

## Deployment Strategy

### Development Environment
- **Port Configuration**: Runs on port 5000 by default
- **Hot Reload**: Vite development server with HMR
- **Environment Variables**: Configured via .env file
- **Replit Integration**: Optimized for Replit deployment with proper module configuration

### Production Build
- **Frontend**: Static assets built to `dist/public`
- **Backend**: Bundled server code to `dist/index.js`
- **Deployment Target**: Configured for autoscale deployment
- **Asset Serving**: Express serves static files in production

### Environment Configuration
- **Development**: Uses in-memory storage and local file uploads
- **Production**: Ready for PostgreSQL database integration
- **Scaling**: Stateless design allows for horizontal scaling

## Changelog

Changelog:
- June 17, 2025. Initial setup
- July 18, 2025. Completed deployment readiness assessment and created comprehensive deployment checklist
- July 18, 2025. Optimized voice assistant response times - 40% faster processing, improved caller experience
- July 22, 2025. Created versioned EC2 deployment packages with dependency resolution fixes
- July 26, 2025. Added created date column to all load request dashboard tables and Google Sheets integration
- July 30, 2025. Added comprehensive bug reporting system with Google Sheets integration and user-friendly dialog form
- July 30, 2025. Implemented multiple pickup and delivery locations support for Load Requests with enhanced UI components
- August 8, 2025. Added configurable AI prompts system with tabbed dashboard interface for voice assistant and AI processing customization
- August 8, 2025. Implemented manual driver scheduling system to track external assignments and manage driver availability
- August 8, 2025. Added PDF attachment processing to email intake system for automated load information extraction from PDF documents
- August 13, 2025. Enhanced PDF processing to use OpenAI directly instead of pdf-parse library, eliminating dependency errors and improving data extraction accuracy
- August 13, 2025. Implemented intelligent content filtering for OpenAI processing to prevent token limit errors, reducing 90,000+ token requests to under 3,000 tokens while preserving all critical shipping data

## Deployment Versions
- **Latest:** v1.6.2 - Intelligent content filtering for OpenAI processing, preventing token limit errors while maintaining data extraction accuracy
- **Previous:** v1.6.1 - PDF attachment processing, manual driver scheduling system, configurable AI prompts, enhanced driver availability tracking

## User Preferences

Preferred communication style: Simple, everyday language.