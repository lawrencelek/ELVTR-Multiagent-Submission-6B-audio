# DUMMIES — every line the player reads, before and after (Prototype 9)

30 October 2026 · 359 lines · 56 with a proposed change · for Lawrence's approval in the Text Lab (`prototypes/p9/text_lab.html`). Nothing is applied to the game until approved. Brief: `text/BRIEF.md`. Inventory: `text/inventory.py`. Lint: `text/lint.py`.

## Proposed rule change: Style Guide V2.10

- **T1:** Dummy Corporation: deadpan and inspirational, with a dry corporate snark. The trainee is an asset under review: a flat, procedural put-down, then the instruction. No cheer, no "!", no wink, no insult to the body's pain (T4 holds).
- **T15:** Feedback (a miss, a denial, a held chassis, NOT COUNTED): a put-down of at most three words, then what to do, in the imperative. At most 60 characters, to fit the strip.
- **T16:** Status lines (COUNTED, TILE CLEARED, combo tallies, drone captions) stay crisp. Praise is withheld, not given. At most one put-down in three.
- **Cars:** Unchanged. Their tier voices already carry the snark (T6 to T12).

Your example set the direction: "Try harder - bait a car to divert and get hit." V2.9 (T1) counted sarcasm as a fault; V2.10 lets the Corporation be dry. Approve it and the new lines follow it; keep V2.9 and they are judged by the old rule.

## Car barks (147 lines, 56 changed)

