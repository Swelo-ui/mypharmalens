import React, { useEffect, useState } from 'react';
import { medlinePlusService } from '@/services/medlinePlusService';
import { HealthTopicResult } from '@/types/medlinePlus';
import { BookOpen, AlertCircle, Info, ChevronRight } from 'lucide-react';

interface HealthTopicsSectionProps {
    drugName: string;
    genericName?: string;
    category?: string;
    indications?: string[];
}

// Decode HTML entities (e.g. &lt; -> <)
const decodeHTML = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

// Parse HTML content into structured React components
const parseHTMLContent = (html: string) => {
    if (!html) return null;

    // Decode first because the API returns escaped HTML (e.g. &lt;p&gt;)
    const decodedHtml = decodeHTML(html);

    const parser = new DOMParser();
    const doc = parser.parseFromString(decodedHtml, 'text/html');
    const elements: JSX.Element[] = [];
    let key = 0;

    const processNode = (node: ChildNode): JSX.Element | string | null => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            return text || null;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const tagName = element.tagName.toLowerCase();
            const children = Array.from(element.childNodes)
                .map(processNode)
                .filter(Boolean);

            switch (tagName) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                    return (
                        <h4 key={key++} className="font-semibold text-pharma-700 dark:text-pharma-300 mt-4 mb-2 text-sm">
                            {children}
                        </h4>
                    );
                case 'p':
                    return (
                        <p key={key++} className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                            {children}
                        </p>
                    );
                case 'ul':
                    return (
                        <ul key={key++} className="ml-4 mb-3 space-y-1.5">
                            {children}
                        </ul>
                    );
                case 'li':
                    return (
                        <li key={key++} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <ChevronRight className="h-4 w-4 text-pharma-500 flex-shrink-0 mt-0.5" />
                            <span>{children}</span>
                        </li>
                    );
                case 'strong':
                case 'b':
                    return <strong key={key++} className="font-semibold text-pharma-600 dark:text-pharma-400">{children}</strong>;
                case 'em':
                case 'i':
                    return <em key={key++}>{children}</em>;
                case 'span':
                    // Ignore MedlinePlus highlighting spans but keep content
                    return <React.Fragment key={key++}>{children}</React.Fragment>;
                default:
                    return <React.Fragment key={key++}>{children}</React.Fragment>;
            }
        }

        return null;
    };

    Array.from(doc.body.childNodes).forEach(node => {
        const processed = processNode(node);
        if (processed) {
            elements.push(<React.Fragment key={key++}>{processed}</React.Fragment>);
        }
    });

    return <div className="space-y-2">{elements}</div>;
};

// Clean text for titles (remove all HTML)
const cleanText = (html: string): string => {
    if (!html) return '';
    const decoded = decodeHTML(html);
    const parser = new DOMParser();
    const doc = parser.parseFromString(decoded, 'text/html');
    return doc.body.textContent || '';
};

