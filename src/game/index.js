// Start-up order matters: the modules still reference each other in cycles, carried
// over from the single-file build. Each module's first import is the module that came
// before it in the original file, so importing the last one (core/loop.js) evaluates
// them all in the original top-to-bottom order. Remove the chain once the cycles are gone.
export { boot } from '../core/loop.js';
