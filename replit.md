# EZHW

## Overview

EZHW (formerly Homework Assistant) is a full-stack web application designed to provide AI-powered solutions for various homework types. It accepts text, image, PDF, and document inputs, leveraging multiple Large Language Models (LLMs) to generate detailed answers. Key capabilities include drag-and-drop file uploads, voice input, mathematical notation rendering, and PDF export. The project aims to offer a comprehensive, user-friendly tool for academic assistance, with ambitions to serve a wide market of students and educators.

## User Preferences

Preferred communication style: Simple, everyday language.

### Testing Mode Active
**PAYWALL DISABLED FOR TESTING**
- All new users automatically receive 99,999,999 tokens (unlimited credits)
- Token balance checks are disabled - no payment required
- Token deduction is disabled - usage doesn't consume credits
- Payment gateways (PayPal/Stripe) remain functional but not required for testing
- Special users (jmkuczynski, randyjohnson) retain unlimited access with no password

To re-enable paywall: Uncomment token check and deduction code in server/routes.ts and change initial token balance in server/auth.ts back to 0.

## System Architecture

The application employs a clear client-server architecture.

### Frontend
- **Framework**: React 18 with TypeScript and Vite
- **UI/Styling**: Shadcn/ui (Radix UI) and Tailwind CSS for a modern, responsive design.
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Display**: MathJax for mathematical notation and integrated image display for graphs.

### Backend
- **Runtime**: Node.js with Express.js (TypeScript)
- **Database**: PostgreSQL with Drizzle ORM.
- **File Processing**: Multer for uploads (PDFs, images, documents), Tesseract.js for OCR, pdf2json for PDF text extraction.
- **Graph Generation**: Chart.js with ChartJSNodeCanvas for server-side graph creation.

### Core Features & Design Patterns
- **File Processing Pipeline**: Standardized process from upload to text extraction, LLM processing, graph detection, and response generation.
- **Integrated Graph Generation**: Automatic detection and server-side creation of graphs (line, bar, scatter) based on LLM-generated data, seamlessly embedded into solutions. Supports multiple graphs per assignment.
- **LLM Integration**: Designed for multiple AI providers, allowing user selection and leveraging their capabilities for detailed solutions. Intelligent content detection ensures LaTeX notation is applied only to mathematical problems.
- **Automatic Word Count Continuation**: Detects word/page count requirements in prompts and automatically continues generating until target length is reached (up to 10 continuation cycles for OpenAI and Anthropic).
- **Voice Input**: Utilizes browser Web Speech API and Azure Speech Services for real-time transcription.
- **Mathematical Notation**: MathJax integration provides full LaTeX support, optimized for display and PDF export.
- **Dual Payment System**: Complete payment infrastructure with both PayPal and Stripe integration for user authentication, session tracking, and flexible payment options.
- **Multi-User Data Isolation**: A single shared PostgreSQL database enforces user-scoped data access via `user_id` filtering, preventing cross-user data access and ensuring secure deletion. Includes support for anonymous users.
- **GPT BYPASS**: Integrated functionality for text rewriting and AI detection score reduction, with a dedicated interface and seamless workflow between homework assistant and bypass features.
- **Grading Assistant**: AI-powered grading tool that treats instructor's grading rubric as ABSOLUTE LAW, supporting any grading format (letter grades, numeric, pass/fail, etc.) with strict adherence to user-specified criteria.

## External Dependencies

- **Database**: PostgreSQL
- **LLM APIs**: Anthropic, OpenAI, Azure OpenAI, DeepSeek, Perplexity
- **Payment Gateways**: PayPal and Stripe
- **CDN Services**: MathJax, Google Fonts
- **Speech Services**: Azure Cognitive Services (optional)

## Recent Changes

### September 11, 2025
- Fixed jmkuczynski login authentication issue
  - Resolved case sensitivity problem in username comparison (frontend sent "JMKUCZYNSKI", backend expected "jmkuczynski")
  - Updated backend login route to use case-insensitive username matching
  - Both jmkuczynski and randyjohnson can now login without passwords as intended
- Updated Contact Us link to be a small, non-floating text link at the top of both homework assistant and GPT BYPASS pages (linking to contact@zhisystems.ai)
- Implemented chunked processing for GPT BYPASS function:
  - Automatically splits large documents (over 800 words) into 700-word chunks
  - Added user controls to select/deselect specific chunks for processing
  - Includes 'Select All' and 'Select None' buttons for chunk selection
  - Processes selected chunks sequentially with individual AI scoring and progress tracking

### September 13, 2025
- **Complete Stripe Payment Integration**: Successfully implemented full Stripe payment system alongside existing PayPal
  - Created stripe_payments database table for payment tracking and status management
  - Built complete payment infrastructure from database schema to frontend components
  - Implemented tabbed payment interface allowing users to choose between PayPal and Stripe
  - Added automatic token crediting upon successful payment completion
  - Fixed popup window auto-close functionality for seamless user experience
  - Verified end-to-end payment flow with live Stripe integration
  - Dual payment system now fully operational and tested
