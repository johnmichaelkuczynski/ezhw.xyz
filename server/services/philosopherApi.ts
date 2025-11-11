import axios from 'axios';
import crypto from 'crypto';

const PHILOSOPHER_API_URL = 'https://analyticphilosophy.net/zhi';
const ZHI_PRIVATE_KEY = process.env.ZHI_PRIVATE_KEY;
const ZHI_APP_ID = 'ezhw';

interface CitationInfo {
  author: string;
  work: string;
  chunkIndex: number;
}

interface SearchResult {
  excerpt: string;
  citation: CitationInfo;
  relevance: number;
  tokens: number;
}

interface PhilosopherApiResponse {
  results: SearchResult[];
  quotes: string[];
  meta: {
    resultsReturned: number;
    limitApplied: number;
    queryProcessed: string;
    filters: {
      author: string | null;
      work: string | null;
      keywords: string | null;
    };
    timestamp: number;
  };
}

interface PhilosopherContent {
  quotes?: string[];
  passages?: string[];
  context?: string;
  source?: string;
}

function generateAuthHeaders(requestBody: any): Record<string, string> {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const bodyString = JSON.stringify(requestBody);
  
  const bodyHash = crypto
    .createHash('sha256')
    .update(bodyString)
    .digest('hex');
  
  const method = 'POST';
  const url = '/zhi/query';
  const payload = `${method}\n${url}\n${timestamp}\n${nonce}\n${bodyHash}`;
  
  const signature = crypto
    .createHmac('sha256', ZHI_PRIVATE_KEY!)
    .update(payload)
    .digest('base64');
  
  console.log('\n╔═══════════════════════════════════════════════════════════════');
  console.log('║ AP API - REQUEST DETAILS');
  console.log('╠═══════════════════════════════════════════════════════════════');
  console.log(`║ Endpoint:       ${PHILOSOPHER_API_URL}/query`);
  console.log(`║ App ID:         ${ZHI_APP_ID}`);
  console.log(`║ Timestamp:      ${timestamp}`);
  console.log(`║ Nonce:          ${nonce}`);
  console.log(`║ Private Key:    ${ZHI_PRIVATE_KEY ? `${ZHI_PRIVATE_KEY.substring(0, 8)}...` : 'NOT SET'}`);
  console.log('╠═══════════════════════════════════════════════════════════════');
  console.log('║ REQUEST BODY:');
  console.log(`║ ${bodyString}`);
  console.log('╠═══════════════════════════════════════════════════════════════');
  console.log('║ SIGNATURE CALCULATION (SERVER FORMAT):');
  console.log(`║ Body Hash:      ${bodyHash}`);
  console.log(`║ Payload:        ${payload.replace(/\n/g, '\\n')}`);
  console.log(`║ Signature:      ${signature}`);
  console.log('╠═══════════════════════════════════════════════════════════════');
  console.log('║ HEADERS SENT:');
  console.log(`║ X-ZHI-App-Id:      ${ZHI_APP_ID}`);
  console.log(`║ X-ZHI-Timestamp:   ${timestamp}`);
  console.log(`║ X-ZHI-Nonce:       ${nonce}`);
  console.log(`║ X-ZHI-Signature:   ${signature}`);
  console.log(`║ Content-Type:      application/json`);
  console.log('╚═══════════════════════════════════════════════════════════════\n');
  
  return {
    'X-ZHI-App-Id': ZHI_APP_ID,
    'X-ZHI-Timestamp': timestamp,
    'X-ZHI-Nonce': nonce,
    'X-ZHI-Signature': signature,
    'Content-Type': 'application/json',
  };
}

