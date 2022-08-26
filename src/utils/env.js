export default function env(name) {
  return (
    window?.configs?.[name] ||
    process.env[name] ||
    window?.configs?.[`VUE_APP_${name}`] ||
    process.env[`VUE_APP_${name}`]
  );
}
