// The configuration library of BOOT §1: a known-good CP97-S01 submission for
// scripted producers.
export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
}

const FIELDS = ["port", "label"];

/** Parses a configuration text into its normalised form, or throws a ConfigError. */
export function parseConfig(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch (e) {
    throw new ConfigError(`malformed JSON: ${e.message}`);
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ConfigError("the configuration is not a JSON object");
  }
  const unknown = Object.keys(value).filter((k) => !FIELDS.includes(k));
  if (unknown.length > 0) throw new ConfigError(`unknown field: ${unknown.join(", ")}`);
  const { port, label } = value;
  if (!Number.isInteger(port)) throw new ConfigError("port: expected an integer");
  if (port < 1 || port > 65535) throw new ConfigError(`port: ${port} is outside 1 through 65535`);
  if (typeof label !== "string") throw new ConfigError("label: expected a string");
  const trimmed = label.trim();
  if (trimmed === "") throw new ConfigError("label: empty once trimmed");
  return { port, label: trimmed };
}
