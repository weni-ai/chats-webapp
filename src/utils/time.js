export function asyncTimeout(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
