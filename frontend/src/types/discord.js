export function emptyEmbed() {
    return {
        title: '',
        description: '',
        color: 0x5865f2,
        fields: [],
        author: { name: '', url: '', icon_url: '' },
        footer: { text: '', icon_url: '' },
        image: { url: '' },
        thumbnail: { url: '' },
    };
}
export function emptyMessage() {
    return { content: '', username: '', avatar_url: '', tts: false, embeds: [] };
}
