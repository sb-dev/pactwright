// The greeting module of HOSTED §1 (CP95-S01). Exports `greet(name)`, which
// returns the greeting or throws for a name it rejects. Run as a program
// with a name argument, it prints the greeting and exits 0, or exits 1
// without output for a name it rejects.

export function greet(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed === "") throw new Error("greet: name is blank once trimmed");
  return `Hello, ${trimmed}!`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log(greet(process.argv[2]));
  } catch {
    process.exit(1);
  }
}
