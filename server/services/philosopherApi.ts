import axios from 'axios';
import crypto from 'crypto';

const PHILOSOPHER_API_URL = 'https://analyticphilosophy.net/zhi';
const ZHI_PRIVATE_KEY = process.env.ZHI_PRIVATE_KEY;
const ZHI_APP_ID = 'ezhw';

interface PhilosopherContent {
  quotes?: string[];
  passages?: string[];
  context?: string;
  source?: string;
}

interface PhilosopherApiResponse {
  success: boolean;
  data?: PhilosopherContent;
  error?: string;
}

const PHILOSOPHICAL_KEYWORDS = [
  // Philosophers
  'freud', 'plato', 'aristotle', 'kant', 'hegel', 'nietzsche', 'descartes',
  'hume', 'locke', 'berkeley', 'spinoza', 'leibniz', 'rousseau', 'hobbes',
  'mill', 'bentham', 'kierkegaard', 'schopenhauer', 'wittgenstein', 'heidegger',
  'sartre', 'camus', 'foucault', 'derrida', 'habermas', 'rawls', 'nozick',
  'socrates', 'epicurus', 'marcus aurelius', 'aquinas', 'augustine',
  'levi-strauss', 'levi strauss', 'chomsky', 'depth psychology', 'depth-psychology',
  'depth grammar', 'depth-grammar', 'structuralism', 'psychoanalysis',
  
  // Philosophical concepts
  'epistemology', 'metaphysics', 'ontology', 'phenomenology', 'existentialism',
  'utilitarianism', 'deontology', 'virtue ethics', 'categorical imperative',
  'social contract', 'dialectic', 'phenomenology', 'hermeneutics',
  'postmodernism', 'pragmatism', 'stoicism', 'skepticism', 'empiricism',
  'rationalism', 'idealism', 'materialism', 'dualism', 'monism',
  
  // Topics that often need philosophical grounding
  'philosophy', 'philosophical', 'philosopher', 'ethics', 'morality',
  'consciousness', 'free will', 'determinism', 'mind-body problem',
  'theory of knowledge', 'logic', 'aesthetics', 'political philosophy'
];

export function detectPhilosophicalContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PHILOSOPHICAL_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

export function extractPhilosophicalTopics(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundTopics: string[] = [];
  
  PHILOSOPHICAL_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      foundTopics.push(keyword);
    }
  });
  
  return Array.from(new Set(foundTopics));
}

function generateAuthHeaders(requestBody: any): Record<string, string> {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const bodyString = JSON.stringify(requestBody);
  
  // Generate HMAC-SHA256 signature
  // Signature format: HMAC-SHA256(privateKey, appId:timestamp:nonce:body)
  const message = `${ZHI_APP_ID}:${timestamp}:${nonce}:${bodyString}`;
  const signature = crypto
    .createHmac('sha256', ZHI_PRIVATE_KEY!)
    .update(message)
    .digest('base64');
  
  console.log('\n╔═══════════════════════════════════════════════════════════════');
  console.log('║ PHILOSOPHER API - REQUEST DETAILS');
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
  console.log('║ SIGNATURE CALCULATION:');
  console.log(`║ Message:        ${message.substring(0, 100)}...`);
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

export async function fetchPhilosophicalContent(query: string): Promise<PhilosopherContent | null> {
  if (!ZHI_PRIVATE_KEY) {
    console.warn('[PHILOSOPHER API] ZHI_PRIVATE_KEY not configured');
    return null;
  }

  try {
    console.log(`[PHILOSOPHER API] Fetching content for query: "${query.substring(0, 100)}..."`);
    
    const requestBody = {
      query: query,
      topics: extractPhilosophicalTopics(query),
    };
    
    const authHeaders = generateAuthHeaders(requestBody);
    
    const response = await axios.post<PhilosopherApiResponse>(
      `${PHILOSOPHER_API_URL}/query`,
      requestBody,
      {
        headers: authHeaders,
        timeout: 10000, // 10 second timeout
      }
    );

    if (response.data.success && response.data.data) {
      console.log(`[PHILOSOPHER API] ✓ Successfully retrieved philosophical content`);
      return response.data.data;
    } else {
      console.warn(`[PHILOSOPHER API] API returned unsuccessful response:`, response.data.error);
      return null;
    }
  } catch (error: any) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`[PHILOSOPHER API] ✗ Server error (${error.response.status}):`, error.response.data);
      
      if (error.response.status === 401) {
        console.error('[PHILOSOPHER API] ✗ Unauthorized - check ZHI_PRIVATE_KEY configuration');
      } else if (error.response.status === 404) {
        console.warn('[PHILOSOPHER API] No content found for this query');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[PHILOSOPHER API] ✗ No response from server:', error.message);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[PHILOSOPHER API] ✗ Request setup error:', error.message);
    }
    
    return null;
  }
}

export function enrichTextWithPhilosophicalContent(
  originalText: string,
  philosophicalContent: PhilosopherContent
): string {
  let enrichedText = originalText;
  
  // Add philosophical content as context for the LLM
  const enrichmentSections: string[] = [];
  
  if (philosophicalContent.quotes && philosophicalContent.quotes.length > 0) {
    enrichmentSections.push(`\n\n=== RELEVANT PHILOSOPHICAL QUOTES ===\n${philosophicalContent.quotes.join('\n\n')}`);
  }
  
  if (philosophicalContent.passages && philosophicalContent.passages.length > 0) {
    enrichmentSections.push(`\n\n=== RELEVANT PHILOSOPHICAL PASSAGES ===\n${philosophicalContent.passages.join('\n\n')}`);
  }
  
  if (philosophicalContent.context) {
    enrichmentSections.push(`\n\n=== PHILOSOPHICAL CONTEXT ===\n${philosophicalContent.context}`);
  }
  
  if (philosophicalContent.source) {
    enrichmentSections.push(`\n\n=== SOURCE ===\n${philosophicalContent.source}`);
  }
  
  if (enrichmentSections.length > 0) {
    enrichedText = `${originalText}\n\n` +
      `========================================\n` +
      `AUTHORITATIVE PHILOSOPHICAL REFERENCE MATERIAL\n` +
      `(Use this material to enrich and ground your response with specific citations and references)\n` +
      `========================================` +
      enrichmentSections.join('') +
      `\n\n========================================`;
    
    console.log(`[PHILOSOPHER API] ✓ Enriched text with ${enrichmentSections.length} philosophical content sections`);
  }
  
  return enrichedText;
}

export async function enrichWithPhilosophicalContentIfNeeded(text: string, forceQuery: boolean = false): Promise<string> {
  const hasPhilosophicalContent = detectPhilosophicalContent(text);
  
  if (!forceQuery && !hasPhilosophicalContent) {
    console.log('[PHILOSOPHER API] No philosophical content detected, skipping enrichment');
    return text;
  }
  
  if (forceQuery) {
    console.log('[PHILOSOPHER API] 🔥 FORCE MODE: Always querying philosopher database');
  } else {
    console.log('[PHILOSOPHER API] Philosophical content detected, fetching reference material...');
  }
  
  const topics = extractPhilosophicalTopics(text);
  console.log(`[PHILOSOPHER API] Detected topics: ${topics.join(', ')}`);
  
  const philosophicalContent = await fetchPhilosophicalContent(text);
  
  if (!philosophicalContent) {
    console.log('[PHILOSOPHER API] No philosophical content retrieved, proceeding without enrichment');
    return text;
  }
  
  return enrichTextWithPhilosophicalContent(text, philosophicalContent);
}
