import crypto from 'crypto';

const AUTHORS = [
  'kuczynski',
  'russell',
  'galileo',
  'nietzsche',
  'freud',
  'james',
  'leibniz',
  'aristotle',
  'le bon',
  'plato',
  'darwin',
  'kant',
  'schopenhauer',
  'jung',
  'poe',
  'marx',
  'keynes',
  'locke',
  'newton',
  'hume',
  'machiavelli',
  'bierce',
  'poincare',
  'bergson',
  'jack london',
  'adler',
  'engels',
  'rousseau',
  'von mises',
  'veblen',
  'swett',
  'berkeley',
  'maimonides'
];

const AP_ENDPOINT = 'https://analyticphilosophy.net/zhi/query';
const APP_ID = 'ezhw';
const PRIVATE_KEY = process.env.ZHI_PRIVATE_KEY || '';

function generateAuthHeaders(method: string, path: string, body: any): any {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const bodyString = JSON.stringify(body);
  const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
  
  const payload = `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyHash}`;
  const signature = crypto.createHmac('sha256', PRIVATE_KEY).update(payload).digest('base64');
  
  return {
    'X-ZHI-App-Id': APP_ID,
    'X-ZHI-Timestamp': timestamp.toString(),
    'X-ZHI-Nonce': nonce,
    'X-ZHI-Signature': signature,
    'Content-Type': 'application/json'
  };
}

async function testAuthor(author: string): Promise<{ author: string; pass: boolean; reason: string; details?: any }> {
  try {
    const body = {
      query: `quotes by ${author}`,
      author: author,
      limit: 10,
      includeQuotes: true
    };
    
    const headers = generateAuthHeaders('POST', '/zhi/query', body);
    
    const response = await fetch(AP_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      return {
        author,
        pass: false,
        reason: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    
    if (!data.excerpts || data.excerpts.length === 0) {
      return {
        author,
        pass: false,
        reason: 'ZERO results returned',
        details: data
      };
    }
    
    // Check if results match the requested author
    const wrongAuthors = data.excerpts.filter((excerpt: any) => {
      const excerptAuthor = excerpt.author?.toLowerCase() || '';
      const normalizedRequestedAuthor = author.toLowerCase().replace(/[^a-z]/g, '');
      const normalizedExcerptAuthor = excerptAuthor.toLowerCase().replace(/[^a-z]/g, '');
      
      // Check if the excerpt author contains the requested author
      return !normalizedExcerptAuthor.includes(normalizedRequestedAuthor) && 
             !normalizedRequestedAuthor.includes(normalizedExcerptAuthor);
    });
    
    if (wrongAuthors.length === data.excerpts.length) {
      return {
        author,
        pass: false,
        reason: `ALL ${data.excerpts.length} results from WRONG authors`,
        details: {
          returned_count: data.excerpts.length,
          sample_wrong_authors: wrongAuthors.slice(0, 3).map((e: any) => e.author)
        }
      };
    }
    
    if (wrongAuthors.length > 0) {
      return {
        author,
        pass: false,
        reason: `${wrongAuthors.length}/${data.excerpts.length} results from wrong authors`,
        details: {
          correct: data.excerpts.length - wrongAuthors.length,
          wrong: wrongAuthors.length,
          sample_wrong: wrongAuthors.slice(0, 3).map((e: any) => e.author)
        }
      };
    }
    
    return {
      author,
      pass: true,
      reason: `✓ ${data.excerpts.length} authentic results`,
      details: {
        excerpt_count: data.excerpts.length,
        quote_count: data.quotes?.length || 0
      }
    };
    
  } catch (error: any) {
    return {
      author,
      pass: false,
      reason: `ERROR: ${error.message}`
    };
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('AP DATABASE TEST - ALL 33 AUTHORS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const results = [];
  
  for (const author of AUTHORS) {
    console.log(`Testing: ${author}...`);
    const result = await testAuthor(author);
    results.push(result);
    
    const status = result.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status}: ${result.reason}`);
    if (result.details) {
      console.log(`  Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('SUMMARY REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const passed = results.filter(r => r.pass);
  const failed = results.filter(r => !r.pass);
  
  console.log(`Total Authors Tested: ${AUTHORS.length}`);
  console.log(`PASSED: ${passed.length} (${Math.round(passed.length/AUTHORS.length*100)}%)`);
  console.log(`FAILED: ${failed.length} (${Math.round(failed.length/AUTHORS.length*100)}%)`);
  
  if (passed.length > 0) {
    console.log('\n✓ WORKING AUTHORS:');
    passed.forEach(r => console.log(`  - ${r.author}`));
  }
  
  if (failed.length > 0) {
    console.log('\n✗ BROKEN AUTHORS:');
    failed.forEach(r => console.log(`  - ${r.author}: ${r.reason}`));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`VERDICT: ${failed.length === 0 ? '✓ ALL TESTS PASSED' : '✗ DATABASE BROKEN'}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

runTests().catch(console.error);
