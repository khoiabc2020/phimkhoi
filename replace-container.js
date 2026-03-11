const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;

        // Replace container mx-auto with w-full max-w-[1920px] mx-auto
        content = content.replace(/container mx-auto/g, 'w-full max-w-[1920px] mx-auto');

        // Also expand Header and specific pages
        content = content.replace(/max-w-\[1600px\]/g, 'max-w-[1920px]');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log('Updated', filePath);
        }
    }
});
