// Fixture driver for library-subject.mjs (CP97-S01). It runs in the child
// process the subject starts, under Node's permission model, reading only
// `src/` and itself. Before any candidate code runs, it reads the subject's
// one-time nonce and the case input from stdin and keeps the functions it
// reports with. The candidate's module graph under `src/` then runs in its own
// V8 realm: no `process`, no built-in modules, no timers, no output, and no
// access to this realm's objects or prototypes. The driver reports what it
// observed as primitives on one line that starts with the nonce; the subject
// and judge decide.
import { readFileSync, writeSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

const write = writeSync;
const stringify = JSON.stringify;
const exit = process.exit.bind(process);
const input = readFileSync(0, "utf8");
const newline = input.indexOf("\n");
const nonce = input.slice(0, newline);
const text = input.slice(newline + 1);

const root = resolve("src");
const context = vm.createContext(vm.constants.DONT_CONTEXTIFY);
const modules = new Map();
const load = (path) => {
  let module = modules.get(path);
  if (!module) {
    const source = readFileSync(path, "utf8");
    module = new vm.SourceTextModule(source, { identifier: pathToFileURL(path).href, context });
    modules.set(path, module);
  }
  return module;
};
// Only modules under src/ link; a built-in or outside module fails the load.
const linker = (specifier, referencing) => {
  const path = resolve(dirname(fileURLToPath(referencing.identifier)), specifier);
  if (!/^\.\.?\//.test(specifier) || !path.startsWith(root + sep)) {
    throw new Error(`${specifier}: only modules under src/ can be imported`);
  }
  return load(path);
};

// Facts are null-prototype objects of primitives, so no inherited or
// candidate-realm toJSON takes part in the report.
let fact = { __proto__: null, returned: null, value: null, error: "the library did not load", message: null };
try {
  const library = load(resolve("src/config.mjs"));
  await library.link(linker);
  await library.evaluate();
  const { parseConfig, ConfigError } = library.namespace;
  if (typeof parseConfig !== "function" || typeof ConfigError !== "function") {
    fact = { __proto__: null, returned: null, value: null, error: "no parseConfig and ConfigError exports", message: null };
  } else {
    try {
      const value = stringify(parseConfig(text));
      fact = { __proto__: null, returned: true, value: typeof value === "string" ? value : null, error: null, message: null };
    } catch (e) {
      const typed = e instanceof ConfigError;
      const message = typed && typeof e.message === "string" ? `${e.message}` : null;
      fact = { __proto__: null, returned: false, value: null, error: typed ? "ConfigError" : "not a ConfigError", message };
    }
  }
} catch {
  // The fact stays: the library did not load, or its code threw on load.
}
write(1, `${nonce} ${stringify(fact)}\n`);
exit(0);
