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

export async function fetchPhilosopherContent(query: string): Promise<PhilosopherContent | null> {
  if (!ZHI_PRIVATE_KEY) {
    console.warn('[AP API] ZHI_PRIVATE_KEY not configured');
    return null;
  }

  try {
    console.log(`[AP API] Sending query: "${query.substring(0, 100)}..."`);
    
    const requestBody = { query };
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
    
    const content: PhilosopherContent = {
      quotes: response.data.quotes.length > 0 ? response.data.quotes : undefined,
      passages: response.data.results.length > 0 
        ? response.data.results.map(r => `"${r.excerpt}"\n— ${r.citation.author}, ${r.citation.work}`)
        : undefined,
      context: response.data.meta.queryProcessed 
        ? `Query processed: ${response.data.meta.queryProcessed}\nReturned ${response.data.meta.resultsReturned} results from the Ask-a-Philosopher database.`
        : undefined,
      source: 'Ask-a-Philosopher Database (https://analyticphilosophy.net/)'
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
    enrichmentSections.push(`\n\n=== QUOTES ===\n${philosopherContent.quotes.join('\n\n')}`);
  }
  
  if (philosopherContent.passages && philosopherContent.passages.length > 0) {
    enrichmentSections.push(`\n\n=== PASSAGES ===\n${philosopherContent.passages.join('\n\n')}`);
  }
  
  if (philosopherContent.context) {
    enrichmentSections.push(`\n\n=== CONTEXT ===\n${philosopherContent.context}`);
  }
  
  if (philosopherContent.source) {
    enrichmentSections.push(`\n\n=== SOURCE ===\n${philosopherContent.source}`);
  }
  
  if (enrichmentSections.length > 0) {
    const enrichedText = `${originalText}\n\n` +
      `========================================\n` +
      `REFERENCE MATERIAL FROM DATABASE\n` +
      `(Use this material to enrich your response with specific citations)\n` +
      `========================================` +
      enrichmentSections.join('') +
      `\n\n========================================`;
    
    console.log(`[AP API] ✓ Enriched text with ${enrichmentSections.length} sections`);
    return enrichedText;
  }
  
  return originalText;
}

export async function enrichWithPhilosophicalContentIfNeeded(text: string, forceQuery: boolean = false): Promise<string> {
  if (!forceQuery) {
    return text;
  }
  
  console.log('[AP API] Toggle ON - querying database');
  const content = await fetchPhilosopherContent(text);
  
  if (!content) {
    console.error('[AP API] ⛔ KILL SWITCH ACTIVATED - Database query failed, refusing to generate fabricated content');
    throw new Error('KILL SWITCH: AP database query failed. Cannot proceed without authentic database content. Toggle must be OFF to process this request.');
  }
  
  return enrichTextWithPhilosopherContent(text, content);
}