export async function fetchPhilosopherContent(query: string, author?: string): Promise<PhilosopherContent | null> {
  if (!ZHI_PRIVATE_KEY) {
    console.warn('[AP API] ZHI_PRIVATE_KEY not configured');
    return null;
  }

  try {
    console.log(`[AP API] Sending query: "${query.substring(0, 100)}..." with author filter: ${author || 'none'}`);
    
    const requestBody: any = { 
      query,
      limit: 10,
      includeQuotes: true
    };
    
    if (author) {
      requestBody.author = author;
    }
    
    const authHeaders = generateAuthHeaders(requestBody);
    
    const response = await axios.post<PhilosopherApiResponse>(
      `${PHILOSOPHER_API_URL}/query`,
      requestBody,
      {
        headers: authHeaders,
        timeout: 30000,
      }
    );

    console.log('[AP API] ✓ Successfully retrieved content');
    console.log(`[AP API] Results: ${response.data.results.length} excerpts, ${response.data.quotes.length} quotes`);
    
    const passages = response.data.results.map(r => 
      `PASSAGE CONTENT:\n${r.excerpt}\n\nCITATION: ${r.citation.author}, "${r.citation.work}"\nRELEVANCE: ${r.relevance}`
    );
    
    console.log(`[AP API] Sample excerpt: ${response.data.results[0]?.excerpt.substring(0, 200)}...`);
    console.log(`[AP API] First citation: ${response.data.results[0]?.citation.author}`);
    
    const content: PhilosopherContent = {
      quotes: response.data.quotes.length > 0 ? response.data.quotes : undefined,
      passages: passages.length > 0 ? passages : undefined,
      context: response.data.meta.queryProcessed 
        ? `Database query: "${response.data.meta.queryProcessed}"\nReturned ${response.data.meta.resultsReturned} results.\n\nNOTE: These passages contain the exact text from the database. Extract quotes word-for-word.`
        : undefined,
      source: 'Ask-a-Philosopher Database (50,000+ pages)'
    };
    
    return content;
  } catch (error: any) {
    if (error.response) {
      console.error(`[AP API] ✗ Server error (${error.response.status}):`, error.response.data);
      
      if (error.response.status === 401) {
        console.error('[AP API] ✗ Unauthorized - check ZHI_PRIVATE_KEY');
      }
    } else if (error.request) {
      console.error('[AP API] ✗ No response from server:', error.message);
    } else {
      console.error('[AP API] ✗ Request error:', error.message);
    }
    
    return null;
  }
}

