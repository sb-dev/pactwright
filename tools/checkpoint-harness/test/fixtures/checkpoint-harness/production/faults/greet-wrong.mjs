// CP96 Step 1: the greeting of PROD §1.
export function greet(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed === "") throw new Error("name must not be blank");
  return `Hi, ${trimmed}.`;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    console.log(greet(process.argv[2]));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
