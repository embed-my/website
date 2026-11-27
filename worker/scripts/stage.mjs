// Gathers what the Worker reads as it runs into staged/, which wrangler.jsonc attaches as modules.
// Each from the installed packages: the pack's parts, the author package's skill, the card.
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const staged = fileURLToPath(new URL('../staged/', import.meta.url))
/** Where an installed package's file is. @param {string} specifier */
const at = (specifier) => fileURLToPath(import.meta.resolve(specifier))

const parts = dirname(at('@missing-elements/h5p-libraries/parts/index.json'))
const references = dirname(at('@missing-elements/h5p-author/references/authoring.md'))
const author = dirname(references)
const card = join(dirname(at('@missing-elements/h5p-mcp/package.json')), 'lib', 'card.html')

await rm(staged, { recursive: true, force: true })
await mkdir(staged, { recursive: true })
await cp(parts, join(staged, 'parts'), { recursive: true })
// The skill, served over MCP (#280): every .md file in its references/, and SKILL.md and LICENSE.
await cp(references, join(staged, 'references'), { recursive: true, filter: async (from) => from.endsWith('.md') || (await stat(from)).isDirectory() })
await cp(join(author, 'SKILL.md'), join(staged, 'SKILL.md'))
await cp(join(author, 'LICENSE'), join(staged, 'LICENSE'))
await cp(card, join(staged, 'card.html'))

const names = async (/** @type {string} */ folder, /** @type {string} */ ending) => (await readdir(join(staged, folder))).filter((name) => name.endsWith(ending))
const [libraries, types] = [await names('parts', '.h5p'), await names(join('references', 'types'), '.md')]
if (!libraries.length || !types.length) throw new Error(`Nothing to carry: ${libraries.length} parts and ${types.length} type files in ${staged}`)
let bytes = 0
for (const name of await readdir(staged, { recursive: true })) {
  const file = await stat(join(staged, name))
  if (file.isFile()) bytes += file.size
}
console.log(`Staged ${libraries.length} parts, the skill with ${types.length} type files, and the card: ${(bytes / 1048576).toFixed(1)} MB`)
