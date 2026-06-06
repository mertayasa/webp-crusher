import ImageTracer from 'imagetracerjs';

console.log('Presets:', Object.keys(ImageTracer.optionpresets));
const myOptions = { ...ImageTracer.optionpresets['posterized2'], viewbox: true, linefilter: true, blurradius: 5, blurdelta: 20 };
console.log('Options:', myOptions);
