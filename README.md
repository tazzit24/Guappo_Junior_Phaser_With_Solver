# Guappo Junior: The Comeback Story Nobody Asked For (But Got Anyway)

Welcome, intrepid internet traveler, to **Guappo Junior**! This ain't your grandma's Siemens phone game, though it started there. This here's a fan-made, lovingly (and somewhat stubbornly) recreated version of the **abandonware classic, "Wappo Junior."** Back in the day, it was all about Wappo, a spirited indigenous kid, and his pals. The mission? Get everyone to the **honeycombs at the same time, dodging traps and those pesky, buzz-killing bees.** Think of it as synchronized honey-gathering, but with more peril. Don't confuse **Wappo Junior** with **Wappo** and **Wappo 2**, made by the same company and already remastered long time ago by other fans. I hope you'll enjoy to play.

## How to Play (Game Rules)

Please refer to the [How to play](docs/howtoplay.html) page for more details.

## The Rules of the House (Licensing)

Look, this project, **"Guappo Junior,"** is a passion project, a labor of self improvement, a digital "homage." It's a fan-made recreation, which means I'm not on the payroll of Siemens Mobile, nor am I getting calls from the original capos at Softex Digital. Their website? Gone with the wind since '06. Trying to find them is like trying to find a honest politician – impossible. So, yeah, I don't own the original game level designs, and my calls to the defunct company went straight to voicemail.

However, all the fancy new code and spiffy assets I cooked up for this remake are **Copyright © 2025 Giancarlo M.** - that's me! And because I'm a generous boss, this whole shebang is licensed under the [**MIT License**](https://opensource.org/licenses/MIT). That means you can use it, mess with it, and spread it around like fresh cannoli, just keep the license terms in sight.

As for the images and music, those are my own masterpieces, conjured from thin air (and maybe a little AI magic, but don't tell anyone). They're available under a **CC BY (Attribution) license**. So, feel free to use 'em, but throw a little credit my way, savvy? It's just good manners.

Oh, and those clever third-party libraries (Phaser 3, RexUI Plugin)? They've got their own rulebooks. Don't go blaming me if you break theirs!

## Why Even Bother, You Ask? (The Saga Begins)

My old Siemens phone, bless its digital heart, bit the dust before I could conquer "Wappo Junior." For years, that unfinished level haunted my dreams, a digital ghost. So, this project became my personal vendetta: **finish the game, and build a game solver** so nobody else ever suffers that indignity again! Plus, I figured it was high time to dust off my web dev skills and prove I'm not still coding in MySpace HTML. Strictly for "educational and non-commercial purposes," of course. *wink*

## Renaming from "Wappo" to "Guappo": A Naming Story

So, "Wappo Junior" had to go. "Guappo" (and let's be clear, this ain't "guapo," which means a handsome dude in Spanish) means "thug" or "ruffian". It just fit the new vibe. Why? Two reasons, wise guy:

1.  **A Fresh Identity:** The original's been abandonware for two decades. This is a whole new beast, a total rewrite. It deserved a name that whispered of its past but screamed "new hotness!"
2.  **Cultural Upgrade:** In this day and age, games can allude to the "mafia" no problem, but indigenous caricatures? That's a no-go. Plus, I'm a Southern Italian, I like bears, and bears are easy to draw (especially with a little AI elbow grease). So, **cosmonaut mafiosi bears** it is! And bonus, they don't need fancy animations, which is great, 'cause I'm a coder and a musician, not a cartoonisti.

## Challenges in Recreating Game Logic & Solutions

Extracting the original game's secrets was tougher than getting a made man to talk. After all these years, my memory of its intricate moves was blurrier than a cheap webcam stream (except for one blurry YouTube video of an easy level). And trying to run the original game? Forget about it. Siemens Mobile's old libraries are harder to find than a quiet spot in Naples.

My first move was to try **decompiling the original J2ME JAR file**. Big mistake. The result was a garbled mess, like a mob boss's coded messages after a few too many grappas. Years. Years of **manual grunt work** to pick apart the core game logic and translate those **200 binary levels into something my cats could actually read.**
[Cat reading Json](docs/catreadingjson.png)

In the end, I threw out the rulebook and **started from scratch**. I used fancy **UML diagrams** (yeah, I went full nerd) and tirelessly implemented different movement algorithms. It was like teaching a bear to dance, but eventually, the solver started finding solutions for all 200 levels. Proof that I actually nailed the game logic... I hope so. Don't test it too hard, or your bicycle may burn.

## Role of AI in the Dev Phase

About 80% of this code was hammered out by yours truly, long before AI started its world domination tour. It was the year 2008. When the robots did rise, I figured they'd be my personal army, rewriting the game in a blink. I was dead wrong. Even the priciest AI models couldn't crack the original game logic with my level of accuracy.

But, I gotta admit, they weren't entirely useless. They helped me clean up my messy code, whip up some JavaScript/Phaser/UI snippets, and even integrate those complex solver algorithms. They basically dragged my coding skills from 2005 (when dial-up was still a thing) into the glorious 2025 modern web.

But because I was too dumb to realize it was "impossible", I went ahead and did it anyway. Sometimes ignorance is bliss, right?

## Why Phaser 3? (My Weapon of Dev-struction)

I started this remake shebang around 2020, right when Phaser 3 was strutting its stuff. Being a Canvas2D and modern JavaScript virgin, Phaser seemed like the perfect business partner. It **simplifies getting your hands on game resources** and offers a framework as solid as a concrete shoe.

While some might say it's **overkill for a game that fits on a Siemens phone screen**, but hey, I wanted to **learn a slick, modern game engine**. Plus, it meant if I ever decided to take this operation mobile (Android, baby!), I'd be ready (though let's be real, I probably won't). And most importantly, it's HTML-based, meaning it plays nice with **any standard Apache web server** – no funny business required. Unlike the original J2ME version, this remake doesn't need to refresh the screen constantly, making the design much smoother.

This digital artistry was crafted in **Visual Studio Code (VS Code)**. This is where the real work gets done, no funny business.

## Dependencies

This project runs on the back of these two loyal associates (they're already in the repo, no need to ask around):

* **Phaser 3:** The brains of the outfit, handling all the graphics, game logic, and asset wrangling.
* **RexUI Plugin:** The slick talker, providing all those fancy UI components that make the game look pretty.

## Local Installation (For the Curious Crooks)

Wanna run this masterpiece yourself? Easy-peasy. Clone or download this repo, then, because browsers are paranoid these days, you gotta serve `index.html` with a local web server (Apache, Node.js `http-server`, whatever floats your boat). Finally, fire up your web browser and point it to the local address. There is no installer included. Capisce ?

## What's Next? (Guappo Mode Activated)

Well, my work here is done. The "Guappo Junior" operation is officially a success, and honestly, this boss needs a break. So, I ain't planning no active maintenance, no fancy porting to other platforms, and definitely no more late-night coding sessions (unless it's for, ya know, "educational purposes" for the new recruits).

Consider this my gift to the "famiglia." Feel free to fix any bugs or game logic issues (because even a boss makes mistakes), cook up new levels, invent some wild game mechanics, and make this joint even bigger. And if you do, send a postcard! I'd be real happy to see what kinda mischief you get into.

## Fun facts

While I was digging through those ancient files, I stumbled upon a blueprint for a new character they planned after level 200. This guy, they called him **"Don,"** was supposed to cross the board diagonally, completely independent from the rest of the crew. They never laid down the rules or coded his moves, so he was just a ghost in the machine I could not recruit.