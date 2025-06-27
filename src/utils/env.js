export default function env(name) {
  return (
    process.env?.[name] || window?.configs?.[name] || import.meta.env[name]
  );
}
