const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  console.log('Fetching Archivo Black font...');
  const archivoRes = await fetch('https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6OYs.ttf');
  const archivoB64 = Buffer.from(await archivoRes.arrayBuffer()).toString('base64');

  console.log('Fetching JetBrains Mono Bold font...');
  const monoRes = await fetch('https://fonts.gstatic.com/s/jetbrainsmono/v23/tDbY2o-flEEny0FZhsfKu5WU4zr3E_ab0VDUGRl9Bg.ttf');
  const monoB64 = Buffer.from(await monoRes.arrayBuffer()).toString('base64');

  // Let's create variants:
  // 1. Logo with Circularity tag (Header style) with transparent background
  // 2. Logo with Circularity tag with website purple background (#8584BD)
  // 3. Yellow Badge only "REUSEHUB" transparent background
  // 4. Yellow Badge only with website purple background
  // 5. Square icon / avatar version for social media / favicon

  // Variant 1: Full Header Logo (Yellow Badge "REUSEHUB" + Pill "CIRCULARITY")
  // Let's craft exact dimensions:
  // Badge: rounded rect 12px, border 4px #1A1A1A, fill #F4ED36, shadow offset 5px 5px #1A1A1A
  // Text: "REUSE" in #1A1A1A, "HUB" in #C94245
  // Pill: black #1A1A1A, rounded 9999px, text "CIRCULARITY" in #F9F5F2

  const createSvgHeader = (bg = 'none') => `
<svg width="1200" height="320" viewBox="0 0 1200 320" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Archivo Black';
        src: url('data:font/truetype;charset=utf-8;base64,${archivoB64}') format('truetype');
      }
      @font-face {
        font-family: 'JetBrains Mono';
        font-weight: 700;
        src: url('data:font/truetype;charset=utf-8;base64,${monoB64}') format('truetype');
      }
      .brand-title {
        font-family: 'Archivo Black', sans-serif;
        font-size: 82px;
        letter-spacing: -1.5px;
      }
      .pill-text {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        font-size: 34px;
        letter-spacing: 3.5px;
        fill: #F9F5F2;
      }
    </style>
  </defs>
  ${bg !== 'none' ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}

  <g transform="translate(40, 50)">
    <!-- Shadow for Badge -->
    <rect x="10" y="10" width="670" height="180" rx="20" fill="#1A1A1A" />
    
    <!-- Yellow Badge -->
    <rect x="0" y="0" width="670" height="180" rx="20" fill="#F4ED36" stroke="#1A1A1A" stroke-width="8" stroke-linejoin="round" />

    <!-- Text inside badge -->
    <text x="50" y="126" class="brand-title">
      <tspan fill="#1A1A1A">REUSE</tspan><tspan fill="#C94245">HUB</tspan>
    </text>

    <!-- Circularity Pill -->
    <g transform="translate(720, 48)">
      <rect x="0" y="0" width="380" height="84" rx="42" fill="#1A1A1A" />
      <text x="190" y="55" class="pill-text" text-anchor="middle">CIRCULARITY</text>
    </g>
  </g>
</svg>
`;

  // Variant 2: Badge Only ("REUSEHUB" in Yellow Box)
  const createSvgBadgeOnly = (bg = 'none') => `
<svg width="800" height="300" viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Archivo Black';
        src: url('data:font/truetype;charset=utf-8;base64,${archivoB64}') format('truetype');
      }
      .brand-title {
        font-family: 'Archivo Black', sans-serif;
        font-size: 88px;
        letter-spacing: -1.5px;
      }
    </style>
  </defs>
  ${bg !== 'none' ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}

  <g transform="translate(45, 45)">
    <!-- Shadow for Badge -->
    <rect x="12" y="12" width="700" height="190" rx="22" fill="#1A1A1A" />
    
    <!-- Yellow Badge -->
    <rect x="0" y="0" width="700" height="190" rx="22" fill="#F4ED36" stroke="#1A1A1A" stroke-width="9" stroke-linejoin="round" />

    <!-- Text inside badge -->
    <text x="350" y="132" class="brand-title" text-anchor="middle">
      <tspan fill="#1A1A1A">REUSE</tspan><tspan fill="#C94245">HUB</tspan>
    </text>
  </g>
</svg>
`;

  // Variant 3: Square App / Avatar Icon (512x512)
  const createSvgSquare = (bg = '#8584BD') => `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Archivo Black';
        src: url('data:font/truetype;charset=utf-8;base64,${archivoB64}') format('truetype');
      }
      @font-face {
        font-family: 'JetBrains Mono';
        font-weight: 700;
        src: url('data:font/truetype;charset=utf-8;base64,${monoB64}') format('truetype');
      }
      .brand-title {
        font-family: 'Archivo Black', sans-serif;
        font-size: 60px;
        letter-spacing: -1px;
      }
      .pill-text {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        font-size: 20px;
        letter-spacing: 2px;
        fill: #F9F5F2;
      }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${bg}" rx="64"/>

  <!-- Recycle symbol or Badge centered -->
  <g transform="translate(36, 130)">
    <!-- Shadow for Badge -->
    <rect x="10" y="10" width="440" height="150" rx="18" fill="#1A1A1A" />
    
    <!-- Yellow Badge -->
    <rect x="0" y="0" width="440" height="150" rx="18" fill="#F4ED36" stroke="#1A1A1A" stroke-width="7" stroke-linejoin="round" />

    <!-- Text inside badge -->
    <text x="220" y="105" class="brand-title" text-anchor="middle">
      <tspan fill="#1A1A1A">REUSE</tspan><tspan fill="#C94245">HUB</tspan>
    </text>
  </g>

  <!-- Circularity Pill below badge -->
  <g transform="translate(136, 320)">
    <rect x="0" y="0" width="240" height="56" rx="28" fill="#1A1A1A" />
    <text x="120" y="37" class="pill-text" text-anchor="middle">CIRCULARITY</text>
  </g>
</svg>
`;

  const outputDir = path.join(__dirname, '..', 'public', 'brand');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const rootDir = path.join(__dirname, '..');

  console.log('Rendering and saving logo files...');

  // 1. Full header logo (transparent PNG)
  const fullTransparentSvg = createSvgHeader('none');
  await sharp(Buffer.from(fullTransparentSvg)).png().toFile(path.join(outputDir, 'reusehub-logo.png'));
  await sharp(Buffer.from(fullTransparentSvg)).png().toFile(path.join(rootDir, 'reusehub-logo.png'));

  // 2. Full header logo with website purple background (#8584BD) (PNG & JPG)
  const fullPurpleSvg = createSvgHeader('#8584BD');
  await sharp(Buffer.from(fullPurpleSvg)).png().toFile(path.join(outputDir, 'reusehub-logo-header-bg.png'));
  await sharp(Buffer.from(fullPurpleSvg)).png().toFile(path.join(rootDir, 'reusehub-logo-header-bg.png'));
  await sharp(Buffer.from(fullPurpleSvg)).jpeg({ quality: 95 }).toFile(path.join(outputDir, 'reusehub-logo.jpg'));
  await sharp(Buffer.from(fullPurpleSvg)).jpeg({ quality: 95 }).toFile(path.join(rootDir, 'reusehub-logo.jpg'));

  // 3. Full header logo on white background (JPG)
  const fullWhiteSvg = createSvgHeader('#FFFFFF');
  await sharp(Buffer.from(fullWhiteSvg)).jpeg({ quality: 95 }).toFile(path.join(outputDir, 'reusehub-logo-white-bg.jpg'));
  await sharp(Buffer.from(fullWhiteSvg)).jpeg({ quality: 95 }).toFile(path.join(rootDir, 'reusehub-logo-white-bg.jpg'));

  // 4. Badge only (Yellow badge "REUSEHUB") transparent PNG & white/purple JPG
  const badgeTransparentSvg = createSvgBadgeOnly('none');
  await sharp(Buffer.from(badgeTransparentSvg)).png().toFile(path.join(outputDir, 'reusehub-badge.png'));
  await sharp(Buffer.from(badgeTransparentSvg)).png().toFile(path.join(rootDir, 'reusehub-badge.png'));

  const badgePurpleSvg = createSvgBadgeOnly('#8584BD');
  await sharp(Buffer.from(badgePurpleSvg)).jpeg({ quality: 95 }).toFile(path.join(outputDir, 'reusehub-badge.jpg'));
  await sharp(Buffer.from(badgePurpleSvg)).jpeg({ quality: 95 }).toFile(path.join(rootDir, 'reusehub-badge.jpg'));

  // 5. Square app / social icon (PNG & JPG)
  const squareSvg = createSvgSquare('#8584BD');
  await sharp(Buffer.from(squareSvg)).png().toFile(path.join(outputDir, 'reusehub-icon.png'));
  await sharp(Buffer.from(squareSvg)).png().toFile(path.join(rootDir, 'reusehub-icon.png'));
  await sharp(Buffer.from(squareSvg)).jpeg({ quality: 95 }).toFile(path.join(outputDir, 'reusehub-icon.jpg'));
  await sharp(Buffer.from(squareSvg)).jpeg({ quality: 95 }).toFile(path.join(rootDir, 'reusehub-icon.jpg'));

  // Save SVGs as well for reference
  fs.writeFileSync(path.join(outputDir, 'reusehub-logo.svg'), fullTransparentSvg);
  fs.writeFileSync(path.join(rootDir, 'reusehub-logo.svg'), fullTransparentSvg);

  console.log('All logo variants successfully generated in PNG, JPG, and SVG formats!');
}

main().catch(err => {
  console.error('Error generating logos:', err);
  process.exit(1);
});
