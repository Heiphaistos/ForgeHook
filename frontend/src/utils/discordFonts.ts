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
  // ── Encadrés ───────────────────────────────────────────────────────
  {
    name: 'Parenthèses',       category: 'Encadrés', icon: '⒯',
    desc: '⒯⒠⒳⒯⒠ ⒫⒜⒭⒠⒩⒯⒣',
    upperMap: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowerMap: '⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵',
  },
  {
    name: 'Négatif cerclé',    category: 'Encadrés', icon: '🅣',
    desc: '🅣🅔🅧🅣🅔 🅝🅔🅖',
    upper: 0x1F150, lower: 0x1F150,
  },
  {
    name: 'Négatif encadré',   category: 'Encadrés', icon: '🆃',
    desc: '🆃🅴🆇🆃🅴 🅽🅴🅶',
    upper: 0x1F170, lower: 0x1F170,
  },
  // ── Exposant / Indice ──────────────────────────────────────────────
  {
    name: 'Exposant',          category: 'Exposant', icon: 'ᵀ',
    desc: 'ᵀᵉˣᵗᵉ ᵉˣᵖᵒˢᵃⁿᵗ',
    upperMap: 'ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁᵛᵂˣʸᶻ',
    lowerMap: 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ',
    digitMap: '⁰¹²³⁴⁵⁶⁷⁸⁹',
  },
  {
    name: 'Indice',            category: 'Exposant', icon: 'ₜ',
    desc: 'ₜₑₓₜₑ ᵢₙ𝒹ᵢ꜀ₑ',
    upperMap: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowerMap: 'ₐbcdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyz',
    digitMap: '₀₁₂₃₄₅₆₇₈₉',
  },
  // ── Retourné / Miroir ──────────────────────────────────────────────
  {
    name: 'Retourné',          category: 'Flip', icon: '⊥',
    desc: 'ʇxǝʇ ǝ ǝuɹǝʇnoɹ',
    upperMap: '∀qƆpƎℲ⅁HIſʞ⅂WNOԀQɹS⊥∩ΛMXʎZ',
    lowerMap: 'ɐqɔpǝɟƃɥıɾʞlɯuodbɹsʇnʌʍxʎz',
  },
  // ── Effets simples ─────────────────────────────────────────────────
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
    name: 'Double souligné',   category: 'Effets', icon: 'T̳',
    desc: 'T̳e̳x̳t̳e̳ ̳d̳o̳u̳b̳l̳e̳',
    combining: '̳', passthrough: true,
  },
  {
    name: 'Double barré',      category: 'Effets', icon: 'T̷',
    desc: 'T̷e̷x̷t̷e̷ ̷c̷o̷u̷r̷t̷',
    combining: '̵', passthrough: true,
  },
  {
    name: 'Tilde overlay',     category: 'Effets', icon: 'T̴',
    desc: 'T̴e̴x̴t̴e̴ ̴t̴i̴l̴d̴e̴',
    combining: '̴', passthrough: true,
  },
  {
    name: 'Overline',          category: 'Effets', icon: 'T̅',
    desc: 'T̅e̅x̅t̅e̅ ̅o̅v̅e̅r̅l̅i̅n̅e̅',
    combining: '̅', passthrough: true,
  },
  {
    name: 'Double overline',   category: 'Effets', icon: 'T̿',
    desc: 'T̿e̿x̿t̿e̿ ̿d̿b̿l̿',
    combining: '̿', passthrough: true,
  },
  {
    name: 'Slash diagonal',    category: 'Effets', icon: 'T̸',
    desc: 'T̸e̸x̸t̸e̸ ̸s̸l̸a̸s̸h̸',
    combining: '̸', passthrough: true,
  },
  {
    name: 'Tilde dessous',     category: 'Effets', icon: 'T̰',
    desc: 'T̰ẽx̰t̰ẽ ̰t̰ḭl̰d̰ḛ',
    combining: '̰', passthrough: true,
  },
  {
    name: 'Macron dessous',    category: 'Effets', icon: 'Ṯ',
    desc: 'Ṯe̱x̱ṯe̱ ̱m̱a̱c̱ṟo̱ṉ',
    combining: '̱', passthrough: true,
  },
  // ── Diacritiques dessus ────────────────────────────────────────────
  {
    name: 'Point dessus',      category: 'Diacritiques', icon: 'Ṫ',
    desc: 'Ṫėẋṫė ṗȯiṅṫ',
    combining: '̇', passthrough: true,
  },
  {
    name: 'Point dessous',     category: 'Diacritiques', icon: 'Ṭ',
    desc: 'Ṭẹẋṭẹ ṗọịṇṭ',
    combining: '̣', passthrough: true,
  },
  {
    name: 'Tréma',             category: 'Diacritiques', icon: 'T̈',
    desc: 'T̈ëẍẗë ẗrëmä',
    combining: '̈', passthrough: true,
  },
  {
    name: 'Tréma dessous',     category: 'Diacritiques', icon: 'T̤',
    desc: 'T̤e̤x̤t̤e̤ ̤t̤r̤e̤m̤a̤',
    combining: '̤', passthrough: true,
  },
  {
    name: 'Accent aigu',       category: 'Diacritiques', icon: 'T́',
    desc: 'T́éx́t́é áćúté',
    combining: '́', passthrough: true,
  },
  {
    name: 'Accent grave',      category: 'Diacritiques', icon: 'T̀',
    desc: 'T̀èx̀t̀è g̀r̀àv̀è',
    combining: '̀', passthrough: true,
  },
  {
    name: 'Circonflexe',       category: 'Diacritiques', icon: 'T̂',
    desc: 'T̂êx̂t̂ê ĉîrĉ',
    combining: '̂', passthrough: true,
  },
  {
    name: 'Caron',             category: 'Diacritiques', icon: 'Ť',
    desc: 'Ťěx̌ťě čǎrǒn',
    combining: '̌', passthrough: true,
  },
  {
    name: 'Macron',            category: 'Diacritiques', icon: 'T̄',
    desc: 'T̄ēx̄t̄ē mācrōn',
    combining: '̄', passthrough: true,
  },
  {
    name: 'Brève',             category: 'Diacritiques', icon: 'T̆',
    desc: 'T̆ĕx̆t̆ĕ brĕvĕ',
    combining: '̆', passthrough: true,
  },
  {
    name: 'Rond dessus',       category: 'Diacritiques', icon: 'T̊',
    desc: 'T̊e̊x̊t̊e̊ r̊i̊n̊g̊',
    combining: '̊', passthrough: true,
  },
  {
    name: 'Rond dessous',      category: 'Diacritiques', icon: 'T̥',
    desc: 'T̥e̥x̥t̥e̥ r̥i̥n̥g̥',
    combining: '̥', passthrough: true,
  },
  {
    name: 'Double aigu',       category: 'Diacritiques', icon: 'T̋',
    desc: 'T̋ő x̋ t̋e̋ d̋b̋l̋',
    combining: '̋', passthrough: true,
  },
  {
    name: 'Crochet dessus',    category: 'Diacritiques', icon: 'T̉',
    desc: 'T̉ẻx̉t̉ẻ h̉ȏȏk̉',
    combining: '̉', passthrough: true,
  },
  {
    name: 'Ligne verticale',   category: 'Diacritiques', icon: 'T̍',
    desc: 'T̍e̍x̍t̍e̍ ̍v̍e̍r̍t̍',
    combining: '̍', passthrough: true,
  },
  {
    name: 'Double verticale',  category: 'Diacritiques', icon: 'T̎',
    desc: 'T̎e̎x̎t̎e̎ ̎d̎b̎l̎',
    combining: '̎', passthrough: true,
  },
  {
    name: 'Croix dessus',      category: 'Diacritiques', icon: 'T͝',
    desc: 'T͝e͝x͝t͝e͝ c͝r͝o͝i͝x͝',
    combining: '̽', passthrough: true,
  },
  {
    name: 'Corne',             category: 'Diacritiques', icon: 'T̛',
    desc: 'T̛e̛x̛t̛e̛ h̛ơr̛n̛',
    combining: '̛', passthrough: true,
  },
  // ── Effets combinés ────────────────────────────────────────────────
  {
    name: 'Barré+Point',       category: 'Combinés', icon: 'Ṫ̶',
    desc: 'Ṫ̶ẋ̶ṫ̶ė̶ ċ̶ȯ̶ṁ̶ḃ̶',
    combining: '̶̇', passthrough: true,
  },
  {
    name: 'Souligné+Point',    category: 'Combinés', icon: 'Ṯ̲',
    desc: 'T̲̣e̲̣x̲̣t̲̣e̲̣ ̲̣c̲̣o̲̣m̲̣b̲̣',
    combining: '̲̣', passthrough: true,
  },
  {
    name: 'Overline+Souligné', category: 'Combinés', icon: 'T̲̅',
    desc: 'T̲̅e̲̅x̲̅t̲̅e̲̅ ̲̅e̲̅n̲̅c̲̅',
    combining: '̲̅', passthrough: true,
  },
  {
    name: 'Tréma+Barré',       category: 'Combinés', icon: 'T̶̈',
    desc: 'T̶̈ë̶ẍ̶ẗ̶ë̶ ̶̈c̶̈ö̶m̶̈b̶̈',
    combining: '̶̈', passthrough: true,
  },
  {
    name: 'Aigu+Barré',        category: 'Combinés', icon: 'T̶́',
    desc: 'T̶́é̶x̶́t̶́é̶ á̶c̶ú̶t̶é̶',
    combining: '̶́', passthrough: true,
  },
  {
    name: 'Rond+Souligné',     category: 'Combinés', icon: 'T̲̊',
    desc: 'T̲̊e̲̊x̲̊t̲̊e̲̊ r̲̊i̲̊n̲̊g̲̊',
    combining: '̲̊', passthrough: true,
  },
  {
    name: 'Overline+Tréma',    category: 'Combinés', icon: 'T̈̅',
    desc: 'T̈̅ë̅ẍ̅ẗ̅ë̅ ̈̅ö̅v̈̅r̈̅',
    combining: '̈̅', passthrough: true,
  },
  {
    name: 'Caron+Souligné',    category: 'Combinés', icon: 'Ť̲',
    desc: 'Ť̲ě̲x̲̌ť̲ě̲ č̲ǎ̲ř̲',
    combining: '̲̌', passthrough: true,
  },
  {
    name: 'Point+Overline',    category: 'Combinés', icon: 'T̅̇',
    desc: 'Ṫ̅ė̅x̅ṫ̅ė̅ ṗ̅ȯ̅',
    combining: '̇̅', passthrough: true,
  },
  {
    name: 'Tilde+Barré',       category: 'Combinés', icon: 'T̴̶',
    desc: 'T̴̶ẽ̶x̴̶t̴̶ẽ̶ ̴̶t̴̶l̴̶d̴̶',
    combining: '̴̶', passthrough: true,
  },
  // ── Diacritiques dessous ───────────────────────────────────────────
  {
    name: 'Brève dessous',     category: 'Diacritiques', icon: 'T̮',
    desc: 'T̮e̮x̮t̮e̮ ̮b̮r̮ê̮v̮e̮',
    combining: '̮', passthrough: true,
  },
  {
    name: 'Circonflexe dss',   category: 'Diacritiques', icon: 'Ṱ',
    desc: 'Ṱḙx̭ṱḙ ̭c̭i̭r̭c̭',
    combining: '̭', passthrough: true,
  },
  {
    name: 'Pont dessous',      category: 'Diacritiques', icon: 'T̪',
    desc: 'T̪e̪x̪t̪e̪ ̪b̪r̪i̪d̪g̪e̪',
    combining: '̪', passthrough: true,
  },
  {
    name: 'Cédille',           category: 'Diacritiques', icon: 'Ţ',
    desc: 'Ţȩx̧ţȩ ̧ç̧ȩ̀ḑ',
    combining: '̧', passthrough: true,
  },
  {
    name: 'Ogonek',            category: 'Diacritiques', icon: 'Tę',
    desc: 'Te̖x̖te̖ ̖o̖g̖o̖n̖e̖k̖',
    combining: '̖', passthrough: true,
  },
  {
    name: 'Signe moins dss',   category: 'Diacritiques', icon: 'T̠',
    desc: 'T̠e̠x̠t̠e̠ ̠m̠i̠n̠u̠s̠',
    combining: '̠', passthrough: true,
  },
  {
    name: 'Virgule dessous',   category: 'Diacritiques', icon: 'Tȩ',
    desc: 'Te̗x̗te̗ ̗v̗i̗r̗g̗',
    combining: '̗', passthrough: true,
  },
  {
    name: 'Astérisque dss',    category: 'Diacritiques', icon: 'T͙',
    desc: 'T͙e͙x͙t͙e͙ ͙a͙s͙t͙',
    combining: '͙', passthrough: true,
  },
  {
    name: 'X dessous',         category: 'Diacritiques', icon: 'T͓',
    desc: 'T͓e͓x͓t͓e͓ ͓x͓ ͓b͓',
    combining: '͓', passthrough: true,
  },
  {
    name: 'Candrabindu',       category: 'Diacritiques', icon: 'T̐',
    desc: 'T̐e̐x̐t̐e̐ ̐c̐a̐n̐d̐',
    combining: '̐', passthrough: true,
  },
  {
    name: 'Brève inversée',    category: 'Diacritiques', icon: 'T̑',
    desc: 'T̑ȇx̑t̑ȇ ̑b̑ȓv̑',
    combining: '̑', passthrough: true,
  },
  {
    name: 'Flèche gauche',     category: 'Diacritiques', icon: 'T⃐',
    desc: 'T⃐e⃐x⃐t⃐e⃐ ←',
    combining: '⃐', passthrough: true,
  },
  {
    name: 'Flèche droite',     category: 'Diacritiques', icon: 'T⃑',
    desc: 'T⃑e⃑x⃑t⃑e⃑ →',
    combining: '⃑', passthrough: true,
  },
  {
    name: 'Flèche haut',       category: 'Diacritiques', icon: 'T⃒',
    desc: 'T⃒e⃒x⃒t⃒e⃒ ↑',
    combining: '⃒', passthrough: true,
  },
  // ── Combinés avancés ───────────────────────────────────────────────
  {
    name: 'Barré+Tréma',       category: 'Combinés', icon: 'T̶̈',
    desc: 'T̶̤ë̶ẍ̶ẗ̶ë̶ ̶̈d̶̈b̶̈l̶̈',
    combining: '̶̤', passthrough: true,
  },
  {
    name: 'Overline+Point',    category: 'Combinés', icon: 'Ṭ̅',
    desc: 'Ṭ̅e̅x̅t̅ė̅ ̅o̅v̅ṗ̅',
    combining: '̣̅', passthrough: true,
  },
  {
    name: 'Triple souligné',   category: 'Combinés', icon: 'T͟',
    desc: 'T͟e͟x͟t͟e͟ t͟r͟i͟p͟l͟e͟',
    combining: '͟', passthrough: true,
  },
  {
    name: 'Barré+Circonf.',    category: 'Combinés', icon: 'T̶̂',
    desc: 'T̶̂ê̶x̶̂t̶̂ê̶ ̶̂ĉ̶ö̶m̶̂b̶̂',
    combining: '̶̂', passthrough: true,
  },
  {
    name: 'Tilde+Overline',    category: 'Combinés', icon: 'T̅̃',
    desc: 'T̅̃e̅̃x̅̃t̅̃e̅̃ ̅̃t̅̃l̅̃d̅̃',
    combining: '̃̅', passthrough: true,
  },
  {
    name: 'Macron+Point',      category: 'Combinés', icon: 'T̄̇',
    desc: 'Ṫ̄ė̄x̄ṫ̄ė̄ ̄ṁ̄c̄ṙ̄',
    combining: '̄̇', passthrough: true,
  },
  {
    name: 'Point+Tréma',       category: 'Combinés', icon: 'T̈̇',
    desc: 'T̈̇ë̇ẍ̈ẗ̈ë̈ ̈ḋ̈b̈ḷ̈',
    combining: '̈̇', passthrough: true,
  },
  {
    name: 'Aigu+Rond',         category: 'Combinés', icon: 'T̊́',
    desc: 'T̊́e̊́x̊́t̊́e̊́ ̊́ṙ̊i̊́ǹ̊g̊́',
    combining: '̊́', passthrough: true,
  },
  {
    name: 'Grave+Souligné',    category: 'Combinés', icon: 'T̲̀',
    desc: 'T̲̀è̲x̲̀t̲̀è̲ ̲̀g̲̀r̲̀à̲v̲̀',
    combining: '̲̀', passthrough: true,
  },
  {
    name: 'Overline+Rond',     category: 'Combinés', icon: 'T̅̊',
    desc: 'T̅̊e̅̊x̅̊t̅̊e̅̊ ̅̊r̅̊i̅̊ǹ̅g̅̊',
    combining: '̅̊', passthrough: true,
  },
  {
    name: 'Double+Point',      category: 'Combinés', icon: 'Ṫ̶̵',
    desc: 'T̶̵ẋ̶t̶̵ė̶ ̶d̶̵ḃ̶l̶̵',
    combining: '̶̵', passthrough: true,
  },
  // ── Zalgo ──────────────────────────────────────────────────────────
  {
    name: 'Zalgo Léger',       category: 'Zalgo', icon: 'T̸̡',
    desc: 'T̷̡e̴̛x̵͜t̸͢e̴ z͟a̷l̵g͝o͞',
    combining: '̵͜', passthrough: true,
  },
  {
    name: 'Zalgo Moyen',       category: 'Zalgo', icon: 'T̶͓̈',
    desc: 'T̷̛͓̈e̸̡͒x̴͜͟t̵͢͝e̸ ͟z̷͡a̴l̵g͝ö͡',
    combining: '̶͓̈', passthrough: true,
  },
  {
    name: 'Zalgo Fort',        category: 'Zalgo', icon: 'T̵̡̛͓',
    desc: 'Ţ̴̡͟͞͡ẽ̸̢̨̢͝x̵̛͢͟t̷̴̡͢͞ě̸̡͢͢͞ ̴̸̡͘͟z͘',
    combining: '̷̨̨̡̛', passthrough: true,
  },
  // ── Leet & Spécial ─────────────────────────────────────────────────
  {
    name: 'Leet Speak',        category: 'Spécial', icon: '1337',
    desc: '1337 5p34k h4x0r',
    upperMap: '4BCD3FGH1JK1MN0PQR57UVWXY2',
    lowerMap: '4bcd3fgh1jk1mn0pqr57uvwxy2',
    digitMap: '0123456789',
  },
  {
    name: 'Vaporwave',         category: 'Spécial', icon: 'Ｖ',
    desc: 'Ａ Ｅ Ｓ Ｔ Ｈ Ｅ Ｔ Ｉ Ｃ',
    upperMap: FULLWIDTH_UPPER, lowerMap: FULLWIDTH_LOWER, digitMap: FULLWIDTH_DIGITS,
  },
  {
    name: 'Médiéval',          category: 'Spécial', icon: '𝕸',
    desc: '𝕸é𝖉𝖎é𝖛𝖆𝖑 𝖌𝖔𝖙𝖍𝖎𝖈',
    upper: 0x1D56C, lower: 0x1D586,
  },
  {
    name: 'Cursif fin',        category: 'Spécial', icon: '𝒯',
    desc: '𝒯ℯ𝓍𝓉ℯ 𝒸𝓊𝓇𝓈𝒾𝒻',
    upper: 0x1D49C, lower: 0x1D4B6,
    upperExceptions: { B:'ℬ', E:'ℰ', F:'ℱ', H:'ℋ', I:'ℐ', L:'ℒ', M:'ℳ', R:'ℛ' },
    lowerExceptions: { e:'ℯ', g:'ℊ', o:'ℴ' },
  },
  {
    name: 'Overline+Barré',    category: 'Combinés', icon: 'T̶̅',
    desc: 'T̶̅e̶̅x̶̅t̶̅e̶̅ ̶̅o̶̅v̶̅b̶̅r̶̅',
    combining: '̶̅', passthrough: true,
  },
  {
    name: 'Souligné+Rond',     category: 'Combinés', icon: 'T̲̊',
    desc: 'T̲̊e̲̊x̲̊t̲̊e̲̊ ̲̊r̲̊i̲̊n̲̊g̲̊',
    combining: '̲̊', passthrough: true,
  },
  {
    name: 'Circonf.+Point',    category: 'Combinés', icon: 'T̂̇',
    desc: 'T̂̇ê̇x̂̇t̂̇ê̇ ̂̇ĉ̇ö̂m̂̇',
    combining: '̂̇', passthrough: true,
  },
  {
    name: 'Aigu+Tréma',        category: 'Combinés', icon: 'T̈́',
    desc: 'T̈́ë́ẍ́ẗ́ë́ ̈́ä́ḯg̈ǘ',
    combining: '̈́', passthrough: true,
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
