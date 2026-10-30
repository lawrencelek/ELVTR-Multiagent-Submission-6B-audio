Write the cue map for Prototype 9.

# DUMMIES — Sound Guide (Prototype 9, GDD Edit 100)

The reviewer and the refiner read this whole guide. Every rule has an ID, a severity, a test and a source.

## 0. The game, for the ear

- **DUMMIES:** a top-down game. A crash-test dummy in training in SHENZHEN SMART CITY. Self-driving cars are built never to hit anyone; the dummy gets hit anyway, in combos, and earns its parts. (GDD Current State)
- **The narrator:** Dummy Corporation. Deadpan and inspirational; corporate comedy in a Sinofuturist city. Never "!". (Edit 95; Style Guide V2 T1)
- **The cars** are colleagues, not enemies. They bark in their tier's voice. (Style Guide V2 T3, T7)
- **Two worlds of sound:**
  - **Bodies and machines:** dashes, jumps, hits, cones, cars, landings. Physical, short, punchy.
  - **The Corporation's system:** menus, notices, drones, counts, gifts, grades, the plaque. Clean, synthetic, official.
- **The pack:** 100 WAV effects (Chequered Ink) and six OGG tracks (ansimuz). Retro, synthetic. Names describe use: `hurt_*`, `select_*`, `confirm_*`, `collect_*`, `powerup_*`, `explosion_*`.

## 1. The request (Lawrence, verbatim)

> Music — Track 1 - Splash Screen. Track 2 - From menu until just before the level starts (whether story or arcade mode). Track 3, 4, 5, 6, Alternate between different levels and maps.
>
> SFX — read WAV file names and decide on appropriate places to put the sound triggers.

## 2. Classes (registry IDs)

**Buses:** `sfx` (bodies, machines, story beats) and `ui` (menus). Music is its own bus.

**Gain classes** (dB on the cue's bus; `audio.sfx.gain.<class>`):

| Class | Use |
|---|---|
| `ui` | Menu moves and confirms |
| `move` | The dummy's own moves: dash, jump, land, stairs |
| `hit` | Contact: hits, knocks, cone hits |
| `big` | The heaviest beats: write-off, big hit, the gift's landing |
| `reward` | Points and progress: combo, count, clear, grade, purchase |
| `story` | Corporation notices: drones, deliveries, fences, the ferry |
| `alert` | Warnings: denied, low health, honks |
| `ambient` | Traffic chatter and background |

**Cooldown classes** (seconds between plays of one cue; `audio.sfx.cooldown.<class>`): `ui`, `action`, `burst`, `frame`, `ambient`, `once`. A cue may name a specific ID instead (`audio.sfx.cooldown.honk`, `audio.sfx.cooldown.bark`).

**Decisions per event:** `cue` (files from the pack), `silence` (no sound, with a reason), `synth` (keep Prototype 8.4's procedural sound), `base` (a variant plays its base event's cue).

## 3. Rules

Severity: blocking −4, major −2, minor −1. Each broken rule deducts once per entry. The floor is 1.

### Coverage

| ID | Sev. | Rule | Test |
|---|---|---|---|
| C1 | blocking | Every catalogued event and variant has exactly one entry | An id in `events.json` with no entry, or two entries |
| C2 | major | Every high-priority event has a `cue` | A high-priority event set to `silence`, `synth` or `base` with no reason tied to the game |
| C3 | minor | Every `silence` and `synth` states why | An empty or generic `why` |

### Fit

| ID | Sev. | Rule | Test |
|---|---|---|---|
| F1 | major | The file's name suits the event | A name from another domain (an animal for a car, a laser for a footstep) with no stated joke |
| F2 | major | The duration suits the frequency | UI over 0.35 s; action, burst, frame or ambient over 0.8 s; once over 2.5 s |
| F3 | minor | Weight follows stakes | The write-off, the clear, the gift and the endings are the largest effects; menus the smallest |
| F4 | major | Tone: deadpan corporate comedy, Sinofuturist | Horror (`ghostly_laugh`), farmyard animals, fantasy magic, unless the entry states the joke and the GDD supports it |

### Clashes and spam

| ID | Sev. | Rule | Test |
|---|---|---|---|
| X1 | major | No file serves two events that fire together | A file in the primary `files` of two events that list each other in `firesWith` (variants of one event never fire together) |
| X2 | minor | Variety across the map | One file primary in more than three events |
| S1 | blocking | Per-frame and ambient events that sound have a cooldown | A sounded `frame` or `ambient` event on cooldown `ui`, `action` or `once` |
| S2 | major | Repeated actions vary | A sounded `burst` or `frame` event with one file and no stated reason |

### Loudness and licence

| ID | Sev. | Rule | Test |
|---|---|---|---|
| L1 | blocking | Every file used is in the inventory, measured and credited | A file missing from `inventory.json`, or with no level or credit |
| L2 | minor | Gain classes follow §2 | A menu cue not `ui`; ambient chatter not `ambient` |

### Music

| ID | Sev. | Rule | Test |
|---|---|---|---|
| M1 | blocking | The request's three spans hold | Intro not Track 1; any menu state not Track 2; levels not Tracks 3–6 |
| M2 | major | Levels alternate | Rotation not four distinct tracks from 3–6; neighbouring Story tiles on one track; Arcade not rotating per run |
| M3 | minor | Open states are stated | Pause, credits, ending or finale with no state and reason |

### Alternates (the Sound Lab)

| ID | Sev. | Rule | Test |
|---|---|---|---|
| A1 | minor | Each `cue` offers 2–3 alternates | Fewer than two, an alternate equal to a primary file, or an alternate from another domain |

## 4. Precedence

The request (§1) beats this guide. A row Lawrence decided in `DECISIONS.md` beats both.


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
| chassis | hits | New chassis | A fresh chassis drops in after a write-off. | once | medium | — | — | no |
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
