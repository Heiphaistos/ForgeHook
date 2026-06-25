import type { DiscordMessage, DiscordEmbed } from '../types/discord'

export function exportJSON(msg: DiscordMessage): string {
  return JSON.stringify(msg, null, 2)
}

export function exportText(msg: DiscordMessage): string {
  const lines: string[] = []
  if (msg.content) { lines.push(msg.content); lines.push('') }
  msg.embeds.forEach((e, i) => {
    lines.push(`=== EMBED ${i + 1} ===`)
    if ((e as DiscordEmbed).author?.name) lines.push(`Auteur: ${(e as DiscordEmbed).author.name}`)
    if (e.title) lines.push(`Titre: ${e.title}`)
    if (e.description) lines.push(e.description)
    if (e.fields?.length) {
      e.fields.forEach(f => { lines.push(`[${f.name}]`); lines.push(f.value) })
    }
    if ((e as DiscordEmbed).footer?.text) lines.push(`Footer: ${(e as DiscordEmbed).footer.text}`)
    lines.push('')
  })
  return lines.join('\n')
}

export function exportMarkdown(msg: DiscordMessage): string {
  const lines: string[] = []
  if (msg.content) { lines.push(msg.content); lines.push('') }
  msg.embeds.forEach((e, i) => {
    const title = e.title || `Embed ${i + 1}`
    lines.push(`## ${title}`)
    const author = (e as DiscordEmbed).author?.name
    if (author) lines.push(`*${author}*`)
    lines.push('')
    if (e.description) { lines.push(e.description); lines.push('') }
    e.fields?.forEach(f => { lines.push(`**${f.name}**`); lines.push(f.value); lines.push('') })
    const footer = (e as DiscordEmbed).footer?.text
    if (footer) { lines.push('---'); lines.push(`*${footer}*`) }
    lines.push('')
  })
  return lines.join('\n')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function exportHTML(msg: DiscordMessage): string {
  const embedsHtml = msg.embeds.map(e => {
    const color = e.color ? `#${e.color.toString(16).padStart(6, '0')}` : '#5865F2'
    const author = (e as DiscordEmbed).author
    const footer = (e as DiscordEmbed).footer
    const image = (e as DiscordEmbed).image
    const thumbnail = (e as DiscordEmbed).thumbnail
    const fieldsHtml = (e.fields ?? []).map(f =>
      `<div class="field"><div class="fn">${escapeHtml(f.name)}</div><div class="fv">${escapeHtml(f.value)}</div></div>`
    ).join('')
    return `<div class="embed" style="border-left:4px solid ${color}">
      ${author?.name ? `<div class="author">${escapeHtml(author.name)}</div>` : ''}
      ${e.title ? `<div class="title">${escapeHtml(e.title)}</div>` : ''}
      <div class="body-row">
        <div class="body-main">
          ${e.description ? `<div class="desc">${escapeHtml(e.description)}</div>` : ''}
          ${fieldsHtml ? `<div class="fields">${fieldsHtml}</div>` : ''}
        </div>
        ${thumbnail?.url ? `<div class="thumb"><img src="${escapeHtml(thumbnail.url)}"></div>` : ''}
      </div>
      ${image?.url ? `<img class="img" src="${escapeHtml(image.url)}">` : ''}
      ${footer?.text ? `<div class="footer">${escapeHtml(footer.text)}</div>` : ''}
    </div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>ForgeHook Export</title><style>
body{background:#36393f;color:#dcddde;font-family:Whitney,"Helvetica Neue",Helvetica,Arial,sans-serif;padding:20px;line-height:1.375}
.message-content{background:#32353b;padding:10px 14px;border-radius:4px;margin-bottom:8px;white-space:pre-wrap}
.embed{background:#2f3136;padding:12px 16px;border-radius:4px;margin:4px 0;max-width:520px}
.author{font-size:12px;font-weight:600;margin-bottom:6px;color:#b9bbbe}
.title{font-weight:700;color:#fff;margin-bottom:6px;font-size:16px}
.body-row{display:flex;gap:12px}
.body-main{flex:1}
.thumb img{width:80px;height:80px;border-radius:4px;object-fit:cover}
.desc{font-size:14px;white-space:pre-wrap;margin-bottom:8px;color:#dcddde}
.fields{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.field{min-width:40%;flex:1;background:#202225;padding:6px 8px;border-radius:3px}
.fn{font-size:12px;font-weight:700;color:#dcddde;margin-bottom:2px}
.fv{font-size:14px;color:#dcddde}
.img{max-width:100%;border-radius:4px;margin-top:8px;display:block}
.footer{font-size:12px;color:#72767d;margin-top:8px;padding-top:6px;border-top:1px solid #40444b}
</style></head><body>
${msg.content ? `<div class="message-content">${escapeHtml(msg.content)}</div>` : ''}
${embedsHtml}
<p style="color:#72767d;font-size:11px;margin-top:20px">Exporté depuis ForgeHook</p>
</body></html>`
}

export function exportCurl(msg: DiscordMessage, webhookUrl: string): string {
  const json = JSON.stringify({
    content: msg.content || undefined,
    username: msg.username || undefined,
    avatar_url: msg.avatar_url || undefined,
    embeds: msg.embeds.length ? msg.embeds : undefined,
  }).replace(/'/g, "'\\''")
  return `curl -X POST '${webhookUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${json}'`
}

export function exportPowerShell(msg: DiscordMessage, webhookUrl: string): string {
  const payload = {
    content: msg.content || undefined,
    username: msg.username || undefined,
    avatar_url: msg.avatar_url || undefined,
    embeds: msg.embeds.length ? msg.embeds : undefined,
  }
  const json = JSON.stringify(payload, null, 2).replace(/"/g, '`"')
  return `$payload = @"\n${json}\n"@\n\nInvoke-RestMethod \`\n  -Uri "${webhookUrl}" \`\n  -Method POST \`\n  -ContentType "application/json" \`\n  -Body $payload`
}

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime}; charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
