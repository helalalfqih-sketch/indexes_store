import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [referencePath, resultPath, outputDirectory = "artifacts/visual-diff"] =
  process.argv.slice(2);
if (!referencePath || !resultPath) {
  throw new Error(
    "Usage: node scripts/compare-storefront-reference.mjs <reference> <result> [output-dir]",
  );
}

const reference = sharp(referencePath).ensureAlpha();
const result = sharp(resultPath).ensureAlpha();
const [referenceMeta, resultMeta] = await Promise.all([reference.metadata(), result.metadata()]);
if (referenceMeta.width !== resultMeta.width || referenceMeta.height !== resultMeta.height) {
  throw new Error(
    `Image dimensions differ: reference=${referenceMeta.width}x${referenceMeta.height}, result=${resultMeta.width}x${resultMeta.height}`,
  );
}

const width = referenceMeta.width;
const height = referenceMeta.height;
if (!width || !height) throw new Error("Unable to read image dimensions");

const [referencePixels, resultPixels] = await Promise.all([
  reference.raw().toBuffer(),
  result.raw().toBuffer(),
]);
const diffPixels = Buffer.alloc(referencePixels.length);
const halfOpacityResult = Buffer.from(resultPixels);
const cellSize = 32;
const cellColumns = Math.ceil(width / cellSize);
const cellRows = Math.ceil(height / cellSize);
const changedCells = new Uint8Array(cellColumns * cellRows);
let mismatchedPixels = 0;

for (let pixel = 0; pixel < width * height; pixel += 1) {
  const offset = pixel * 4;
  const delta = Math.max(
    Math.abs(referencePixels[offset] - resultPixels[offset]),
    Math.abs(referencePixels[offset + 1] - resultPixels[offset + 1]),
    Math.abs(referencePixels[offset + 2] - resultPixels[offset + 2]),
  );
  const changed = delta > 16;
  if (changed) {
    mismatchedPixels += 1;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    changedCells[Math.floor(y / cellSize) * cellColumns + Math.floor(x / cellSize)] = 1;
  }
  const gray = Math.round(
    (referencePixels[offset] + referencePixels[offset + 1] + referencePixels[offset + 2]) / 3,
  );
  diffPixels[offset] = changed ? 255 : gray;
  diffPixels[offset + 1] = changed ? 32 : gray;
  diffPixels[offset + 2] = changed ? 96 : gray;
  diffPixels[offset + 3] = 255;
  halfOpacityResult[offset + 3] = 128;
}

const visited = new Uint8Array(changedCells.length);
const regions = [];
for (let row = 0; row < cellRows; row += 1) {
  for (let column = 0; column < cellColumns; column += 1) {
    const start = row * cellColumns + column;
    if (!changedCells[start] || visited[start]) continue;
    const queue = [[column, row]];
    visited[start] = 1;
    let minColumn = column;
    let maxColumn = column;
    let minRow = row;
    let maxRow = row;
    let cells = 0;
    while (queue.length) {
      const [currentColumn, currentRow] = queue.pop();
      cells += 1;
      minColumn = Math.min(minColumn, currentColumn);
      maxColumn = Math.max(maxColumn, currentColumn);
      minRow = Math.min(minRow, currentRow);
      maxRow = Math.max(maxRow, currentRow);
      for (const [nextColumn, nextRow] of [
        [currentColumn - 1, currentRow],
        [currentColumn + 1, currentRow],
        [currentColumn, currentRow - 1],
        [currentColumn, currentRow + 1],
      ]) {
        if (nextColumn < 0 || nextRow < 0 || nextColumn >= cellColumns || nextRow >= cellRows)
          continue;
        const next = nextRow * cellColumns + nextColumn;
        if (!changedCells[next] || visited[next]) continue;
        visited[next] = 1;
        queue.push([nextColumn, nextRow]);
      }
    }
    regions.push({
      x: minColumn * cellSize,
      y: minRow * cellSize,
      width: Math.min(width, (maxColumn + 1) * cellSize) - minColumn * cellSize,
      height: Math.min(height, (maxRow + 1) * cellSize) - minRow * cellSize,
      cells,
    });
  }
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  sharp(diffPixels, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(outputDirectory, "pixel-diff.png")),
  sharp(referencePath)
    .composite([
      {
        input: await sharp(halfOpacityResult, { raw: { width, height, channels: 4 } })
          .png()
          .toBuffer(),
        blend: "over",
      },
    ])
    .png()
    .toFile(path.join(outputDirectory, "overlay.png")),
]);

const report = {
  width,
  height,
  mismatchedPixels,
  mismatchPercentage: Number(((mismatchedPixels / (width * height)) * 100).toFixed(4)),
  threshold: 16,
  largestMismatchRegions: regions.sort((a, b) => b.cells - a.cells).slice(0, 8),
};
await writeFile(path.join(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
