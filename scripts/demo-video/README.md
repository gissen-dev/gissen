# Demo videos

The site has two places for a short clip. Each shows a fallback until its files exist, and switches to the video on the next build with no code change.

| Kind | Where it shows | Fallback until the files exist |
|---|---|---|
| `editor` | Top of the landing page | A screenshot of the real playground, linking to it |
| `agent` | The AI section of the landing page, and the top of the MCP guide | Nothing |

## What to record

**editor**: editing by hand, on the current UI. Drag a component in, nest one inside another, change a prop, undo, switch the viewport. The [playground](https://gissen.dev/playground) is a good place to record, because anyone can reproduce it.

**agent**: an AI client (Claude Desktop or Cursor) editing a page through `gissen-mcp`, with the running app next to it updating as the agent works. [examples/mcp-agent](../../examples/mcp-agent) is set up for exactly this.

## Specification

| | |
|---|---|
| Length | 20 to 30 seconds, loops cleanly |
| Audio | None. The site plays it muted |
| Size | At most 1280 px wide. Crop to the part that matters |
| Formats | `<kind>.mp4` (H.264, yuv420p, faststart) and `<kind>.webm` (VP9) |
| Poster | `<kind>-poster.jpg`, one frame that reads well on its own |
| Weight | At most 3 MB per file. They are committed to git |

Files go in `apps/docs/public/demo/`. The encoder makes all three from one recording:

```sh
bash scripts/demo-video/encode.sh ~/Desktop/recording.mov editor
bash scripts/demo-video/encode.sh ~/Desktop/recording.mov agent 4
```

The last argument is the second to take the poster from. It needs `ffmpeg` (macOS: `brew install ffmpeg`).

## Privacy checklist

The files are published with the site and kept in git history for good. Recordings of a chat window or a desktop give things away without you noticing. Before committing, play each file once and look at every frame for:

- your account name, avatar or email address
- a sidebar listing other chats or projects
- file paths that contain a user name, such as `/Users/<name>/...`
- terminal prompts, hostnames or environment variable values
- open browser tabs, bookmarks, and notifications sliding in
- API keys or tokens in a config file that is briefly on screen

Crop or blur what you find, or re-record. A file that has been committed once should be treated as published, even if a later commit removes it.
