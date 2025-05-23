/* eslint-env node */
import fs from 'node:fs';
import sharp from 'sharp';

const icon = Buffer.from(fs.readFileSync('src/icon/icon.svg', 'utf8'));
const jobs = [16, 24, 32, 48, 96].map((s) => sharp(icon).png().resize(s).toFile(`public/icon/${s}.png`));
const padding = 8;
jobs.push(
  sharp(icon)
    .resize(128 - 2 * padding)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: {r: 255, g: 255, b: 255, alpha: 0},
    })
    .png()
    .toFile('public/icon/128.png')
);

Promise.all(jobs)
  .then(() => console.log('done'))
  .catch((err) => console.error('errors:', err));
