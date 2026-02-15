const TMDB_API_KEY = "dae5842ebb3cb34367b94550aae10cf3";
const TMDB_API_URL = "https://api.themoviedb.org/3";

// Helper to calculate Levenshtein distance for string similarity
const levenshtein = (a, b) => {
    const matrix = [];
    let i, j;
    for (i = 0; i <= b.length; i++) matrix[i] = [i];
    for (j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const isTitleMatch = (t1, t2) => {
    if (!t1 || !t2) return false;
    const clean1 = t1.toLowerCase().replace(/[^a-z0-9]/g, "");
    const clean2 = t2.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    const dist = levenshtein(clean1, clean2);
    // console.log(`Comparing "${t1}" vs "${t2}": Dist=${dist}, Threshold=${Math.max(clean1.length, clean2.length) * 0.3}`);
    return dist <= Math.max(clean1.length, clean2.length) * 0.3; // Allow 30% difference
};

const getLanguageFromCountry = (countrySlug) => {
    if (!countrySlug) return [];
    if (countrySlug.includes('han-quoc')) return ['ko'];
    if (countrySlug.includes('trung-quoc') || countrySlug.includes('hong-kong') || countrySlug.includes('dai-loan')) return ['zh', 'cn', 'bo'];
    if (countrySlug.includes('nhat-ban')) return ['ja'];
    if (countrySlug.includes('au-my') || countrySlug.includes('anh') || countrySlug.includes('my')) return ['en'];
    if (countrySlug.includes('thai-lan')) return ['th'];
    if (countrySlug.includes('an-do')) return ['hi'];
    if (countrySlug.includes('viet-nam')) return ['vi'];
    return [];
};

const searchTMDBMovie = async (query, year, type = 'movie', verification) => {
    console.log(`\n--- Searching: "${query}" (${year}) [${type}] ---`);
    console.log("Verification:", verification);

    const cleanQueryString = (q) => q.replace(/Vietsub|Thuyết Minh|Lồng Tiếng|Tập \d+/gi, "").replace(/\s+/g, " ").trim();
    const cleanQuery = cleanQueryString(query);
    const endpoints = type === 'tv' ? ['tv', 'movie'] : ['movie', 'tv'];

    for (const endpoint of endpoints) {
        let url = `${TMDB_API_URL}/search/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQuery)}&language=vi-VN`;

        if (year) {
            if (endpoint === 'movie') url += `&primary_release_year=${year}`;
            if (endpoint === 'tv') url += `&first_air_date_year=${year}`;
        }

        console.log(`Fetching: ${url}`);
        let res = await fetch(url);
        let data = await res.json();

        if (data.results?.length > 0) {
            console.log(`Found ${data.results.length} results in /${endpoint}:`);
            for (const result of data.results) {
                let score = 0;
                let logs = [];

                // 1. Year Check
                const resultYear = endpoint === 'movie'
                    ? (result.release_date ? parseInt(result.release_date.substring(0, 4)) : null)
                    : (result.first_air_date ? parseInt(result.first_air_date.substring(0, 4)) : null);

                if (year && resultYear) {
                    if (Math.abs(resultYear - year) <= 1) { score += 2; logs.push("Year Match (+2)"); }
                    else if (Math.abs(resultYear - year) <= 3) { score += 0.5; logs.push("Year Close (+0.5)"); }
                    else { logs.push("Year Mismatch"); }
                }

                // 2. Name Match
                const titleMatch = isTitleMatch(query, result.title || result.name);
                const originalMatch = verification?.originalName
                    ? isTitleMatch(verification.originalName, result.original_title || result.original_name)
                    : false;

                if (titleMatch) { score += 2; logs.push("Title Match (+2)"); }
                if (originalMatch) { score += 3; logs.push("Original Title Match (+3)"); }

                // 3. Country/Language Check
                if (verification?.countrySlug) {
                    const expectedLangs = getLanguageFromCountry(verification.countrySlug);
                    if (expectedLangs.length > 0 && result.original_language) {
                        if (expectedLangs.includes(result.original_language)) { score += 2; logs.push(`Lang Match (${result.original_language}) (+2)`); }
                        else { score -= 1; logs.push(`Lang Mismatch (${result.original_language} vs ${expectedLangs}) (-1)`); }
                    }
                }

                console.log(`  - [${result.id}] ${result.title || result.name} (${resultYear}) / Orig: ${result.original_title || result.original_name} / Lang: ${result.original_language}`);
                console.log(`    Score: ${score}. Logs: ${logs.join(", ")}`);

                if (score >= 3) {
                    console.log("    => MATCH FOUND!");
                    return { ...result, media_type: endpoint };
                }
            }
        } else {
            console.log(`No results in /${endpoint}`);
        }
    }
    console.log("=> NO MATCH FOUND.");
    return null;
};

// 1. Test "Huyền Giới Chi Môn" (Fails often)
searchTMDBMovie("Huyền Giới Chi Môn", 2025, "tv", {
    originalName: "The Gate Of Mystical Realm",
    countrySlug: "trung-quoc"
}).then(res => console.log("Result 1:", res ? res.name : "NULL"));

// 2. Test "Người Tình Ánh Trăng" (Should work)
searchTMDBMovie("Người Tình Ánh Trăng", 2016, "tv", {
    originalName: "Moon Lovers: Scarlet Heart Ryeo",
    countrySlug: "han-quoc"
}).then(res => console.log("Result 2:", res ? res.name : "NULL"));
