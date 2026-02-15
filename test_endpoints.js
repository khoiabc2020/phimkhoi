const fetch = require('node-fetch');

const endpoints = [
    'https://phimapi.com/v1/api/danh-sach/phim-bo-hoan-thanh',
    'https://phimapi.com/v1/api/danh-sach/phim-sap-chieu',
    'https://phimapi.com/v1/api/the-loai/phim-chieu-rap'
];

async function test() {
    for (const url of endpoints) {
        try {
            const res = await fetch(url);
            const data = await res.json();
            console.log(`${url}: Status ${res.status}, Items: ${data?.data?.items?.length || data?.items?.length || 0}`);
        } catch (e) {
            console.log(`${url}: Error ${e.message}`);
        }
    }
}

test();
