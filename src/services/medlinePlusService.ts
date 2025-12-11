import { MedlinePlusSearchParams, HealthTopicResult, MedlinePlusCacheItem } from '../types/medlinePlus';

class MedlinePlusService {
    // Use proxy in development, direct API in production
    private getBaseUrl() {
        if (import.meta.env.DEV) {
            // In development, use Vite proxy
            return '/medlineplus-api';
        }
        // In production, use direct API (will work from deployed domain)
        return 'https://wsearch.nlm.nih.gov/ws/query';
    }

    private cacheKeyPrefix = 'medlineplus_cache_';
    private cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
    private requestsPerMinute = 0;
    private lastResetTime = Date.now();

    /**
     * Search MedlinePlus health topics
     */
    async searchHealthTopics(params: MedlinePlusSearchParams): Promise<HealthTopicResult[]> {
        await this.enforceRateLimit();

        const db = params.language === 'es' ? 'healthTopicsSpanish' : 'healthTopics';
        const cacheKey = `${this.cacheKeyPrefix}${db}_${params.term}_${params.rettype || 'brief'}`;

        // Check cache first
        const cachedData = this.getFromCache<HealthTopicResult[]>(cacheKey);
        if (cachedData) {
            console.log('✅ Using cached data for:', params.term);
            return cachedData;
        }

        const url = new URL(this.getBaseUrl(), window.location.origin);
        url.searchParams.append('db', db);
        url.searchParams.append('term', params.term);

        if (params.retmax) {
            url.searchParams.append('retmax', params.retmax.toString());
        }

        if (params.rettype) {
            url.searchParams.append('rettype', params.rettype);
        }

        // Add tool and email parameters as recommended by NLM
        url.searchParams.append('tool', 'PharmaLens');
        url.searchParams.append('email', 'support@pharmalens.com'); // Replace with actual email if available

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`MedlinePlus API error: ${response.status}`);
        }

        const xmlText = await response.text();
        const results = this.parseSearchResults(xmlText);

        // Cache results
        this.setCache(cacheKey, results);

        return results;
    }

    /**
     * Parse XML response to structured data
     */
    private parseSearchResults(xmlText: string): HealthTopicResult[] {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const documents = xmlDoc.querySelectorAll('document');

        const results: HealthTopicResult[] = [];

        documents.forEach(doc => {
            const result: HealthTopicResult = {
                title: this.getContentValue(doc, 'title') || '',
                url: doc.getAttribute('url') || '',
                snippet: this.getContentValue(doc, 'snippet'),
                summary: this.getContentValue(doc, 'FullSummary'),
                altTitle: this.getContentValue(doc, 'altTitle'),
                groupName: this.getContentValue(doc, 'groupName'),
                organizationName: this.getContentValue(doc, 'organizationName')
            };

            results.push(result);
        });

        return results;
    }

    /**
     * Extract content value from XML node
     */
    private getContentValue(doc: Element, name: string): string | undefined {
        const contentNode = doc.querySelector(`content[name="${name}"]`);
        return contentNode?.textContent || undefined;
    }

    /**
     * Enforce rate limiting (85 requests per minute)
     */
    private async enforceRateLimit(): Promise<void> {
        const now = Date.now();

        // Reset counter every minute
        if (now - this.lastResetTime > 60000) {
            this.requestsPerMinute = 0;
            this.lastResetTime = now;
        }

        // If at limit, wait until next minute
        if (this.requestsPerMinute >= 80) { // Use 80 to be safe
            const waitTime = 60000 - (now - this.lastResetTime);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.requestsPerMinute = 0;
            this.lastResetTime = Date.now();
        }

        this.requestsPerMinute++;
    }

    /**
     * Cache management using localStorage
     */
    private getFromCache<T>(key: string): T | null {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;

            const item: MedlinePlusCacheItem<T> = JSON.parse(itemStr);
            const now = Date.now();

            if (now - item.timestamp > this.cacheDuration) {
                localStorage.removeItem(key);
                return null;
            }

            return item.data;
        } catch (e) {
            console.warn('Error reading from cache', e);
            return null;
        }
    }

    private setCache<T>(key: string, data: T): void {
        try {
            const item: MedlinePlusCacheItem<T> = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            console.warn('Error writing to cache', e);
        }
    }
}

export const medlinePlusService = new MedlinePlusService();
