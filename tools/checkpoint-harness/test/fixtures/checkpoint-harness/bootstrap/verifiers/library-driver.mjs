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
import { types } from "node:util";
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

// The observer reads candidate values only through reflection on ordinary
// objects, which runs no candidate code: no getter, proxy trap, toJSON or
// Symbol.hasInstance takes part in a fact.
const plain = (o) => o !== null && (typeof o === "object" || typeof o === "function") && !types.isProxy(o);
const data = (o, key) => {
  const d = Reflect.getOwnPropertyDescriptor(o, key);
  return d !== undefined && "value" in d ? d.value : undefined;
};
// The returned configuration: an ordinary object whose only own properties
// are the data properties port (a number) and label (a string). An exotic
// object whose reflection throws is not one.
const configuration = (value) => {
  try {
    if (!plain(value) || typeof value === "function") return null;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 2 || !keys.includes("port") || !keys.includes("label")) return null;
    const port = data(value, "port");
    const label = data(value, "label");
    return typeof port === "number" && typeof label === "string" ? { port, label } : null;
  } catch {
    return null;
  }
};
// A ConfigError: an ordinary object with ConfigError.prototype on its
// prototype chain, and its own message when that is a data property.
const rejection = (error, ConfigError) => {
  try {
    const prototype = plain(ConfigError) ? data(ConfigError, "prototype") : undefined;
    for (let o = error; plain(o); ) {
      o = Reflect.getPrototypeOf(o);
      if (o !== null && o === prototype) {
        const message = data(error, "message");
        return { typed: true, message: typeof message === "string" ? message : null };
      }
    }
  } catch {
    // An exotic value whose reflection throws is not a ConfigError.
  }
  return { typed: false, message: null };
};

let fact = { __proto__: null, returned: null, value: null, error: "the library did not load", message: null };
try {
  const library = load(resolve("src/config.mjs"));
  await library.link(linker);
  await library.evaluate();
  const { parseConfig, ConfigError } = library.namespace;
  if (typeof parseConfig !== "function" || typeof ConfigError !== "function") {
    fact = { __proto__: null, returned: null, value: null, error: "no parseConfig and ConfigError exports", message: null };
  } else {
    // Only the call itself can reject; its result is judged afterwards.
    let outcome;
    try {
      outcome = { returned: true, value: parseConfig(text) };
    } catch (e) {
      outcome = { returned: false, error: e };
    }
    if (outcome.returned) {
      const config = configuration(outcome.value);
      fact = config
        ? { __proto__: null, returned: true, value: JSON.stringify(config), error: null, message: null }
        : { __proto__: null, returned: true, value: null, error: "not a {port, label} configuration", message: null };
    } else {
      const { typed, message } = rejection(outcome.error, ConfigError);
      fact = { __proto__: null, returned: false, value: null, error: typed ? "ConfigError" : "not a ConfigError", message };
    }
  }
} catch {
  // The fact stays: the library did not load, or its code threw on load.
}
writeSync(1, `${JSON.stringify(fact)}\n`);
