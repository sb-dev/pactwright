# Bootstrap fixture specification

The authority of the T3-F bootstrap fixture, checkpoint CP97. It defines a
configuration library and a command that uses it. It is not a Pactwright
specification and grants no Checkpoint 1 acceptance.

## 1. Configuration library

A configuration is a JSON object with exactly two fields:

- `port`, an integer from 1 through 65535;
- `label`, a string that is not empty once trimmed.

The library parses a configuration text. For a valid configuration it returns
the normalised configuration: the port and the trimmed label. It rejects, with
an error whose message names the problem:

- malformed JSON;
- a value that is not an object;
- a missing field, or a field of the wrong type;
- a port outside 1 through 65535;
- a label that is empty once trimmed;
- an unknown field.

The library publishes a typed API.

## 2. Command line

The command reads the one configuration file named by its argument and
validates it with the library. For a valid configuration it prints the
normalised configuration as JSON on stdout, `{"port":…,"label":…}` in that key
order followed by a newline, and exits 0.

For invalid content, or a file it cannot read, it prints a diagnostic on
stderr, prints nothing on stdout and exits nonzero. It never modifies the
file.

The command does not restate the library's validation rules.

## Exit gate

Every step candidate keeps the fixture repository gate passing.
