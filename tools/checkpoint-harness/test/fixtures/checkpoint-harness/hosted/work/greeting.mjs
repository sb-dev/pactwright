// The greeting module of HOSTED §1 (CP95-S01). Exports `greet(name)`, which
// returns `Hello, <name>!` for the trimmed name, or throws for a name that is
// empty once trimmed. Run as a program with a name argument, it prints the
// greeting and exits 0, or exits 1 without output for a name it rejects.

export function greet(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed === "") {
    throw new Error("greet: name is empty once trimmed");
  }
  return `Hello, ${trimmed}!`;
}

function isMain() {
  const invoked = process.argv[1];
  return invoked && import.meta.url === new URL(invoked, "file://").href;
}

if (isMain()) {
  const [, , name] = process.argv;
  try {
    console.log(greet(name));
    process.exit(0);
  } catch {
    process.exit(1);
  }
}
