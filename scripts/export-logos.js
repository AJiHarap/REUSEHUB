const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const rootDir = path.resolve(__dirname, '..');
const publicBrandDir = path.join(rootDir, 'public', 'brand');
const tempDir = path.join(rootDir, 'temp_render');

if (!fs.existsSync(publicBrandDir)) {
  fs.mkdirSync(publicBrandDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// HTML generator
function generateHtml({ content, bg = 'transparent', extraCss = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: ${bg};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      font-feature-settings: normal;
    }
    .badge {
      background-color: #F4ED36;
      border: 4px solid #1A1A1A;
      border-radius: 12px;
      padding: 10px 24px 12px 24px;
      box-shadow: 5px 5px 0px #1A1A1A;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .brand-title {
      font-family: 'Archivo Black', sans-serif;
      font-size: 52px;
      line-height: 1;
      letter-spacing: -0.5px;
      text-transform: uppercase;
      color: #1A1A1A;
    }
    .hub {
      color: #C94245;
    }
    .pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #F9F5F2;
      background-color: #1A1A1A;
      padding: 7px 20px 8px 20px;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    ${extraCss}
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

// Templates:
// 1. Full Logo (Badge + Circularity pill)
const fullLogoHtml = generateHtml({
  content: `
    <div style="display: inline-flex; align-items: center; gap: 18px;">
      <div class="badge">
        <span class="brand-title">REUSE<span class="hub">HUB</span></span>
      </div>
      <span class="pill">CIRCULARITY</span>
    </div>
  `
});

// 2. Exact Header Bar (Matching user's screenshot with #8584BD background and border lines)
const headerBarHtml = generateHtml({
  bg: '#8584BD',
  extraCss: `
    body {
      padding: 0 !important;
      width: 800px;
      height: 120px;
      border-top: 3px solid #1A1A1A;
      border-bottom: 3px solid #1A1A1A;
    }
  `,
  content: `
    <div style="display: flex; align-items: center; gap: 16px; padding: 14px 28px; width: 100%;">
      <div class="badge" style="box-shadow: 4px 4px 0px #1A1A1A; padding: 6px 20px 8px 20px;">
        <span class="brand-title" style="font-size: 42px;">REUSE<span class="hub">HUB</span></span>
      </div>
      <span class="pill" style="font-size: 18px; padding: 6px 18px 7px 18px;">CIRCULARITY</span>
    </div>
  `
});

// 3. Badge Only
const badgeOnlyHtml = generateHtml({
  content: `
    <div class="badge">
      <span class="brand-title">REUSE<span class="hub">HUB</span></span>
    </div>
  `
});

// 4. Square App / Profile Icon (512x512)
const squareIconHtml = generateHtml({
  bg: '#8584BD',
  extraCss: `
    body {
      padding: 0 !important;
      width: 512px;
      height: 512px;
    }
    .icon-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 28px;
      width: 100%;
      height: 100%;
    }
  `,
  content: `
    <div class="icon-container">
      <div class="badge" style="padding: 14px 32px 18px 32px; border-width: 5px; box-shadow: 6px 6px 0px #1A1A1A; border-radius: 16px;">
        <span class="brand-title" style="font-size: 64px;">REUSE<span class="hub">HUB</span></span>
      </div>
      <span class="pill" style="font-size: 22px; padding: 8px 26px 10px 26px;">CIRCULARITY</span>
    </div>
  `
});

function captureHtml(htmlContent, tempHtmlName, tempPngName, windowSize = '1200,400', transparent = true) {
  const htmlPath = path.join(tempDir, tempHtmlName);
  const pngPath = path.join(tempDir, tempPngName);
  fs.writeFileSync(htmlPath, htmlContent);

  const args = [
    '--headless=new',
    '--disable-gpu',
    `--window-size=${windowSize}`,
    '--device-scale-factor=2',
    transparent ? '--default-background-color=00000000' : '',
    `--screenshot="${pngPath}"`,
    `"file:///${htmlPath.replace(/\\/g, '/')}"`
  ].filter(Boolean).join(' ');

  execSync(`"${CHROME_PATH}" ${args}`, { stdio: 'pipe' });
  return pngPath;
}

async function processOutputs() {
  console.log('Capturing high-resolution components via Chrome...');

  // Capture Full Logo (transparent)
  const fullPng = captureHtml(fullLogoHtml, 'full.html', 'raw_full.png', '1400,360', true);

  // Capture Header Bar (with purple background)
  const headerPng = captureHtml(headerBarHtml, 'header.html', 'raw_header.png', '800,120', false);

  // Capture Badge Only (transparent)
  const badgePng = captureHtml(badgeOnlyHtml, 'badge.html', 'raw_badge.png', '1000,360', true);

  // Capture Square Icon
  const iconPng = captureHtml(squareIconHtml, 'icon.html', 'raw_icon.png', '512,512', false);

  console.log('Post-processing and optimizing with Sharp...');

  // 1. Full Logo - Trimmed with padding (Transparent PNG)
  const fullTrimmed = await sharp(fullPng)
    .trim()
    .extend({ top: 30, bottom: 30, left: 40, right: 40, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(rootDir, 'reusehub-logo.png'), fullTrimmed);
  fs.writeFileSync(path.join(publicBrandDir, 'reusehub-logo.png'), fullTrimmed);
  fs.writeFileSync(path.join(rootDir, 'reusehub-logo-transparent.png'), fullTrimmed);

  // Full Logo - JPG on Header Purple Background (#8584BD)
  await sharp(fullTrimmed)
    .flatten({ background: '#8584BD' })
    .jpeg({ quality: 95 })
    .toFile(path.join(rootDir, 'reusehub-logo.jpg'));
  await sharp(fullTrimmed)
    .flatten({ background: '#8584BD' })
    .jpeg({ quality: 95 })
    .toFile(path.join(publicBrandDir, 'reusehub-logo.jpg'));

  // Full Logo - JPG on Clean White Background
  await sharp(fullTrimmed)
    .flatten({ background: '#FFFFFF' })
    .jpeg({ quality: 95 })
    .toFile(path.join(rootDir, 'reusehub-logo-white.jpg'));
  await sharp(fullTrimmed)
    .flatten({ background: '#FFFFFF' })
    .jpeg({ quality: 95 })
    .toFile(path.join(publicBrandDir, 'reusehub-logo-white.jpg'));

  // 2. Exact Header Bar (Matching user screenshot)
  const headerBuffer = await sharp(headerPng).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'reusehub-header.png'), headerBuffer);
  fs.writeFileSync(path.join(publicBrandDir, 'reusehub-header.png'), headerBuffer);
  await sharp(headerBuffer)
    .jpeg({ quality: 95 })
    .toFile(path.join(rootDir, 'reusehub-header.jpg'));

  // 3. Badge Only ("REUSEHUB" yellow box)
  const badgeTrimmed = await sharp(badgePng)
    .trim()
    .extend({ top: 24, bottom: 24, left: 30, right: 30, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(rootDir, 'reusehub-badge.png'), badgeTrimmed);
  fs.writeFileSync(path.join(publicBrandDir, 'reusehub-badge.png'), badgeTrimmed);
  await sharp(badgeTrimmed)
    .flatten({ background: '#FFFFFF' })
    .jpeg({ quality: 95 })
    .toFile(path.join(rootDir, 'reusehub-badge.jpg'));
  await sharp(badgeTrimmed)
    .flatten({ background: '#8584BD' })
    .jpeg({ quality: 95 })
    .toFile(path.join(rootDir, 'reusehub-badge-header-bg.jpg'));

  // 4. Square Icon (512x512)
  await sharp(iconPng).png().toFile(path.join(rootDir, 'reusehub-icon.png'));
  await sharp(iconPng).jpeg({ quality: 95 }).toFile(path.join(rootDir, 'reusehub-icon.jpg'));
  await sharp(iconPng).png().toFile(path.join(publicBrandDir, 'reusehub-icon.png'));
  await sharp(iconPng).jpeg({ quality: 95 }).toFile(path.join(publicBrandDir, 'reusehub-icon.jpg'));

  // Clean up temp
  fs.rmSync(tempDir, { recursive: true, force: true });
  const testFiles = ['test_logo.png', 'test_chrome.png'];
  for (const f of testFiles) {
    const p = path.join(rootDir, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log('Successfully generated all logo files in PNG and JPG formats!');
}

processOutputs().catch(console.error);
