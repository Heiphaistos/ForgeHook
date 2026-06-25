export function renderDiscordMarkdown(text: string): string {
  if (!text) return ''
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Code block (multiline)
  s = s.replace(/```(?:\w+)?\n?([\s\S]*?)```/g, '<pre class="md-code-block">$1</pre>')
  // Inline code
  s = s.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
  // Bold italic
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic
  s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>')
  // Underline
  s = s.replace(/__(.+?)__/g, '<span class="md-underline">$1</span>')
  // Strikethrough
  s = s.replace(/~~(.+?)~~/g, '<s>$1</s>')
  // Spoiler
  s = s.replace(/\|\|(.+?)\|\|/g, '<span class="md-spoiler">$1</span>')
  // Blockquote
  s = s.replace(/^&gt; (.+)$/gm, '<span class="md-quote">$1</span>')
  // Mentions
  s = s.replace(/@everyone/g, '<span class="md-mention">@everyone</span>')
  s = s.replace(/@here/g, '<span class="md-mention">@here</span>')
  s = s.replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="md-mention">@rôle</span>')
  s = s.replace(/&lt;@(\d+)&gt;/g, '<span class="md-mention">@user</span>')
  s = s.replace(/&lt;#(\d+)&gt;/g, '<span class="md-channel">#channel</span>')
  // Newlines
  s = s.replace(/\n/g, '<br/>')
  return s
}
