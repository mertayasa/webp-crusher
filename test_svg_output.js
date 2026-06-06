import { traceBitmap, getSVG } from '@cadit-app/potrace-ts';

const bitmap = {
  width: 10,
  height: 10,
  data: new Uint8Array(10 * 10).fill(1)
};
const paths = traceBitmap(bitmap);
const svg = getSVG(paths, 1);

console.log(svg);
