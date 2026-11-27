// The address the project answers at: the one h5p-toolkit's code of conduct and security
// policy give, and the organization's on GitHub.
const contact = "alekswebnet@proton.me";

export default {
  name: "Embed My",
  // Where to reach the project: the privacy, terms and support pages give it.
  contact,
  // Embed My is an organisation on GitHub, not a company: the person who runs it is the one the
  // privacy and terms pages name as responsible (the owner, 2026-11-24). No postal address.
  operator: "Oleksandr Shevchuk",
  // The app in ChatGPT, as the privacy, terms and support pages name it, and the address of its
  // server (worker/).
  app: { name: "EmbedMy Lesson", server: "mcp.embed-my.org" },
  // When the privacy and terms pages last changed what they say: the date they show.
  legalUpdated: "27 November 2026",
  // What the site is, in a line: under the name in the top bar.
  tagline: "Authoring learning activities",
  url: "https://embed-my.org",
  github: "https://github.com/embed-my",
  // Where to give to the project's development: the footer.
  support: "https://donatello.to/OleksandrShevchuk",
  // Where the guides and the h5p-author skill stay: missing-elements.github.io.
  guides: "https://missing-elements.github.io",
  // The apps on the home page and in the footer. `href` is an app's listing, once it has one: its
  // name links there; until then the footer points to its card.
  apps: [
    {
      name: "EmbedMy Lesson",
      href: null,
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
};
