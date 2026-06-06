import ImageTracer from 'imagetracerjs';
import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function test() {
  const img = await loadImage('./public/image-slayer-artwork.webp');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  const optionsLow = {
    corsenabled: false,
    ltres: 0.1,
    qtres: 0.1,
    pathomit: 8,
    rightangleenhance: false,
    colorsampling: 0,
    numberofcolors: 2,
    pal: [{r:0,g:0,b:0,a:255}, {r:255,g:255,b:255,a:255}],
    linefilter: true,
    scale: 1,
    roundcoords: 2,
    viewbox: true,
  };

  const optionsHigh = {
    ...optionsLow,
    ltres: 5,
    qtres: 5,
  };

  const svgLow = ImageTracer.imagedataToSVG(imageData, optionsLow);
  const svgHigh = ImageTracer.imagedataToSVG(imageData, optionsHigh);

  fs.writeFileSync('test_low.svg', svgLow);
  fs.writeFileSync('test_high.svg', svgHigh);
  console.log('Done!');
}

test().catch(console.error);
