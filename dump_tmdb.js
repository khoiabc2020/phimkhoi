const fs = require('fs');
async function run() {
    try {
        const res = await fetch('https://api.themoviedb.org/3/search/tv?api_key=dae5842ebb3cb34367b94550aae10cf3&query=Pursuit%20of%20Jade&language=vi-VN');
        const data = await res.json();
        fs.writeFileSync('tmdb_dump.json', JSON.stringify(data.results[0], null, 2));
        console.log('Dumped to tmdb_dump.json');
    } catch (e) {
        console.error(e);
    }
}
run();
