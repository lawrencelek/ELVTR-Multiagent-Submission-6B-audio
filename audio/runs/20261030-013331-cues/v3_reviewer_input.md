Score this cue map.

## The cue map

```json
{
 "music": {
  "states": {
   "intro": "track1_ansimuz-itch-io_megabot.ogg",
   "menu": "track2_ansimuz-itch-io_summer-nights.ogg",
   "credits": "track2_ansimuz-itch-io_summer-nights.ogg",
   "card": "continue",
   "level": "rotation",
   "pause": "duck",
   "ending": "track2_ansimuz-itch-io_summer-nights.ogg",
   "finale": "track1_ansimuz-itch-io_megabot.ogg"
  },
  "rotation": [
   "track3_ansimuz-itch-io_chibi-robot-b.ogg",
   "track4_ansimuz-itch-io_happywalking.ogg",
   "track5_ansimuz-itch-io_dark-happy-world.ogg",
   "track6_ansimuz-itch-io_fantasy Dragon.ogg"
  ],
  "storyRule": "tile",
  "arcadeRule": "run",
  "why": {
   "intro": "The request names Track 1 for the splash screen.",
   "menu": "The request runs Track 2 from menu to level start.",
   "credits": "Credits is a menu card, so Track 2 holds.",
   "card": "The card comes before the level starts, so Track 2 continues.",
   "level": "Tracks 3–6 alternate per tile in Story and per run in Arcade.",
   "pause": "Pause ducks the level track so play resumes seamlessly.",
   "ending": "Run ends lead back to menus, so Track 2 returns.",
   "finale": "Megabot bookends the story: the intro theme crowns the monument."
  }
 },
 "sfx": [
  {
   "event": "ui-move",
   "decision": "cue",
   "files": [
    "select_3.wav"
   ],
   "pick": "cycle",
   "bus": "ui",
   "gain": "ui",
   "cooldown": "ui",
   "alternates": [
    "select_1.wav",
    "select_2.wav"
   ],
   "why": "Shortest select tick suits rapid cursor moves."
  },
  {
   "event": "ui-ok",
   "decision": "cue",
   "files": [
    "confirm_4.wav"
   ],
   "pick": "cycle",
   "bus": "ui",
   "gain": "ui",
   "cooldown": "ui",
   "alternates": [
    "confirm_1.wav",
    "select_5.wav"
   ],
   "why": "Crisp short confirm keeps menus snappy."
  },
  {
   "event": "ui-back",
   "decision": "cue",
   "files": [
    "cancel_3.wav"
   ],
   "pick": "cycle",
   "bus": "ui",
   "gain": "ui",
   "cooldown": "ui",
   "alternates": [
    "cancel_1.wav",
    "cancel_2.wav"
   ],
   "why": "Cancel family reads as back."
  },
  {
   "event": "ui-pause",
   "decision": "cue",
   "files": [
    "select_4.wav"
   ],
   "pick": "cycle",
   "bus": "ui",
   "gain": "ui",
   "cooldown": "ui",
   "alternates": [
    "cancel_4.wav",
    "equip_1.wav"
   ],
   "why": "Soft select marks the pause while the music ducks."
  },
  {
   "event": "ui-start",
   "decision": "cue",
   "files": [
    "confirm_1.wav"
   ],
   "pick": "cycle",
   "bus": "ui",
   "gain": "ui",
   "cooldown": "once",
   "alternates": [
    "select_5.wav",
    "equip_2.wav"
   ],
   "why": "A distinct confirm opens the game."
  },
  {
   "event": "ui-gate",
   "decision": "silence",
   "why": "Track 1 starting is the response to the press."
  },
  {
   "event": "lunge",
   "decision": "cue",
   "files": [
    "jump_4.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "shrink.wav",
    "wobble.wav"
   ],
   "why": "A short spring launch reads as a lunge."
  },
  {
   "event": "jump",
   "decision": "cue",
   "files": [
    "jump_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "jump_3.wav",
    "jump_2.wav"
   ],
   "why": "The pack's jump sound matches the event directly."
  },
  {
   "event": "jump.dash",
   "decision": "cue",
   "files": [
    "jump_3.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "jump_2.wav",
    "jump_1.wav"
   ],
   "why": "A longer rise marks the long jump."
  },
  {
   "event": "jump-land",
   "decision": "cue",
   "files": [
    "land.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "blocked.wav",
    "door_close.wav"
   ],
   "why": "The pack's landing thud matches by name."
  },
  {
   "event": "land",
   "decision": "cue",
   "files": [
    "land.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "door_close.wav",
    "blocked.wav"
   ],
   "why": "The same body thud covers every ground landing."
  },
  {
   "event": "land.car",
   "decision": "cue",
   "files": [
    "door_close.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "land.wav",
    "blocked.wav"
   ],
   "why": "A metallic panel thunk sells a landing on a roof."
  },
  {
   "event": "deck-drop",
   "decision": "synth",
   "why": "The landing cue carries the drop; the 8.4 step-off stays light."
  },
  {
   "event": "rail-jump",
   "decision": "cue",
   "files": [
    "jump_3.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "jump_1.wav",
    "jump_4.wav"
   ],
   "why": "A vault is a jump; it reuses the long-jump rise."
  },
  {
   "event": "stair",
   "decision": "synth",
   "why": "The pack has no footsteps; the procedural step suits stairs."
  },
  {
   "event": "level",
   "decision": "silence",
   "why": "The stair sound already marks the climb."
  },
  {
   "event": "slip",
   "decision": "cue",
   "files": [
    "wobble.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "swim_1.wav",
    "bubble.wav"
   ],
   "why": "A wobble sells feet losing grip on water."
  },
  {
   "event": "push",
   "decision": "cue",
   "files": [
    "door_close.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "hit",
   "cooldown": "action",
   "alternates": [
    "blocked.wav",
    "soft_destruction.wav"
   ],
   "why": "Palms on a car panel make a flat metal thunk."
  },
  {
   "event": "hitch",
   "decision": "cue",
   "files": [
    "equip_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "equip_2.wav",
    "door_close.wav"
   ],
   "why": "A clamp click reads as a grip that locks on."
  },
  {
   "event": "sling",
   "decision": "cue",
   "files": [
    "shrink.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "jump_4.wav",
    "jump_2.wav"
   ],
   "why": "A falling sweep sells the release at speed."
  },
  {
   "event": "denied",
   "decision": "cue",
   "files": [
    "blocked.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "alert",
   "cooldown": "action",
   "alternates": [
    "cancel_2.wav",
    "cancel_4.wav"
   ],
   "why": "The name matches: a refused move."
  },
  {
   "event": "denied.locked",
   "decision": "cue",
   "files": [
    "cancel_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "alert",
   "cooldown": "action",
   "alternates": [
    "cancel_4.wav",
    "blocked.wav"
   ],
   "why": "A system cancel says the part isn't fitted yet."
  },
  {
   "event": "impact",
   "decision": "cue",
   "files": [
    "hurt_1.wav",
    "hurt_2.wav",
    "hurt_3.wav",
    "hurt_4.wav"
   ],
   "pick": "random",
   "bus": "sfx",
   "gain": "hit",
   "cooldown": "burst",
   "alternates": [
    "soft_destruction.wav",
    "explosion_1.wav"
   ],
   "why": "Four hurt variants keep repeated combo hits fresh."
  },
  {
   "event": "impact.big",
   "decision": "cue",
   "files": [
    "harsh_destruction.wav",
    "explosion_1.wav"
   ],
   "pick": "random",
   "bus": "sfx",
   "gain": "big",
   "cooldown": "burst",
   "alternates": [
    "explosion_2.wav",
    "soft_destruction.wav"
   ],
   "why": "Crunch and blast give big hits weight."
  },
  {
   "event": "impact.drop",
   "decision": "cue",
   "files": [
    "soft_destruction.wav",
    "hurt_3.wav"
   ],
   "pick": "random",
   "bus": "sfx",
   "gain": "hit",
   "cooldown": "burst",
   "alternates": [
    "land.wav",
    "hurt_1.wav"
   ],
   "why": "A soft crumple suits a drop onto a car."
  },
  {
   "event": "held",
   "decision": "cue",
   "files": [
    "equip_2.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "equip_1.wav",
    "blocked.wav"
   ],
   "why": "A clamp click: the Corporation holds the chassis floor."
  },
  {
   "event": "knock",
   "decision": "synth",
   "why": "The procedural shove scales with speed; hurt sounds mean damage."
  },
  {
   "event": "touch-spent",
   "decision": "silence",
   "why": "Spent cars pay nothing; silence teaches that."
  },
  {
   "event": "writeoff",
   "decision": "cue",
   "files": [
    "explosion_4.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "big",
   "cooldown": "once",
   "alternates": [
    "explosion_3.wav",
    "harsh_destruction.wav"
   ],
   "why": "The loudest explosion marks the biggest body beat."
  },
  {
   "event": "chassis",
   "decision": "cue",
   "files": [
    "teleport.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "powerup_3.wav",
    "equip_2.wav"
   ],
   "why": "A clean beam-in suits Sinofuturist replacement stock."
  },
  {
   "event": "chassis.start",
   "decision": "base",
   "why": "A level's first chassis beams in like every other; it plays the chassis cue."
  },
  {
   "event": "part-break",
   "decision": "cue",
   "files": [
    "fire_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "alert",
   "cooldown": "once",
   "alternates": [
    "fire_2.wav",
    "lose_4.wav"
   ],
   "why": "A spark crackle: a part shorts out."
  },
  {
   "event": "low-health",
   "decision": "cue",
   "files": [
    "siren.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "alert",
   "cooldown": "once",
   "alternates": [
    "uh-oh.wav",
    "computer_2.wav"
   ],
   "why": "A city siren warns calmly without horror."
  },
  {
   "event": "near-miss",
   "decision": "synth",
   "why": "The procedural whoosh tracks car speed; the pack has no pass-by."
  },
  {
   "event": "miss",
   "decision": "silence",
   "why": "The lunge already sounds; an empty dash earns nothing."
  },
  {
   "event": "pickup",
   "decision": "cue",
   "files": [
    "collect_3.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "collect_4.wav",
    "equip_1.wav"
   ],
   "why": "A collect blip suits taking a cone."
  },
  {
   "event": "drop",
   "decision": "synth",
   "why": "The pack has no plastic tap; the 8.4 tap suits a cone."
  },
  {
   "event": "throw",
   "decision": "cue",
   "files": [
    "jump_2.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "action",
   "alternates": [
    "jump_4.wav",
    "shrink.wav"
   ],
   "why": "A rising swoosh carries the cone's arc."
  },
  {
   "event": "punt",
   "decision": "synth",
   "why": "The light procedural kick keeps a low-stakes action quiet."
  },
  {
   "event": "cone-hit",
   "decision": "cue",
   "files": [
    "explosion_2.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "hit",
   "cooldown": "once",
   "alternates": [
    "explosion_1.wav",
    "harsh_destruction.wav"
   ],
   "why": "A mid-size blast pays off the cone trap."
  },
  {
   "event": "cone-struck",
   "decision": "silence",
   "why": "The cone-hit sound carries the payoff; strikes would chatter."
  },
  {
   "event": "cone-stop",
   "decision": "silence",
   "why": "Background cone settling would clutter traffic."
  },
  {
   "event": "cone-rest",
   "decision": "silence",
   "why": "Background cone settling would clutter traffic."
  },
  {
   "event": "cone-release",
   "decision": "silence",
   "why": "The write-off owns this moment."
  },
  {
   "event": "combo",
   "decision": "cue",
   "files": [
    "collect_7.wav",
    "collect_1.wav",
    "collect_2.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "burst",
   "alternates": [
    "collect_5.wav",
    "collect_6.wav"
   ],
   "why": "Cycling collects build the combo count."
  },
  {
   "event": "combo.max",
   "decision": "cue",
   "files": [
    "powerup_2.wav",
    "powerup_4.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "burst",
   "alternates": [
    "collect_5.wav",
    "powerup_3.wav"
   ],
   "why": "Two cycling powerups crown each capped hit without repeating."
  },
  {
   "event": "combo-end",
   "decision": "cue",
   "files": [
    "chime.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "once",
   "alternates": [
    "confirm_2.wav",
    "collect_6.wav"
   ],
   "why": "A ledger chime: the combo is banked."
  },
  {
   "event": "splash",
   "decision": "cue",
   "files": [
    "water_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "big",
   "cooldown": "once",
   "alternates": [
    "water_2.wav",
    "swim_1.wav"
   ],
   "why": "A real splash matches a fall into the river."
  },
  {
   "event": "rescued",
   "decision": "cue",
   "files": [
    "water_2.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "swim_2.wav",
    "teleport.wav"
   ],
   "why": "Draining water as the drone lifts the chassis."
  },
  {
   "event": "screen",
   "decision": "synth",
   "why": "Flips are frequent; the 8.4 flip sits under the music."
  },
  {
   "event": "honk",
   "decision": "synth",
   "why": "The pack has no horn; 8.4 honks keep each tier's voice."
  },
  {
   "event": "honk.body",
   "decision": "synth",
   "why": "The tier horn holds; the bark names the target."
  },
  {
   "event": "skid",
   "decision": "synth",
   "why": "slippery.wav runs 0.82 s; the procedural skid stays short."
  },
  {
   "event": "unstick",
   "decision": "silence",
   "why": "Replans are invisible; only reversing earns a sound."
  },
  {
   "event": "unstick.reverse",
   "decision": "synth",
   "why": "The 8.4 reversing beep is a real street cue."
  },
  {
   "event": "learn-standoff",
   "decision": "cue",
   "files": [
    "computer_2.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "computer_1.wav",
    "stat_increase.wav"
   ],
   "why": "A computer chirp: the model updates its data."
  },
  {
   "event": "car-notice",
   "decision": "silence",
   "why": "Headlight flashes are the language; a sound would duplicate them."
  },
  {
   "event": "car-brake",
   "decision": "silence",
   "why": "Constant traffic chatter; brake lights carry it."
  },
  {
   "event": "commit",
   "decision": "silence",
   "why": "Internal traffic state; the player sees the move."
  },
  {
   "event": "interrupt",
   "decision": "silence",
   "why": "Internal traffic state; constant chatter would mask the hits."
  },
  {
   "event": "resume",
   "decision": "silence",
   "why": "Internal traffic state; constant chatter would mask the hits."
  },
  {
   "event": "release",
   "decision": "silence",
   "why": "Internal traffic state; constant chatter would mask the hits."
  },
  {
   "event": "ring",
   "decision": "silence",
   "why": "Lane changes are visual; sound would clutter the roundabout."
  },
  {
   "event": "gridlock",
   "decision": "cue",
   "files": [
    "uh-oh.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "alert",
   "cooldown": "once",
   "alternates": [
    "lose_2.wav",
    "computer_2.wav"
   ],
   "why": "A deadpan uh-oh: the smart city stalls."
  },
  {
   "event": "gridlock-clear",
   "decision": "cue",
   "files": [
    "confirm_2.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "ambient",
   "cooldown": "once",
   "alternates": [
    "confirm_3.wav",
    "chime.wav"
   ],
   "why": "A quiet system confirm: traffic is restored."
  },
  {
   "event": "admit",
   "decision": "silence",
   "why": "Cars enter constantly; the music carries the city."
  },
  {
   "event": "exit",
   "decision": "silence",
   "why": "Cars leave constantly; the music carries the city."
  },
  {
   "event": "contact-ignored",
   "decision": "silence",
   "why": "It scores nothing, so silence keeps the feedback honest."
  },
  {
   "event": "touch",
   "decision": "silence",
   "why": "Zero-speed touches don't count; silence keeps the feedback honest."
  },
  {
   "event": "drone-dispatch",
   "decision": "cue",
   "files": [
    "ufo.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "engine.wav",
    "computer_1.wav"
   ],
   "why": "A hovering whir: a Corporation drone, not an alien."
  },
  {
   "event": "drone-dispatch.rescue",
   "decision": "cue",
   "files": [
    "siren.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "ufo.wav",
    "engine.wav"
   ],
   "why": "An official siren marks the rescue run."
  },
  {
   "event": "drone-pickup",
   "decision": "cue",
   "files": [
    "equip_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "equip_2.wav",
    "collect_4.wav"
   ],
   "why": "A clamp click: the drone lifts the cone."
  },
  {
   "event": "drone-drop",
   "decision": "synth",
   "why": "The pickup frames the trip; the 8.4 tap closes it."
  },
  {
   "event": "drop-in",
   "decision": "cue",
   "files": [
    "engine.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "ufo.wav",
    "boost.wav"
   ],
   "why": "A motor hum carries the dummy into the level."
  },
  {
   "event": "dropped-in",
   "decision": "cue",
   "files": [
    "land.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "move",
   "cooldown": "once",
   "alternates": [
    "door_close.wav",
    "confirm_2.wav"
   ],
   "why": "A landing thud starts play."
  },
  {
   "event": "story-enter",
   "decision": "cue",
   "files": [
    "computer_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "computer_2.wav",
    "chime.wav"
   ],
   "why": "The Corporation logs the tile in test."
  },
  {
   "event": "story-count",
   "decision": "cue",
   "files": [
    "stat_increase.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "once",
   "alternates": [
    "collect_5.wav",
    "confirm_2.wav"
   ],
   "why": "The brief's tally goes up."
  },
  {
   "event": "story-miss",
   "decision": "cue",
   "files": [
    "stat_decrease.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "alert",
   "cooldown": "once",
   "alternates": [
    "lose_4.wav",
    "cancel_2.wav"
   ],
   "why": "A falling tone: the write-off doesn't count."
  },
  {
   "event": "story-clear",
   "decision": "cue",
   "files": [
    "powerup_5.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "once",
   "alternates": [
    "level_up.wav",
    "powerup_1.wav"
   ],
   "why": "The loudest powerup: the tile is cleared, louder than any combo tick."
  },
  {
   "event": "story-gift",
   "decision": "cue",
   "files": [
    "collect_6.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "once",
   "alternates": [
    "collect_5.wav",
    "chime.wav"
   ],
   "why": "A coin collect: credits arrive."
  },
  {
   "event": "story-deliver",
   "decision": "cue",
   "files": [
    "engine.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "ufo.wav",
    "boost.wav"
   ],
   "why": "A drone motor hum brings the part."
  },
  {
   "event": "story-ferry",
   "decision": "cue",
   "files": [
    "ufo.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "engine.wav",
    "teleport.wav"
   ],
   "why": "The drone's hover carries the dummy onward."
  },
  {
   "event": "story-ferried",
   "decision": "silence",
   "why": "The next tile's entry sound marks the arrival."
  },
  {
   "event": "story-fence",
   "decision": "cue",
   "files": [
    "blocked.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "alert",
   "cooldown": "action",
   "alternates": [
    "cancel_4.wav",
    "door_close.wav"
   ],
   "why": "Blocked by name: the fence refuses entry."
  },
  {
   "event": "gift",
   "decision": "cue",
   "files": [
    "powerup_5.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "big",
   "cooldown": "once",
   "alternates": [
    "powerup_3.wav",
    "level_up.wav"
   ],
   "why": "The loudest powerup: a part is fitted."
  },
  {
   "event": "delivered",
   "decision": "silence",
   "why": "Fitting the part already closed the delivery."
  },
  {
   "event": "unveil",
   "decision": "cue",
   "files": [
    "powerup_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "big",
   "cooldown": "once",
   "alternates": [
    "powerup_3.wav",
    "level_up.wav"
   ],
   "why": "A long ceremonial rise presents the monument."
  },
  {
   "event": "unveil-lift",
   "decision": "cue",
   "files": [
    "disappear.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "big",
   "cooldown": "once",
   "alternates": [
    "teleport.wav",
    "shrink.wav"
   ],
   "why": "A sweeping vanish: the cloth comes off."
  },
  {
   "event": "voyage",
   "decision": "cue",
   "files": [
    "ufo.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "engine.wav",
    "teleport.wav"
   ],
   "why": "The drone's hover lifts the dummy to the ship."
  },
  {
   "event": "voyage-end",
   "decision": "cue",
   "files": [
    "note_high_C.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "once",
   "alternates": [
    "chime.wav",
    "confirm_2.wav"
   ],
   "why": "One clean high note: CERTIFIED."
  },
  {
   "event": "shop-open",
   "decision": "cue",
   "files": [
    "select_5.wav"
   ],
   "pick": "cycle",
   "bus": "ui",
   "gain": "ui",
   "cooldown": "once",
   "alternates": [
    "confirm_3.wav",
    "equip_1.wav"
   ],
   "why": "A menu blip opens the workshop."
  },
  {
   "event": "purchase",
   "decision": "cue",
   "files": [
    "equip_2.wav"
   ],
   "pick": "cycle",
   "bus": "ui",
   "gain": "reward",
   "cooldown": "action",
   "alternates": [
    "equip_1.wav",
    "collect_7.wav"
   ],
   "why": "Equip by name: a part is bought and fitted."
  },
  {
   "event": "purchase-denied",
   "decision": "cue",
   "files": [
    "cancel_4.wav"
   ],
   "pick": "cycle",
   "bus": "ui",
   "gain": "alert",
   "cooldown": "action",
   "alternates": [
    "cancel_2.wav",
    "blocked.wav"
   ],
   "why": "A short cancel refuses the sale."
  },
  {
   "event": "shop-skip",
   "decision": "silence",
   "why": "Nothing to buy, so there's nothing to hear."
  },
  {
   "event": "credit",
   "decision": "cue",
   "files": [
    "collect_5.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "once",
   "alternates": [
    "collect_6.wav",
    "confirm_2.wav"
   ],
   "why": "A coin collect: payroll for a write-off."
  },
  {
   "event": "road-cleared",
   "decision": "cue",
   "files": [
    "powerup_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "once",
   "alternates": [
    "powerup_3.wav",
    "level_up.wav"
   ],
   "why": "A long rising powerup: the met quota outranks any capped combo hit."
  },
  {
   "event": "grade",
   "decision": "cue",
   "files": [
    "powerup_3.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "reward",
   "cooldown": "once",
   "alternates": [
    "powerup_1.wav",
    "level_up.wav"
   ],
   "why": "A rising powerup: a tougher grade."
  },
  {
   "event": "ending",
   "decision": "cue",
   "files": [
    "computer_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "story",
   "cooldown": "once",
   "alternates": [
    "chime.wav",
    "computer_2.wav"
   ],
   "why": "A deadpan readout: the Corporation files the report."
  },
  {
   "event": "ending.win",
   "decision": "cue",
   "files": [
    "powerup_5.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "big",
   "cooldown": "once",
   "alternates": [
    "level_up.wav",
    "powerup_1.wav"
   ],
   "why": "The loudest powerup: Licensed or Certified ends bigger than any failed test."
  },
  {
   "event": "ending.fail",
   "decision": "cue",
   "files": [
    "lose_1.wav"
   ],
   "pick": "cycle",
   "bus": "sfx",
   "gain": "big",
   "cooldown": "once",
   "alternates": [
    "lose_3.wav",
    "uh-oh.wav"
   ],
   "why": "The longest lose sting: a failed test."
  },
  {
   "event": "milestone",
   "decision": "silence",
   "why": "It's an internal log the player never sees."
  },
  {
   "event": "bark",
   "decision": "cue",
   "files": [
    "bubble.wav",
    "select_1.wav"
   ],
   "pick": "random",
   "bus": "sfx",
   "gain": "ambient",
   "cooldown": "audio.sfx.cooldown.bark",
   "alternates": [
    "select_2.wav",
    "computer_2.wav"
   ],
   "why": "A bubble pop: a car's line appears."
  },
  {
   "event": "bark.shout",
   "decision": "cue",
   "files": [
    "select_5.wav",
    "select_4.wav"
   ],
   "pick": "random",
   "bus": "sfx",
   "gain": "ambient",
   "cooldown": "audio.sfx.cooldown.bark",
   "alternates": [
    "bubble.wav",
    "blocked.wav"
   ],
   "why": "Brighter chirps lift a shouted line."
  },
  {
   "event": "intro-hit",
   "decision": "silence",
   "why": "Track 1 owns the intro; a looping hit would grate."
  },
  {
   "event": "learned",
   "decision": "silence",
   "why": "The bark sound already plays this line."
  },
  {
   "event": "upgrade-seen",
   "decision": "silence",
   "why": "The bark sound already plays this line."
  },
  {
   "event": "part-seen",
   "decision": "silence",
   "why": "The bark sound already plays this line."
  }
 ]
}
```

