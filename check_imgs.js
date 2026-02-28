const http = require('http');

http.get('http://18.141.25.244', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const matches = data.match(/<img[^>]+src="([^"]+)"[^\>]*>/g);
        if (matches) {
            matches.filter(m => m.includes('Monarch')).forEach(m => console.log(m));
        } else {
            console.log("No images found");
        }
    });
}).on('error', (err) => {
    console.error(err);
});
