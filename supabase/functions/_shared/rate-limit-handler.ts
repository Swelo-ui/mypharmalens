/**
 * Rate Limit Handler
 * Detects when AI services are exhausted and provides user-friendly responses
 */

interface RateLimitResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    genericName: string;
    description: string;
    warnings: string[];
    recommendations: string[];
    confidence: 'low';
    verified: false;
    rateLimited: true;
  };
  processingStages: string[];
  confidence: 'low';
  fallbackUsed: boolean;
  processingTime: number;
}

/**
 * Check if error is due to rate limiting
 */
export function isRateLimitError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  
  return errorMessage.includes('429') || 
         errorMessage.includes('Rate limit') || 
         errorMessage.includes('credit') ||
         errorMessage.includes('quota') ||
         errorMessage.includes('ALL MODELS FAILED') ||
         errorMessage.includes('exhausted') ||
         errorMessage.includes('Too Many Requests');
}

/**
 * Create user-friendly response when AI services are rate limited
 */
export function createRateLimitResponse(processingTime: number = 0): RateLimitResponse {
  return {
    success: true,
    data: {
      id: crypto.randomUUID(),
      name: 'AI Services Temporarily Unavailable',
      genericName: 'Service Limit Reached',
      description: 'Our AI identification services have reached their daily limit. This is temporary and will reset soon.',
      warnings: [
        '🚫 AI identification services temporarily exhausted',
        '⏰ Services will be restored within 24 hours',
        '💊 Do not take unidentified medications',
        '👨‍⚕️ Consult healthcare provider for urgent needs'
      ],
      recommendations: [
        '🕐 Try again in a few hours when services reset',
        '🏥 Visit a pharmacy for immediate identification',
        '📞 Contact your healthcare provider',
        '📸 Save the photo to try again later',
        '🔍 Look for manufacturer information on packaging'
      ],
      confidence: 'low' as const,
      verified: false,
      rateLimited: true
    },
    processingStages: ['rate-limit-detected'],
    confidence: 'low' as const,
    fallbackUsed: true,
    processingTime
  };
}

/**
 * Create enhanced error message for rate limits
 */
export function getRateLimitErrorMessage(): string {
  return "AI services temporarily exhausted due to high usage. Please try again in a few hours or visit a pharmacy for identification.";
}

/**
 * Log rate limit occurrence for monitoring
 */
export function logRateLimit(service: string, error: string): void {
  console.log('🚨 === RATE LIMIT DETECTED ===');
  console.log(`Service: ${service}`);
  console.log(`Error: ${error}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('Recommendation: User should try again later or visit pharmacy');
  console.log('================================');
}