| ID | Where | Before | After | Why |
|---|---|---|---|---|
| `bark.b001` | the car hits the dummy (zone front/frontDiagonal) | Bumper damage on a Luxury trim. Typical. | *unchanged* | kept: the guide's own in-voice Luxury example; front zone fits bumper. |
| `bark.b002` | the car hits the dummy (zone front/frontDiagonal) | You will be invoiced for that. | *unchanged* | kept: Luxury superiority, a threat not a fact; true to a front hit. |
| `bark.b003` | the car hits the dummy (zone side) | My door panel! Hand-finished! | **That door was hand-finished. You were not.** | T7: Luxury sneers, not shrieks; side zone keeps the door (R2). |
| `bark.b004` | the car hits the dummy (zone rear/rearDiagonal) | From behind? How very common. | *unchanged* | kept: Luxury snobbery; rear zone matches 'from behind'. |
| `bark.b005` | the car hits the dummy (zone front/frontDiagonal) | Front contact. Incident 4471 opened. | *unchanged* | kept: Corporate incident number; paperwork digits allowed (F5). |
| `bark.b006` | the car hits the dummy (zone front/frontDiagonal) | Impact logged. KPIs adjusted. | **Impact logged. Quarterly KPIs revised downward.** | T12: flat report gets a dry Corporate sting. |
| `bark.b007` | the car hits the dummy (zone side) | Side contact. Filing under unforeseen. | *unchanged* | kept: procedural filing joke, side zone true. |
| `bark.b008` | the car hits the dummy (zone rear/rearDiagonal) | Rear contact. Not my liability. | *unchanged* | kept: Corporate liability dodge, rear zone true. |
| `bark.b009` | the car hits the dummy (zone front/frontDiagonal) | Of course it was me. | *unchanged* | kept: Consumer resignation in five words. |
| `bark.b010` | the car hits the dummy (zone front/frontDiagonal) | And the day was going so averagely. | *unchanged* | kept: tired Consumer joke, claims nothing extra. |
| `bark.b011` | the car hits the dummy (zone side) | Side panel. Add it to the list. | *unchanged* | kept: resigned Consumer; side zone fits side panel. |
| `bark.b012` | the car hits the dummy (zone rear/rearDiagonal) | Hit from behind. Story of my life. | *unchanged* | kept: tired Consumer cliché; rear zone true. |
| `bark.b013` | the car hits the dummy (zone front/frontDiagonal) | OI! Right in the grille, kind regards. | *unchanged* | kept: Budget rage with politeness bolted on; front zone fits grille. |
| `bark.b014` | the car hits the dummy (zone front/frontDiagonal) | You absolute bollard! Respectfully. | *unchanged* | kept: Budget insult plus bolted-on courtesy, the tier's signature. |
| `bark.b015` | the car hits the dummy (zone side) | My side! Watch it, you plank! | **My side panel, you plank! Sincerely.** | T7: Budget rage now gets its bolted-on politeness. |
| `bark.b016` | the car hits the dummy (zone rear/rearDiagonal) | My boot! Come back here! | **My boot! Come back here, if you please!** | T7: Budget rage now gets its bolted-on politeness. |
| `bark.b017` | the car hits the dummy (bait True) | It left my path, then came back. Rude. | **I routed around it. It rerouted into me.** | R2: bait means a committed route; resentment sharpened. |
| `bark.b018` | the car hits the dummy (bait True) | It waited for my route to lock. Clever. | **Hit after route lock. Flagging an exploit.** | R1: 'it waited' claimed a motive; T7: Corporate logs it. |
| `bark.b019` | the car hits the dummy (stopped True) | I was stationary. Please note I was stationary. | *unchanged* | kept: defensive, true to a stopped hit. |
| `bark.b020` | the car hits the dummy (stopped True) | I had stopped! I was being good! | **I had STOPPED! Cheers for that, pal!** | T7: whine became Budget rage with sarcastic courtesy. |
| `bark.b021` | the car hits the dummy (seniority {'min': 2}) | I was trained for this. It happened anyway. | **I have experience. It has persistence.** | T8: drops the resigned 03 note; rank pride, dry. |
| `bark.b022` | the car hits the dummy (seniority {'min': 3}) | Senior model. Hit like an intern. | *unchanged* | kept: Consumer self-deprecation; seniority 3 guarantees 'senior'. |
| `bark.b023` | the car hits the dummy (seniority {'max': 0}) | First week on the job. Great. | **Still on probation. This will look great.** | R2: 'first week' invented a duration; seniority 0 means new. |
| `bark.b024` | the car hits the dummy (class bus) | Passengers, please remain seated. | *unchanged* | kept: bus job, deadpan. |
| `bark.b025` | the car hits the dummy (class police) | Assaulting an officer. Noted. | *unchanged* | kept: police joke; now the batch's only 'Noted.' |
| `bark.b026` | the car hits the dummy (class van) | Parcel intact. Nerves are not. | **You are not on my manifest.** | R1: 'parcel intact' not logged; van job kept. |
| `bark.b027` | the car hits the dummy (class sports) | You scratched the clear coat! | **Express courier! Crash tests are not my job.** | R1: no scratch logged; courier job, workplace grievance. |
| `bark.b028` | the car hits the dummy | Contact registered. | **Contact. I will be asked about this.** | T12: flat Corporate log; adds fear of review. |
| `bark.b029` | the car hits the dummy (class wagon) | Not in front of the children! | *unchanged* | kept: wagon job, shout fits. |
| `bark.b030` | the car hits the dummy (class suv) | Escort formation broken. Regrouping. | **I do security. You are now the incident.** | R1: no formation logged; security job, dry jab. |
| `bark.b031` | the car hits the dummy (class sedan) | Meter is still running, you know. | *unchanged* | kept: sedan job, dry snark. |
| `bark.b032` | the car hits the dummy (model HAT-03-001) | I only went out for noodles. | *unchanged* | kept: callsign Noodle pins it (V7). |
| `bark.b033` | the car hits the dummy (model SED-01-001) | The board will hear of this. | *unchanged* | kept: chauffeur job pins it (V7). |
| `bark.b034` | the car writes the chassis off | A write-off on my record. Unthinkable. | *unchanged* | kept: Luxury pride in its record; writeoff event true. |
| `bark.b035` | the car writes the chassis off | Have that removed from the bay, please. | **Have that cleared from my route. Discreetly.** | V3: the bay issues chassis; the write-off lies on the route. |
| `bark.b036` | the car writes the chassis off | Write-off {writeOffs} recorded. Please advise. | *unchanged* | kept: Corporate log; placeholder intact. |
| `bark.b037` | the car writes the chassis off | Body total confirmed. Closing ticket. | **Chassis total confirmed. Ticket auto-closed.** | V3: 'chassis', the canon word; auto-closed adds the dry shrug. |
| `bark.b038` | the car writes the chassis off | I always end up doing the worst bit. | *unchanged* | kept: Consumer grievance, true to a writeoff. |
| `bark.b039` | the car writes the chassis off | Please not retraining. Anything but. | *unchanged* | kept: fear of retraining (T6), Consumer voice. |
| `bark.b040` | the car writes the chassis off | WRITE-OFF! Tell dispatch I tried! | *unchanged* | kept: Budget panic naming dispatch; writeoff true. |
| `bark.b041` | the car writes the chassis off | Done, done! You happy now?! | **Done, done! You're welcome, I'm sure!** | T7: Budget fury now wears bolted-on politeness. |
| `bark.b042` | the car writes the chassis off (seniority {'min': 3}) | Senior model. Apparently not senior enough. | *unchanged* | kept: rank sting, true to seniority. |
| `bark.b043` | the car writes the chassis off (class bus) | This service apologises for the delay. | **End of the line. For the chassis, anyway.** | T8: Luxury never apologises; R1: no delay logged. |
| `bark.b044` | the car writes the chassis off (class police) | Case closed. Wait, that was the test. | *unchanged* | kept: fear of the car's own test. |
| `bark.b045` | the car writes the chassis off | Write-off confirmed. | **Write-off. Dispatch will want a word.** | T12: flat confirm; fear of dispatch instead. |
| `bark.b046` | the car passes close | Missed. One prefers a wide berth. | **A near thing. One prefers a wider berth.** | T11: 'Missed' opened five lines; Luxury distaste kept. |
| `bark.b047` | the car passes close | Close. Do keep up. | *unchanged* | kept: Luxury amusement in four words. |
| `bark.b048` | the car passes close | Within tolerance. Barely. | *unchanged* | kept: Corporate tolerance joke, dry and short. |
| `bark.b049` | the car passes close | Near miss logged as a pass. | *unchanged* | kept: Corporate fudging the log; near-miss true. |
| `bark.b050` | the car passes close | That nearly made my day worse. | *unchanged* | kept: Consumer gloom, true to a close pass. |
| `bark.b051` | the car passes close | Missed me. For now. | *unchanged* | kept: Consumer expects the worst. |
| `bark.b052` | the car passes close | Too slow, ha! Have a nice day! | *unchanged* | kept: Budget gloat with bolted-on courtesy. |
| `bark.b053` | the car passes close | Nearly had me. NEARLY. | *unchanged* | kept: Budget short fuse; caps carry the rage. |
| `bark.b054` | the car passes close (wear {'min': 0.7}) | That one is nearly scrap. Steer wide. | *unchanged* | kept: true to wear, workplace caution. |
| `bark.b055` | the car passes close | Was that a collision? Logging it as not. | **Was that contact? I am going with no.** | T8: 'logging' is Corporate's signature; the denial joke kept. |
| `bark.b056` | a dash misses the car | Is it dancing? How quaint. | *unchanged* | kept: Luxury amusement at a whiffed dash. |
| `bark.b057` | a dash misses the car | Missed. One expected nothing less. | **All that effort, and not a scratch. Charming.** | T11: 'Missed' opener cut; drier Luxury amusement at the miss. |
| `bark.b058` | a dash misses the car | Dash detected, no contact. Noted. | **Dash detected, no contact. Form not required.** | T11: drops stock 'Noted'; Corporate snub lands harder. |
| `bark.b059` | a dash misses the car | Missed. Updating my calendar. | **Attempt unsuccessful. Copying your supervisor.** | T7: calendar line was off-voice; office snark in Corporate register. |
| `bark.b060` | a dash misses the car | It missed. Even it gave up on me. | **It missed me. I refuse to feel lucky.** | R2: a miss is not giving up; Consumer gloom kept. |
| `bark.b061` | a dash misses the car | It lunged and nothing happened. Same. | *unchanged* | kept: Consumer empathy joke; 'lunged' matches the dash. |
| `bark.b062` | a dash misses the car | Missed, rubbish! Regards! | *unchanged* | kept: Budget insult with bolted-on sign-off. |
| `bark.b063` | a dash misses the car | Ha! Do it properly! | **Ha! Better luck never, cheers!** | T7: adds Budget's bolted-on courtesy; sharper jab. |
| `bark.b064` | a dash misses the car (broken legs) | Its legs have gone. It cannot reach. | **Its legs are broken. Its ambition is not.** | T12: report to joke; broken legs still claimed. |
| `bark.b065` | the car fixes its route around the dummy (mood Rush) | Rushing. Do not make me late. | *unchanged* | kept: true to Rush mood. |
| `bark.b066` | the car fixes its route around the dummy (mood Cautious) | Slowing. Everything is a hazard. | *unchanged* | kept: true to Cautious mood. |
| `bark.b067` | the car passes close (mood Unreliable) | Was that a dummy? Or a bin? | *unchanged* | kept: true to Unreliable mood, dry. |
| `bark.b068` | a dash misses the car | Missed. Noted for my record. | **Missed me. Please keep practising elsewhere.** | T8, T11: drops Corporate 'Noted'; smug relief instead. |
| `bark.b069` | the car fixes its route around the dummy (cause body, man brake) | Stopping for the dummy. Window closing. | *unchanged* | kept: true to a brake for the body. |
| `bark.b070` | the car fixes its route around the dummy (cause body) | Route locked. Do not try anything. | **Route locked. Do try not to embarrass us both.** | T7: threat read as Budget; Luxury condescends instead. |
| `bark.b071` | the car fixes its route around the dummy (cause body) | Route committed per policy 6.3. | *unchanged* | kept: Corporate policy number; commit event true. |
| `bark.b072` | the car fixes its route around the dummy (cause body) | Going round. Please let me. | *unchanged* | kept: tired Consumer plea. |
| `bark.b073` | the car fixes its route around the dummy (cause body) | Going round you! Stay put! | **Going round you! Stay put, there's a dear!** | T7: Budget rage now gets its bolted-on politeness. |
| `bark.b074` | the car fixes its route around the dummy (cause pass) | Passing, after waiting. Patience documented. | **Passing. Stay exactly where you are.** | R1: no wait logged; T8: drops Corporate 'documented'. |
| `bark.b075` | the car fixes its route around the dummy | Route locked. | **Route locked. Do not improvise.** | T12: bare status; adds a dry warning. |
| `bark.b076` | the car honks at the dummy | Horn sounded, per procedure. | **That was the horn. It means move.** | T8, T11: drops 'procedure'; dry translation instead. |
| `bark.b077` | the car's route is interrupted | Braking for safety. | *unchanged* | kept: generic fallback; repeat in b086 removed. |
| `bark.b078` | the car unsticks itself | Recovering route. | **Unstuck. We never speak of this.** | T12: flat status; adds embarrassment. |
| `bark.b079` | the car fixes its route around the dummy (cause body, wear {'min': 0.7}) | That one is wobbling. Give it room. | *unchanged* | kept: true to wear and a body cause. |
| `bark.b080` | the car honks at the dummy (at body) | Excuse me. Kindly vacate the carriageway. | *unchanged* | kept: politeness barely contains it (T9). |
| `bark.b081` | the car honks at the dummy (at body) | Move. I have a schedule, and standards. | *unchanged* | kept: Luxury impatience with standards. |
| `bark.b082` | the car honks at the dummy (at body, model VAN-02-001) | You are blocking route 44. | *unchanged* | kept: route 44 is the model's job (V7). |
| `bark.b083` | the car honks at the dummy (at body) | MOVE IT, thank you! MOVE! | *unchanged* | kept: Budget honk with courtesy jammed in. |
| `bark.b084` | the car honks at the dummy (at cone) | Cone in lane. Raising with maintenance. | *unchanged* | kept: workplace grievance, true to a cone honk. |
| `bark.b085` | the car honks at the dummy (at cone) | Who put a cone here? It was you. | **Who put a cone here? Thanks ever so much!** | R2: 'it was you' unproven; Budget sarcasm added. |
| `bark.b086` | the car's route is interrupted (by car) | Another vehicle. Braking for safety. | **Colleague in my way. We will talk later.** | T12: repeated 'braking for safety'; colleague resentment instead. |
| `bark.b087` | the car's route is interrupted (by cone) | Swerve halted by a cone. Procedure holds. | **Overruled by a cone. Humbling.** | T8, T11: drops 'procedure'; R1: no swerve guaranteed. |
| `bark.b088` | the car unsticks itself (how reverse) | Reversing. This is within procedure. | **Reversing. This is not a retreat.** | T8, T11: drops 'procedure'; pride instead. |
| `bark.b089` | the car unsticks itself (how replan) | Replanning. Rank unaffected. | *unchanged* | kept: rank pride, true to replan. |
| `bark.b090` | the dummy touches a car that already hit it | Already assessed. Please move along. | *unchanged* | kept: true to a spent car, dry. |
| `bark.b091` | the dummy touches a car that already hit it | I have done my bit today. | *unchanged* | kept: Consumer weariness, true to a spent car. |
| `bark.b092` | the car knocks the dummy aside | Contact logged. Stand clear of the vehicle. | **Moved it aside. Stand clear of the vehicle.** | T8: drops Corporate 'logged'; announcement deadpan kept. |
| `bark.b093` | the car knocks the dummy aside | Hands off the paintwork. | *unchanged* | kept: Luxury disdain, true to a knock. |
| `bark.b094` | the car's model learns a stop line | Stop line moved back. Lesson logged. | **Stop line moved back. We are learning you.** | T8: drops 'logged'; adds the fleet's quiet threat. |
| `bark.b095` | the car's model learns a stop line | I remember you. I stop further now. | **I remember you. I shall stop further back.** | T7: broken grammar fixed; Luxury polish; true to a stop line. |
| `bark.b096` | the car's model learns a stop line | Retrained. Keeping my distance. | *unchanged* | kept: Consumer resignation, true to a learned stop line. |
| `bark.b097` | the car's model learns a stop line | Not falling for that again! | **Not falling for that again, ta very much!** | T7: Budget rage now gets its bolted-on politeness. |
| `bark.b098` | the car sees a new part on the chassis (node widerView) | It is looking at all of us now. | *unchanged* | kept: true to wider view, uneasy. |
| `bark.b099` | the car sees a new part on the chassis (node memory) | It remembers where we were. Unsettling. | *unchanged* | kept: true to memory, uneasy. |
| `bark.b100` | the car sees a new part on the chassis (node ears) | It heard me coming. It has ears. | **Ears on the subject. Mind what you say.** | R2: no hearing logged; workplace gossip instead. |
| `bark.b101` | the car sees a new part on the chassis (node hips) | Subject has acquired hips. | *unchanged* | kept: deadpan, true to hips. |
| `bark.b102` | the car sees a new part on the chassis (node spine) | That spine was not on the last report. | *unchanged* | kept: true to spine, dry. |
| `bark.b103` | the car sees a new part on the chassis (node neck) | It looked one way and walked another. | *unchanged* | kept: true to neck, dry. |
| `bark.b104` | the car sees a new part on the chassis (node springStart) | No wind-up? Who approved that? | *unchanged* | kept: workplace complaint, true to spring start. |
| `bark.b105` | the car sees a new part on the chassis (node jump) | It jumped. Dummies do not jump. | **Jumping legs? Dummies do not jump.** | R2: a seen part, not a logged jump. |
| `bark.b106` | the car sees a new part on the chassis (node grip) | It is not sliding any more. Noted. | **It has grip. The road is ours, actually.** | T11: repeated 'Noted.'; territorial resentment instead. |
| `bark.b107` | the car sees a new part on the chassis (node carry) | It is carrying something. Approved? | **It carries cones. I know where they end up.** | R2: carrying not guaranteed; the cone threat lands. |
| `bark.b108` | the car sees a new part on the chassis (node throw) | It can throw now. Nobody told us. | *unchanged* | kept: workplace grievance, true to throw. |
| `bark.b109` | the car sees a new part on the chassis (node holdOn) | Is it holding on to my door? | **It can hold on to us. We are not handrails.** | R2: no zone, so no 'door'; grievance added. |
| `bark.b110` | the car sees a new part on the chassis (node bigBattery) | Bigger battery, more dashes. Wonderful. | *unchanged* | kept: dry sarcasm, true to battery. |
| `bark.b111` | the car sees a new part on the chassis (node kineticCharge) | It recharges when it hits us?! | **It recharges when it hits us?** | T10: '!' only in a shout. |
| `bark.b112` | the car sees a new part on the chassis (node fastCharge) | It recharges faster than I do. | *unchanged* | kept: tired envy fits any tier. |
| `bark.b113` | the car sees a new part on the chassis | New modification. Updating my threat model. | *unchanged* | kept: Corporate threat model, true to a new part. |
| `bark.b114` | the car sees a new part on the chassis | The subject has changed. Noted. | **It has a new part. We were not consulted.** | T11: repeated 'Noted.'; workplace grievance instead. |
| `bark.b115` | the car sees a damaged part (part head) | Its head is cracked. Still coming. | *unchanged* | kept: true to a broken head. |
| `bark.b116` | the car sees a damaged part (part torso) | Its torso is buckled. It turns so slowly. | *unchanged* | kept: true to a broken torso. |
| `bark.b117` | the car sees a damaged part (part armL) | Its left arm is hanging. | *unchanged* | kept: true to a broken left arm. |
| `bark.b118` | the car sees a damaged part (part armR) | Its right arm is hanging. | **Right arm hanging. Not my department.** | T12: twin of b117; adds workplace deflection. |
| `bark.b119` | the car sees a damaged part (part legL) | Left leg gone. It is limping. | *unchanged* | kept: true to a broken left leg. |
| `bark.b120` | the car sees a damaged part (part legR) | Right leg gone. Look at it hobble. | **Right leg gone. Still on the clock, though.** | Not mean: drops mockery; workplace dryness instead. |
| `bark.b121` | the car sees a damaged part | It is falling apart. Like me. | *unchanged* | kept: Consumer self-pity, true to a damaged part. |
| `bark.b122` | the car sees a damaged part | Damaged goods. Not my problem. | *unchanged* | kept: Luxury indifference, true to a damaged part. |
| `bark.b123` | the car sees a damaged part | Subject damage noted. | **It is damaged. Do not look at me.** | T11, T12: flat 'noted' log; defensive instead. |
| `bark.c001` | the car hits the dummy (drop True, dropFrom roof, dropZ 2) | A roof? I was not briefed on roofs. | *unchanged* | kept: Luxury affront; roof drop true. |
| `bark.c002` | the car hits the dummy (drop True, dropFrom roof, dropZ 2) | Incident filed: load received from a roof. | *unchanged* | kept: Corporate incident filing; roof drop true. |
| `bark.c003` | the car hits the dummy (drop True, dropFrom roof, dropZ 2) | Roofs are not on my route. | *unchanged* | kept: true to a roof drop. |
| `bark.c004` | the car hits the dummy (drop True, dropFrom roof, dropZ 2) | Landed on from a roof. My paintwork objects. | *unchanged* | kept: Luxury vanity; roof drop true. |
| `bark.c005` | the car hits the dummy (drop True, dropFrom deck, dropZ 2) | That came off the high highway. | **It dropped off the highway. Onto me.** | Fixes 'high highway'; true to a deck drop. |
| `bark.c006` | the car hits the dummy (drop True, dropFrom deck) | Form 9: load received from a parapet. | *unchanged* | kept: Corporate form; deck drop through a parapet true. |
| `bark.c007` | the car hits the dummy (drop True, dropFrom deck, dropZ 1) | From the low highway? Quite unseemly. | *unchanged* | kept: Luxury snobbery; dropZ 1 is the low highway. |
| `bark.c008` | the car hits the dummy (drop True, dropZ 2) | That fell a long way to reach me. | *unchanged* | kept: true to a high drop. |
| `bark.c009` | the car hits the dummy (drop True, dropFrom deck, dropZ 1) | Policy 12 excludes loads from parapets. | *unchanged* | kept: Corporate policy dodge; deck drop true. |
| `bark.c010` | the car hits the dummy (deck True) | Nobody walks the highway. Nobody. | *unchanged* | kept: true to a deck hit. |
| `bark.c011` | the car hits the dummy (deck True) | Struck on the highway. How undignified. | **Struck on the highway. Simply not done.** | T11: third 'How …' closer in Luxury; varied, same hauteur. |
| `bark.c012` | the car hits the dummy (deck True) | Highway strike filed under policy 9. | *unchanged* | kept: Corporate policy filing; deck hit true. |
| `bark.c013` | the car hits the dummy (plate True) | Hit on a plate. Calibrated, naturally. | *unchanged* | kept: true to a plate hit. |
| `bark.c014` | the car hits the dummy (plate True) | Struck on a calibration plate. Vulgar. | *unchanged* | kept: Luxury one-word verdict; plate hit true. |
| `bark.c015` | the car hits the dummy (plate True) | Plate hit filed against calibration form 3. | *unchanged* | kept: Corporate form number; plate hit true. |
| `bark.c016` | the car writes the chassis off (drop True) | Written off from above. Unthinkable. | **Written off from above. Hardly sporting.** | T11: 'Unthinkable' duplicated b034; Luxury hauteur kept. |
| `bark.c017` | the car writes the chassis off (drop True) | Write-off filed. Cause: load from above. | *unchanged* | kept: Corporate cause log; drop writeoff true. |
| `bark.c018` | the car writes the chassis off (deck True) | Written off on the highway. On my record. | *unchanged* | kept: record fear, true to a deck write-off. |
| `bark.c019` | the car writes the chassis off (plate True) | Written off on a calibration plate. | *unchanged* | kept: true to a plate write-off. |
| `bark.c020` | the car hits the dummy (district riverside) | Riverside route. Nobody mentioned this. | **Riverside route. Scenic, until now.** | T11: third 'Nobody' line; sarcasm instead. |
| `bark.c021` | the car hits the dummy (district market) | Old Market. Not on any itinerary. | *unchanged* | kept: true to the market district. |
| `bark.c022` | the car hits the dummy (district interchange) | Interchange. Two flyovers and now this. | *unchanged* | kept: true to the interchange. |
| `bark.c023` | the car hits the dummy (district cbd) | Business district. Of all places. | *unchanged* | kept: dry, true to the business district. |
| `bark.c024` | the car hits the dummy (district campus) | Hit on campus. That goes on my record. | **Hit on campus. Now I am a case study.** | Campus joke; frees 'on my record' for c018. |

