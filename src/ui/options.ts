import type { DisplayOptions } from '../snippet'

/** Step 3: the display options, read from the form as it stands. */

export interface OptionsParts {
  title: HTMLInputElement
  copyright: HTMLInputElement
  reuse: HTMLInputElement
}

/** What the visitor chose. */
export interface EmbedOptions {
  /** The frame title as typed; empty when none was. */
  title: string
  display: DisplayOptions
}

/** What a change affects: the display options change the frame itself, the rest only the snippet. */
export type OptionsChange = 'display' | 'snippet'

export interface Options {
  read(): EmbedOptions
}

export function createOptions(parts: OptionsParts, onChange: (change: OptionsChange) => void): Options {
  const { title, copyright, reuse } = parts

  for (const input of [copyright, reuse]) input.addEventListener('change', () => onChange('display'))
  title.addEventListener('input', () => onChange('snippet'))

  return {
    read() {
      return {
        title: title.value.trim(),
        display: { copyright: copyright.checked, reuse: reuse.checked }
      }
    }
  }
}
