const fs = require('fs');
let content;
try {
    content = fs.readFileSync('eslint-report.json', 'utf16le');
} catch (e) {
    content = fs.readFileSync('eslint-report.json', 'utf8');
}
// Strip BOM if present
if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
}
const report = JSON.parse(content);
let count = 0;
report.forEach(file => {
    const errors = file.messages.filter(m => m.severity === 2);
    if (errors.length) {
        console.log(file.filePath);
        errors.forEach(e => {
            console.log('  Line ' + e.line + ' ' + e.ruleId + ': ' + e.message);
            count++;
        });
    }
});
console.log('Total errors:', count);
