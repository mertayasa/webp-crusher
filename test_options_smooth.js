import ImageTracer from 'imagetracerjs';

// Get a smooth tracing preset
const options = {
  corsenabled: false,
  ltres: 0.1,         // lower = tighter fit, but if we want smooth we want higher? 
  qtres: 0.1,         // lower = tighter fit to pixels.
  pathomit: 8,
  rightangleenhance: false,
  colorsampling: 0,
  numberofcolors: 2,
  mincolorratio: 0,
  colorquantcycles: 3,
  layering: 0,
  strokewidth: 0,
  linefilter: true,
  scale: 1,
  roundcoords: 2,
  viewbox: true,
  desc: false,
  blurradius: 0,      // blurring creates multiple layers of gray which makes edges jagged!
  blurdelta: 0,
};

console.log(options);
