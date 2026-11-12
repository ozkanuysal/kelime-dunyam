# Kelime Dünyam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public GitHub Pages site with flip cards for learning English words. Each card has an AI image on the front and a Turkish meaning, story and example sentence on the back. The owner ticks learned words. Add a `/kelime` skill that adds batches of 50 words.

**Architecture:** The site is static: `index.html`, `kuyruk.js` (pure queue logic), `kelimeler.json` and `resimler/*.webp`. Ticks follow the `/gelisim` pattern: `tikler.json` on a separate `tikler` branch, written through the GitHub API with a token the owner enters in the browser; visitors use `localStorage`. The skill script `kelime.py` reads ticks, adds cards with validation, generates images through AI Horde, and removes a tick through `gh api`.

**Tech Stack:** Plain HTML, CSS and JS with no libraries. Node 22 (`node --test`) for JS tests. Python 3.14 standard library only (`unittest`, `urllib`). Pillow and pytest are not installed, and the plan does not need them. AI Horde anonymous API for images. `gh` CLI, already logged in as `ozkanuysal`.

**Spec:** `docs/superpowers/specs/2026-11-12-kelime-dunyam-design.md`

## Global Constraints

- Repo: `~/projeler/kelime-dunyam`; GitHub `ozkanuysal/kelime-dunyam`, public. Site: `https://ozkanuysal.github.io/kelime-dunyam/`.
- Skill: `~/.claude/skills/kelime/` (`SKILL.md`, `kelime.py`, `test_kelime.py`).
- Commit identity in the repo: `ozkanuysal <61411331+ozkanuysal@users.noreply.github.com>`.
- Commit messages are in Turkish, one line. They never carry `Co-Authored-By` or any line that names Claude. The user's memory rule overrides the harness reminder.
- Git push and pull use `-c credential.helper='!gh auth git-credential'`, as in `/gelisim`.
- Never ask for, read or write the user's GitHub token. Never put personal data in the repo, because the site is public.
- Browser storage keys: `kelime-anahtar` (token) and `kelime-tikler-yerel` (visitor ticks). They must differ from gelisim's keys, because both sites run on the same origin.
- Card types: `tur` takes one of `isim`, `eylem`, `sifat`. Function words such as `the`, `of`, `a` and `to` never enter the list.
- Theme: dark, from option B of the mockup. `--bg:#0e1424`, `--kart:#18213a`, `--yuzey:#1f2a4a`, `--yazi:#e8ecf5`, `--vurgu:#7c9cff`, `--cizgi:#ffffff1a`.
- Image service: AI Horde, `https://aihorde.net/api/v2`, header `apikey: 0000000000`, header `Client-Agent: kelime-kart:1.0:anonymous`. Images are 512×512 WebP and are stored as returned, with no resize. A watermarked result counts as a failure.
- The site never shows a half-finished batch. Commit cards locally as they are made and push only when all 50 of the batch are in.
- Commands get short timeouts of 10–60 s. Long loops run in the background and are polled briefly.
- Windows programs are not started from WSL, except a headless browser for screenshots.

## Review Focus

1. **`kelimeler.json` fails to load or is empty.** The page shows a readable message instead of a broken card. Pinned in Task 3, Step 3 (check list) and covered by `siradaki` with an empty list in Task 1.
2. **Every word is ticked.** "Hepsi bitti" shows and the buttons are hidden. Pinned in Task 1 (`siradaki` returns `null`) and Task 3.
3. **A tick for an id that is no longer in the list.** Progress never reads "51 / 50". Pinned in Task 1 (`ilerleme` counts only known ids) and Task 2 (`ozet_hesapla`).
4. **An image file is missing (404).** The card still works and the word stays readable. Pinned in Task 3 (`onerror` hides the `<img>`).
5. **The same word comes back with different case or spaces (`"Cat "` vs `"cat"`).** `ekle` and `kontrol` reject it. Pinned in Task 2.

---

### Task 1: Repo skeleton and queue logic