## Lint findings (measured; deduct each under its rule)

- honk · C2 (major) high-priority event set to synth

## The event catalogue (94 events; content/audio/events.json)

| id | group | label | what happens | freq | priority | fires with | variants (id: when) | Prototype 8.4 synth |
|---|---|---|---|---|---|---|---|---|
| ui-move | ui | Cursor moves | A menu cursor moves: arrows, stick, d-pad, WASD. | action | high | — | — | no |
| ui-ok | ui | Confirm | A menu choice is confirmed: A, Space, Enter, a tap or a click. | action | high | — | — | no |
| ui-back | ui | Back | A menu goes back or closes: B, Shift, Esc on a page. | action | high | — | — | no |
| ui-pause | ui | Pause opens | Play pauses: Esc, P, START or the pause chip. | action | medium | — | — | no |
| ui-start | ui | START | START on the intro screen opens the mode select. | once | high | — | — | no |
| ui-gate | ui | Press any key | The first press on the intro screen unlocks audio; Track 1 starts. | once | low | — | — | no |
| lunge | moves | Dash | The dummy dashes (A). Spends a battery charge. | action | high | impact, combo, jump | — | yes |
| jump | moves | Jump | The dummy jumps (B). A jump out of a dash is a long jump. | action | high | lunge | jump.dash: {"kind": "dash"} | yes |
| jump-land | moves | Jump lands | A jump lands on the ground. | action | medium | impact | — | yes |
| land | moves | Drop lands | A drop from a walkway or deck lands, on a car or on the ground. | action | medium | impact, deck-drop | land.car: {"car": "*"} | yes |
| deck-drop | moves | Drop off a deck | The dummy steps off a highway parapet or ledge. | action | medium | land | — | yes |
| rail-jump | moves | Over the rail | The dummy jumps a walkway rail. | action | low | — | — | yes |
| stair | moves | Stairs | The dummy starts up or down a stair. | action | low | — | — | yes |
| level | moves | New level | The dummy reaches a new level: walkway, deck, roof. | action | low | stair | — | no |
| slip | moves | Slip on water | A dash is refused on a puddle. | action | medium | denied | — | no |
| push | abilities | Push off a car | Arms: the dummy pushes off a car (Y). | action | high | — | — | yes |
| hitch | abilities | Hitch a car | The dummy grabs a passing car (X). | action | high | — | — | yes |
| sling | abilities | Sling off | The dummy lets go of a hitched car with speed. | action | high | — | — | yes |
| denied | abilities | Denied | A move is refused: no charge, or not fitted yet. | action | medium | slip | denied.locked: {"why": "locked"} | yes |
| impact | hits | Hit | A car hits the dummy. Damage, points, the burst. | burst | high | combo, writeoff, held, learn-standoff, part-break, low-health, land | impact.big: {"big": true}; impact.drop: {"drop": true} | yes |
| held | hits | Chassis held | Story: a hit that misses the brief; the chassis holds at the floor. | once | medium | impact | — | yes |
| knock | hits | Knock | A car shoves the dummy without damage. | frame | medium | — | — | yes |
| touch-spent | hits | Spent car | The dummy touches a spent car: no reward. | frame | low | — | — | yes |
| writeoff | hits | Write-off | The chassis is written off: health reaches zero. | once | high | impact, combo, ending, credit | — | yes |
| chassis | hits | New chassis | A chassis is issued: at a level's start, under the card, and after each write-off. | once | medium | — | chassis.start: {"start": true} | no |
| part-break | hits | Part breaks | A body part reaches broken (level 3). | once | medium | impact | — | no |
| low-health | hits | Low health | The chassis falls below audio.sfx.lowHealthAt of its maximum. | once | medium | impact | — | no |
| near-miss | near | Near-miss | A fast car passes close without touching. | burst | medium | — | — | yes |
| miss | near | Dash misses | A dash ends with no contact. | action | low | lunge | — | yes |
| pickup | cones | Cone picked up | The dummy picks up a cone (X). | action | high | — | — | yes |
| drop | cones | Cone set down | The dummy sets a cone down. | action | medium | — | — | yes |
| throw | cones | Cone thrown | The dummy throws a cone. | action | high | — | — | yes |
| punt | cones | Cone kicked | The dummy walks into a cone and kicks it. | action | low | — | — | yes |
| cone-hit | cones | Cone hit | A cone makes a car stop or crash: points. | once | high | combo | — | yes |
| cone-struck | cones | Car strikes a cone | A car runs into a cone. | ambient | low | cone-hit | — | no |
| cone-stop | cones | Cone stops | A thrown cone stops sliding. | ambient | low | — | — | no |
| cone-rest | cones | Cone at rest | A cone settles. | ambient | low | — | — | no |
| cone-release | cones | Cone released | Carried cones fall when the dummy is written off. | once | low | writeoff | — | no |
| combo | combos | Combo | A hit extends a combo (two or more). | burst | high | impact | combo.max: {"max": true} | yes |
| combo-end | combos | Combo banked | The combo clock runs out; the combo is banked. | once | medium | — | — | yes |
| splash | world | Into the river | The dummy falls into the river. | once | high | drone-dispatch | — | yes |
| rescued | world | River rescue | A drone recovers the chassis from the river. | once | medium | — | — | yes |
| screen | world | Screen flip | The view moves to a neighbouring tile. | action | medium | — | — | yes |
| honk | cars | Honk | A blocked car honks, at the dummy or at a cone. | burst | high | — | honk.body: {"at": "body"} | yes |
| skid | cars | Skid | A car skids on a puddle. | ambient | medium | — | — | yes |
| unstick | cars | Car reverses | A stuck car reverses or replans. | ambient | low | — | unstick.reverse: {"how": "reverse"} | yes |
| learn-standoff | cars | Model learns | A car model learns to stop further back. | once | medium | impact | — | yes |
| car-notice | cars | Car notices you | A car's headlights start to flash: it has noticed the dummy. | burst | medium | — | — | no |
| car-brake | cars | Car brakes | A car's brake lights come on as it brakes for safety. | ambient | low | — | — | no |
| commit | cars | Car commits | A car commits to a manoeuvre. | ambient | low | — | — | no |
| interrupt | cars | Car interrupted | A car's manoeuvre is interrupted. | ambient | low | — | — | no |
| resume | cars | Car resumes | A car resumes after an interruption. | ambient | low | — | — | no |
| release | cars | Car released | A car is released from a hold. | ambient | low | — | — | no |
| ring | cars | Roundabout lane | A car changes ring on a roundabout. | ambient | low | — | — | no |
| gridlock | cars | Gridlock | Traffic locks on a layer. | once | low | — | — | no |
| gridlock-clear | cars | Gridlock clears | Locked traffic clears. | once | low | — | — | no |
| admit | cars | Car enters | A car enters the screen. | ambient | low | — | — | no |
| exit | cars | Car leaves | A car leaves the screen. | ambient | low | — | — | no |
| contact-ignored | cars | Contact ignored | A contact that scores nothing. | frame | low | — | — | no |
| touch | cars | Touch | A zero-speed touch. | frame | low | — | — | no |
| drone-dispatch | drones | Drone dispatched | A Corporation drone sets off: to clear a cone, or to the river. | once | medium | splash | drone-dispatch.rescue: {"rescue": true} | yes |
| drone-pickup | drones | Drone lifts a cone | The drone lifts a cone. | once | low | — | — | yes |
| drone-drop | drones | Drone sets a cone down | The drone sets the cone down. | once | low | — | — | yes |
| drop-in | drones | Drone drop begins | A level starts: a drone carries the dummy in. | once | high | — | — | no |
| dropped-in | drones | Dummy set down | The drone sets the dummy down; play starts. | once | medium | — | — | no |
| story-enter | story | Tile in test | The dummy is in the tile in test. | once | medium | — | — | yes |
| story-count | story | Counted | A write-off counts toward the brief. | once | high | writeoff | — | yes |
| story-miss | story | Not counted | A write-off does not count. | once | medium | writeoff | — | yes |
| story-clear | story | Tile cleared | The tile's brief is met. | once | high | story-count, writeoff | — | yes |
| story-gift | story | Credit gift | Dummy Corporation gifts credits on arrival. | once | medium | — | — | no |
| story-deliver | story | Delivery drone | A drone brings this tile's part. | once | medium | story-enter | — | yes |
| story-ferry | story | Ferry | A drone carries the dummy to the next tile. | once | medium | — | — | yes |
| story-ferried | story | Ferried | The ferry sets the dummy down on the next tile. | once | low | — | — | yes |
| story-fence | story | Fence | The dummy meets a tile's fence. | action | medium | — | — | yes |
| gift | story | Gift screen | A part falls, lands and is fitted: the gift screen. | once | high | story-gift | — | yes |
| delivered | story | Delivery done | The delivery drone leaves. | once | low | — | — | yes |
| unveil | story | Unveiling | The finale: the monument and its plaque. | once | high | — | — | no |
| unveil-lift | story | Cloth lifts | The cloth comes off the monument. | once | high | unveil | — | no |
| voyage | story | Voyage | A drone lifts the dummy toward the ship. | once | medium | — | — | no |
| voyage-end | story | At the ship | The dummy is set down at the ship: CERTIFIED. | once | medium | ending | — | no |
| shop-open | arcade | Workshop opens | The workshop opens after a report. | once | low | — | — | no |
| purchase | arcade | Part fitted | A part is bought and fitted. | action | high | — | — | yes |
| purchase-denied | arcade | Cannot buy | A purchase is refused. | action | medium | — | — | yes |
| shop-skip | arcade | Workshop skipped | Story: nothing to buy; the workshop is skipped. | once | low | — | — | no |
| credit | arcade | Credits paid | Credits are paid for a write-off. | once | low | writeoff | — | no |
| road-cleared | arcade | Road cleared | Arcade: the road's quota is met. | once | medium | — | — | no |
| grade | arcade | Grade up | Arcade: the grade rises; tougher chassis, denser traffic. | once | high | writeoff | — | yes |
| ending | arcade | Ending | A run ends: Licensed, Certified, Failed test or Non-compliant. | once | high | writeoff | ending.win: {"kind": ["Licensed", "Certified"]}; ending.fail: {"kind": ["Failed test", "Non-compliant"]} | yes |
| milestone | arcade | Milestone | An internal first (first hit, first combo). | once | low | — | — | no |
| bark | barks | Bark bubble | A car's line appears in the message strip. | burst | medium | — | bark.shout: {"style": "shout"} | no |
| intro-hit | intro | Intro hit | The intro loop: the car meets the dummy. | once | low | — | — | no |
| learned | barks | Model returns | A model that learned returns and says so (a bark). | once | low | bark | — | no |
| upgrade-seen | barks | Upgrade seen | A car remarks on a new module (a bark). | once | low | bark | — | no |
| part-seen | barks | Broken part seen | A car remarks on a broken part (a bark). | once | low | bark | — | no |

