// Fixture driver for library-subject.mjs (CP97-S01): the trusted observer of
// the candidate library. It loads the candidate's `src/config.mjs` and its
// imports in a V8 realm of their own, linked only to modules under `src/`.
// Candidate code there has no `process`, built-in modules, timers or output,
// and no reference to this realm's objects, so it cannot read this process's
// memory, write output or change the observation. The driver forms the fact
// from what it observes, as primitives, and prints it as its only output.
import { readFileSync, writeSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";

const text = readFileSync(0, "utf8");
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

// Facts are null-prototype objects of primitives, so no candidate toJSON
// takes part in the report.
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
      const value = JSON.stringify(parseConfig(text));
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
writeSync(1, `${JSON.stringify(fact)}\n`);
