#!/usr/bin/env node
// Rebuild every favicon from the same vector source. Requires sharp.
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

async function build() {
  const root = path.resolve(__dirname, "..");
  const directory = path.join(root, "images/favicon");
  const source = await fs.readFile(path.join(directory, "globe.svg"));
  const icons = [];
  for (const size of [16, 32, 48, 96, 180, 192, 512]) {
    const png = await sharp(source, { density: 1536 })
      .resize(size, size).png().toBuffer();
    const name = size === 180 ? "apple-touch-icon.png"
      : size >= 192 ? `android-chrome-${size}x${size}.png`
      : `favicon-${size}x${size}.png`;
    await fs.writeFile(path.join(directory, name), png);
    if (size <= 96) icons.push({ size, png });
  }

  // ICO directory entries point to embedded PNG images, one per resolution.
  const header = Buffer.alloc(6 + 16 * icons.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icons.length, 4);
  let offset = header.length;
  icons.forEach(({ size, png }, index) => {
    const entry = 6 + index * 16;
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  const ico = Buffer.concat([header, ...icons.map(({ png }) => png)]);
  await fs.writeFile(path.join(root, "favicon.ico"), ico);
  await fs.writeFile(path.join(directory, "favicon.ico"), ico);
  console.log("Rebuilt seven PNG sizes and both ICO files.");
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
