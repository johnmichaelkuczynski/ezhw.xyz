import axios from 'axios';

const PHILOSOPHER_API_URL = 'https://analyticphilosophy.net/api';
const ZHI_PRIVATE_KEY = process.env.ZHI_PRIVATE_KEY;

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

export async function fetchPhilosophicalContent(query: string): Promise<PhilosopherContent | null> {
  if (!ZHI_PRIVATE_KEY) {
    console.warn('[PHILOSOPHER API] ZHI_PRIVATE_KEY not configured');
    return null;
  }

  try {
    console.log(`[PHILOSOPHER API] Fetching content for query: "${query.substring(0, 100)}..."`);
    
    const response = await axios.post<PhilosopherApiResponse>(
      `${PHILOSOPHER_API_URL}/query`,
      {
        query: query,
        topics: extractPhilosophicalTopics(query),
      },
      {
        headers: {
          'Authorization': `Bearer ${ZHI_PRIVATE_KEY}`,
          'Content-Type': 'application/json',
        },
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

export async function enrichWithPhilosophicalContentIfNeeded(text: string): Promise<string> {
  if (!detectPhilosophicalContent(text)) {
    console.log('[PHILOSOPHER API] No philosophical content detected, skipping enrichment');
    return text;
  }
  
  console.log('[PHILOSOPHER API] Philosophical content detected, fetching reference material...');
  const topics = extractPhilosophicalTopics(text);
  console.log(`[PHILOSOPHER API] Detected topics: ${topics.join(', ')}`);
  
  const philosophicalContent = await fetchPhilosophicalContent(text);
  
  if (!philosophicalContent) {
    console.log('[PHILOSOPHER API] No philosophical content retrieved, proceeding without enrichment');
    return text;
  }
  
  return enrichTextWithPhilosophicalContent(text, philosophicalContent);
}
