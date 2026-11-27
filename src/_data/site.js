// The address the project answers at: the one h5p-toolkit's code of conduct and security
// policy give, and the organization's on GitHub.
const contact = "alekswebnet@proton.me";

// Where to say how the build page went, in two ways that start from the same title and two
// questions. An email asks for no account, and a teacher may have none on GitHub. A new discussion
// in h5p-toolkit, where the author is made, is public, for someone who has one. A mail body's
// lines end in CRLF (RFC 6068).
const feedbackTitle = "Feedback on the H5P build page";
const feedbackBody = "What I made (the content type, and the chat that wrote the source):\n\n\nWhat went well, or wrong:\n\n";
const buildFeedback = {
  email:
    `mailto:${contact}?subject=${encodeURIComponent(feedbackTitle)}` +
    `&body=${encodeURIComponent(feedbackBody.replaceAll("\n", "\r\n"))}`,
  github:
    "https://github.com/missing-elements/h5p-toolkit/discussions/new?category=general" +
    `&title=${encodeURIComponent(feedbackTitle)}&body=${encodeURIComponent(feedbackBody)}`,
};

export default {
  name: "Embed My",
  // Where to reach the project: the privacy, terms and support pages give it.
  contact,
  // Embed My is an organisation on GitHub, not a company: the person who runs it is the one the
  // privacy and terms pages name as responsible (the owner, 2026-11-24). No postal address.
  operator: "Oleksandr Shevchuk",
  // The app in ChatGPT, as the privacy, terms and support pages name it, and the address of its
  // server (h5p-toolkit's apps/mcp-worker).
  app: { name: "EmbedMy Lesson", server: "mcp.embed-my.org" },
  // When the privacy and terms pages last changed what they say: the date they show.
  legalUpdated: "27 November 2026",
  // What the site is, in a line: under the name in the top bar.
  tagline: "H5P that plays anywhere",
  url: "https://embed-my.org",
  github: "https://github.com/embed-my",
  // Where to give to the project's development: the footer.
  support: "https://donatello.to/OleksandrShevchuk",
  // Where the guides and the h5p-author skill stay: missing-elements.github.io.
  guides: "https://missing-elements.github.io",
  // The apps on the home page: each card's title goes where its first link does.
  apps: [
    {
      name: "EmbedMy Lesson",
      kind: "App for ChatGPT",
      description: "Describe a lesson in ChatGPT and get an H5P activity in the reply, from a quiz to a branching scenario: play it there, and download a .h5p file for Moodle or any other H5P site.",
      links: [
        { text: "Support", href: "/support/" },
        { text: "Privacy", href: "/privacy/" },
        { text: "Terms", href: "/terms/" },
      ],
    },
  ],
  // The player the apps are built on, on the home page and in the footer.
  player: {
    name: "H5P Offline Player",
    package: "@missing-elements/h5p-offline-player",
    description: "Plays .h5p files from your own URLs or from disk with no H5P server, offline too, and reports results as xAPI, cmi5 or SCORM.",
    links: [
      { text: "Demo", href: "https://h5p-offline-player.vercel.app/" },
      { text: "GitHub", href: "https://github.com/missing-elements/h5p-toolkit" },
      { text: "npm", href: "https://www.npmjs.com/package/@missing-elements/h5p-offline-player" },
    ],
  },
  buildFeedback,
};
