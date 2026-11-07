# Publish

The piece is approved and in the library. Publish it exactly as approved.

1. Read `post.md` in the piece's folder and the format's file. Don't rewrite anything.
2. Find the tool for the platform among your MCP tools (for example `mcp__composio__*` with Reddit, YouTube, LinkedIn or
   Instagram actions). Check the destination's rules first (a subreddit's rules on self-promotion and flair).
3. Files: get a public link per file with `get_file_link` (tools that upload by URL need it).
4. After posting, open the post and check it looks right.
5. Done: `set_route` "posted" with the link, and `complete` with the link and anything worth knowing (flair used,
   scheduled time).

If there's no tool for this platform, or posting fails twice, stop: `ask_human` with what's missing and a kit a person
can paste: where to post, the title and text, and the file links.