## Story (42 lines, 0 changed)

| ID | Where | Before | After | Why |
|---|---|---|---|---|
| `story.act.monument` | ACT I · INDUCTION: the act line, on the district's first card and the map | Dummy Corporation welcomes you off the factory floor. The cars are your colleagues; Certification is your goal. | *unchanged* | kept |
| `story.tale.monument.A1` | Monument A1 · The welcome wall: the tile card's tale | Fresh off the factory floor, you're ready to do some damage to yourself. Make your engineers proud. | *unchanged* | kept · your line (U1) |
| `story.tale.monument.B1` | Monument B1 · The podium bridge: the tile card's tale | Battery 1 is fitted. The skybridge was built for shoppers who never came; staff watch you dash into a colleague. | *unchanged* | kept |
| `story.tale.monument.C1` | Monument C1 · The LED drum: the tile card's tale | The LED drum lights each bend. Step off the high road onto a car: gravity is company policy. | *unchanged* | kept |
| `story.tale.monument.C2` | Monument C2 · The portal tower: the tile card's tale | The road runs through the portal tower at the sixth floor. Take your write-off up there; ignore the view. | *unchanged* | kept |
| `story.tale.monument.B2` | Monument B2 · The monument: the tile card's tale | The plaque reads ZERO ACCIDENTS: a target, not a record. Stand near it until a colleague finds you. | *unchanged* | kept |
| `story.tale.monument.A2` | Monument A2 · The neon shops: the tile card's tale | The neon shops sell nothing, but the traffic reads them. Hands 1 is fitted: bait a colleague with a cone. | *unchanged* | kept |
| `story.tale.monument.A3` | Monument A3 · The stacked cubes: the tile card's tale | The stacked cubes rose one budget at a time. Build the same way: one hit, then another, quickly. | *unchanged* | kept |
| `story.tale.monument.B3` | Monument B3 · The LED canyon: the tile card's tale | Two screens advertise to each other all night. Legs 1 is fitted: jump into a car between them. | *unchanged* | kept |
| `story.tale.monument.C3` | Monument C3 · The LED gateway: the tile card's tale | The gateway thanked the car that wrote you off for driving safely. Let one colleague throw you into the next. | *unchanged* | kept |
| `story.act.parkland` | ACT II · OPENING DAY: the act line, on the district's first card and the map | The Expo opens to clients when this park passes. Your training keeps them safe. | *unchanged* | kept |
| `story.tale.parkland.C1` | Parkland C1 · The lantern pavilion: the tile card's tale | The lantern, the Expo's first exhibit, is lit for clients. With Arms 1, push off one car into the next. | *unchanged* | kept |
| `story.tale.parkland.C2` | Parkland C2 · The amphitheatre: the tile card's tale | Our board watches opening day from these terraces. A van delivers the catering; arrange for it to deliver you. | *unchanged* | kept |
| `story.tale.parkland.C3` | Parkland C3 · The arch and the roundabout: the tile card's tale | The arch is the Expo's gate; visitors circle the roundabout once. You go faster: chain hits before each is forgotten. | *unchanged* | kept |
| `story.tale.parkland.B3` | Parkland B3 · The obelisk court: the tile card's tale | The obelisk marks the surveyors' first stake. Police escort a school party here on opening day; test them first. | *unchanged* | kept |
| `story.tale.parkland.A3` | Parkland A3 · The belvedere: the tile card's tale | A wedding faces the traffic from the belvedere. Legs 2 is fitted: jump into a car, so no guest does. | *unchanged* | kept |
| `story.tale.parkland.A2` | Parkland A2 · The dome by the canal: the tile card's tale | The dome is the Expo's showroom; you are the exhibit. Hands 2 is fitted: bait a car with a cone. | *unchanged* | kept |
| `story.tale.parkland.A1` | Parkland A1 · The reservoir terraces: the tile card's tale | The gardener's pools need cars that stop. Teach them with Arms 2: push off one car into the next. | *unchanged* | kept |
| `story.tale.parkland.B1` | Parkland B1 · The cascade: the tile card's tale | The cascade was built to drown out the traffic. The traffic got louder; take your hit up on the highway. | *unchanged* | kept |
| `story.tale.parkland.B2` | Parkland B2 · The ring over the pools: the tile card's tale | The board watches the ring over the pools. Battery 2 is fitted: chain your hits. | *unchanged* | kept |
| `story.act.waterfront` | ACT III · CUSTOMS: the act line, on the district's first card and the map | Certified dummies ship across the river, to be sacrificed in service to our clients. Your papers are being prepared. | *unchanged* | kept |
| `story.tale.waterfront.A1` | Waterfront A1 · The west portal: the tile card's tale | The bus carries engineers through the west portal to the bridge. It never misses; take its hit. | *unchanged* | kept |
| `story.tale.waterfront.B1` | Waterfront B1 · The tunnel portal: the tile card's tale | Cars go into the tunnel under the hill, and data comes back. Legs 3 is fitted: leap into one. | *unchanged* | kept |
| `story.tale.waterfront.C1` | Waterfront C1 · The east portal: the tile card's tale | The east portal faces away from its twin. Police here check papers; your Certification needs their fleet on record. | *unchanged* | kept |
| `story.tale.waterfront.C2` | Waterfront C2 · The east beach terrace: the tile card's tale | The east beach terrace served tourists, then sensors. Drop from its rail onto a car; ships wait for the Certified. | *unchanged* | kept |
| `story.tale.waterfront.C3` | Waterfront C3 · The east customs post: the tile card's tale | The pier tower logs all that floats: containers, ducks, one dummy. Be thrown into a car to earn your entry. | *unchanged* | kept |
| `story.tale.waterfront.B3` | Waterfront B3 · The stilt houses: the tile card's tale | The stilt houses keep Chassis 0 behind glass. Arms 3 is fitted; push off a car and show it progress. | *unchanged* | kept |
| `story.tale.waterfront.A3` | Waterfront A3 · The west customs post: the tile card's tale | The west tower keeps the customs log. Your entry reads PURPOSE DESTRUCTION: honour it on the raised road. | *unchanged* | kept |
| `story.tale.waterfront.A2` | Waterfront A2 · The west beach terrace: the tile card's tale | Sand from three provinces lies under the west beach terrace. Place a cone; one more clean reading before the ceremony. | *unchanged* | kept |
| `story.tale.waterfront.B2` | Waterfront B2 · The circus: the tile card's tale | The circus monument, cast from your written-off chassis, reads ZERO ACCIDENTS (EXCLUDING TESTS). Battery 3 is fitted; chain your hits. | *unchanged* | kept |
| `story.brief.any` | the brief 'any': the level card, the map's tile panel | Walk into the path of the incoming vehicles. Time your approach, and choose your angle carefully. Bonus points for combinations and lethal hits. | *unchanged* | kept · your line (U1) |
| `story.brief.dash` | the brief 'dash': the level card, the map's tile panel | Dash into a car. The final hit must be the dash. | *unchanged* | kept |
| `story.brief.drop` | the brief 'drop': the level card, the map's tile panel | Drop onto a car from above. The final hit must be that drop. | *unchanged* | kept |
| `story.brief.jump` | the brief 'jump': the level card, the map's tile panel | Jump into a car. The jump must be the final hit. | *unchanged* | kept |
| `story.brief.level` | the brief 'level': the level card, the map's tile panel | Climb to a raised road. The final hit must land up there, not on the street. | *unchanged* | kept |
| `story.brief.cone` | the brief 'cone': the level card, the map's tile panel | Place a cone. The final hit must come from a car reacting to it. | *unchanged* | kept |
| `story.brief.push` | the brief 'push': the level card, the map's tile panel | Push off one car. The final hit must be the next car. | *unchanged* | kept |
| `story.brief.bounce` | the brief 'bounce': the level card, the map's tile panel | Let one car throw you into another. Take the final hit while a hit is still throwing you. | *unchanged* | kept |
| `story.brief.struck` | the brief 'struck': the level card, the map's tile panel | Walk or stand in the traffic. A car must deliver the final hit while you are not dashing. | *unchanged* | kept |
| `story.brief.combo` | the brief 'combo': the level card, the map's tile panel | Chain your hits into a combo. The final hit must be link {n} or later. | *unchanged* | kept |
| `story.brief.cls` | the brief 'cls': the level card, the map's tile panel | Step in front of the {clsLong}. The final hit must come from a {cls}. | *unchanged* | kept |
| `story.ending` | CERTIFIED: the ending at the ship | Your model has passed and will be manufactured for our clients. A Corporation drone carries you to the ship. | *unchanged* | kept |