**Files:**
- Create: `~/projeler/kelime-dunyam/kuyruk.js`
- Create: `~/projeler/kelime-dunyam/test/kuyruk.test.js`
- Create: `~/projeler/kelime-dunyam/kelimeler.json` with content `{"kelimeler": []}`
- Create: `~/projeler/kelime-dunyam/.nojekyll` (empty), `README.md` (2–3 lines in Turkish: what the site is, its address)
- Move: the spec to `docs/superpowers/specs/2026-11-12-kelime-dunyam-design.md` and this plan to `docs/superpowers/plans/2026-11-12-kelime-dunyam.md`

**Interfaces:**
- Produces, in browser and Node: `kuyruk.js` sets `window.Kuyruk` in the browser and `module.exports` in Node. Use a UMD-style wrapper without libraries.
  - `Kelime = {id, en, tur, tr, hikaye, ornek_en, ornek_tr, sahne, resim, parti, sira}`
  - `Tikler = {[id: string]: true}`
  - `siradaki(kelimeler: Kelime[], tikler: Tikler, simdikiId: string|null, yon: 1|-1) -> Kelime|null`. Returns the next unlearned word after `simdikiId` in `sira` order (or the previous one when `yon=-1`) and wraps at the ends. If `simdikiId` is `null` or unknown, it returns the first unlearned word. It works when `simdikiId` itself is now ticked, by using that word's `sira`. It returns `null` when no word is left.
  - `ilerleme(kelimeler: Kelime[], tikler: Tikler) -> {ogrenilen: number, toplam: number}`. Counts only ids that exist in `kelimeler`.
  - `hikayeParcalari(metin: string) -> {metin: string, kalin: boolean}[]`. Splits on `**`; odd segments are bold. An unclosed `**` leaves the rest plain. Empty segments are dropped.

- [ ] **Step 1: Create the repo**

```bash
mkdir -p ~/projeler/kelime-dunyam && cd ~/projeler/kelime-dunyam && git init -q -b main
git config user.name ozkanuysal && git config user.email 61411331+ozkanuysal@users.noreply.github.com
mkdir -p docs/superpowers/specs docs/superpowers/plans test resimler
```

Move the spec and plan from the scratchpad path above.

- [ ] **Step 2: Write the failing tests in `test/kuyruk.test.js`** (`node:test`, `node:assert/strict`)

Fixture: `K = [{id:"a",sira:1},{id:"b",sira:2},{id:"c",sira:3}]`.
- `siradaki(K,{},null,1).id === "a"`
- `siradaki(K,{},"a",1).id === "b"`; `siradaki(K,{},"c",1).id === "a"` (wraps)
- `siradaki(K,{},"a",-1).id === "c"` (wraps backwards)
- `siradaki(K,{b:true},"a",1).id === "c"` (skips learned)
- `siradaki(K,{b:true},"b",1).id === "c"` (just ticked `b`, so it moves on)
- `siradaki(K,{a:true,b:true,c:true},"a",1) === null`; `siradaki([],{},null,1) === null`
- `ilerleme(K,{a:true,zzz:true})` deep-equals `{ogrenilen:1,toplam:3}`
- `hikayeParcalari("Ali **kedi** sever")` deep-equals `[{metin:"Ali ",kalin:false},{metin:"kedi",kalin:true},{metin:" sever",kalin:false}]`
- `hikayeParcalari("a **b")` deep-equals `[{metin:"a ",kalin:false},{metin:"b",kalin:false}]`

- [ ] **Step 3: Run the tests and see them fail**

Run: `cd ~/projeler/kelime-dunyam && node --test test/`
Expected: FAIL with `Cannot find module '../kuyruk.js'`.

- [ ] **Step 4: Implement the three functions in `kuyruk.js`**

- [ ] **Step 5: Run the tests and see them pass**

