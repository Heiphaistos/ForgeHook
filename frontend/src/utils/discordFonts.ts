// Unicode "font" converter for Discord
// These use Mathematical Alphanumeric Symbols (U+1D400...) which Discord renders

export type FontDef = {
  name: string
  category: string
  icon: string
  desc: string
  upper?: number
  lower?: number
  digits?: number
  upperMap?: string
  lowerMap?: string
  digitMap?: string
  upperExceptions?: Record<string, string>
  lowerExceptions?: Record<string, string>
  combining?: string
  passthrough?: boolean
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'

function mapChars(src: string, map: string): string {
  return [...src].map((c, i) => (i < map.length ? [...map][i] : c)).join('')
}

const SMALL_CAPS_UPPER = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀsᴛᴜᴠᴡxʏᴢ'
const SMALL_CAPS_LOWER = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀsᴛᴜᴠᴡxʏᴢ'
const FULLWIDTH_UPPER  = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ'
const FULLWIDTH_LOWER  = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ'
const FULLWIDTH_DIGITS = '０１２３４５６７８９'

export const FONT_LIST: FontDef[] = [
  // ── Serif ──────────────────────────────────────────────────────────
  {
    name: 'Gras',              category: 'Serif', icon: '𝐁',
    desc: '𝐓𝐞𝐱𝐭𝐞 𝐞𝐧 𝐠𝐫𝐚𝐬',
    upper: 0x1D400, lower: 0x1D41A, digits: 0x1D7CE,
  },
  {
    name: 'Italique',          category: 'Serif', icon: '𝐼',
    desc: '𝑇𝑒𝑥𝑡𝑒 𝑒𝑛 𝑖𝑡𝑎𝑙𝑖𝑞𝑢𝑒',
    upper: 0x1D434, lower: 0x1D44E,
    upperExceptions: { I: 'ℐ' },
    lowerExceptions: { h: 'ℎ' },
  },
  {
    name: 'Gras Italique',     category: 'Serif', icon: '𝑩',
    desc: '𝑻𝒆𝒙𝒕𝒆 𝒈𝒓𝒂𝒔 𝒊𝒕𝒂𝒍𝒊𝒒𝒖𝒆',
    upper: 0x1D468, lower: 0x1D482,
  },
  // ── Script ─────────────────────────────────────────────────────────
  {
    name: 'Script',            category: 'Script', icon: '𝒮',
    desc: '𝒯𝑒𝓍𝓉𝑒 𝓈𝒸𝓇𝒾𝓅𝓉',
    upper: 0x1D49C, lower: 0x1D4B6,
    upperExceptions: { B:'ℬ', E:'ℰ', F:'ℱ', H:'ℋ', I:'ℐ', L:'ℒ', M:'ℳ', R:'ℛ' },
    lowerExceptions: { e:'ℯ', g:'ℊ', o:'ℴ' },
  },
  {
    name: 'Script Gras',       category: 'Script', icon: '𝓑',
    desc: '𝓣𝓮𝔁𝓽𝓮 𝓼𝓬𝓻𝓲𝓹𝓽 𝓰𝓻𝓪𝓼',
    upper: 0x1D4D0, lower: 0x1D4EA,
  },
  // ── Fraktur ────────────────────────────────────────────────────────
  {
    name: 'Fraktur',           category: 'Fraktur', icon: '𝔉',
    desc: '𝔗𝔢𝔵𝔱𝔢 𝔣𝔯𝔞𝔨𝔱𝔲𝔯',
    upper: 0x1D504, lower: 0x1D51E,
    upperExceptions: { C:'ℭ', H:'ℌ', I:'ℑ', R:'ℜ', Z:'ℨ' },
  },
  {
    name: 'Fraktur Gras',      category: 'Fraktur', icon: '𝕱',
    desc: '𝕿𝖊𝖝𝖙𝖊 𝖋𝖗𝖆𝖐𝖙𝖚𝖗 𝖌𝖗𝖆𝖘',
    upper: 0x1D56C, lower: 0x1D586,
  },
  // ── Double-Struck ──────────────────────────────────────────────────
  {
    name: 'Double trait',      category: 'Double-Struck', icon: '𝔸',
    desc: '𝔻𝕠𝕦𝕓𝕝𝕖 𝕥𝕣𝕒𝕚𝕥',
    upper: 0x1D538, lower: 0x1D552, digits: 0x1D7D8,
    upperExceptions: { C:'ℂ', H:'ℍ', N:'ℕ', P:'ℙ', Q:'ℚ', R:'ℝ', Z:'ℤ' },
  },
  // ── Sans-Serif ─────────────────────────────────────────────────────
  {
    name: 'Sans-Serif',        category: 'Sans-Serif', icon: '𝖲',
    desc: '𝖳𝖾𝗑𝗍𝖾 𝗌𝖺𝗇𝗌-𝗌é𝗋𝗂𝖿',
    upper: 0x1D5A0, lower: 0x1D5BA, digits: 0x1D7E2,
  },
  {
    name: 'Sans Gras',         category: 'Sans-Serif', icon: '𝗦',
    desc: '𝗧𝗲𝘅𝘁𝗲 𝘀𝗮𝗻𝘀 𝗴𝗿𝗮𝘀',
    upper: 0x1D5D4, lower: 0x1D5EE, digits: 0x1D7EC,
  },
  {
    name: 'Sans Italique',     category: 'Sans-Serif', icon: '𝘚',
    desc: '𝘛𝘦𝘹𝘵𝘦 𝘴𝘢𝘯𝘴 𝘪𝘵𝘢𝘭𝘪𝘲𝘶𝘦',
    upper: 0x1D608, lower: 0x1D622,
  },
  {
    name: 'Sans Gras Ital.',   category: 'Sans-Serif', icon: '𝙎',
    desc: '𝙏𝙚𝙭𝙩𝙚 𝙨𝙖𝙣𝙨 𝙜𝙧𝙖𝙨 𝙞𝙩𝙖𝙡.',
    upper: 0x1D63C, lower: 0x1D656,
  },
  // ── Monospace ──────────────────────────────────────────────────────
  {
    name: 'Monospace',         category: 'Monospace', icon: '𝙼',
    desc: '𝚃𝚎𝚡𝚝𝚎 𝚖𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎',
    upper: 0x1D670, lower: 0x1D68A, digits: 0x1D7F6,
  },
  // ── Décoratif ──────────────────────────────────────────────────────
  {
    name: 'Petites Capitales', category: 'Décoratif', icon: 'Sᴍ',
    desc: 'Texte en petites capitales',
    upperMap: SMALL_CAPS_UPPER, lowerMap: SMALL_CAPS_LOWER,
  },
  {
    name: 'Pleine Largeur',    category: 'Décoratif', icon: 'Ｆ',
    desc: 'Ｔｅｘｔｅ ｐｌｅｉｎｅ ｌａｒｇｅｕｒ',
    upperMap: FULLWIDTH_UPPER, lowerMap: FULLWIDTH_LOWER, digitMap: FULLWIDTH_DIGITS,
  },
  {
    name: 'Cerclé',            category: 'Décoratif', icon: 'Ⓒ',
    desc: 'Ⓣⓔⓧⓣⓔ ⓒⓔⓡⓒⓛé',
    upper: 0x24B6, lower: 0x24D0,
    digitMap: '⓪①②③④⑤⑥⑦⑧⑨',
  },
  {
    name: 'Cerclé plein',      category: 'Décoratif', icon: '🅒',
    desc: '🅣🅔🅧🅣🅔 🅒🅔🅡🅒🅛é',
    upper: 0x1F150, lower: 0x1F150, // same block, uppercase only for lower
  },
  {
    name: 'Encadré',           category: 'Décoratif', icon: '🄰',
    desc: '🄰🄱🄲 encadré',
    upper: 0x1F130, lower: 0x1F130,
  },
  {
    name: 'Drapeaux',          category: 'Décoratif', icon: '🇦',
    desc: '🇨🇱🇦🇳🇳🇪🇱 indicateurs régionaux',
    upper: 0x1F1E6, lower: 0x1F1E6,
  },
  // ── Effets ─────────────────────────────────────────────────────────
  {
    name: 'Barré',             category: 'Effets', icon: 'T̶',
    desc: 'T̶e̶x̶t̶e̶ ̶b̶a̶r̶r̶é̶',
    combining: '̶', passthrough: true,
  },
  {
    name: 'Souligné',          category: 'Effets', icon: 'T̲',
    desc: 'T̲e̲x̲t̲e̲ ̲s̲o̲u̲l̲i̲g̲n̲é̲',
    combining: '̲', passthrough: true,
  },
  {
    name: 'Double barré',      category: 'Effets', icon: 'T͇',
    desc: 'T͇e͇x͇t͇e͇ ͇d͇o͇u͇b͇l͇e͇',
    combining: '̵', passthrough: true,
  },
  {
    name: 'Tilde',             category: 'Effets', icon: 'T͂',
    desc: 'T͂e͂x͂t͂e͂ ͂t͂i͂l͂d͂e͂',
    combining: '͂', passthrough: true,
  },
]

function codePointConvert(
  char: string,
  upperStart: number,
  lowerStart: number,
  digitStart?: number,
  upperExceptions?: Record<string, string>,
  lowerExceptions?: Record<string, string>,
): string {
  const upper = UPPERCASE.indexOf(char)
  const lower = LOWERCASE.indexOf(char)
  const digit = char >= '0' && char <= '9' ? Number(char) : -1

  if (upper >= 0) return upperExceptions?.[char] ?? String.fromCodePoint(upperStart + upper)
  if (lower >= 0) return lowerExceptions?.[char] ?? String.fromCodePoint(lowerStart + lower)
  if (digit >= 0 && digitStart !== undefined) return String.fromCodePoint(digitStart + digit)
  return char
}

export function convertFont(text: string, font: FontDef): string {
  if (font.combining) {
    if (font.passthrough) {
      return [...text].map(c => c === ' ' ? c : c + font.combining!).join('')
    }
  }

  return [...text].map(char => {
    // Map-based fonts (small caps, fullwidth, circled digits override)
    if (font.upperMap || font.lowerMap) {
      const uIdx = UPPERCASE.indexOf(char)
      const lIdx = LOWERCASE.indexOf(char)
      const dIdx = char >= '0' && char <= '9' ? Number(char) : -1

      if (uIdx >= 0 && font.upperMap) return [...font.upperMap][uIdx] ?? char
      if (lIdx >= 0 && font.lowerMap) return [...font.lowerMap][lIdx] ?? char
      if (dIdx >= 0 && font.digitMap) return [...font.digitMap][dIdx] ?? char
      return char
    }

    // digitMap override (e.g. circled digits)
    if (char >= '0' && char <= '9' && font.digitMap) {
      return [...font.digitMap][Number(char)] ?? char
    }

    // Code point based
    if (font.upper !== undefined && font.lower !== undefined) {
      return codePointConvert(
        char,
        font.upper, font.lower, font.digits,
        font.upperExceptions, font.lowerExceptions,
      )
    }

    return char
  }).join('')
}

export const CATEGORIES = [...new Set(FONT_LIST.map(f => f.category))]
