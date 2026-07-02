# Audit ForgeHook — 2026-07-02

**Auditeur :** Claude Code (Fable 5)
**Périmètre :** backend Hono.js (auth, routes, services, DB), config, artefacts frontend
**Verdict :** Backend **bien durci** (audits précédents solides). Aucune faille critique/haute. Quelques correctifs mineurs appliqués + nettoyage.

## Points positifs (déjà en place)
- **Auth** : `JWT_SECRET` validé au boot (refus des valeurs par défaut), bcrypt cost 12, JWT 7 j, rate-limit login (5 essais / 15 min → ban 1 h).
- **Autorisation** : `requireAuth` sur **toutes** les routes API (sauf `GET /uploads/file/:filename`, public par conception pour servir les images).
- **Injection SQL** : prepared statements partout (better-sqlite3), y compris le bulk-delete (placeholders générés).
- **SSRF** : URL webhook forcée sur l'hôte Discord (zod `.refine`) ; URL RSS filtrée (`isSafeUrl` bloque loopback/privé/link-local).
- **Uploads** : path traversal neutralisé (`resolve` + `startsWith`), whitelist MIME/extension, taille max 5 Mo, noms `randomUUID`.
- **DB** : WAL, `foreign_keys=ON`, `secure_delete=ON`, `busy_timeout`.
- **Erreurs** : `onError` global renvoie un message générique (pas de stack trace exposée).

## Correctifs appliqués (v3.0.0 → v3.1.1)

| # | Sévérité | Correctif |
|---|----------|-----------|
| 1 | FAIBLE | **Path injection** : `messageId` (routes DELETE/PATCH `/discord/messages/...`) était interpolé brut dans l'URL Discord. Ajout d'une validation `^\d{1,25}$` (snowflake) avant le fetch + timeout sur le DELETE. |
| 2 | FAIBLE | **SSRF défense en profondeur** : `isSafeUrl` factorisé dans `utils/ssrf.ts` et **re-validé au fetch** dans `checkFeed` (le poller lisait l'URL depuis la DB sans re-contrôle → lignes héritées/altérées). |
| 3 | FAIBLE | **Validation bulk-delete** : `DELETE /history/bulk` acceptait `ids` sans typage → filtrage strict `Number.isInteger` + cap à 1000. |
| 4 | INFO | **Dérive de version** : `/health` renvoyait `2.2.0` (hardcodé) alors que l'app est en 3.x. Corrigé → `3.1.1`. `package.json` back/front alignés 3.0.0 → **3.1.1**. |
| 5 | HYGIÈNE | **43 artefacts parasites** (`.vue.js`/`.js` de compilation TS) supprimés de `frontend/src/` + `.gitignore` durci pour empêcher la récidive. |

## Résidus assumés (faibles, app mono-admin self-hosted)
- **Secrets au repos en clair** : tokens de bot et URL de webhook (qui contiennent le token) stockés en clair dans SQLite. Acceptable ici (DB en volume Docker, un seul admin) ; un chiffrement au repos serait un plus si multi-tenant un jour.
- **SSRF via DNS rebinding / redirection** : `isSafeUrl` valide le hostname, pas l'IP résolue au fetch ni les redirections suivies par `rss-parser`. Risque faible en mono-admin. Documenté dans `utils/ssrf.ts`.

## Vérifications
- `tsc --noEmit` backend : **OK**. `vue-tsc --noEmit` frontend : **OK** (suppression des artefacts sans régression).
