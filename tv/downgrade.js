const fs = require('fs');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Downgrade dependencies
packageJson.dependencies['nativewind'] = '^2.0.11';
packageJson.dependencies['tailwindcss'] = '3.3.2';

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('Downgraded package.json');
