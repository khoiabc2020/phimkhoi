const TMDB_API_KEY = 'dae5842ebb3cb34367b94550aae10cf3';
const TMDB_API_URL = 'https://api.themoviedb.org/3';

const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    return 0;
};

async function run() {
    console.log("Fetching: Pursuit Of Jade (Language vi-VN)");
    const res = await fetch(TMDB_API_URL + '/search/tv?api_key=' + TMDB_API_KEY + '&query=Pursuit%20of%20Jade&language=vi-VN');
    const data = await res.json();
    
    if (!data.results || data.results.length === 0) {
        console.log("No results returned from TMDB.");
        return;
    }

    // Exact logic from tmdb.ts
    const filteredResults = data.results.filter(item => {
        if (!2026 || 2026 < 2010) return true;
        const itemDate = item.first_air_date;
        const itemYear = itemDate ? parseInt(itemDate.substring(0, 4)) : null;
        if (itemYear && itemYear < 2026 - 10) return false;
        return true;
    });

    console.log('Filtered Count:', filteredResults.length);

    const bestMatch = filteredResults.find((item) => {
        const itemYear = item.first_air_date ? parseInt(item.first_air_date.substring(0, 4)) : null;

        const isAsianDrama = true;
        const itemCountries = item.origin_country || [];
        if (isAsianDrama) {
            const hasAsianOrigin = itemCountries.some(c => ["CN", "KR", "JP", "TH", "TW", "HK"].includes(c));
            if (itemCountries.length > 0 && !hasAsianOrigin) {
                console.log("Rejected by Asian Origin Check");
                return false;
            }
        }

        let isMatch = false;

        const originalTitle = item.original_name;
        if (originalTitle && calculateSimilarity('Pursuit Of Jade', originalTitle) >= 0.35) {
            console.log("Matched originalName");
            isMatch = true;
        }

        if (!isMatch && itemYear && Math.abs(itemYear - 2026) > 3) {
            console.log("Failed Year Check");
            return false;
        }

        const localTitle = item.name;
        if (localTitle && calculateSimilarity('Pursuit Of Jade', localTitle) >= 0.5) {
            console.log("Matched cleanQuery with localTitle (Pursuit Of Jade)");
            isMatch = true;
        }
        if (originalTitle && calculateSimilarity('Pursuit Of Jade', originalTitle) >= 0.5) {
            console.log("Matched cleanQuery with originalTitle");
            isMatch = true;
        }

        // With localName injected
        if (localTitle && calculateSimilarity('Trực Ngọc', localTitle) >= 0.5) {
            console.log("Matched cleanQuery with localTitle (Trực Ngọc)");
            isMatch = true;
        }

        if (!isMatch && itemYear === 2026) {
            if ('Pursuit Of Jade' === 'Pursuit Of Jade' && filteredResults.indexOf(item) === 0) {
                console.log("Matched Fallback 3");
                isMatch = true;
            }
        }

        console.log("isMatch Evaluated to:", isMatch);
        return isMatch;
    });

    console.log('Final Best Match:', bestMatch ? bestMatch.name : 'null');
}
run();
