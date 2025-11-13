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

### November 13, 2025 - Context Length Fix for Multi-Philosopher Queries
- **Fixed OpenAI/Anthropic Context Length Error:** Limited database content to prevent token overflow
  - Max 5 passages per author (down from 10)
  - Max 1000 characters per passage (truncates long excerpts)
  - Max 20 quotes per author (down from unlimited)
  - Prevents "context_length_exceeded" errors when querying 30+ philosophers
  - Database still returns authentic content, just in manageable portions

### November 12, 2025 (Evening) - AP Database CONFIRMED WORKING
- **Database Fully Functional:** AnalyticPhilosophy.net database now successfully returning authentic quotes
  - Verified working for Kuczynski, Russell, Bergson, Jack London, Adler, Engels, Rousseau, Von Mises, Veblen, Swett, Berkeley, and many others
  - Returns authentic excerpts and quotes per query
  - Example citation: "Philosophy is the analysis of the concepts in terms of which we understand the world." — J.-M. Kuczynski, "Philosophy and Psychoanalysis: Selected Dialogues"
- **Toggle Default:** Philosopher DB toggle set to OFF by default (user can enable as needed)
- **KILL SWITCH Operational:** System correctly validates database responses and prevents fabrication

### November 12, 2025 - Critical KILL SWITCH Fix & Client-Side Validation
- **KILL SWITCH Enhancement:** System now correctly refuses to fabricate quotes when database returns zero authentic content
  - If client-side filtering removes ALL results (database author filter broken), KILL SWITCH activates immediately
  - Error message: "KILL SWITCH: AP database query failed. Cannot proceed without authentic database content."
  - Prevents LLMs from generating fake quotes when toggle is ON and database fails to deliver
- **Client-Side Validation:** Added post-fetch filtering to compensate for broken upstream author filtering
  - AP database's `author` parameter is non-functional (returns wrong authors 20-100% of the time)
  - EZHW now filters results client-side to ensure citation accuracy
  - Detailed warnings logged when filtering removes incorrect results
- **Expanded Author Detection:** Now detects all 33+ philosophers from user's list
  - Kuczynski, Russell, Galileo, Nietzsche, Freud, James, Leibniz, Aristotle, Le Bon, Plato
  - Darwin, Kant, Schopenhauer, Jung, Poe, Marx, Keynes, Locke, Newton, Hume
  - Machiavelli, Bierce, Poincare, Bergson, Jack London, Adler, Engels, Rousseau
  - Von Mises, Veblen, Swett, Berkeley, Maimonides, Descartes, Wittgenstein

### November 11, 2025 - Ask-a-Philosopher API Integration
- Created `server/services/philosopherApi.ts` for AP database integration
- **HMAC-SHA256 Authentication Implementation:**
  - X-ZHI-App-Id: "ezhw"
  - X-ZHI-Timestamp: Unix milliseconds
  - X-ZHI-Nonce: Random 32-char hex string
  - X-ZHI-Signature: Base64 HMAC-SHA256 of POST method, path, timestamp, nonce, and body hash
  - Uses ZHI_PRIVATE_KEY environment variable
- **Toggle Behavior:** When "Philosopher DB: ON", system queries AP database with author filtering
- API endpoint: https://analyticphilosophy.net/zhi/query
- Request format: `{ "query": "user's text", "author": "detected_author", "limit": 10, "includeQuotes": true }`
- Response enriches LLM prompt with quotes, passages, context, and sources from 50,000+ page database
- Detailed logging shows exact request details (endpoint, headers, signature calculation) for debugging
- Works for both short assignments and chunked processing (1000+ words)