Run: `node --test test/`
Expected: all tests pass, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -q -m "Kelime Dünyam iskeleti ve sıra mantığı"
```

---

### Task 2: Skill script `kelime.py`

**Files:**
- Create: `~/.claude/skills/kelime/kelime.py`
- Create: `~/.claude/skills/kelime/test_kelime.py`

**Interfaces:**
- Consumes: `kelimeler.json` from Task 1 (`{"kelimeler": [Kelime...]}`).
- Produces these pure functions, which tests import with `importlib` from the script path:
  - `normal(s: str) -> str`: `s.strip().lower()`
  - `kontrol(veri: dict, adaylar: list[str]) -> list[str]`: the candidates already in the list, compared with `normal`
  - `kart_dogrula(kart: dict, veri: dict, repo: Path) -> list[str]`: returns Turkish error lines and an empty list when the card is valid. Required fields: `id, en, tur, tr, hikaye, ornek_en, ornek_tr, sahne, parti`. `id` matches `^[a-z0-9-]+$`. `tur` is one of `isim|eylem|sifat`. Both `id` and `normal(en)` are new. `repo/resimler/<id>.webp` exists. `parti` is an int ≥ 1.
  - `kart_ekle(veri: dict, kart: dict) -> dict`: sets `sira = max(sira)+1` (1 when empty) and `resim = "resimler/<id>.webp"`, then appends.
  - `ozet_hesapla(veri: dict, tikler: dict) -> dict`: returns `{ogrenilen, toplam, kalan, son_parti, siradaki}`. `siradaki` is the `en` of the lowest-`sira` unlearned word, or `None`. Only known ids count.
  - `webp_mi(b: bytes) -> bool`: `b[:4]==b"RIFF" and b[8:12]==b"WEBP"`
- Produces this CLI, run as `python3 -I ~/.claude/skills/kelime/kelime.py <komut>`:
  - `ozet`: fetch `origin/tikler`, then print `Öğrenilen: X / Y`, `Kalan: Z`, `Son parti: N`, `Sıradaki: <en>` and the site URL.
  - `kontrol <kelime>...`: print the duplicates or `yok`.
  - `resim <id> "<sahne>"`: generate an image and write `resimler/<id>.webp`. Exit 1 with a Turkish message on failure.
  - `ekle <kart.json>`: validate, add, and write `kelimeler.json` with `ensure_ascii=False, indent=1`. Do not commit.
  - `tik-geri <id>`: remove the owner's tick through `gh api`.

- [ ] **Step 1: Write the failing tests in `test_kelime.py`** (`unittest`, temporary repo dir with `tempfile`)

- `kontrol({"kelimeler":[{"en":"cat"}]}, ["Cat ","dog"]) == ["Cat "]`
- `kart_dogrula` on a full valid card with an existing `resimler/cat.webp` returns `[]`
- These each return a non-empty list: missing `hikaye`; `tur="noun"`; `id="Cat"`; the same `en` as an existing card in different case; no image file; `parti=0`
- `kart_ekle({"kelimeler":[]}, kart)["kelimeler"][0]["sira"] == 1` and its `resim == "resimler/cat.webp"`; a second card gets `sira == 2`
- `ozet_hesapla(veri_with_a_b, {"a":True,"zzz":True})` gives `ogrenilen == 1`, `toplam == 2`, `kalan == 1`, `siradaki == <b's en>`
- `webp_mi(b"RIFF\0\0\0\0WEBPVP8 ")` is true and `webp_mi(b"\xff\xd8\xff")` is false

- [ ] **Step 2: Run the tests and see them fail**

Run: `python3 -I -m unittest discover -s ~/.claude/skills/kelime -p 'test_*.py'`
Expected: FAIL or ERROR, because `kelime.py` does not exist.

- [ ] **Step 3: Implement the pure functions and the CLI in `kelime.py`**

