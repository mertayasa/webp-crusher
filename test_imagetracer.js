import ImageTracer from 'imagetracerjs';

async function test() {
  const size = 200;
  console.log(`Testing size ${size}x${size}...`);
  const data = new Uint8ClampedArray(size * size * 4);
  // Fill with random noise
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 255;

  const imageData = {
    data,
    width: size,
    height: size,
    constructor: { name: 'ImageData' }
  };

  try {
    const start = Date.now();
    const svgString = ImageTracer.imagedataToSVG(imageData, { corsenabled: false });
    console.log(`Size ${size}x${size} succeeded in ${Date.now() - start}ms.`);
    console.log(svgString.substring(0, 100));
  } catch (e) {
    console.error(`Size ${size}x${size} failed: ${e.message}`);
  }
}

test().catch(console.error);
