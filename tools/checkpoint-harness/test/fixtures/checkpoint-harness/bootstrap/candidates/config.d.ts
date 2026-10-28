/** A normalised configuration of BOOT §1: the port and the trimmed label. */
export type Config = { port: number; label: string };

/** Thrown for a configuration BOOT §1 rejects; the message names the problem. */
export declare class ConfigError extends Error {
  name: "ConfigError";
}

/** Parses a configuration text into its normalised form, or throws a ConfigError. */
export declare function parseConfig(text: string): Config;
