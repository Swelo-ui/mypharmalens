// Test script for debugging MedlinePlus API
async function testAPI() {
    const testTerms = [
        'Anemia',
        'Iron deficiency',
        'High Blood Pressure',
        'Pain',
        'Diabetes',
        'Heart Disease',
        'Neuropathy'
    ];

    console.log('Testing MedlinePlus API with various terms...\n');

    for (const term of testTerms) {
        const url = `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encodeURIComponent(term)}&rettype=brief&retmax=3`;

        try {
            console.log(`\n=== Testing: "${term}" ===`);
            console.log(`URL: ${url}`);

            const response = await fetch(url);
            const xmlText = await response.text();

            // Count documents
            const docMatches = xmlText.match(/<document/g);
            const count = docMatches ? docMatches.length : 0;

            console.log(`Status: ${response.status}`);
            console.log(`Results: ${count} documents found`);

            if (count > 0) {
                // Extract first title
                const titleMatch = xmlText.match(/<content name="title">([^<]+)<\/content>/);
                if (titleMatch) {
                    console.log(`First title: "${titleMatch[1]}"`);
                }
            }

        } catch (error) {
            console.error(`Error for "${term}":`, error.message);
        }
    }
}

testAPI();
