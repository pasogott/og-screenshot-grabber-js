/**
 * Add metadata footer to screenshot images
 */
import sharp from 'sharp';
import { createCanvas } from 'canvas';
import { readFile, writeFile, unlink } from 'fs/promises';

const FOOTER_HEIGHT = 90;
const BG_COLOR = '#F5F5F5';
const TEXT_COLOR = '#000000';
const SECONDARY_COLOR = '#3C3C3C';
const LINE_COLOR = '#DCDCDC';

/**
 * Add footer with metadata to an image
 */
export async function addFooterWithMetadata(
  imagePath: string,
  url: string,
  utcTime: string
): Promise<void> {
  // Load image metadata
  const img = sharp(imagePath);
  const metadata = await img.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 630;

  // Create footer canvas
  const canvas = createCanvas(width, FOOTER_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, FOOTER_HEIGHT);

  // Top border line
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.stroke();

  // Main text (timestamp)
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '24px Arial';
  ctx.fillText(`Captured: ${utcTime}`, 20, 35);

  // Secondary text (URL)
  ctx.fillStyle = SECONDARY_COLOR;
  ctx.font = '20px Arial';
  const urlText = url.length > 180 ? url.slice(0, 177) + '...' : url;
  ctx.fillText(`URL: ${urlText}`, 20, 65);

  // Convert canvas to buffer
  const footerBuffer = canvas.toBuffer('image/png');

  // Composite images
  const tempPath = `${imagePath}.tmp`;
  
  await img
    .extend({
      bottom: FOOTER_HEIGHT,
      background: BG_COLOR,
    })
    .composite([
      {
        input: footerBuffer,
        top: height,
        left: 0,
      },
    ])
    .toFile(tempPath);

  // Replace original
  await unlink(imagePath);
  await writeFile(imagePath, await readFile(tempPath));
  await unlink(tempPath);
}
