# @pactwright/standard

The default Pactwright agent pack. It implements the three core Delivery
capabilities:

| Capability               | Agent         |
| ------------------------ | ------------- |
| `delivery-specification` | `spec`        |
| `delivery-execution`     | `implementer` |
| `delivery-review`        | `reviewer`    |

You do not install this package directly. `pactwright` depends on it, so
`pnpm add -D pactwright` installs it, and `.pactwright/config.yml` selects it
with `agent_pack.source: "@pactwright/standard"`.

The pack contains prompts and skills only. Lifecycle stages, gates and graph
mutations belong to the `pactwright` runtime; the prompts call the runtime for
anything stateful. `pack.yml` is the manifest (Distribution §7). During the
`0.0.x` series its `pactwright` field is the exact matching runtime version.
