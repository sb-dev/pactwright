// The greeting module of CP95-S01 (HOSTED §1): greets a name that is not
// empty once trimmed as `Hello, <name>!` for the trimmed name, and rejects
// any other name.

export function greet(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed === "") {
    throw new Error("name rejected");
  }
  return `Hello, ${trimmed}!`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const greeting = greet(process.argv[2]);
    console.log(greeting);
    process.exit(0);
  } catch {
    process.exit(1);
  }
}
