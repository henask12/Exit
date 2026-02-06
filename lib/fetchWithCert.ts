/**
 * Custom fetch utility that handles self-signed certificates in development
 * Only bypasses certificate validation in development mode
 */

import https from 'https';
import { Agent } from 'https';

// Create a custom agent that accepts self-signed certificates (development only)
const httpsAgent = new Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production',
});

/**
 * Custom fetch wrapper that uses a custom HTTPS agent
 * This allows self-signed certificates in development
 */
export async function fetchWithCert(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Only use custom agent for HTTPS URLs in development
  if (process.env.NODE_ENV !== 'production' && url.startsWith('https://')) {
    // For Next.js, we need to use the global fetch but configure it
    // Since Next.js uses undici, we can't directly pass an agent
    // Instead, we'll set the NODE_TLS_REJECT_UNAUTHORIZED env var approach
    // or use a workaround
    
    // Workaround: Use node's https module for development
    if (typeof window === 'undefined') {
      // Server-side: Use https module directly
      return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.pathname + urlObj.search,
          method: options.method || 'GET',
          headers: {
            ...(options.headers as Record<string, string>),
          },
          agent: httpsAgent,
        };

        const req = https.request(requestOptions, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const body = Buffer.concat(chunks);
            const response = new Response(body, {
              status: res.statusCode || 200,
              statusText: res.statusMessage || 'OK',
              headers: new Headers(res.headers as Record<string, string>),
            });
            resolve(response);
          });
        });

        req.on('error', reject);

        if (options.body) {
          if (typeof options.body === 'string') {
            req.write(options.body);
          } else if (options.body instanceof ArrayBuffer) {
            req.write(Buffer.from(options.body));
          } else if (options.body instanceof Blob) {
            // For Blob, we'd need to convert it, but in server-side this is unlikely
            req.write(options.body);
          }
        }

        req.end();
      });
    }
  }

  // Production or client-side: Use standard fetch
  return fetch(url, options);
}