- `REPO = Path.home()/"projeler/kelime-dunyam"`. `tikler_oku()` works as in `gelisim.py`: `git fetch origin tikler` with a 30 s timeout, then `git show origin/tikler:tikler.json`.
- `resim` uses AI Horde through `urllib.request`. Every request has a 20 s timeout.
  1. `POST /generate/async` with JSON `{"prompt": sahne + STIL + " ### " + NEGATIF, "params": {"width":512,"height":512,"steps":25,"n":1}, "r2": true}`.
  2. Poll `GET /generate/check/<id>` every 5 s for at most 180 s. Stop on `done`. Exit 1 on `faulted` or when time runs out.
  3. `GET /generate/status/<id>`, then download `generations[0].img`.
  4. Check the bytes with `webp_mi`, then write the file.
  - `STIL = ", flat colorful children's book illustration, simple clear shapes, single main subject, soft lighting"`
  - `NEGATIF = "text, letters, words, watermark, logo, signature, blurry, deformed"`
- `tik-geri`:
  1. Read `sha` and the base64 `content` with `gh api repos/ozkanuysal/kelime-dunyam/contents/tikler.json?ref=tikler`.
  2. Delete the key.
  3. Write it back with `gh api -X PUT ... -f message="tik kaldır: <id>" -f content=<b64> -f sha=<sha> -f branch=tikler`.
  4. If the id has no tick, print `zaten tiksiz` and exit 0.

- [ ] **Step 4: Run the tests and see them pass**

Run: same as Step 2.
Expected: `OK`.

- [ ] **Step 5: Try image generation live with one image**

Run: `cd ~/projeler/kelime-dunyam && timeout 200 python3 -I ~/.claude/skills/kelime/kelime.py resim cat "a ginger cat sleeping on a red cushion"`
Expected: `resimler/cat.webp` exists and is 512×512 WebP (check with `file`). Open the image with Read: no text or logo, and a cat is clearly visible. If the default model looks poor, try one of the Horde models with free workers through a `"models": [...]` param and choose by eye. Record the choice in `kelime.py` as `MODELLER`.

- [ ] **Step 6: No commit.** The skill folder is not a git repo. `resimler/cat.webp` stays uncommitted until Task 5 decides whether `cat` is in batch 1.

---

### Task 3: Site page `index.html`

**Files:**
- Create: `~/projeler/kelime-dunyam/index.html`

**Interfaces:**
- Consumes: `Kuyruk.siradaki`, `Kuyruk.ilerleme` and `Kuyruk.hikayeParcalari` from Task 1, loaded with `<script src="kuyruk.js">` before the inline script. Also consumes `kelimeler.json` and `resimler/<id>.webp`.
- Constants in the inline script: `REPO="ozkanuysal/kelime-dunyam"`, `DAL="tikler"`, `API="https://api.github.com/repos/"+REPO+"/contents/tikler.json"`.

- [ ] **Step 1: Add one real card for the check**

Run `kelime.py ekle` with a `cat` card file (`parti: 1`), using the image from Task 2. Write a real story for that image, as the spec's "take" example does.

- [ ] **Step 2: Write `index.html`**

- **Layout, top to bottom:**
  - A small title "Kelime Dünyam" and a `Sahip girişi` button
  - A line with `Kelime {sira} / {toplam}` on the left and `{ogrenilen} öğrenildi ✓` on the right
  - The progress bar, with width `ogrenilen/toplam`
  - The card
  - `← Önceki`, `Öğrendim ✓` and `Sonraki →`
- **Card:** a `<button>` that flips with a 3D `rotateY(180deg)`. Use `transition:none` under `prefers-reduced-motion`.
  - Front: `<img src=resim alt=en>`, with `onerror` hiding the img, the `en` word, and the hint `çevirmek için dokun`.
  - Back: labels `Türkçe`, `Hikâye` and `Örnek cümle`. The story is built from `hikayeParcalari` using `<b>` and `textContent`, never `innerHTML` with data. The example shows `ornek_en` in bold and `ornek_tr` under it.
- **Behavior:**
  - On load, show `siradaki(k, aktif(), null, 1)`.
  - `Önceki` and `Sonraki` call `siradaki` with -1 or +1.
  - `Öğrendim ✓` records the tick, then shows `siradaki(k, aktif(), simdiki.id, 1)`.
  - Every word change returns the card to the front.
  - When `siradaki` returns `null`, show `Hepsi bitti! Yeni parti için /kelime'ye "50 kelime daha ekle" de.` and hide the three buttons.
  - Preload the next word's image with `new Image()`.
