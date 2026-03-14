/**
 * Generates PNG app icons from public/icons/icon.svg using sharp.
 * Run once: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, "..");
const srcSvg    = readFileSync(join(root, "public/icons/icon.svg"));
const outDir    = join(root, "public/icons");

await mkdir(outDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const out = join(outDir, `icon-${size}x${size}.png`);
  await sharp(srcSvg, { density: Math.ceil((size / 512) * 72 * 4) })
    .resize(size, size)
    .png()
    .toFile(out);
  console.log(`  ✓ icon-${size}x${size}.png`);
}

console.log(`\nAll ${sizes.length} icons written to public/icons/`);