## Notices (27 lines, 0 changed)

| ID | Where | Before | After | Why |
|---|---|---|---|---|
| `notice.n01` | the intro screen's line (Arcade) | You are a Dummy Corporation trainee. Every write-off brings Certification closer. | *unchanged* | kept |
| `notice.n02` | the title line | Welcome, trainee. Every write-off brings Certification closer. | *unchanged* | kept |
| `notice.n03` | the STORY card on the mode select | Get your Dummy Certification in Shenzhen Smart City and learn about the Corporation. | *unchanged* | kept · your line (U1) |
| `notice.n07` | toast: a drone delivers a part | CORPORATION DRONE · DELIVERING {PART} | *unchanged* | kept |
| `notice.n08` | toast: the ferry, with a part on board | CORPORATION DRONE · {PART} ON BOARD · THEN {TILE} | *unchanged* | kept |
| `notice.n09` | toast: the ferry | CORPORATION DRONE · CARRYING YOU TO {TILE} | *unchanged* | kept |
| `notice.n11` | toast: a tile's credit gift | CORPORATION GIFT · +{N} CREDITS | *unchanged* | kept |
| `notice.n13` | the workshop: a part not yet issued | A Corporation drone brings this part. | *unchanged* | kept |
| `notice.n14` | the workshop: a part not yet issued, with a nudge | A Corporation drone brings this part. Keep training. | *unchanged* | kept |
| `notice.n15` | toast: buying a part the drone brings | A Corporation drone brings that part | *unchanged* | kept |
| `notice.n16` | controls: a verb not yet fitted | A Corporation drone brings it | *unchanged* | kept |
| `notice.n17` | toast: a drone rescues the chassis from the river | Corporation drone dispatched: chassis in the river | *unchanged* | kept |
| `notice.n18` | toast: a drone clears a cone | Corporation drone dispatched. Obstruction will be relocated. | *unchanged* | kept |
| `notice.n19` | toast: the chassis recovered from the river | Corporation drone: chassis recovered from the river | *unchanged* | kept |
| `notice.n20` | the ending: Licensed | Training complete. The Corporation thanks you for your service. | *unchanged* | kept |
| `notice.n21` | the ending: Failed test | Traffic exhausted. Training incomplete; report to the bay. | *unchanged* | kept |
| `notice.n24` | Monument: the district blurb | Neon shops, LED walls; one road splits round the monument under the walkway ring. Your training begins here. | *unchanged* | kept |
| `notice.n25` | Parkland: the district blurb | Water and concrete; a boulevard passes under the raised ring. Your write-offs open the Expo to clients. | *unchanged* | kept |
| `notice.n26` | Waterfront: the district blurb | A hill walled by towers; bridges cross the drive and the river. Certified dummies ship across it to clients. | *unchanged* | kept |
| `notice.n28` | the CBD blurb (district not in play) | Towers and barriers. Corporation Tower stands over your training. | *unchanged* | kept |
| `notice.n29` | the Campus blurb (district not in play) | The test centre the city was modelled on. Hits on its impact plates count for more. | *unchanged* | kept |
| `notice.n30` | the CBD intro (district not in play) | Two flyovers cross it, one above the other. Corporation Tower stands at the centre; towers shade your training. | *unchanged* | kept |
| `notice.n31` | the Campus intro (district not in play) | Impact plates mark the road at the centre. A write-off on a plate counts for more. | *unchanged* | kept |
| `notice.n34` | the ARCADE card on the mode select | Get hit in fun, creative, and destructive ways before the vehicles run out. | *unchanged* | kept · your line (U1) |
| `notice.n35` | toast: Arcade's grade rises | GRADE {G} · TOUGHER CHASSIS · DENSER TRAFFIC | *unchanged* | kept |
| `notice.n36` | the intro screen's line | Self-driving cars are designed never to hit anyone. Your training: get hit, in combos, and earn your parts. | *unchanged* | kept |
| `notice.n37` | Arcade's district card | Write off bodies; every {Q} write-offs, the grade rises. Keep training until the vehicles run out. | *unchanged* | kept |

