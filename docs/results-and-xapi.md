# Results, xAPI and grades

Embed My displays H5P activities. It does **not** put scores in an LMS gradebook. Treat a standard public embed as an ungraded activity.

## xAPI statements

H5P activities produce xAPI statements as they are used. Collecting, storing, and sending them to an LRS or LMS requires an explicit integration, and the learner's consent where personal data is involved.

## Receiving statements on your page (developers)

The frame can hand statements to the page around it. When the embed address names your page's origin in an `xapi` parameter, the frame posts each statement to that origin with `postMessage`, and to no other. Nothing is sent unless the page asks for it this way.

Your page should check each message's `origin` and `source` before using it, then do with the statements what it needs, for example forward them to an LRS.

For what a statement contains, see the player's [API](https://github.com/missing-elements/h5p-offline-player#api) and its guide to [which build a learner completed](https://github.com/missing-elements/h5p-offline-player/blob/main/docs/revision.md).
