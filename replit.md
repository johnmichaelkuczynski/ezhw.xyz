# EZHW

## Overview

EZHW is a full-stack web application providing AI-powered solutions for diverse homework types, including text, image, PDF, and document inputs. It leverages multiple Large Language Models (LLMs) to generate detailed answers, featuring drag-and-drop file uploads, voice input, mathematical notation rendering, and PDF export. The project aims to be a comprehensive, user-friendly academic assistance tool, targeting a broad market of students and educators.

## User Preferences

Preferred communication style: Simple, everyday language.

### Testing Mode Active
**PAYWALL DISABLED FOR TESTING**
- All new users automatically receive 99,999,999 tokens (unlimited credits)
- Token balance checks are disabled - no payment required
- Token deduction is disabled - usage doesn't consume credits
- Payment gateways (PayPal/Stripe) remain functional but not required for testing
- Special users (jmkuczynski, randyjohnson) retain unlimited access with no password

## System Architecture

The application employs a client-server architecture.

### Frontend
- **Framework**: React 18 with TypeScript and Vite
- **UI/Styling**: Shadcn/ui (Radix UI) and Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Display**: MathJax for mathematical notation and integrated image display.

### Backend
- **Runtime**: Node.js with Express.js (TypeScript)
- **Database**: PostgreSQL with Drizzle ORM.
- **File Processing**: Multer for uploads, Tesseract.js for OCR, pdf2json for PDF text extraction.
- **Graph Generation**: Chart.js with ChartJSNodeCanvas for server-side graph creation.

### Core Features & Design Patterns
- **File Processing Pipeline**: Standardized process from upload to LLM processing and response generation.
- **Integrated Graph Generation**: Automatic detection and server-side creation of various graph types, seamlessly embedded into solutions.
- **LLM Integration**: Supports multiple AI providers, allowing user selection and intelligent content detection for LaTeX application. Incorporates advanced academic rigor standards in system prompts across all LLMs.
- **Automatic Word Count Continuation**: Detects and meets specified word/page count requirements through iterative content generation.
- **Voice Input**: Browser Web Speech API and Azure Speech Services for real-time transcription.
- **Mathematical Notation**: MathJax integration for LaTeX support and optimized PDF export.
- **Dual Payment System**: Full PayPal and Stripe integration for user authentication and flexible payment.
- **Multi-User Data Isolation**: PostgreSQL enforces user-scoped data access and secure deletion, supporting anonymous users.
- **GPT BYPASS**: Functionality for text rewriting and AI detection score reduction with a dedicated interface and chunked processing.
- **Grading Assistant**: AI-powered grading tool that strictly adheres to user-provided rubrics in any format (letter grades, numeric, pass/fail).
- **Ask-a-Philosopher Integration**: Automated philosophical content enrichment via secure API integration with https://analyticphilosophy.net/. Detects philosophical topics (Freud, Plato, Chomsky, etc.) in user requests and automatically fetches authoritative quotes, passages, and context to enrich homework responses. Uses ZHI_PRIVATE_KEY for authentication with graceful degradation on API failures.

## External Dependencies

- **Database**: PostgreSQL
- **LLM APIs**: Anthropic, OpenAI, Azure OpenAI, DeepSeek, Perplexity
- **Payment Gateways**: PayPal, Stripe
- **Philosophical Content**: Ask-a-Philosopher API (https://analyticphilosophy.net/)
- **CDN Services**: MathJax, Google Fonts
- **Speech Services**: Azure Cognitive Services

## Recent Changes

### November 11, 2025 - Ask-a-Philosopher API Integration
- Created `server/services/philosopherApi.ts` with comprehensive philosophical keyword detection
- Integrated automatic content enrichment in `/api/process-text` pipeline before LLM processing
- Added secure authentication using ZHI_PRIVATE_KEY environment variable
- Implemented graceful error handling with detailed logging for unauthorized/failed requests
- Covered 60+ philosophical keywords including major philosophers, schools of thought, and concepts
- Enriched text includes quotes, passages, context, and source attribution in structured format