// Garde SSRF partagée : rejette les URL vers des adresses privées/loopback/link-local.
//
// Limite connue : la validation porte sur le hostname fourni. Elle ne protège pas
// contre le DNS rebinding (domaine public résolvant vers une IP privée) ni contre
// une redirection HTTP vers une cible interne. Pour ForgeHook (mono-admin,
// self-hosted) le risque résiduel est faible ; la garde est appliquée à la
// création ET au fetch (défense en profondeur).

const SSRF_BLOCK =
  /^(localhost|127\.\d+\.\d+\.\d+|::1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|fd[0-9a-f]{2}:|fc[0-9a-f]{2}:)$/i

export function isSafeUrl(raw: string): boolean {
  try {
    const { protocol, hostname } = new URL(raw)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    return !SSRF_BLOCK.test(hostname)
  } catch {
    return false
  }
}
