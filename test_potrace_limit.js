import { init, potrace } from 'esm-potrace-wasm';

async function test() {
  await init();

  // Test different sizes
  const sizes = [100, 200, 500, 800, 1000, 1200, 1500, 2000];

  for (const size of sizes) {
    console.log(`Testing size ${size}x${size} with a simple shape...`);
    const data = new Uint8ClampedArray(size * size * 4);
    
    // Draw a black square in the middle of a white image
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const isBlack = (x > size/4 && x < size*3/4 && y > size/4 && y < size*3/4);
        data[i] = isBlack ? 0 : 255;     // R
        data[i+1] = isBlack ? 0 : 255;   // G
        data[i+2] = isBlack ? 0 : 255;   // B
        data[i+3] = 255;                 // A
      }
    }

    const imageData = {
      data,
      width: size,
      height: size,
      constructor: { name: 'ImageData' }
    };

    try {
      await potrace(imageData, { extractcolors: false });
      console.log(`Size ${size}x${size} succeeded.`);
    } catch (e) {
      console.error(`Size ${size}x${size} failed: ${e.message}`);
      break;
    }
  }
}

test().catch(console.error);