## Labels (21 lines, 0 changed)

| ID | Where | Before | After | Why |
|---|---|---|---|---|
| `notice.n04` | a label | TRAINING BRIEF | *unchanged* | kept |
| `notice.n05` | a label | TRAINING BRIEF · {LABEL} | *unchanged* | kept |
| `notice.n06` | a label | CORPORATION DRONE | *unchanged* | kept |
| `notice.n10` | the drone label, incoming | CORPORATION DRONE · INCOMING | *unchanged* | kept |
| `notice.n12` | the report: the next part's heading | NEXT FROM THE CORPORATION | *unchanged* | kept |
| `notice.n22` | a label | DUMMY CORPORATION | *unchanged* | kept |
| `notice.n23` | a label | DUMMY CORP | *unchanged* | kept |
| `notice.n27` | a label | Calibration Campus | *unchanged* | kept |
| `notice.n32` | a label | Corporation Tower Plaza | *unchanged* | kept |
| `notice.n33` | a label | Corporation Tower | *unchanged* | kept |
| `label.any` | the brief's label: the card, the map, the held toast | ANY WRITE-OFF | *unchanged* | kept |
| `label.dash` | the brief's label: the card, the map, the held toast | DASH INTO A CAR | *unchanged* | kept |
| `label.drop` | the brief's label: the card, the map, the held toast | DROP ONTO A CAR | *unchanged* | kept |
| `label.jump` | the brief's label: the card, the map, the held toast | JUMP INTO A CAR | *unchanged* | kept |
| `label.level` | the brief's label: the card, the map, the held toast | ON A RAISED ROAD | *unchanged* | kept |
| `label.cone` | the brief's label: the card, the map, the held toast | CONE-BAITED CAR | *unchanged* | kept |
| `label.push` | the brief's label: the card, the map, the held toast | PUSH OFF A CAR | *unchanged* | kept |
| `label.bounce` | the brief's label: the card, the map, the held toast | THROWN INTO A CAR | *unchanged* | kept |
| `label.struck` | the brief's label: the card, the map, the held toast | STRUCK, NOT DASHING | *unchanged* | kept |
| `label.combo` | the brief's label: the card, the map, the held toast | COMBO ×{n} | *unchanged* | kept |
| `label.cls` | the brief's label: the card, the map, the held toast | A {cls} | *unchanged* | kept |

