import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const slug = "nghe-thuat-lua-doi-cua-sarah";
    const movie = await mongoose.connection.db.collection('movies').findOne({ slug });
    console.log("Check Sarah:", movie ? "FOUND" : "NOT FOUND");
    if (movie) {
        console.log("Details:", JSON.stringify({ 
            name: movie.name, 
            thumb: movie.thumb_url, 
            poster: movie.poster_url,
            logoExists: !!movie.logo_url 
        }, null, 2));
    }
    await mongoose.disconnect();
}
main();