- **Critical Stripe Deployment Fixes**: Resolved production payment failures with comprehensive security and reliability improvements
  - Removed dangerous fallback keys and implemented fail-fast environment variable validation
  - Fixed redirect reconciliation by adding session_id to success/cancel URLs for proper post-payment handling
  - Eliminated session dependency from payment status endpoint to prevent 401 errors after cross-site redirects
  - Enhanced webhook security by removing insecure fallbacks and requiring proper environment configuration
  - Improved token crediting reliability by using server-side payment records instead of Stripe metadata
  - Added comprehensive debug logging for production troubleshooting
  - Updated to valid Stripe API version (2024-06-20) for stable production behavior
- **Stripe Production Deployment Issue RESOLVED**: Successfully diagnosed and fixed false "Payment failed" errors in production
  - Root cause identified: Backend was working perfectly (payments completing, tokens being credited), but frontend polling timeout was too aggressive
  - Fixed frontend polling system with 3-minute timeout and proper error handling
  - Enhanced status logging revealed payments were actually succeeding (e.g., 8,000 → 10,000 token balance increases)
  - Eliminated false negative "Payment failed" messages that occurred when UI timed out before Stripe completed payment flow
  - Production Stripe payment system now fully functional and user-facing error resolved

### September 14, 2025
- **Render Stripe Deployment Fixes**: Implemented comprehensive Render-specific fixes for production Stripe payment functionality
  - Added reachability probes (`/__ping` and `/api/webhooks/stripe` GET endpoints) for Render deployment diagnostics
  - Corrected webhook path from `/api/webhook/stripe` to `/api/webhooks/stripe` (plural) for consistency
  - Enhanced webhook route ordering with proper placement before express.json() middleware for raw body access
  - Added diagnostics endpoint (`/__diag/pay`) to verify environment configuration without exposing secrets
  - Implemented live price credits fetching via line items for Render deployment compatibility
  - Enhanced error handling with transient vs permanent error classification for proper Stripe retry behavior
  - All Render-specific fixes validated and production-ready
- **GPT BYPASS Database Fix RESOLVED**: Fixed critical "Humanization failed" error in both development and production
  - Root cause: Missing database tables (`rewrite_jobs`, `documents`, `stripe_events`) causing relation errors
  - Solution: Created all missing tables using direct SQL commands to restore full database schema
  - Verified fix: Humanization API now responds correctly (200 OK) with proper AI detection scoring
  - GPT BYPASS feature fully operational with chunked processing and rewriting capabilities restored
- **GPTZero AI Detection FULLY FIXED**: Resolved critical AI detection accuracy issues in GPT BYPASS feature
  - Problem identified: Invalid GPTZero API key causing 401 authentication errors and fallback to fake scores
  - Root cause: App showing incorrect results (e.g., 51% AI) while GPTZero direct interface showed correct results (99% Human)
  - Solution: Updated to valid GPTZero API key with proper authentication and API credits
  - Result: AI detection now returns accurate real-time scores matching GPTZero's direct interface
  - GPT BYPASS feature now provides precise AI detection scoring for both original and humanized text

### October 21, 2025
- **Automatic Word Count Continuation System**: Implemented intelligent continuation for exact length requirements
  - Detects word count requirements (e.g., "2500 words") and page count requirements (auto-converts to ~500 words/page)
  - Automatically continues generating content in chunks until target word count is reached
  - Supports up to 10 continuation cycles with seamless merging
  - Implemented for OpenAI (ZHI 2) and Anthropic (ZHI 1) providers
  - Server logs show real-time progress: "[CONTINUATION] Current: 800 words, Target: 2500 words, Continuing..."
  - Ensures essays meet EXACT word count requirements specified by user
- **Grading Assistant Feature COMPLETED**: Built complete AI-powered grading system with STRICT rubric adherence
  - Three-panel interface: Assignment Prompt, Grading Instructions, Student Submission
  - Backend API (/api/grade-submission, /api/adjust-grade) treats grading instructions as ABSOLUTE LAW
  - Supports ANY grading format: letter grades (A/B/C), numeric (0-100), pass/fail, or custom rubrics
  - Prompt explicitly instructs LLM to follow instructor's rubric EXACTLY without applying generic criteria
  - Example: If rubric says "A IF PERFECT; B IF PERFECT BUT DOES NOT INCLUDE QUOTES", system gives letter grade, not 95/100
  - UI displays original grade format with numeric equivalent for reference
  - Grade adjustment feature allows re-evaluation with options: higher, lower, appropriate, or complete re-evaluation
  - Route available at /grading path
  - Critical fix: Removed forced numeric conversion that was ignoring user's specified grading format