## Feedback (46 lines, 0 changed)

| ID | Where | Before | After | Why |
|---|---|---|---|---|
| `copy.toast.touch-spent` | toast: the dummy touches a car that already hit it | Appearance already assessed. No damage. No points. | *unchanged* | kept |
| `copy.toast.purchase` | toast: Arcade, a part bought | {node} will be installed on the next chassis. | *unchanged* | kept |
| `copy.toast.learn-standoff` | toast: a car model learns to stop further back | {model} revised its stop line to {metres} m. | *unchanged* | kept |
| `copy.toast.refusal-locked` | toast: Arcade, Refuse testing before one body | Refusal is unavailable until one body is completed. | *unchanged* | kept |
| `copy.denied.lunge` | toast: a dash refused (no charge, or recovering) | Lunge declined. Charge or recovery incomplete. | *unchanged* | kept |
| `copy.denied.pickup` | toast: nothing to grab | Nothing within reach to carry. | *unchanged* | kept |
| `copy.denied.drop` | toast: no room to put a cone down | No legal room ahead. Cone retained. | *unchanged* | kept |
| `copy.denied.throw` | toast: no room to throw a cone | No legal room to throw. Cone retained. | *unchanged* | kept |
| `place.levels.z1` | toast: first time on the low highway | Low highway: only its own cars drive here. A broken parapet drops you to the street. | *unchanged* | kept |
| `place.levels.z2Highway` | toast: first time on the high highway | High highway: fast traffic. A broken parapet drops you to the street, a long fall. | *unchanged* | kept |
| `place.levels.roof` | toast: first time on a roof | Roof: no traffic. Step off a ledge to drop to the street below. | *unchanged* | kept |
| `msg.held` | toast: a hit that would write off the chassis misses the brief; the chassis is held (row 620) | HELD AT {health} · the brief wants {brief} | *unchanged* | kept |
| `msg.story-count` | toast: a write-off counts for the tile | COUNTED · {tile} {n} / {need} | *unchanged* | kept |
| `msg.story-miss.task` | toast: a write-off misses the brief | NOT COUNTED · the brief wants {brief} | *unchanged* | kept |
| `msg.story-miss.cleared` | toast: a write-off on a cleared tile | NOT COUNTED · {tile} is already cleared | *unchanged* | kept |
| `msg.story-miss.elsewhere` | toast: a write-off on a tile not yet in test | NOT COUNTED · {tile} is not in test | *unchanged* | kept |
| `msg.story-clear` | toast: the tile's last write-off | TILE {tile} CLEARED · {next} OPEN | *unchanged* | kept |
| `msg.fence.unsurveyed` | toast: walking into a fence toward a tile not yet open | Fence: {tile} is not yet surveyed | *unchanged* | kept |
| `msg.fence.clear-first` | toast: walking into the tile's fence before it is cleared | Fence: clear {tile} first ({n} / {need}) | *unchanged* | kept |
| `msg.hop` | toast, once: a standing jump that clears nothing | A hop clears nothing. Run, then jump. | *unchanged* | kept |
| `msg.rail` | toast: a jump over a highway rail | Over the rail | *unchanged* | kept |
| `msg.hitch` | toast, once: the dummy hitches onto a car | Hitched. X lets go; A slings you off with a dash. | *unchanged* | kept |
| `msg.slip` | toast: a dash on a puddle | No dash on water. Step off the puddle. | *unchanged* | kept |
| `msg.not-fitted` | toast: Story, a verb whose part the drone has not brought | Not fitted yet | *unchanged* | kept |
| `msg.deny.jump` | toast: a jump refused | No jump — charge empty, or mid-action | *unchanged* | kept |
| `msg.deny.jump.charge` | toast: a jump refused, battery empty | No jump: the battery is empty | *unchanged* | kept |
| `msg.deny.push.spent` | toast: a push refused, none left | No pushes left: land to get them back | *unchanged* | kept |
| `msg.deny.push.nothing` | toast: a push with no car to push off | Nothing to push off: hit or touch a car | *unchanged* | kept |
| `msg.deny.drop.hold` | toast: tapping X with a cone where it cannot go down | Hold X to put the cone down | *unchanged* | kept |
| `msg.deny.throw.empty` | toast: a throw with no cone | Grab a cone first (X), then throw (Y) | *unchanged* | kept |
| `msg.cones` | toast: a cone picked up (more than one carried) | Cones {n} / {capacity} | *unchanged* | kept |
| `msg.combo` | toast: a hit chains a combo | COMBO {n} · {moves} · ×{mult} · +{bonus} | *unchanged* | kept |
| `msg.combo-banked` | toast: the combo's window closes | COMBO BANKED · {n} hits · ×{mult} · {points} | *unchanged* | kept |
| `msg.cone-hit` | toast: a thrown cone hits a car | CONE HIT · +{points} | *unchanged* | kept |
| `msg.screen` | toast, first visit: the screen's name | {screen} · {landmark} | *unchanged* | kept |
| `msg.purchase.upgrade` | toast: Story, a part fitted in the workshop | {part} fitted · {n} upgrades left | *unchanged* | kept |
| `msg.purchase-denied.max` | toast: buying a part at its top level | That part is at its top level | *unchanged* | kept |
| `msg.level.walk` | toast, first time: a walkway | Walkway: no traffic up here. Step off the side to drop onto cars below. | *unchanged* | kept |
| `msg.level.ring` | toast, first time: the ring deck | Ring deck: highway traffic gives way at the entries. Escalators lead down. | *unchanged* | kept |
| `msg.level.terrace` | toast, first time: a terrace | Terrace: step off the edge to drop to the beach. | *unchanged* | kept |
| `msg.level.hill` | toast, first time: the hilltop | Hilltop (Z1): streets with traffic. Step off the cliff edge to drop to the valley. | *unchanged* | kept |
| `msg.volume` | toast: − or + in play (row 608) | Volume {n} / 10 | *unchanged* | kept |
| `msg.mute` | toast: M in play (row 608) | Sound off · M | *unchanged* | kept |
| `saves.saved` | toast: a save | Saved: {name} | *unchanged* | kept |
| `saves.renamed` | toast: a rename | Renamed: {name} | *unchanged* | kept |
| `saves.erased` | toast: a save erased | Erased: {name} | *unchanged* | kept |

