import { createHash } from "node:crypto";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/assets");
  // `CNAME` keeps the custom domain, embed-my.org, on every deploy from GitHub Actions.
  eleventyConfig.addPassthroughCopy({ public: "/" });

  // A page with a Content-Security-Policy (`csp` in its front matter, written first in <head> by
  // base.njk, and holding no double quote) allows its inline scripts by hash, as they are written:
  // the color-scheme script has to run before the page paints, so it stays inline.
  eleventyConfig.addTransform("csp-inline-script-hashes", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    const scriptSrc = /<meta http-equiv="Content-Security-Policy" content="[^"]*?script-src [^;"]*/;
    if (!scriptSrc.test(content)) return content;
    const hashes = [...content.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)]
      .map(([, source]) => ` 'sha256-${createHash("sha256").update(source).digest("base64")}'`)
      .join("");
    return content.replace(scriptSrc, (directive) => directive + hashes);
  });

  return {
    dir: { input: "src", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
