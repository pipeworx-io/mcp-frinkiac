# @pipeworx/frinkiac

Quote-based screencap search for The Simpsons (Frinkiac), Futurama (Morbotron), and Rick and Morty (Master of All Science). Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `search(show?, query)` — find screencaps matching a quote
- `random(show?)` — random screencap + caption
- `caption(show?, episode, timestamp)` — caption for a specific screencap

`show` is one of `simpsons` (default), `futurama`, `rickandmorty`.

## Data source

- `https://frinkiac.com/api/` (Simpsons)
- `https://morbotron.com/api/` (Futurama)
- `https://masterofallscience.com/api/` (Rick and Morty)

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "frinkiac": {
      "url": "https://gateway.pipeworx.io/frinkiac/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Frinkiac data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
