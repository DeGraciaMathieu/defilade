/* RNG seedable (LCG) : les règles reçoivent `rng` en argument, seul main décide de la graine. */
export function createRng(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
