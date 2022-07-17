exports.toTitleCase = function toTitleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

exports.getRanges = function getRanges(length, step) {
  const ranges = [];
  if (step > length) {
    throw 'step must be less than length';
  }
  else {
    for (let i = 0; i < length; i += step) {
      let max = i + step - 1
      if (max > length - 1) {
        max = length - 1;
      }
      ranges.push([i, max]);
    }
  }
  return ranges;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
exports.sleep = sleep;