export const HealthTopicsSection: React.FC<HealthTopicsSectionProps> = ({
    drugName,
    genericName,
    category,
    indications
}) => {
    const [topics, setTopics] = useState<HealthTopicResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('=== MedlinePlus Search Debug ===');
                console.log('Drug:', drugName);
                console.log('Generic:', genericName);
                console.log('Category:', category);
                console.log('Indications:', indications);

                // Try multiple search strategies to find relevant topics
                const searchStrategies = [];

                // Strategy 1: Use the first indication (most specific)
                if (indications && indications.length > 0) {
                    const indication = indications[0];
                    const keywords = indication.split(' ').slice(0, 3).join(' ');
                    searchStrategies.push({ term: keywords, source: 'indication' });
                }

                // Strategy 2: Use generic name
                if (genericName) {
                    const cleanGeneric = genericName.split('(')[0].trim();
                    searchStrategies.push({ term: cleanGeneric, source: 'generic' });
                }

                // Strategy 3: Use drug name
                const cleanDrugName = drugName.split('(')[0].trim();
                searchStrategies.push({ term: cleanDrugName, source: 'drug' });

                // Strategy 4: Use category-based search
                if (category) {
                    const categoryMap: Record<string, string> = {
                        'Cardiovascular': 'Heart Disease',
                        'Pain Management': 'Pain',
                        'Diabetes': 'Diabetes',
                        'Antibiotics': 'Infections',
                        'Antihypertensive': 'High Blood Pressure',
                        'Analgesic': 'Pain',
                        'Anti-inflammatory': 'Inflammation',
                    };
                    const categoryTerm = categoryMap[category];
                    if (categoryTerm) {
                        searchStrategies.push({ term: categoryTerm, source: 'category' });
                    }
                }

                console.log('Search strategies:', searchStrategies);

                // Try each search strategy in order until we find results
                let results: HealthTopicResult[] = [];
                let successfulTerm = '';

                for (const strategy of searchStrategies) {
                    console.log(`Trying strategy "${strategy.source}" with term: "${strategy.term}"`);

                    try {
                        const strategyResults = await medlinePlusService.searchHealthTopics({
                            term: strategy.term,
                            retmax: 5,
                            rettype: 'brief'
                        });

                        console.log(`Strategy "${strategy.source}" returned ${strategyResults.length} results`);

                        if (strategyResults.length > 0) {
                            results = strategyResults;
                            successfulTerm = strategy.term;
                            console.log('✅ Found results! Using:', successfulTerm);
                            break;
                        }
                    } catch (err) {
                        console.error(`Strategy "${strategy.source}" failed:`, err);
                        continue;
                    }
                }

                if (results.length === 0) {
                    console.warn('❌ No results found with any strategy');
                }

                setSearchTerm(successfulTerm || drugName);
                setTopics(results);
            } catch (err) {
                console.error('MedlinePlus fetch error:', err);
                setError('Unable to load health topics at this time.');
            } finally {
                setLoading(false);
            }
        };

        fetchTopics();
    }, [drugName, genericName, indications, category]);

    if (loading) {
        return (
            <div className="glass-card p-6 animate-pulse">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-3">
                    <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
                    <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-6 text-center">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Health Information Currently Unavailable
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    We're having trouble loading health topics right now. Please try again later.
                </p>
            </div>
        );
    }

    if (topics.length === 0) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-start gap-3 mb-4">
                    <Info className="h-5 w-5 text-pharma-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                            No General Health Topics Found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            While we couldn't find general health topics related to this medication, you can find detailed
                            information about <span className="font-medium">{drugName}</span> in the other tabs above, including:
                        </p>
                        <ul className="mt-3 ml-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-pharma-500"></span>
                                Description and mechanism of action
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-pharma-500"></span>
                                Dosage and administration guidelines
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-pharma-500"></span>
                                Side effects and precautions
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-pharma-500"></span>
                                Drug interactions and contraindications
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                        <BookOpen className="h-5 w-5 text-pharma-600" />
                        Related Health Information
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Educational content about {searchTerm}
                    </p>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    Source: NLM MedlinePlus
                </span>
            </div>

            <div className="grid gap-4">
                {topics.map((topic, index) => (
                    <div
                        key={index}
                        className="glass-card p-6 hover:shadow-lg transition-all border-l-4 border-l-pharma-500 group"
                    >
                        <h4 className="font-bold text-lg text-pharma-700 dark:text-pharma-300 mb-3 group-hover:text-pharma-800 dark:group-hover:text-pharma-200 transition-colors">
                            {cleanText(topic.title)}
                        </h4>

                        {topic.altTitle && (
                            <p className="text-xs text-gray-500 mb-4 italic flex items-center gap-1.5">
                                <span className="font-medium">Also known as:</span>
                                <span>{cleanText(topic.altTitle)}</span>
                            </p>
                        )}

                        {topic.snippet && (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                {parseHTMLContent(topic.snippet)}
                            </div>
                        )}

                        {topic.summary && topic.summary !== topic.snippet && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {topic.summary}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="glass-card p-4 bg-pharma-50/50 dark:bg-pharma-900/10 border border-pharma-200 dark:border-pharma-800 mt-6">
                <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-pharma-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong className="text-pharma-700 dark:text-pharma-300">Educational Purpose:</strong> This health information
                        is provided for educational purposes and should not replace professional medical advice. Always consult your
                        healthcare provider for medical advice specific to your condition.
                    </p>
                </div>
            </div>
        </div>
    );
};
