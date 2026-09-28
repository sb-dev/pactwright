// Fixture subject for parser.accepts and parser.rejects (CP99-S01/AC01). Run
// with --permission --allow-fs-read=. --frozen-intrinsics. Before it loads
// the code under test it reads the run's seal and target key from stdin as
// bytes, never as strings, closes stdin and freezes Buffer.prototype, so
// that code can learn neither. It then calls
// parseConfig with the target's input and writes one observation, the value
// returned or the error thrown, marked with the seal. An exit during import,
// or anything the code under test prints, yields no sealed observation.
import { closeSync, readSync, writeSync } from "node:fs";

const write = writeSync;
const stringify = JSON.stringify;
const raw = Buffer.allocUnsafeSlow(512);
let size = 0;
for (let n; (n = readSync(0, raw, size, raw.length - size, null)) > 0;) size += n;
closeSync(0);
const seal = Buffer.allocUnsafeSlow(64);
raw.copy(seal, 0, 0, 64);
const target = raw.subarray(65, size);
const inputs = { valid: '{"name": " demo "}', invalid: '{"name": "  "}' };
const id = Object.keys(inputs).find((c) => {
  const prefix = Buffer.from(`CP99-S01/AC01/${c}/`);
  return target.subarray(0, prefix.length).equals(prefix);
});
raw.fill(0);
if (id === undefined) process.exit(2);
const input = inputs[id];
Object.freeze(Buffer.prototype);

const { parseConfig } = await import("../src/parser.mjs");
let observed;
try {
  observed = { input, returned: parseConfig(input) };
} catch (e) {
  observed = { input, threw: String(e?.message ?? e) };
}
let line;
try {
  line = stringify(observed);
} catch {
  line = stringify({ input, unserializable: true });
}
write(1, "\n");
write(1, seal);
write(1, ` ${line}\n`);
seal.fill(0);
