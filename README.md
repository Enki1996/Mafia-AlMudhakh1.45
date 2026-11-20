# مافيا المذخر — Complete Online Game Replacement (v4.5)

This is a **new standalone Node.js + Express + Socket.IO replacement project**, assembled from the latest approved designs and supplied artwork. **It is NOT a verified patch against your original `Enki1996/mafia-nights` repository**, because the original source was not accessible in this session. Back up the old repository and test this build on a separate Railway service before replacing a live deployment.

## Included screens

- Home: latest Iraqi Arabic copy, responsive cinematic background MP4, official illustrated logo and characters, create/join forms, rules.
- Narrator waiting room: static warehouse backdrop, real room code/invite, live player list, Mafia count, optional Doctor/Detective, and conditional Silencer count.
- Player waiting room: static backdrop, official logo, hourglass, rules popup, real invitation and participants.
- End-of-round player: envelope/role-card reveal, all five supplied double-headed cards, alternating 0°/180° orientation on successive reveals, own role description, teammate list (Mafia only), private action selector.
- End-of-round narrator: live action-progress overview, player actions and target names, resolve-night command.
- Day: face-to-face accusations and voting; narrator records an elimination or no elimination. Silenced players get a warning, and detective privately gets investigation results.
- Game end/rematch: win condition and new game in the same room.

## Mechanics and privacy

- Room codes, session tokens, role assignments and game state are generated **server-side**.
- Player names are **actual connected lobby members**, not hardcoded accounts.
- **Mafia** has two variants: `mafia_killer` and `mafia_silencer`. Both are counted within total Mafia.
- Each living killing-Mafia member submits a target. **All active killers must agree** to perform the end-of-round elimination. Killers cannot target any Mafia teammate.
- Silencers may target **any living player, including themselves or a Mafia teammate**, to divert suspicion. They **cannot choose the same player in consecutive rounds**. Restrictions are enforced on the server and only committed after the round resolves.
- If **no active killing Mafia remains**, the first living Silencer is promoted to **Killing Mafia** on the server. Their role card, description, target action and teammate projection update automatically. If other Silencers remain, the process can happen again after the promoted killer dies.
- Doctor protects one player, including themself, but **cannot protect the same target in consecutive rounds**. Detective privately learns the alignment of one target; the **narrator also sees each investigation result (Mafia confirmed / not Mafia) on the end-of-round results screen**. Other players do not receive those results.
- Mafia players receive the names, role subtypes and alive statuses **only of other Mafia players**. Non-Mafia players never receive other players' secret roles or end-of-round targets. The narrator receives privileged information. The **secret-action progress counter is only sent to the narrator**, never to players.
- Only the server validates and resolves end-of-round actions. The player browser cannot choose or overwrite its assigned role.
- One narrator-recorded elimination per day; no phone-based voting (the group votes physically). The narrator can **kick a player before or after the game starts**. In an active game, kicked players forfeit their place, action targets are cleared, Mafia promotion and winner checks run, and their session tokens are revoked. In the lobby, kicking removes the player from the list.
- Players can refresh their page in the **same browser tab** and resume using a session token stored in `sessionStorage`. Do not share the narrator's device/session.

## Install and run

Requires **Node.js 20+**.

```bash
npm install
npm start
```

Open `http://localhost:3000` for local development. You can set `PORT` in the environment.

Tests (do not require an internet connection once Node is installed):

```bash
npm test
```

## Deploy to Railway from GitHub

1. **Back up** your existing `Enki1996/mafia-nights` repository before replacing anything. Prefer a separate branch and separate Railway service for this build.
2. Extract the ZIP; upload its **contents** (`server.js`, `game-logic.js`, `package.json`, `railway.json`, `public/`, and `test/`) to the repository **root**. Do not upload only the ZIP or keep the outer folder as an extra level.
3. If the existing repo still has an **old `package-lock.json`**, remove it or regenerate it locally with `npm install` so it matches this new `package.json`. Railway should use Node/Nixpacks and run `npm start` (already set in `package.json` and `railway.json`). Keep the Railway public URL for inviting players.
4. For room persistence, attach a Railway Volume at `/data` and set `MAFIA_DATA_DIR=/data`. The app writes `almudhakhar-rooms-v1.json`, deliberately avoiding collision with an older game's room file. With no volume, rooms exist only in memory and disappear on server restart/redeploy.
5. Test with several devices, including narrator reconnection, player reconnection, Mafia teammate secrecy, all five card displays, the Silencer promotion, win conditions, and role assignment before migrating the production URL.

## Deployment notes

- Socket.IO requires a working long-running Node service (Railway is suitable). **GitHub Pages alone cannot run the backend.**
- This ZIP does not include a `node_modules` folder or credentials; Railway runs `npm install` during build.
- The `public/assets/background.mp4` is used on the home screen only. Other pages use the supplied **static** backgrounds.
- This is a replacement architecture, not a database migration from the old game. Existing live rooms cannot be guaranteed to survive switching codebases.
- The user-provided game cards' Arabic role names are baked into the images; if the UI is switched to English, the additional translated role label appears under the card.
- **Automated tests cover the pure game-logic module.** The earlier replacement build was checked with mocked Socket.IO. For v4.5, game logic, privacy, moderation, typography and version checks pass. Offline visual rendering was checked with mocked room states in Chromium on mobile and desktop. A live Railway deployment and multi-device real-time test are still required.

## Key files

- `server.js`: authorized Socket.IO events, persistence, room management.
- `game-logic.js`: secure room/role/action/round and Silencer promotion rules.
- `public/index.html`, `public/styles.css`, `public/app.js`: screens and interactive UI.
- `public/assets/`: original logo, backgrounds, video, five cards, classified envelope, hourglass, characters.
- `test/game-logic.test.js`: automated role privacy and game-rule tests.


