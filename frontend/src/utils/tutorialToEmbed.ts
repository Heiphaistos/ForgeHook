import type { Tutorial } from '../types/app'

export function tutorialToEmbed(tut: Tutorial, color = 0x5865f2): object {
  const fields: { name: string; value: string; inline: boolean }[] = []
  let description = ''
  let imageUrl = ''
  let thumbnailUrl = ''
  let sectionIdx = 0

  for (const b of tut.blocks) {
    if (b.type === 'text') {
      if (!description) {
        description = (b.content as string).slice(0, 4096)
      } else {
        sectionIdx++
        const val = (b.content as string).slice(0, 1024)
        if (fields.length < 25) fields.push({ name: `Section ${sectionIdx}`, value: val, inline: false })
      }
    } else if (b.type === 'image' && b.content?.url) {
      if (!imageUrl) imageUrl = b.content.url
      else if (!thumbnailUrl) thumbnailUrl = b.content.url
    } else if (b.type === 'code') {
      const lang = b.content?.language ?? ''
      const code = (b.content?.code ?? '').slice(0, 990)
      if (fields.length < 25) fields.push({ name: `💻 Code${lang ? ` (${lang})` : ''}`, value: `\`\`\`${lang}\n${code}\n\`\`\``, inline: false })
    } else if (b.type === 'callout') {
      const emoji: Record<string, string> = { warning: '⚠️', success: '✅', danger: '❌', info: 'ℹ️' }
      const e = emoji[b.content?.type ?? 'info'] ?? 'ℹ️'
      const val = `${e} ${(b.content?.text ?? '').slice(0, 1020)}`
      if (fields.length < 25) fields.push({ name: 'Note', value: val, inline: false })
    }
  }

  return {
    title: tut.title.slice(0, 256),
    description,
    color,
    fields,
    image: imageUrl ? { url: imageUrl } : { url: '' },
    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : { url: '' },
    author: { name: '', url: '', icon_url: '' },
    footer: { text: '', icon_url: '' },
    url: '',
    timestamp: '',
  }
}
