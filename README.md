# Guappo Junior: The Comeback Story Nobody Asked For (But Got Anyway)

Welcome, brave internet traveler, to **Guappo Junior**!  
This isn’t your grandma’s Siemens phone game—though it started there. It’s a fan-made, stubbornly recreated version of the **abandonware classic “Wappo Junior.”** Back in the day, you guided Wappo, a spirited kid, and his pals to the **honeycombs—dodging traps and bees—at the same time.** Think synchronized honey-gathering.  

⚠️ Don’t confuse **Wappo Junior** with **Wappo** or **Wappo 2** (already remastered by other fans). This is its own beast. Enjoy!

---

## Installation

1. Download or clone this repo.  
2. Open the project folder.  
3. Start a local web server: serve `index.html` (Apache) or `server.js` (Node.js).  
4. Open your browser at the server address.  

No complex setup—just a modern browser and a local server.

---

## Dependencies

Already bundled in the repo:  
- **Phaser 3** – brains of the outfit (graphics, logic, assets).  
- **RexUI Plugin** – smooth talker (UI components).  

PWA and SW features exist but remain untested.

---

## How to Play

See [docs/howtoplay.html](docs/howtoplay.html) for details.

---

## The Rules of the House (Licensing)

This project, **"Guappo Junior,"** is a fan-made homage. Siemens Mobile and Softex Digital? Long gone since ’06. I don’t own the original designs.

- **Code:** Licensed under the [MIT License](https://opensource.org/licenses/MIT).  
  Use, modify, fork, sell, or remix freely, as long as you keep the copyright notice.

- **Original Images & Music (my own work + AI‑generated):** Licensed under **CC BY‑NC (Attribution–NonCommercial)**.  
  Share, remix, and adapt them, but not for commercial use. Attribution can be to the project name (“Guappo Junior”).

- **Third‑Party Free Assets (e.g., SVGRepo starfish, background):** These remain under their original **CC0 (public domain)** license.  
  They can be reused without attribution or restriction.

- **Libraries (Phaser 3, RexUI Plugin):** Each has its own license. Respect their rulebooks, or the bees will find you.


---

## Why Bother? (The Vendetta)

My Siemens phone died before I could finish “Wappo Junior.” That unfinished level haunted me. So I swore vengeance: **finish the game and build a solver** so no one else suffers. Also, a chance to prove I’ve moved past MySpace HTML. Strictly “educational and non-commercial,” of course. *wink*

---

## Naming Story: From Wappo to Guappo

“Wappo Junior” had to go. Enter **Guappo** (not *guapo*). In Italian slang, it means “ruffian” or “thug.” Perfect fit.  

Reasons:  
1. **Fresh Identity:** Two decades of abandonware deserved a new name—nostalgic whisper, modern scream.  
2. **Cultural Upgrade:** Mafia bears > outdated caricatures. I’m Italian, I like bears, and they’re easy to draw. So: **cosmonaut mafiosi bears.** Minimal animation required. Win-win.

---

## Challenges & Solutions

Reverse-engineering the original was harder than getting a mob boss to talk. My memory was fuzzy, Siemens libraries were gone, and decompiling the J2ME JAR produced gibberish.  

So I went full nerd:  
- Years of manual work to decode 200 binary levels.  
- UML diagrams + custom movement algorithms.  
- Built a solver that cracks all 200 levels. Proof the logic works… probably. Don’t stress-test it too hard, or your bike may burn.  

---

## Role of AI

80% of the code was mine, hammered out in 2008. When AI rose, I thought it’d rewrite the game instantly. Nope. Even the fanciest models couldn’t match the original logic.  

Still, AI helped:  
- Cleaned messy code.  
- Generated JS/Phaser/UI snippets.  
- Assisted with solver integration.  

Basically dragged my skills from dial-up era into 2025. Sometimes ignorance really is bliss.

---

## Why Phaser 3?

Started in 2020, Phaser 3 was the shiny new toy. Perfect for a Canvas2D rookie.  
- Simplifies resource handling.  
- Solid framework, HTML-based, Apache-friendly.  
- Overkill for a Siemens-sized game? Sure. But I wanted to learn a modern engine.  

And yes, all crafted in **VS Code**—no funny business.

---

## What’s Next?

The mission’s complete, but I still plan a few finishing touches:  
- Add music (because silence kills the vibe).  
- Fix the landscape view (portrait already works great, but sideways deserves love too).  
- Package a **standalone install** so it can run directly without a web server—mobile‑friendly by design, but not an Android/iOS port.  
- Add internationalization (so bees can buzz in multiple languages).  
 
Beyond these tweaks, there’s no active maintenance, no grand roadmap, no endless bug‑fix marathons. Just upgrades before I hang up my coding gloves. Consider the project a gift to the famiglia—free to expand, remix, or wreak havoc as you please.

---

## Fun Fact

Hidden in old files: a blueprint for a new character, **“Don.”** He was meant to move diagonally, independent of the crew. Rules were never written, code never made. A ghost I couldn’t recruit.
