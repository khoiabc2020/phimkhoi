const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'assets', 'images', 'logo.png');
const outputPath = path.join(__dirname, 'assets', 'images', 'adaptive-icon.png');

async function createAdaptiveIcon() {
    try {
        console.log('Reading:', inputPath);
        // Resize to 350x350 so it represents ~34% of the 1024x1024 screen.
        // This makes the inner logo look reasonably sized and elegant.
        await sharp(inputPath)
            .resize(350, 350, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .extend({
                top: 337,
                bottom: 337,
                left: 337,
                right: 337,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .toFile(outputPath);

        console.log('Successfully created adaptive-icon.png at:', outputPath);
    } catch (err) {
        console.error('Error creating adaptive icon:', err);
    }
}

createAdaptiveIcon();
