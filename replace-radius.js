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
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let original = content;

        content = content.replace(/rounded-3xl/g, 'rounded-2xl');
        content = content.replace(/rounded-2xl/g, 'rounded-xl');
        content = content.replace(/rounded-xl/g, 'rounded-lg');
        content = content.replace(/rounded-\[24px\]/g, 'rounded-[16px]');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log('Updated', filePath);
        }
    }
});