## V1.1 — updates (November 13, 2026)

- Room settings note now explains when the Silencer can be enabled and how a surviving Silencer inherits the Killing Mafia role.
- Waiting-room hourglass replaced by the user's transparent PNG (optimized as alpha-preserving WebP).
- End-of-round action selection is an accessible grid of all players, not a dropdown. Eliminated players are disabled. Killing Mafia cannot target allies, but Silencers may target themselves or allies; forbidden repeats from the previous round are disabled and validated by the server.
- Rules dialog now uses numbered step cards and colored role panels, matching the approved mockup.
- `designed by WEBNEXIQ ✦ ENKI` appears in every page footer.
- All room phases have visible leave buttons. Leaving during a live game is a deliberate, irreversible **forfeit** (unlike an accidental network disconnect): server marks the player eliminated, revokes the session token on all connected devices, clears submitted action, processes any Mafia promotion, and re-checks winner. The narrator leaving closes the room for everyone; this is stated in the confirmation dialog.
- Leaving players do not reappear when the narrator resets the room for another game.

### Deployment caution

This is an updated version of the V1 replacement project created in ChatGPT, **not an in-place patch of your original GitHub source**. Back up your original repo before changing it, and test in a separate Railway service. Set `MAFIA_DATA_DIR` to a persistent directory when using Railway volumes.


## v1.3 — layout and wording update (November 13, 2026)

- Every page footer now contains **only** the credit `designed by WEBNEXIQ ✦ ENKI` and **v1.3**; the previous narrator slogan and footer action buttons have been removed.
- During a room session the **Rules** and **Leave room** controls are available together in a small toolbar immediately beneath the header, including the waiting room and active rounds. The home page keeps the Rules button next to the room creation form.
- On mobile, the secret **role identification and envelope reveal panel comes before the role's secret-action panel**; desktop retains its original two-column order.
- The double-headed role card is larger on reveal: up to 292px wide on desktop and 248px on mobile.
- All UI and player-facing messages use **نهاية الجولة** / **end-of-round phase** in place of references to night/ليل. The internal game state remains `phase:'night'` and the Socket.IO events remain named `night:submit` and `night:resolve` for compatibility: these are code identifiers, not visible UI text.
- No changes to role privacy, live room codes, Silencer succession, or elimination mechanics.

## Update v1.35

- The narrator action button reads `إنهاء الجولة وإعلان النتيجة`.
- Active round headings and status badges display only the round number (`الجولة 3`, `Round 3`), rather than naming the phase. Internal state identifiers remain unchanged.
- On every screen the footer has `مافيا المذخر - نسخة 1.35` on the right and `designed by WEBNEXIQ ✦ ENKI` on the left, including small phones.


## Update v1.4 — Typography theme (November 13, 2026)

- Footer now reads `مافيا المذخر - نسخة 1.4` on the right, with `designed by WEBNEXIQ ✦ ENKI` on the left. English reads `Mafia Al-Mudhakhar - Version 1.4`.
- Font hierarchy lives in **`public/theme.css`**. Arabic large headings prefer Retro Brush Arabic (only if an appropriately licensed copy is supplied), interface role headings and primary buttons use Lalezar, secondary buttons use Digi Maryam where supplied, long descriptions use Tajawal, and English uses Outfit.
- Original logo, role artwork, layout, room logic, and Silencer rules are unchanged.
- **Custom font binaries are not bundled.** See `FONT_SETUP.md` for installation and copyright/licensing notes. The styles have sensible fallbacks without those local files.
- Change the `GAME_VERSION` constant in `public/app.js` plus `package.json` on later releases.


## Update v4.5 — Gameplay and narrator controls (November 20, 2026)

1. Silencers may now silence **themselves and Mafia teammates** to redirect accusations. The exact same target is prohibited in **two consecutive rounds**. The last submitted target is recorded when the round resolves; editing a pending selection during a round is allowed.
2. Doctors may still save themselves but **cannot protect the same person in consecutive rounds**. An unsubmitted round does not count as a repeated target.
3. Detective investigations now display on the **narrator-only results** as confirmed Mafia / not Mafia, including the target name. The Detective's private history still works. The narrator also retains the results on a victory screen when the game ends immediately.
4. Secret action progress is now **restricted to the narrator**: the shared count and meter are removed from player views and omitted entirely from their server payload.
5. Narrator **Kick** controls appear on every player roster, including the waiting room, active rounds, and game-end screen. This is a real `room:kick` Socket.IO event authorized only for the narrator. Kicking during play forfeits the player, cancels their target and any actions targeting them, revokes their old token, and applies promotion/win checks. Offline clients cannot resume with a revoked token.
6. The original Arabic/English numbered Rules dialog and colored role cards are **visually unchanged**, with updated ability and moderation descriptions.
7. Footer version is **مافيا المذخر - نسخة 4.5** on the right and the linked **designed by WEBNEXIQ ✦ ENKI** on the left. `package.json` is `4.5.0`.

### Important operational notes

- **Kick is removal, not a permanent ban.** A player kicked from a lobby could rejoin with a new session if they still know the invite code; preventing re-entry would require a persistent identity or a ban mechanism. Once the game has started, new players cannot join that active room.
- **Room data:** a Railway persistent volume and `MAFIA_DATA_DIR` preserve game state on restarts. Existing room persistence is compatible with missing previous-target fields; fresh fields are populated when new actions resolve.
- **Source provenance:** This ZIP is an update to the *replacement* game created during this chat, not a verified patch against the separate original GitHub repository. Please stage and test before replacing a live service.
- **Font licenses:** Custom font binaries are not redistributed in this ZIP. Retro Brush is personal-use-only unless you have obtained web-use rights. See `FONT_SETUP.md`.
