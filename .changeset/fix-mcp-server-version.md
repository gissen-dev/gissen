---
"gissen-mcp": patch
---

Report the package's real version in the MCP handshake. The server announced a hard-coded `0.0.0`; the version is now injected from package.json at build time, and a test compares it with package.json.
