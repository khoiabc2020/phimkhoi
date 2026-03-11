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

        // Horizontal scroll items
        content = content.replace(/min-w-\[130px\] md:min-w-\[150px\]/g, 'min-w-[150px] sm:min-w-[170px] md:min-w-[190px] xl:min-w-[230px]');
        content = content.replace(/min-w-\[130px\]/g, 'min-w-[150px]');

        // Responsive Grids (changing 6 to 5 columns on xl to make cards larger)
        content = content.replace(/xl:grid-cols-6/g, 'xl:grid-cols-5');
        content = content.replace(/2xl:grid-cols-8/g, '2xl:grid-cols-6');
        content = content.replace(/lg:grid-cols-5/g, 'lg:grid-cols-4');

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log('Updated', filePath);
        }
    }
});
