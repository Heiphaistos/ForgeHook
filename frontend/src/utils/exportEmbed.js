export function exportJSON(msg) {
    return JSON.stringify(msg, null, 2);
}
export function exportText(msg) {
    const lines = [];
    if (msg.content) {
        lines.push(msg.content);
        lines.push('');
    }
    msg.embeds.forEach((e, i) => {
        lines.push(`=== EMBED ${i + 1} ===`);
        if (e.author?.name)
            lines.push(`Auteur: ${e.author.name}`);
        if (e.title)
            lines.push(`Titre: ${e.title}`);
        if (e.description)
            lines.push(e.description);
        if (e.fields?.length) {
            e.fields.forEach(f => { lines.push(`[${f.name}]`); lines.push(f.value); });
        }
        if (e.footer?.text)
            lines.push(`Footer: ${e.footer.text}`);
        lines.push('');
    });
    return lines.join('\n');
}
export function exportMarkdown(msg) {
    const lines = [];
    if (msg.content) {
        lines.push(msg.content);
        lines.push('');
    }
    msg.embeds.forEach((e, i) => {
        const title = e.title || `Embed ${i + 1}`;
        lines.push(`## ${title}`);
        const author = e.author?.name;
        if (author)
            lines.push(`*${author}*`);
        lines.push('');
        if (e.description) {
            lines.push(e.description);
            lines.push('');
        }
        e.fields?.forEach(f => { lines.push(`**${f.name}**`); lines.push(f.value); lines.push(''); });
        const footer = e.footer?.text;
        if (footer) {
            lines.push('---');
            lines.push(`*${footer}*`);
        }
        lines.push('');
    });
    return lines.join('\n');
}
function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function exportHTML(msg) {
    const embedsHtml = msg.embeds.map(e => {
        const color = e.color ? `#${e.color.toString(16).padStart(6, '0')}` : '#5865F2';
        const author = e.author;
        const footer = e.footer;
        const image = e.image;
        const thumbnail = e.thumbnail;
        const fieldsHtml = (e.fields ?? []).map(f => `<div class="field"><div class="fn">${escapeHtml(f.name)}</div><div class="fv">${escapeHtml(f.value)}</div></div>`).join('');
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
    </div>`;
    }).join('\n');
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
</body></html>`;
}
export function exportCurl(msg, webhookUrl) {
    const json = JSON.stringify({
        content: msg.content || undefined,
        username: msg.username || undefined,
        avatar_url: msg.avatar_url || undefined,
        embeds: msg.embeds.length ? msg.embeds : undefined,
    }).replace(/'/g, "'\\''");
    return `curl -X POST '${webhookUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${json}'`;
}
export function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: `${mime}; charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
