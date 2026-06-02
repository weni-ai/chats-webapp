export function asyncTimeout(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export function parseSecondsToMinutes(seconds) {
  return parseInt(seconds) / 60;
}

export function parseMinutesToSeconds(minutes) {
  return parseInt(minutes) * 60;
}