## Endings and screens (29 lines, 0 changed)

| ID | Where | Before | After | Why |
|---|---|---|---|---|
| `copy.endings.Non-compliant` | the ending: Non-compliant (a refusal) | Testing declined. Your refusal has been recorded. | *unchanged* | kept |
| `copy.report.title` | the write-off report's title | Chassis {chassis} written off. | *unchanged* | kept |
| `copy.report.credit` | the report, Arcade: the credit for the body | One body credit granted. Balance: {credits}. | *unchanged* | kept |
| `copy.shop.deploy` | the workshop's last row | Deploy next chassis | *unchanged* | kept |
| `copy.shop.bank` | the workshop's last row, credits left | Keep {credits} in credit. Deploy next chassis | *unchanged* | kept |
| `rep.counted` | the report: the write-off counted | Counted for {tile}: {n} of {need} · points this body {points} | *unchanged* | kept |
| `rep.task` | the report: the write-off missed the brief | Not counted: the brief wants {brief} · points this body {points} | *unchanged* | kept |
| `rep.cleared` | the report: a cleared tile | Not counted: {tile} is already cleared · points this body {points} | *unchanged* | kept |
| `rep.elsewhere` | the report: a tile not in test | Not counted: {tile} is not in test · points this body {points} | *unchanged* | kept |
| `rep.credit` | the report, Story: the credit and the next affordable part | +{n} credits for the body. Balance: {balance}. {part} is yours for {price}. | *unchanged* | kept |
| `rep.full` | the report, Story: every part at its top | +{n} credits for the body. Balance: {balance}. Every track is full. | *unchanged* | kept |
| `rep.next` | the report: the next part the drone brings | {part} · {district} {tile} (tile {n} of {total}). | *unchanged* | kept |
| `shop.keep` | the workshop: upgrades left | Keep {n} upgrades for later, or fit them now. | *unchanged* | kept |
| `shop.ready` | the workshop: nothing left to fit | Chassis {n} is ready. | *unchanged* | kept |
| `shop.top` | the workshop: a part at its top | {part} is at its top level. | *unchanged* | kept |
| `map.unsurveyed` | the map: a tile not yet open | Clear the tiles before it. The map opens one tile at a time. | *unchanged* | kept |
| `map.fences` | the map's footer | Fenced until cleared. Cleared tiles stay open. | *unchanged* | kept |
| `map.need` | the map's tile panel, after the brief | One counted write-off clears the tile. | *unchanged* | kept |
| `map.needN` | the map's tile panel, after the brief | {n} counted write-offs clear the tile ({count} so far). | *unchanged* | kept |
| `card.sub` | the level card's subtitle | Tile {tile}. Level {n} of {total}. | *unchanged* | kept |
| `pause.story` | pause, Story: under Quit to title | The story map saves this tile's count. The body in play is lost. | *unchanged* | kept |
| `pause.refuse-locked` | pause, Arcade: before one body | Refusal opens after one completed body. | *unchanged* | kept |
| `pause.refuse` | pause, Arcade: Refuse testing | Refusal is a deliberate ending. | *unchanged* | kept |
| `end.certified.fallback` | the CERTIFIED ending, if the story has no ending line | All {total} tiles of the Test City are tested and certified complete. | *unchanged* | kept |
| `scores.none.arcade` | high scores: an empty Arcade table | No scores yet. Play a shift in {district}. | *unchanged* | kept |
| `scores.none.story` | high scores: an empty Story table | No scores yet. A Certified story run sets the first. | *unchanged* | kept |
| `saves.none` | save slots: an empty slot | No story saved here. | *unchanged* | kept |
| `saves.rename` | naming a save | Type to replace the name, or OK to keep it. | *unchanged* | kept |
| `saves.full` | toast: a new game with every slot full | All {n} slots in use: choose one to overwrite | *unchanged* | kept |