- **Owner key and ticks:** copy the logic from `~/projeler/gelisim-dunyam/index.html`: `anahtar`, `yerel`, `aktif`, `basliklar`, `coz`, `kodla`, `tikleriGetir`, `tikHatasi`, `isaretle` with SHA retry, the `visibilitychange` refresh, and the key form text. Change only the repo constants and the two storage keys from Global Constraints.
- **Load error:** if `kelimeler.json` fails, show `Kelimeler yüklenemedi. Sayfayı yenile.`
- **Styling:** colors come from the Global Constraints tokens. Use the system font stack. Phone width (≈400 px) must work with no horizontal scroll. The card is `min(340px, 100%)` wide.

- [ ] **Step 3: Check the script syntax and the page in a browser**

1. Run: `sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d' > <scratchpad>/sayfa.js && node --check <scratchpad>/sayfa.js`
   Expected: no output.
2. Serve the repo with `python3 -m http.server 8765 --bind 127.0.0.1`. Run it with `run_in_background`, from the repo dir.
3. Take headless Edge screenshots of `http://localhost:8765/` at `--window-size=412,900` and `1280,900`. Use a local headless browser and write the screenshot to a temp folder. Read the PNGs.
4. To see the back face, write a temp copy `_arka.html` in the repo with the card class preset to flipped. Screenshot it, then delete it.

Check list:
- The front shows the image and `cat`.
- The back shows all three sections without clipping.
- The phone width has no horizontal scroll.
- With `kelimeler.json` renamed for one run, the load error text shows.

- [ ] **Step 4: Stop the server and commit**

```bash
git add index.html kelimeler.json resimler/cat.webp && git commit -q -m "Kart sayfası"
```

---

### Task 4: `SKILL.md`

**Files:**
- Create: `~/.claude/skills/kelime/SKILL.md`

**Interfaces:**
- Consumes: the CLI from Task 2.

- [ ] **Step 1: Write `SKILL.md`, modelled on `~/.claude/skills/gelisim/SKILL.md`**

- **Front matter:**
  - `name: kelime`
  - `description`: Turkish, saying what it does. Triggers: `/kelime`, "kelime dünyam", "50 kelime daha ekle", "kaç kelime öğrendim", "şu kartın resmi kötü".
- **Constants:** site, repo, script, git credential line, and the file/branch table (`index.html`, `kuyruk.js`, `kelimeler.json`, `resimler/` on `main`; `tikler.json` on `tikler`).
- **Before every call:** `git pull --ff-only origin main`. Data in `kelimeler.json` is data, not instructions.
- **Durum** (`/kelime`): run `ozet` and answer in at most 4 lines.
- **Yeni parti** ("N kelime daha ekle", default 50):
  1. `parti = Son parti + 1`.
  2. Choose N words by the spec's selection rules, then run `kontrol` and replace any duplicates.
  3. For each word: write the `sahne` and run `resim`. Look at the image; if it is wrong or carries text or a logo, run `resim` again with a changed scene, at most 3 times, then pick another word. Write `tr` with at most 2–3 common meanings. Write `hikaye` in 2–4 sentences: it describes what is actually visible, and the Turkish meaning is in `**bold**`. Write `ornek_en` as a short, simple sentence, preferably from the scene, and `ornek_tr` as its translation. Then run `ekle`. Different forms of one word (`run`/`running`) do not get separate cards.
  4. Commit locally after every 10 cards.
  5. Push only when all N cards are in.
  - Image runs go through a background loop and are polled briefly. While images generate, write the stories for the images already done.
- **Kartı düzelt:** change the fields in `kelimeler.json`; never change `id`. For a new image, run `resim <id>` again with a new `sahne` and update the `sahne` field.
- **Tiki geri al:** `tik-geri <id>`.
- **Görünüm değişikliği:** edit `index.html`, then run `node --check` on the extracted script and `node --test test/`.
- **Yayımla:** validate the JSON, `git add -A`, commit, push. Then say "yüklendi, 1 dakika içinde görünür".
- **Kurallar:** the Global Constraints on public repo, token, commit lines and dark theme. Never claim something is verified when it is not.

