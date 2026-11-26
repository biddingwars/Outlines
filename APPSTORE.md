# Outlines: App Store release checklist

Written on 26 November 2026, at v19, for the move to Xcode on 28 November. It follows Bidding Wars'
`APPSTORE.md` (same shell, same wrapper) and adds what is particular to Outlines.

**"You"** marks something only the account holder can do: App Store Connect, the Xcode project, a real
device. Nothing here has run on a real iPhone or iPad yet, and the repository has no native project.

## 1. What the App Review Guidelines ask, and where Outlines stands

| Guideline | Status |
|---|---|
| 1.1.1 Objectionable content | Done. Bot lines tease the player, never a country. Fun facts are neutral. |
| 1.3 Kids Category | **You: do not pick it.** The support page links to GitHub. The game suits all ages without it. |
| 1.5 Developer information | **You: add an email address to `support.html`.** Today the only contact is a GitHub issue, which needs an account. |
| 2.1 Completeness | Done in code: no placeholder or "coming soon" content. **You: play it on a real iPhone and iPad, in airplane mode, before submitting** (section 5). |
| 2.3 Accurate metadata | **You:** take screenshots from the build you submit. Do not mention online play; there is none. |
| 2.5.2 Self-contained | Done. No network at runtime, no remote code; everything is bundled. **You: bundle the files (section 3); never point the wrapper at the website.** |
| 3.1 Payments | Not applicable: nothing is sold, no ads. |
| 4.2 Minimum functionality | A full offline game with finger drawing, haptics, sound and its own interface, in 13 languages. |
| 5.1.1 Privacy policy | Done: `privacy.html`, bundled and linked in the game (Privacy → Privacy policy). **You: enter its URL in App Store Connect.** |
| 5.1.2 Data use | Done: nothing is collected. The optional game log stays on the device and leaves it only when the player shares it. |
| 5.2 Intellectual property | Done: sources and licences in `NOTICE.md` and in Privacy → Credits & licences (world-countries ODbL, Unicode CLDR, Natural Earth, US Census, NASA imagery, three.js MIT). |
| 5 Local laws | **You decide.** The Countries pack lists Taiwan and Kosovo as countries with their own flags, and the globe draws Natural Earth's borders. Leave out storefronts where that is a problem (mainland China, for example), or accept the risk. |

## 2. App Store Connect answers

- **Name:** Outlines. **Subtitle idea:** "Guess the place. Draw it from memory."
- **App Privacy:** *Data Not Collected.*
- **Privacy Policy URL:** `https://biddingwars.github.io/Outlines/privacy.html`
- **Support URL:** `https://biddingwars.github.io/Outlines/support.html`
- **Age rating:** every content question "None". No gambling, contests, web access, user-generated content, messaging or ads.
- **Category:** Games → Trivia (or Word); secondary Education.
- **Export compliance:** no encryption of its own. Set `ITSAppUsesNonExemptEncryption` to `NO`.
- **Review notes:** no sign-in needed; the game is fully offline.
- **Content rights:** third-party content with rights (all credited in the app).

## 3. The native wrapper (Capacitor, as for Bidding Wars)

`platform.js` already talks to Capacitor when it is there (`Preferences`, `Haptics`, `Keyboard`,
`StatusBar`, `SplashScreen`).

1. **Bundle the game files**, flat as they are: `index.html`, `app.css`, the root `.js` files, `manifest.json`, the images, `countries-110m.json`, `privacy.html` and `support.html`.
   - Leave out the folders `engine/`, `packs/`, `tools/`, `tests/`, `docs/` and `dist/`.
   - Leave out the files `package.json`, `*.md` and `sw.js`.
   - Never set `server.url`: the app must start in airplane mode on first launch.
2. **Privacy manifest (`PrivacyInfo.xcprivacy`).**
   - Set `NSPrivacyTracking` to false, with no tracking domains and no collected data types.
   - Preferences uses `UserDefaults`: declare `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1`.
3. **No usage-description strings:** the game asks for no permission. Don't add plugins that need one.
4. **Share sheet for the game log.** Settings → Record my games → Export uses `navigator.share` with a file. If the iOS web view does not offer it, the game falls back to Copy. That is enough for beta testers. For the App Store build you can add Capacitor's Share plugin later.
5. **Keyboard.** The guess box sits above the keyboard through the Keyboard plugin (`resize`). Check it on the smallest supported iPhone (section 5).
6. **iPad.** All four orientations, with a launch screen.
7. **Service worker.** Not registered inside the app (`Native.is`), which is right: the files are already local.
8. **Icons.** Use `icon-1024.png` (1024 × 1024, no transparency) for the App Store. Xcode makes the rest from it.

## 4. Before release (not code)

- **Native-speaker review** of the 8 added languages (pt-BR, id, zh, hi, ja, ko, ar, th). The texts are complete but machine-careful, not native.
- **Spot-check the US state facts** in `packs/us-states/data.js` (ranks, highest points, nicknames, landmarks, fun facts). They were compiled by hand.
- **Support email** (1.5 above).

## 5. Test on a real device (no simulator can stand in for these)

- **Fresh install in airplane mode:**
  1. Play one Countries game and one US States game to the end.
  2. Check that the results globe and the US map appear.
- **Finger drawing:**
  - Draw, then tap Undo, Clear or Done **right after** lifting the finger.
  - The browser test could not settle this; a fix in v19 makes sure the game never cancels such a tap.
  - Draw several strokes quickly, and draw close to the canvas edge.
- **Typing:**
  - Check the keyboard does not cover the guess box or the suggestions.
  - Tapping a suggestion must count as a guess.
  - Try a name with an accent ("Côte") and an abbreviation ("USA").
- **Timers:**
  - Lock the phone during a clue and during a drawing, and take a call. On unlock, no time should have been lost.
- **Long games:** 30 rounds against 3 bots. The results must fit, with each column scrolling, and "Lift every bar" must take about 1.5 s.
- **Accessibility:** run VoiceOver through one whole game, and set Dynamic Type to its largest.
- **Sizes:** check the smallest iPhone you support (iPhone SE).
- **Pass and play:** two players on one phone.
- **Arabic:** right to left, the whole game.
- **Data:**
  - Settings → Record my games → Export → Share, then Copy.
  - Privacy → Delete all data, then restart.
- **Sound:** the silent switch on and off (the game uses the "ambient" audio session).

## 6. Checked in this repository at v19 (browser, automated)

- 145 unit tests.
- 480 fuzzed games with about 34,000 random and illegal actions.
- Every text in 13 languages.
- The offline cache list.
- The interface in 8 size, language and theme setups, from 320 px to 1366 px.
- Human-like play-tests on a phone-sized touch screen:
  - Countries (Beginner, Standard in Arabic) and US States (Master, 10 rounds);
  - pass-and-play with two players and a bot;
  - typing, suggestions, wrong guesses, timers running out, Undo, Clear, Done, the reveal, the round end and the results;
  - the record and the game log after a reload.

  No errors.