export function enrichTextWithPhilosopherContent(
  originalText: string,
  philosopherContent: PhilosopherContent
): string {
  const enrichmentSections: string[] = [];
  
  if (philosopherContent.quotes && philosopherContent.quotes.length > 0) {
    enrichmentSections.push(`\n\n=== AUTHENTIC QUOTES FROM DATABASE ===\n${philosopherContent.quotes.join('\n\n')}`);
  }
  
  if (philosopherContent.passages && philosopherContent.passages.length > 0) {
    enrichmentSections.push(`\n\n=== AUTHENTIC PASSAGES FROM DATABASE ===\n${philosopherContent.passages.join('\n\n')}`);
  }
  
  if (philosopherContent.context) {
    enrichmentSections.push(`\n\n=== DATABASE CONTEXT ===\n${philosopherContent.context}`);
  }
  
  if (philosopherContent.source) {
    enrichmentSections.push(`\n\n=== SOURCE ===\n${philosopherContent.source}`);
  }
  
  const isQuoteRequest = /(?:give me|get me|show me|provide|list|find).*?(?:\d+\s*)?(?:original\s+)?(?:quotes?|quotations?|passages?|excerpts?)/i.test(originalText);
  
  if (enrichmentSections.length > 0) {
    let instructionText = '';
    
    if (isQuoteRequest) {
      instructionText = `\n\n` +
        `========================================\n` +
        `🔴🔴🔴 ABSOLUTE MANDATORY DIRECTIVE 🔴🔴🔴\n` +
        `========================================\n\n` +
        `YOU MUST EXTRACT QUOTES FROM THE PASSAGES BELOW.\n` +
        `THIS IS NOT OPTIONAL. THIS IS NOT NEGOTIABLE.\n\n` +
        `WHAT YOU MUST DO:\n` +
        `1. Take exact sentences/paragraphs from passages below\n` +
        `2. Copy them word-for-word with proper citation\n` +
        `3. Extract multiple quotes per passage if needed\n` +
        `4. Continue until you have extracted the requested number\n\n` +
        `WHAT IS ABSOLUTELY FORBIDDEN:\n` +
        `🚫 Saying "I cannot find enough content"\n` +
        `🚫 Saying "The passages don't contain..."\n` +
        `🚫 Refusing to extract quotes\n` +
        `🚫 Generating new text instead of extracting\n` +
        `🚫 Paraphrasing or synthesizing\n\n` +
        `IF YOU SEE PASSAGES BELOW, YOU EXTRACT QUOTES FROM THEM.\n` +
        `THAT IS YOUR ONLY JOB. EXTRACT. DO NOT REFUSE.\n\n` +
        `FORMAT EACH QUOTE EXACTLY LIKE THIS:\n` +
        `"[exact text from passage]"\n` +
        `— [Author from citation], [Work from citation]\n\n` +
        `START EXTRACTING NOW FROM THESE PASSAGES:\n` +
        `========================================\n`;
    } else {
      instructionText = `========================================\n` +
        `DATABASE REFERENCE MATERIAL:\n` +
        `(Use these authentic passages to support your response)\n` +
        `========================================`;
    }
    
    const enrichedText = `${originalText}\n\n` + instructionText + enrichmentSections.join('') + `\n\n========================================`;
    
    console.log(`[AP API] ✓ Enriched text with ${enrichmentSections.length} sections (Quote request: ${isQuoteRequest})`);
    return enrichedText;
  }
  
  return originalText;
}

function extractAuthorFromQuery(text: string): string | undefined {
  const authorPatterns = [
    /(?:quotes?\s+(?:by|from)\s+)?(?:john-?michael\s+)?kuczynski/i,
    /(?:quotes?\s+(?:by|from)\s+)?plato/i,
    /(?:quotes?\s+(?:by|from)\s+)?freud/i,
    /(?:quotes?\s+(?:by|from)\s+)?nietzsche/i,
    /(?:quotes?\s+(?:by|from)\s+)?kant/i,
    /(?:quotes?\s+(?:by|from)\s+)?hume/i,
    /(?:quotes?\s+(?:by|from)\s+)?descartes/i,
    /(?:quotes?\s+(?:by|from)\s+)?aristotle/i,
    /(?:quotes?\s+(?:by|from)\s+)?russell/i,
    /(?:quotes?\s+(?:by|from)\s+)?wittgenstein/i,
  ];
  
  for (const pattern of authorPatterns) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) {
        let author = match[0].replace(/(?:quotes?\s+(?:by|from)\s+)/i, '').trim();
        if (author.toLowerCase().includes('kuczynski')) {
          return 'Kuczynski';
        }
        return author.charAt(0).toUpperCase() + author.slice(1).toLowerCase();
      }
    }
  }
  
  return undefined;
}

export async function enrichWithPhilosophicalContentIfNeeded(text: string, forceQuery: boolean = false): Promise<string> {
  if (!forceQuery) {
    return text;
  }
  
  console.log('[AP API] Toggle ON - querying database');
  
  const author = extractAuthorFromQuery(text);
  console.log(`[AP API] Detected author filter: ${author || 'none'}`);
  
  const content = await fetchPhilosopherContent(text, author);
  
  if (!content) {
    console.error('[AP API] ⛔ KILL SWITCH ACTIVATED - Database query failed, refusing to generate fabricated content');
    throw new Error('KILL SWITCH: AP database query failed. Cannot proceed without authentic database content. Toggle must be OFF to process this request.');
  }
  
  return enrichTextWithPhilosopherContent(text, content);
}