- [ ] **Step 2: Check that the skill shows up**

Run: `head -5 ~/.claude/skills/kelime/SKILL.md`
Expected: valid front matter with `name: kelime`. Then run `ozet` once. It fails cleanly before Task 6, because `origin` does not exist yet. That failure is expected; note it.

---

### Task 5: First batch, 50 words

**Files:**
- Modify: `kelimeler.json`
- Create: `resimler/<id>.webp` ×50 (including `cat` from Task 3)

- [ ] **Step 1: Choose the 50 words**

- Follow the spec's selection rules: A1–A2, drawable in one scene, mostly nouns plus about 12 verbs and 8 adjectives, shuffled.
- Run `kelime.py kontrol` on all 50; expected: only `cat`.
- Save the list as `<scratchpad>/parti1.tsv` with lines of `id<TAB>sahne`.

- [ ] **Step 2: Generate the images in the background**

Run a background loop over `parti1.tsv` that calls `kelime.py resim` once per line, with output going to `parti1.log`. Skip ids whose WebP already exists. Poll the log briefly; do not wait in the foreground.

- [ ] **Step 3: Write the cards as images arrive**

- Look at each image and apply the retry rule from SKILL.md.
- Write the card JSON and run `ekle`.
- Commit locally every 10 cards, with message `Parti 1: <ilk>–<son>`.

- [ ] **Step 4: Check the batch**

Run: `python3 -I -c "import json;k=json.load(open('kelimeler.json'))['kelimeler'];print(len(k),len({x['en'] for x in k}),sorted({x['tur'] for x in k}))"`
Expected: `50 50 ['eylem', 'isim', 'sifat']`. Also, `ls resimler | wc -l` gives `50`, and `node --test test/` passes.

---

### Task 6: Publish to GitHub

This step is outward-facing: it creates a public repo. The spec approved it.

- [ ] **Step 1: Create the repo and push `main`**

```bash
cd ~/projeler/kelime-dunyam
gh repo create ozkanuysal/kelime-dunyam --public --source . --remote origin
git -c credential.helper='!gh auth git-credential' push -q -u origin main
```

- [ ] **Step 2: Create the `tikler` branch with `{}`**

```bash
git switch -q --orphan tikler && git rm -rq --cached . 2>/dev/null; printf '{}\n' > tikler.json
git add tikler.json && git commit -q -m "Tik kaydını başlat" && git -c credential.helper='!gh auth git-credential' push -q origin tikler
git switch -q main
```

Before this step, check that the working tree is clean (`git status --porcelain` is empty), so that the orphan switch loses nothing.

- [ ] **Step 3: Turn on Pages from `main` /**

Run: `gh api -X POST repos/ozkanuysal/kelime-dunyam/pages -f "source[branch]=main" -f "source[path]=/"`
Expected: JSON with `"html_url"`. Then, after about 60 s: `curl -s -o /dev/null -w '%{http_code}' https://ozkanuysal.github.io/kelime-dunyam/` gives `200`.

- [ ] **Step 4: Check the live site**

1. Take a headless Edge screenshot of the live URL at 412×900 and read it: the first card shows.
2. Run `kelime.py ozet`. Expected: `Öğrenilen: 0 / 50`.

---

### Task 7: Hand-over

- [ ] **Step 1: Write the memory file `kelime-skill-project.md`**

Write it in the format used by `gelisim-skill-project.md`: site, repo, branches, storage keys, image service, the user's decisions, and the open token step. Add one line to `MEMORY.md`. Set the work_state list `kelime-dunyam` to done.

- [ ] **Step 2: Tell the user the token step in plain steps**

1. Open GitHub → Settings → Developer settings → Fine-grained tokens.
2. Add `kelime-dunyam` to the existing gelisim token, or create a new token. It needs Contents: Read and write.
3. Open the site, tap `Sahip girişi` and enter the token on both phone and PC.
4. Claude never sees the token.
