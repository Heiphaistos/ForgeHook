export interface DiscordEmbedField {
  name: string
  value: string
  inline: boolean
}

export interface DiscordEmbed {
  title: string
  description: string
  url: string
  color: number | null
  timestamp: string
  author: { name: string; url: string; icon_url: string }
  footer: { text: string; icon_url: string }
  image: { url: string }
  thumbnail: { url: string }
  fields: DiscordEmbedField[]
}

export interface DiscordMessage {
  content: string
  username: string
  avatar_url: string
  tts: boolean
  embeds: Partial<DiscordEmbed>[]
  thread_id?: string
}

export function emptyEmbed(): Partial<DiscordEmbed> {
  return {
    title: '',
    description: '',
    color: 0x5865f2,
    fields: [],
    author: { name: '', url: '', icon_url: '' },
    footer: { text: '', icon_url: '' },
    image: { url: '' },
    thumbnail: { url: '' },
  }
}

export function emptyMessage(): DiscordMessage {
  return { content: '', username: '', avatar_url: '', tts: false, embeds: [] }
}