Frequency classes: {"once": "once per occurrence: a beat in the run", "action": "once per player action", "burst": "a few per second at most", "frame": "logged on every contact frame: needs a cooldown", "ambient": "traffic chatter: many per minute, from any car"}

## Music states

| state | label | what shows |
|---|---|---|
| intro | Intro screen | DUMMIES, the front-on animation, START (after the first press). |
| menu | Menus | Mode select, save slots, name entry, Story splash, map, district select, high scores, loading. |
| credits | Credits card | The Credits card, from the title or the ending. |
| card | Level card | The level card before the drone drop, at a district's start. |
| level | Levels | Play, the drone drop, write-off holds, flips, ferries, the gift screen, reports, the workshop. |
| pause | Pause | Pause, options, controls: the level track, ducked. |
| ending | Run ends | Licensed, Failed test, Non-compliant. |
| finale | Finale | The unveiling, the voyage, CERTIFIED. |

## The pack: SFX (100 WAV files; content/audio/inventory.json)

| file | seconds | level dB | family |
|---|---:|---:|---|
| animal_bird_fly.wav | 0.48 | -17.6 | animal |
| animal_bird_tweet.wav | 0.64 | -20.5 | animal |
| animal_cat.wav | 0.49 | -24.4 | animal |
| animal_cow.wav | 0.60 | -22.9 | animal |
| animal_dog_big.wav | 0.46 | -25.4 | animal |
| animal_dog_small.wav | 0.46 | -25.7 | animal |
| animal_frog.wav | 0.45 | -27.5 | animal |
| blocked.wav | 0.11 | -24.5 | blocked |
| boost.wav | 1.03 | -26.5 | boost |
| bubble.wav | 0.33 | -23.7 | bubble |
| cancel_1.wav | 0.19 | -23.4 | cancel |
| cancel_2.wav | 0.18 | -25.6 | cancel |
| cancel_3.wav | 0.15 | -21.9 | cancel |
| cancel_4.wav | 0.19 | -25.1 | cancel |
| chime.wav | 0.77 | -20.3 | chime |
| collect_1.wav | 0.35 | -24.2 | collect |
| collect_2.wav | 0.47 | -25.6 | collect |
| collect_3.wav | 0.21 | -24.9 | collect |
| collect_4.wav | 0.21 | -25.7 | collect |
| collect_5.wav | 0.53 | -27.0 | collect |
| collect_6.wav | 0.53 | -26.3 | collect |
| collect_7.wav | 0.19 | -22.9 | collect |
| computer_1.wav | 1.30 | -18.6 | computer |
| computer_2.wav | 0.64 | -21.6 | computer |
| confirm_1.wav | 0.24 | -27.9 | confirm |
| confirm_2.wav | 0.44 | -24.8 | confirm |
| confirm_3.wav | 0.41 | -25.0 | confirm |
| confirm_4.wav | 0.16 | -23.2 | confirm |
| disappear.wav | 0.84 | -28.3 | disappear |
| door_close.wav | 0.14 | -25.8 | door_close |
| earthquake.wav | 1.64 | -26.9 | earthquake |
| engine.wav | 1.36 | -29.0 | engine |
| equip_1.wav | 0.21 | -26.9 | equip |
| equip_2.wav | 0.28 | -25.9 | equip |
| explosion_1.wav | 0.42 | -26.8 | explosion |
| explosion_2.wav | 0.60 | -27.3 | explosion |
| explosion_3.wav | 0.82 | -27.6 | explosion |
| explosion_4.wav | 0.86 | -25.7 | explosion |
| explosion_5.wav | 0.69 | -26.3 | explosion |
| fall.wav | 2.22 | -22.3 | fall |
| fire_1.wav | 0.36 | -23.4 | fire |
| fire_2.wav | 0.36 | -22.2 | fire |
| fire_3.wav | 0.90 | -28.0 | fire |
| ghostly_laugh.wav | 0.67 | -21.7 | ghostly_laugh |
| harsh_destruction.wav | 0.69 | -25.7 | harsh_destruction |
| hurt_1.wav | 0.14 | -24.4 | hurt |
| hurt_2.wav | 0.20 | -23.8 | hurt |
| hurt_3.wav | 0.20 | -23.9 | hurt |
| hurt_4.wav | 0.14 | -23.3 | hurt |
| jump_1.wav | 0.36 | -23.6 | jump |
| jump_2.wav | 0.41 | -24.4 | jump |
| jump_3.wav | 0.41 | -24.4 | jump |
| jump_4.wav | 0.21 | -24.7 | jump |
| land.wav | 0.10 | -19.1 | land |
| laser_1.wav | 0.34 | -24.2 | laser |
| laser_2.wav | 0.40 | -25.6 | laser |
| laser_3.wav | 0.38 | -22.1 | laser |
| laser_4.wav | 0.26 | -23.6 | laser |
| laser_5.wav | 0.47 | -21.5 | laser |
| laser_6.wav | 0.77 | -24.5 | laser |
| level_up.wav | 0.96 | -28.2 | level_up |
| lightning.wav | 0.68 | -22.3 | lightning |
| lose_1.wav | 0.94 | -24.3 | lose |
| lose_2.wav | 0.68 | -24.2 | lose |
| lose_3.wav | 0.76 | -24.9 | lose |
| lose_4.wav | 0.65 | -24.4 | lose |
| mystery_1.wav | 3.29 | -27.7 | mystery |
| note_C.wav | 0.84 | -26.0 | note |
| note_D.wav | 0.84 | -26.0 | note |
| note_E.wav | 0.84 | -25.9 | note |
| note_F.wav | 0.84 | -25.9 | note |
| note_G.wav | 0.84 | -25.8 | note |
| note_high_A.wav | 0.84 | -25.6 | note |
| note_high_B.wav | 0.84 | -25.4 | note |
| note_high_C.wav | 0.84 | -25.3 | note |
| powerup_1.wav | 1.10 | -28.1 | powerup |
| powerup_2.wav | 0.66 | -27.3 | powerup |
| powerup_3.wav | 0.91 | -27.6 | powerup |
| powerup_4.wav | 0.67 | -26.8 | powerup |
| powerup_5.wav | 0.79 | -19.5 | powerup |
| select_1.wav | 0.12 | -20.7 | select |
| select_2.wav | 0.16 | -24.3 | select |
| select_3.wav | 0.10 | -20.7 | select |
| select_4.wav | 0.20 | -25.3 | select |
| select_5.wav | 0.27 | -22.7 | select |
| shrink.wav | 0.33 | -24.1 | shrink |
| siren.wav | 0.84 | -28.3 | siren |
| slippery.wav | 0.82 | -26.0 | slippery |
| soft_destruction.wav | 0.47 | -27.2 | soft_destruction |
| stat_decrease.wav | 0.77 | -27.6 | stat_decrease |
| stat_increase.wav | 0.77 | -27.3 | stat_increase |
| swim_1.wav | 0.50 | -24.9 | swim |
| swim_2.wav | 0.52 | -24.2 | swim |
| teleport.wav | 1.00 | -26.8 | teleport |
| tidal_wave.wav | 2.19 | -27.8 | tidal_wave |
| ufo.wav | 2.42 | -27.9 | ufo |
| uh-oh.wav | 0.99 | -26.0 | uh-oh |
| water_1.wav | 1.75 | -23.4 | water |
| water_2.wav | 1.66 | -26.4 | water |
| wobble.wav | 0.35 | -21.5 | wobble |

## The pack: music (6 OGG tracks)

| track | file | seconds | title |
|---|---|---:|---|
| 1 | track1_ansimuz-itch-io_megabot.ogg | 72.0 | megabot |
| 2 | track2_ansimuz-itch-io_summer-nights.ogg | 72.0 | summer nights |
| 3 | track3_ansimuz-itch-io_chibi-robot-b.ogg | 123.4 | chibi robot b |
| 4 | track4_ansimuz-itch-io_happywalking.ogg | 103.4 | happywalking |
| 5 | track5_ansimuz-itch-io_dark-happy-world.ogg | 96.0 | dark happy world |
| 6 | track6_ansimuz-itch-io_fantasy Dragon.ogg | 66.5 | fantasy Dragon |
