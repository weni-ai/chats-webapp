export default function env(name) {
  return window?.configs?.[name];
}