## Objective strip (9 lines, 0 changed)

| ID | Where | Before | After | Why |
|---|---|---|---|---|
| `obj.task` | the objective strip on the tile in test | Write off a body. Last hit: {brief} ({n} of {need}). | *unchanged* | kept |
| `obj.any` | the objective strip, brief 'any' | Write off a body ({n} of {need}). | *unchanged* | kept |
| `obj.drone.deliver` | the strip while a drone delivers a part | Delivering {part}. | *unchanged* | kept |
| `obj.drone.bring` | the strip while a drone brings a part, then ferries | Bringing {part}, then on to {tile}. | *unchanged* | kept |
| `obj.drone.ferry` | the strip on the ferry | Carrying the chassis to {tile}. | *unchanged* | kept |
| `obj.drone.voyage` | the strip on the voyage | Carrying the certified model to the ship at {tile}. | *unchanged* | kept |
| `obj.cleared` | the strip when the district is cleared | {district} is cleared. | *unchanged* | kept |
| `obj.arcade` | the strip, Arcade | Grade {g}: write off {n} bodies for grade {next} ({count} of {n}). | *unchanged* | kept |
| `obj.arcade.top` | the strip, Arcade at the top grade | Grade {g}, the top grade: write off all you can. | *unchanged* | kept |

## Interface chrome (38 lines, 0 changed)

| ID | Where | Before | After | Why |
|---|---|---|---|---|
| `ui.01` | menus, legends and the cue key | PRESS ANY KEY | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.02` | menus, legends and the cue key | TAP TO BEGIN | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.03` | menus, legends and the cue key | SELECT A MODE | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.04` | menus, legends and the cue key | ARROWS CHOOSE · SPACE SELECT | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.05` | menus, legends and the cue key | ARROWS CHOOSE · SPACE SELECT · SHIFT BACK | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.06` | menus, legends and the cue key | ARROWS READ A TILE · SPACE DEPLOY · SHIFT BACK | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.07` | menus, legends and the cue key | TYPE THE NAME · ENTER OK · BACKSPACE DELETE · ESC CANCEL | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.08` | menus, legends and the cue key | SAVED IN THIS BROWSER | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.09` | menus, legends and the cue key | STORY · SAVE GAMES | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.10` | menus, legends and the cue key | STORY · THE TEST CITY | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.11` | menus, legends and the cue key | ARCADE · SELECT A DISTRICT | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.12` | menus, legends and the cue key | Quit to title | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.13` | menus, legends and the cue key | Retry this district | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.14` | menus, legends and the cue key | Choose a district | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.15` | menus, legends and the cue key | Play again from district 1 | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.16` | menus, legends and the cue key | Name this score | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.17` | menus, legends and the cue key | Resume | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.18` | menus, legends and the cue key | Restart level | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.19` | menus, legends and the cue key | Refuse testing | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.20` | menus, legends and the cue key | Options | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.21` | menus, legends and the cue key | Controls | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.22` | menus, legends and the cue key | Show trace | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.23` | menus, legends and the cue key | Deploy next chassis | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.24` | menus, legends and the cue key | NEW PART FITTED | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.25` | menus, legends and the cue key | EVERY PART FITTED | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.26` | menus, legends and the cue key | CHOOSE A PART | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.27` | menus, legends and the cue key | NOT YET ISSUED | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.28` | menus, legends and the cue key | Has noticed you | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.29` | menus, legends and the cue key | Route fixed | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.30` | menus, legends and the cue key | Slowing | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.31` | menus, legends and the cue key | Braking for safety | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.32` | menus, legends and the cue key | Already hit you | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.33` | menus, legends and the cue key | Blocked, warning you | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.34` | menus, legends and the cue key | What you can see | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.35` | menus, legends and the cue key | Out of a dash, the jump is free | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.36` | menus, legends and the cue key | Tap: pick up a cone. Tap with none in reach: put one down | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.37` | menus, legends and the cue key | Hold to put a cone down | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |
| `ui.38` | menus, legends and the cue key | Up to 12 characters: letters, digits, space, - . ' | *unchanged* | kept: interface chrome, out of the voice's scope (decision 540) |

