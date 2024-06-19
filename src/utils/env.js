export default function env(name) {
  return (
    window?.configs?.[name] ||
    import.meta.env[name] ||
    window?.configs?.[`VITE_${name}`] ||
    import.meta.env[`VITE_${name}`]
  );
}
