import { getMovieDetail } from './src/services/api.js';

const HERO_SLUGS = [
    "nghe-thuat-lua-doi-cua-sarah",
    "khi-cuoc-doi-cho-ban-qua-quyt",
    "tieng-yeu-nay-anh-dich-duoc-khong",
    "ban-trai-theo-yeu-cau",
    "trao-em-ca-vu-tru"
];

async function checkMovies() {
    console.log("Checking Hero Movies Data...");
    for (const slug of HERO_SLUGS) {
        try {
            const data = await getMovieDetail(slug);
            if (data?.movie) {
                console.log(`[OK] ${slug}: "${data.movie.name}" - ${data.movie.episode_current} - Content length: ${data.movie.content?.length || 0}`);
            } else {
                console.log(`[MISSING] ${slug}: No movie data found.`);
            }
        } catch (e) {
            console.log(`[ERROR] ${slug}:`, e.message);
        }
    }
}

checkMovies();
