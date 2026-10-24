#!/usr/bin/env node
// Build image assets offline; the homepage needs no JavaScript image loader.
// Requires sharp, avifenc, cwebp, and pdftoppm. See docs/homepage-audit.md.
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
  }
}

async function optimize() {
  run("avifenc", ["--version"]);
  run("cwebp", ["-version"]);
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "homepage-images-"));
  const outputs = [];

  async function stage(relative, build) {
    const output = path.join(temporary, relative.replace(/[\\/]/g, "-"));
    await build(output);
    outputs.push({ relative, output, bytes: (await fs.stat(output)).size });
  }

  try {
    for (const width of [240, 480, 720]) {
      const input = path.join(temporary, `portrait-${width}.png`);
      // Resize from the original, never from the lossy WebP fallback.
      await sharp(path.join(root, "images/yzhu.png"))
        .resize({ width })
        .png()
        .toFile(input);
      await stage(`images/yzhu-${width}.avif`, async (output) => {
        run("avifenc", [
          "-q", "70", "--qalpha", "100", "-y", "444", "-s", "2", "-j", "4",
          "--ignore-exif", "--ignore-xmp", input, output,
        ]);
      });
    }

    for (const width of [480, 768]) {
      const input = path.join(temporary, `hyperset-${width}.png`);
      await sharp(path.join(root, "data/iclr2026/teaser.png"))
        .resize({ width })
        .png()
        .toFile(input);
      await stage(`data/iclr2026/teaser-${width}.webp`, async (output) => {
        run("cwebp", ["-lossless", "-z", "9", "-exact", input, "-o", output]);
      });
    }

    for (const directory of ["data/iclr2026", "data/neurips2024"]) {
      const input = path.join(root, directory, "teaser.png");
      await stage(`${directory}/teaser.webp`, async (output) => {
        run("cwebp", ["-lossless", "-z", "9", "-exact", input, "-o", output]);
      });
    }

    const vpflowPrefix = path.join(temporary, "vpflow");
    run("pdftoppm", [
      "-png", "-singlefile", "-scale-to-x", "2400", "-scale-to-y", "-1",
      path.join(root, "data/arxiv/value-equivalence-crop.pdf"), vpflowPrefix,
    ]);
    for (const width of [480, 768, 2400]) {
      const input = path.join(temporary, `vpflow-${width}.png`);
      await sharp(`${vpflowPrefix}.png`).resize({ width }).png().toFile(input);
      const suffix = width === 2400 ? "" : `-${width}`;
      await stage(`data/arxiv/value-equivalence${suffix}.webp`, async (output) => {
        run("cwebp", ["-lossless", "-z", "9", "-exact", input, "-o", output]);
      });
    }

    // Publish the generated assets only after all encoders succeed.
    for (const { relative, output, bytes } of outputs) {
      await fs.copyFile(output, path.join(root, relative));
      console.log(`${relative}: ${bytes.toLocaleString("en-US")} bytes`);
    }
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
}

optimize().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
