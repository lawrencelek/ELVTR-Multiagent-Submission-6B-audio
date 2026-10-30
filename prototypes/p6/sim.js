/* DUMMIES P1 — Finding the Fun. Deterministic simulation core. No DOM, no randomness. */
(function (root) {
  'use strict';
  const JUMP = root.JUMP || (typeof require !== 'undefined' ? require('../jump/jump.js') : null); // Edit 76: the jump's rules, shared with the jump test

  // Registry values (Engineering §13.5). Trial.
  const REG = {
    'movement.walkSpeed': 81, 'movement.runSpeed': 162, 'movement.rampSeconds': 1,
    'movement.turnRate': 180, 'movement.turningSpeedFraction': 0.6, 'movement.alignThreshold': 30,
    'movement.stopSeconds': 0.25, 'movement.counterPressAngle': 135, 'movement.counterPressStop': 0.4,
    'movement.lungeDistance': 164, 'movement.lungeDuration': 0.3, 'movement.lungeRecovery': 0.35,
    'movement.wearFloor': 0.45, 'movement.lungeFastTimeFraction': 1 / 3, 'movement.lungeFastDistanceFraction': 0.7,
    'battery.capacity': 2, 'battery.secondsPerCharge': 0.8, 'battery.refillDelaySeconds': 0.3, 'battery.lungeCost': 1,
    'sensing.coneWidth': 90, 'sensing.coneReach': 900,
    'upgrades.hipsTurnRate': 360, 'upgrades.spineLimit': 45, 'upgrades.spineRate': 540,
    'upgrades.carrySpeed': 0.85, 'upgrades.throwDistance': 120,
    'feedback.hitStop': 0.06, 'feedback.writeOffSeconds': 1.1,
    'damage.baseImpact': 100, 'damage.zone.front': 1, 'damage.zone.frontDiagonal': 0.6, 'damage.zone.side': 0.3,
    'damage.zone.rearDiagonal': 0.15, 'damage.zone.rear': 0.05, 'damage.bodyHealth': 800, 'damage.referenceSpeed': 138,
    'rewards.writeOff': 2500,
    'perception.reactionDelay': 0.15, 'perception.sideRadius': 100, 'perception.forwardLength': 320,
    'perception.sideHalfAngle': 80,
    'traffic.timeGap': 1.2, 'traffic.minimumGap': 8, 'traffic.acceleration': 360, 'traffic.comfortBraking': 400,
    'traffic.hardBraking': 600, 'traffic.commitHorizon': 0.75, 'traffic.deadlockTimeout': 3,
    'traffic.entryRoomLengths': 1.0,
    'vehicles.sedan.mass': 1.0, 'vehicles.sedan.length': 56, 'vehicles.sedan.width': 28, 'vehicles.sedan.cruiseSpeed': 138,
    'vehicles.sedan.height': 22, 'vehicles.van.height': 34,
    'vehicles.van.mass': 1.5, 'vehicles.van.length': 68, 'vehicles.van.width': 32, 'vehicles.van.cruiseSpeed': 120,
    // P5 (Edit 50): hatchback, police and a 96 midi bus join sedan and van, at their V29 registry sizes. Sports, wagon and SUV stay out.
    'vehicles.hatchback.length': 46, 'vehicles.hatchback.width': 26, 'vehicles.hatchback.height': 23, 'vehicles.hatchback.cruiseSpeed': 156, 'vehicles.hatchback.mass': 0.9,
    'vehicles.police.length': 58, 'vehicles.police.width': 28, 'vehicles.police.height': 23, 'vehicles.police.cruiseSpeed': 150, 'vehicles.police.mass': 1.1,
    'vehicles.bus.length': 96, 'vehicles.bus.width': 34, 'vehicles.bus.height': 48, 'vehicles.bus.cruiseSpeed': 108, 'vehicles.bus.mass': 3.0,
    'world.laneWidth': 56, 'world.pedestrianGap': 40, 'world.spawnLeadIn': 200, 'world.width': 800, 'world.height': 640,
    'body.radius': 13, 'simulation.tickRate': 60,
    'run.quota.road': 5, 'run.appearances.road': 40, 'run.admissionInterval': 12,
    'economy.price.torso.hips': 1, 'economy.price.arms.carry': 1,
    'economy.price.torso.spine': 2, 'economy.price.arms.throw': 2,
    'props.cone.radius': 6, 'props.cone.pickupEdgeRange': 12, 'props.cone.placementClearance': 0.1,
    'props.cone.throwSeconds': 0.2, 'props.cone.puntDistance': 24, 'props.cone.puntSeconds': 0.2,
    'learning.playerHitStep': 0.08, 'learning.playerHitCap': 0.4, 'input.dropHoldSeconds': 0.25,
    // Presentation (GDD §4.2.3 legibility budget; Edit 37 §4.1.3 pixel grid). Reference units: 1280 × 720 canvas.
    'ui.playWidth': 800, 'ui.playHeight': 640, 'ui.typeLoadBearing': 24, 'ui.typeSecondary': 16, 'ui.typeTexture': 9, // Edit 42 (D27): field 400 × 320 art px, 25 × 20 tiles
    'ui.artScale': 3,
    // Edit 40 (20 Oct): Big battery (D26), surfaces (D18), districts (D24), city targets (7.9 clause 6).
    'upgrades.bigCapacity': 3, 'economy.price.battery': 1, 'movement.lowGripStopMultiplier': 2.5,
    'world.terrain.puddle.dummySpeed': 0.9, 'world.terrain.puddle.lunge': 0, 'world.terrain.puddle.grip': 'low', 'world.terrain.puddle.carBraking': 0.5,
    'world.terrain.matting.lunge': 1.15, 'world.terrain.matting.grip': 'high', // the Interchange island: a springboard (7.3)
    'world.tileSize': 32, 'world.puddleShare': 0.02, 'world.puddleSpotMax': 2, 'world.barrierGapsMin': 3,
    'world.districtColumns': 3, 'world.districtRows': 3, 'world.gateWidth': 48, 'world.flipSeconds': 0.4,
    'world.blockShare': 0.25, 'world.jerseyShare': 0.08, 'world.occludedFractionMax': 0.3,
    // Edit 41 (20 Oct): city districts. Rows of the registry's districts table, addressable as world.district.<id>.<field>.
    'world.district.riverside.quota': 1, 'world.district.riverside.interval': 3, 'world.district.riverside.vanShare': 0.2, 'world.district.riverside.blockShare': 0.38, 'world.district.riverside.blockMax': 112, 'world.district.riverside.doubleShare': 0.3, 'world.district.riverside.towerShare': 0, 'world.district.riverside.puddleShare': 0.02, 'world.district.riverside.jerseyShare': 0.06, 'world.district.riverside.decks': 0, 'world.district.riverside.highDecks': 0, 'world.district.riverside.platformShare': 0.1,
    'world.district.market.quota': 2, 'world.district.market.interval': 3, 'world.district.market.vanShare': 0.45, 'world.district.market.blockShare': 0.42, 'world.district.market.blockMax': 96, 'world.district.market.doubleShare': 0.7, 'world.district.market.towerShare': 0, 'world.district.market.puddleShare': 0.04, 'world.district.market.jerseyShare': 0.05, 'world.district.market.decks': 0, 'world.district.market.highDecks': 0, 'world.district.market.platformShare': 0.12,
    'world.district.interchange.quota': 2, 'world.district.interchange.interval': 2.8, 'world.district.interchange.vanShare': 0.3, 'world.district.interchange.blockShare': 0.36, 'world.district.interchange.blockMax': 160, 'world.district.interchange.doubleShare': 0.6, 'world.district.interchange.towerShare': 0.15, 'world.district.interchange.puddleShare': 0.02, 'world.district.interchange.jerseyShare': 0.1, 'world.district.interchange.decks': 2, 'world.district.interchange.highDecks': 1, 'world.district.interchange.platformShare': 0.15,
    'world.district.cbd.quota': 3, 'world.district.cbd.interval': 2.6, 'world.district.cbd.vanShare': 0.3, 'world.district.cbd.blockShare': 0.42, 'world.district.cbd.blockMax': 160, 'world.district.cbd.doubleShare': 0.8, 'world.district.cbd.towerShare': 0.5, 'world.district.cbd.puddleShare': 0.02, 'world.district.cbd.jerseyShare': 0.08, 'world.district.cbd.decks': 2, 'world.district.cbd.highDecks': 1, 'world.district.cbd.platformShare': 0.15,
    'world.district.campus.quota': 4, 'world.district.campus.interval': 2.5, 'world.district.campus.vanShare': 0.4, 'world.district.campus.blockShare': 0.36, 'world.district.campus.blockMax': 160, 'world.district.campus.doubleShare': 0.9, 'world.district.campus.towerShare': 0.1, 'world.district.campus.puddleShare': 0.01, 'world.district.campus.jerseyShare': 0.08, 'world.district.campus.decks': 1, 'world.district.campus.highDecks': 0, 'world.district.campus.platformShare': 0.12,
    'world.deckHeight': 120, 'world.deckWidth': 160, // P5.2 (Edit 50.2): as wide as a ground road and its pavements (2 × (world.laneWidth + proto.shoulderWidth))
     'world.deckPillarSpacing': 160, 'world.deckInterval': 2.4,
    // Edit 42 (P3.1): three levels, bounded districts
    'world.parapetWidth': 8, 'world.deckLampSpacing': 88, // P5.2: lamps in pairs, about nine per screen width
     'world.stairLength': 64, 'world.stairWidth': 32, 'world.stairSpeed': 0.7, 'world.stairApron': 40, 'world.stairEdgeMargin': 16, // P6.3 (Edit 65): a clear apron beyond every foot; flights drawn inside the screen
     'world.edgeArrivalDepth': 8, 'traffic.giveWayWindow': 200, 'traffic.giveWayLookahead': 40, 'world.gardenVerge': 10, 'world.stairForecourt': 44, // Prototype 6.2 (Edit 70): the garden's grass verge; a flight's forecourt beyond its apron // Prototype 6.1 (Edit 69): standing room on arrival across an edge; the give-way approach window and its margin past a stopping distance
    'world.dropSeconds': 0.35, 'damage.dropSpeed': 120, 'world.wallThickness': 16, 'world.boomRange': 140, 'world.boomSeconds': 0.5,
    'world.towerHeightMin': 288, 'world.towerHeightMax': 380, 'world.roundaboutRadius': 160, 'damage.plateMultiplier': 1.5,
    // Edit 43 (P3.2): perpendicular crossings, turn styles, storeys and frontage, car lights
    'world.deckCrossAngle': 5, 'world.turnRadiusTight': 64, 'world.turnRadiusWide': 224, 'world.buildingSetback': 48, 'world.storeyHeight': 36,
    'traffic.cornerAccel': 60, 'world.deckColumn': 24,
    // Edit 44 (P3.3): Z0 ground, Z1 low highway, Z2 high highway, platform roofs and skybridges
    'world.highHeight': 216, 'world.skybridgeMax': 96, 'world.skybridgeChance': 0.75, 'world.platformChain': 3, 'world.skybridgeCount': 4,
    'world.deckTopClear': 128, 'world.deckBottomClear': 128, 'world.edgeOverlap': 32, // Edit 48: drawn deck clear of the top edge, a building row below it; buildings straddle shared edges
    // P4 test (Edit 49): no road bends tighter than world.turnRadiusTight; roundabout entries on fillets; 45° roads in the palette;
    // cars judge other cars along their own lane; no new cars while traffic is jammed
    'world.roundaboutEntryRadius': 96, 'world.diagonalShare': 0.25, 'traffic.followRoad': 1, 'traffic.gridlockSeconds': 6, 'traffic.jamReverse': 1, 'traffic.giveWayGap': 2.5, 'traffic.giveWaySpeed': 40, 'traffic.signalCancel': 30, 'vehicles.scale': 1, // Edit 72: traffic.ringEntryGap (2.0) and traffic.signalDistance (140) are P6's (world6.js); the shared sim keeps 6.2's rings: the junction gap, no turn signals
    'traffic.signalDistance': 0, 'proto.art.signalLength': 4, 'proto.droneConeSeconds': 0, // Edit 71 (P6 sets proto.droneConeSeconds 2; 0 keeps the P2 rule: a drone only for a car blocked and honking)
    'world.junctionTurnRadius': 96, 'world.junctionApproach': 192, 'world.roundaboutArmGap': 10, // P4 (Edit 49.3)
    'world.junctionStagger': 256, // Edit 55 (example only): two T junctions this far apart replace a 45° crossroads
    'world.junctionZone': 0.75, // Edit 55.2: every junction sits in this central share of its tile, each way
    'world.roundaboutRadiusStreet': 112, // Edit 56: a ground (street) roundabout's centre radius in the district plans; highway rings keep world.deckRingRadius
    'world.markYieldBase': 14, 'world.markYieldHeight': 21, 'world.markYieldGap': 4, // Edit 56–57: yield line teeth (MUTCD 3B.16 shape, 1 : 1.5), 7 × 10.5 art px, stamped identical
    // P5 (Edit 50): five models (hatchback, sedan, police, van, bus); buses on wide roads and highways; faster, sparser, richer highways
    'traffic.share.hatchback': 0.22, 'traffic.share.police': 0.08, 'traffic.share.bus': 0.1,
    'vehicles.bus.minRadius': 160, 'vehicles.bus.swerve': 0,
    'traffic.deckSpeedScale': 1.4, 'traffic.deckGapScale': 1.5, 'damage.deckMultiplier': 1, // P5.1: highway hits pay through speed alone (user, 21 October)
    'world.deckRingRadius': 160, 'world.deckRingRadiusHigh': 120, 'world.walkwayRingRadius': 112, 'world.walkwayWidth': 28, 'world.plazaRadius': 168, 'world.plazaStreetWidth': 56, // Edit 51 (cityscape mock-up only)
    'world.walkwayRingHalf': 168, 'world.walkwayRingChamfer': 60, 'world.walkwayLinkLength': 100, 'world.plazaHalf': 190, // Edit 51.1–51.2: the square walkway ring (district mock-up only)
    'world.deckEscalators': 2, 'world.deckEscalatorInset': 64, 'world.splitLaneOffset': 104, 'world.walkwayColumn': 16, // Edit 51.2 (district mock-up only)
    'world.portalClearance': 72, // Edit 54: headroom over a highway where it runs through a tower (two storeys)
    'world.roundaboutMinArms': 3, 'traffic.ringOrbitMax': 2, 'traffic.ringInnerExit': 3, 'traffic.ringFill': 0, 'world.deckRingFill': 0.5, 'traffic.ringOrbit': 1, 'traffic.ringLaneChange': 72, 'traffic.ringExitCheck': 120, 'traffic.ringMergeGap': 1.2, 'traffic.ringPassRatio': 0.4, 'traffic.ringMaxLaps': 3, // Edit 52: the inner ring lane
    'traffic.continuous': 1, 'traffic.warmSeconds': 30, 'traffic.exitAfterSeams': 9, // P5.3 (Edit 53): one traffic for the whole district; a car crosses a shared edge with its id, speed and plan. warmSeconds: the district mock-up runs before it is shown; exitAfterSeams: after that many seams a mock-up car takes the way out at a junction
    'world.deckRingTopClear': 32, 'world.gardenCellWidth': 160, 'world.gardenCellHeight': 128, 'world.gardenPath': 32, // Edit 51.3 (district mock-up only)
    'world.gardenLargeCells': 2, 'world.gardenBedTypes': 2, 'world.gardenPlanter': 40, 'world.sculptureScaleLarge': 2, 'world.sculptureScaleSmall': 0.5, 'world.courtSmallCount': 7, // Edit 55: planting and sculpture in three sizes (district mock-up only)
    'world.district.parkland.quota': 2, 'world.district.circus.quota': 3, 'world.district.monument.quota': 4, // Edit 51: three districts (mock-up; the game still runs five)
    'traffic.offscreenCullSeconds': 12, 'proto.rescueSinkSeconds': 2, // P6.1 (Edit 63): off-screen jam cleanup; the river rescue's sink before the drone comes
    'world.district.waterfront.quota': 3, 'world.district.waterfront.interval': 3.2, 'world.district.waterfront.deckInterval': 8, // P6 (Edit 62): Waterfront replaces Circus (district 2 of 3); its bridges end at T junctions on the ridge road, fed no faster than they pass (as Parkland's ring, Edit 54)
    'world.district.parkland.interval': 3.2, 'world.district.parkland.deckInterval': 8, 'world.district.circus.interval': 3.2, 'world.district.monument.interval': 2.4, // Edit 53: mock-up traffic; each lane entering the district runs one car per 2 × interval, as the game's roads
    'damage.walkShare': 0.25, // P5.1 (Edit 50.1): walking into a car adds a quarter of the walk; only a dash strikes at full speed
    'proto.art.beamLength': 200, 'proto.art.beamAlpha': 0.22, 'proto.art.brakeLength': 48, 'proto.art.brakeAlpha': 0.35,
    // Edit 75 (Prototype 6.5): DIRECT turning (decision, 27 October); B jumps (Legs); X grabs; Y throws; chained hits pay a combo;
    // Ricochet doubles the bounce. Switched on by P6.5 (world6.js P6SIM); P1–P6.4 keep their rules (proto.* switches below).
    'movement.directTurnRate': 1080, 'upgrades.jumpAirtime': 0.5, 'upgrades.jumpHeight': 44, 'upgrades.jumpRecovery': 0.1,
    'upgrades.jumpMaxSpeed': 324, 'upgrades.jumpAirAccel': 324, // Edit 76: the jump keeps its take-off speed (Link's Awakening); upgrades.jumpDistance retires
    'battery.jumpCost': 1, 'battery.dashJumpCost': 1, 'abilities.hands.tapDrop': 0, 'world.jumpableHeight': 20, 'world.jumpableDepth': 48, 'proto.art.jumpableTop': 5, 'upgrades.ricochetScale': 2, 'scoring.comboWindow': 1.5, 'scoring.comboStep': 0.5, 'scoring.comboMax': 3,
    'economy.price.legs.jump': 1, 'economy.price.legs.ricochet': 2,
    // Edit 77 (P6.7): four ability tracks by level; each level shields its ability from wear. Run to clear.
    'abilities.maxLevel': 4, 'abilities.wearCut': 0.2, 'abilities.battery.rechargeCut': 0.1, // Edit 78: four levels; linear steps per level
    'abilities.legs.airtimeBase': 0.3, 'abilities.legs.airtimeStep': 0.1, 'abilities.arms.conesPerLevel': 1, 'abilities.throw.distanceStep': 40,
    'economy.price.ability.level1': 1, 'economy.price.ability.level2': 2, 'economy.price.ability.level3': 3, 'economy.price.ability.level4': 4,
    // Edit 79 (P6.9): three tracks, three levels. Battery's seconds a charge per level; X held throws; Arms 3 hitches a car
    'abilities.battery.level1Seconds': 0.8, 'abilities.battery.level2Seconds': 0.7, 'abilities.battery.level3Seconds': 0.6, 'input.throwHoldSeconds': 0.3,
    'abilities.arms.hitchReach': 12, 'abilities.arms.hitchSeconds': 1.5, 'abilities.arms.hitchMinSpeed': 30, 'abilities.arms.hitchEdge': 40,
    'abilities.arms.slingScale': 1, 'abilities.arms.slingDash': 120,
    // Edit 80 (P6.10): Hands carry cones (two levels: two hands); Arms push off cars, a ricochet: stronger, and once more, a level
    'abilities.hands.maxLevel': 2, 'abilities.hands.conesPerLevel': 1,
    'abilities.arms.pushSpeed': 160, 'abilities.arms.pushStep': 40, 'abilities.arms.pushesPerLevel': 1, 'abilities.arms.pushReach': 10, 'abilities.arms.pushWindow': 0.3,
    // Edit 81 (P7): Story mode. Write-offs a tile; power-ups for a clear, a gift and a score; the brief's combo lengths; the story's shift
    'story.tileWriteOffs': 3, 'story.clearPowerUps': 1, 'story.pointsPerPowerUp': 15000, 'story.giftPowerUps': 1, 'story.task.comboEasy': 2, 'story.task.comboHard': 3, 'story.shiftCars': 5000,
    // Edit 82 (P7.1): a credit a body (Arcade and Story); story prices 3, 4, 5; a credit gift; write-offs per tile, in the story's order
    'arcade.giftEvery': 1, 'ui.gift.fallSeconds': 0.7, 'ui.gift.holdSeconds': 1.2, // Edit 84 (P7.3): Arcade issues a verb per write-off; the gift screen's fall and hold
    'ui.finale.unveilSeconds': 1.2, // Edit 94 (P7.13): the finale's unveiling, the cloth lifted off the monument (manual review of R-UNVEIL)
    'world.deckDropGaps': 0, 'world.deckFlightsMin': 0, 'props.cone.minVisible': 0, // Edit 85 (P7.4): level rules, off for 6.x (P7SIM turns them on)
    'story.traffic.monument.A1': 1.5, 'story.traffic.monument.B1': 1.75, 'story.traffic.monument.C1': 1, 'story.traffic.monument.C2': 1, 'story.traffic.monument.B2': 1, 'story.traffic.monument.A2': 1, 'story.traffic.monument.A3': 1, 'story.traffic.monument.B3': 1, 'story.traffic.monument.C3': 1.5,
    'story.traffic.parkland.C1': 1.75, 'story.traffic.parkland.C2': 1.75, 'story.traffic.parkland.C3': 1, 'story.traffic.parkland.B3': 1.25, 'story.traffic.parkland.A3': 2, 'story.traffic.parkland.A2': 1.5, 'story.traffic.parkland.A1': 1, 'story.traffic.parkland.B1': 2, 'story.traffic.parkland.B2': 1.25,
    'story.traffic.waterfront.A1': 1, 'story.traffic.waterfront.B1': 1.5, 'story.traffic.waterfront.C1': 1, 'story.traffic.waterfront.C2': 1.5, 'story.traffic.waterfront.C3': 1, 'story.traffic.waterfront.B3': 1, 'story.traffic.waterfront.A3': 1, 'story.traffic.waterfront.A2': 1.5, 'story.traffic.waterfront.B2': 1,
    'proto.bounce.maxThrow': 0, 'story.ferryDepth': 160, 'story.saveSlots': 3, 'story.saveNameMax': 12, 'story.level.firstPoints': 6500, 'story.level.stepPoints': 2000, 'story.level.max': 9, 'story.level.upgrades': 1,
    'proto.batteryModel': 0, 'abilities.battery.dashCharges': 1, 'damage.bodyHealthOnFoot': 500, 'story.missFloor': 1, 'world.dummyMonument': 0, 'world.storyArt': 0, // Edit 92 (P7.11): the story's tile art, cosmetic only // Edit 91 (P7.10): Battery 1 the dash, 2 a second charge, 3 a faster recharge; the chassis on foot; a miss holds at 1 // Edit 89 (P7.8): the dummy's level from points; an upgrade a level. Edit 88 (P7.7): save slots; a slot name's longest. Edit 83 (P7.2): the knock's longest slide (0: no cap; P7.2 sets it); how far in from the entry edge the drone sets the dummy down
    'economy.creditsPerWriteOff': 1, 'story.price.ability.level1': 3, 'story.price.ability.level2': 4, 'story.price.ability.level3': 5, 'story.giftCredits': 3,
    'story.writeOffs.monument.A1': 1, 'story.writeOffs.monument.B1': 1, 'story.writeOffs.monument.C1': 1, 'story.writeOffs.monument.C2': 1, 'story.writeOffs.monument.B2': 1, 'story.writeOffs.monument.A2': 1, 'story.writeOffs.monument.A3': 1, 'story.writeOffs.monument.B3': 1, 'story.writeOffs.monument.C3': 1,
    'story.writeOffs.parkland.C1': 1, 'story.writeOffs.parkland.C2': 2, 'story.writeOffs.parkland.C3': 1, 'story.writeOffs.parkland.B3': 1, 'story.writeOffs.parkland.A3': 1, 'story.writeOffs.parkland.A2': 2, 'story.writeOffs.parkland.A1': 1, 'story.writeOffs.parkland.B1': 1, 'story.writeOffs.parkland.B2': 2,
    'story.writeOffs.waterfront.A1': 1, 'story.writeOffs.waterfront.B1': 2, 'story.writeOffs.waterfront.C1': 1, 'story.writeOffs.waterfront.C2': 2, 'story.writeOffs.waterfront.C3': 1, 'story.writeOffs.waterfront.B3': 1, 'story.writeOffs.waterfront.A3': 2, 'story.writeOffs.waterfront.A2': 1, 'story.writeOffs.waterfront.B2': 2,
    'proto.parts.armPushLoss': 1, 'proto.parts.armPushFloor': 0.5,
    // Edit 79: combos. Variety pays; the clock stops in the air; a thrown cone that hits a car links the chain
    'scoring.comboVariety': 0, 'scoring.comboAirPause': 0, 'scoring.coneLink': 0, 'scoring.coneHitPoints': 20,
    'physics.slideFriction': 1, 'physics.gravity': 9.81, // Edit 78: a knocked dummy slides to a stop at slideFriction × gravity (m/s², × proto.scale.unitsPerMetre)
    'proto.parts.torsoRechargeLoss': 1.5, 'proto.parts.torsoRechargeFloor': 0.5,
    // Edits 74–75: input (gamepad stick, touch stick, pad setup) and touch sizes in CSS px
    'proto.input.deadzone': 0.2, 'proto.input.stickOuter': 0.9, 'proto.input.padSetupHoldSeconds': 1, 'proto.input.touchDeadzone': 0.12, 'proto.input.touchOuter': 0.85,
    'proto.input.touchFloat': 1, 'ui.touch.stickRadius': 60, 'ui.touch.margin': 16, 'ui.touch.faceRadius': 30, 'ui.touch.scaleMin': 0.6, 'ui.touch.scaleMax': 1.6, 'ui.touch.scaleStep': 0.1, // Edit 87: the player's sizes for the stick and the diamond
  };
  // P1-only proposed parameters (brief §P1.9). Not in the registry.
  const PROTO = {
    'proto.swerveLength': 120, 'proto.swerveOuter': 34, 'proto.shoulderWidth': 24,
    'proto.substeps': 4,
    'proto.learningEnabled': 0, 'proto.zonesEverywhere': 0, 'proto.pathsEverywhere': 1, 'proto.stopCue': 1,
    'proto.returnSignalSeconds': 0.5, 'proto.returnClearance': 30, 'proto.carYawRate': 240, 'proto.headingBlend': 12, // Edit 71: a car's heading blends across a path vertex within this (world units)
    'proto.difficulty': 1, 'proto.health.fragile': 600, 'proto.health.standard': 800, 'proto.health.reinforced': 1000, // Edit 40.1: base 800; easy 600; difficult 1000
    'proto.quota.straight': 1, 'proto.quota.barrier': 2, 'proto.quota.corner': 3,
    'proto.traffic.straight.interval': 3, 'proto.traffic.barrier.interval': 3, 'proto.traffic.corner.interval': 3.5,
    'proto.traffic.jitter': 0.4, 'proto.art.pillarHeight': 60,
    'proto.damageModel': 1, 'proto.damageExponent': 2, 'proto.dummyMass': 0.056, 'proto.restitution': 0.3, 'proto.dummyStrikeSpeed': 100,
    'proto.contactFriction': 0.3, 'proto.recoilScale': 0.6, 'proto.recoilSeconds': 0.35,
    'proto.standoffDistance': 50, 'proto.learn.standoffEnabled': 1, 'proto.learn.standoffStep': 35, 'proto.learn.standoffMax': 190, 'proto.sensorStraight': 1, 'proto.unstick.reverseSpeed': 30, 'proto.unstick.reverseGap': 140, 'proto.unstick.reverseSeconds': 5, 'proto.honkSeconds': 5,
    'proto.scale.unitsPerMetre': 12.2, 'proto.driver.coveredReaction': 0.18, 'proto.driver.cautionZone': 180,
    'proto.driver.cautionSpeed': 82, 'proto.driver.passClearance': 24, 'proto.driver.passSpeed': 55,
    'proto.driver.patienceSeconds': 8, 'proto.driver.coneSteepPass': 0, 'proto.droneSpeed': 240, 'proto.droneLiftSeconds': 0.5,
    'proto.art.shadowScale': 0.3, 'proto.art.crateHeight': 30, 'proto.art.barrierHeight': 14,
    'proto.art.coneHeight': 16, 'proto.art.dummyHeight': 18, 'proto.art.droneHeight': 70,
    'proto.art.extrusion': 0.3, // P3: share of an object's height drawn as screen-up offset (three-quarter view)
    'proto.city': 1, // P3: city blocks and jersey barriers are level statics (Fix A). 0 restores the P2.2 roads.
    'proto.art.wallHeight': 40, // P3.1: perimeter walls and checkpoint booths, drawn height
    'proto.district': 1, 'proto.district.seed': 0, 'proto.layout': 0, // proto.layout: baked layout 1–3 per city district (0 = 1; −1 = generate live) // P3 (D24): 3 × 3 screens per road, Zelda-style. 0 = one static screen. Seed rerolls the generated screens.
    // P3 locational damage: an impact's assessed damage picks the height (legs → torso/arms → head); shares of
    // damage.bodyHealth lost by one part mark it cracked, then broken. Presentation and reports only; health is one pool.
    'proto.parts.torsoFrom': 100, 'proto.parts.headFrom': 250, 'proto.parts.crackedShare': 0.2, 'proto.parts.brokenShare': 0.4,
    // P3 part effects: each part's share of damage.bodyHealth lost cuts one ability, linearly, to a floor.
    // Legs → walk and run speed. Torso → turn rate. Head → view cone width. Arms → throw distance; both arms broken → no cone handling.
    'proto.parts.effects': 1,
    'proto.parts.legSpeedLoss': 1, 'proto.parts.legSpeedFloor': 0.5, 'proto.parts.legDashLoss': 1.5, 'proto.parts.torsoTurnLoss': 1.5, 'proto.parts.torsoTurnFloor': 0.5,
    'proto.parts.headConeLoss': 1.5, 'proto.parts.headConeFloor': 0.5, 'proto.parts.armThrowLoss': 1, 'proto.parts.armThrowFloor': 0.5,
    'proto.turnModel': 1, 'proto.input.fourButtons': 0, 'proto.combo': 0, // Edit 75: 1 LAG (P2–6.4), 2 DIRECT; A/B/X/Y; combo scoring. P6.5 sets 2, 1, 1
    'proto.abilities': 0, 'proto.jump.runToClear': 0, // Edit 77: ability tracks by level; only running and dash jumps clear. P6.7 sets 1, 1
    'proto.bounce.newton': 0, // Edit 78: 1: the bounce off a car is its full post-impact velocity, sliding to a stop on the ground. P6.8 sets 1
  };

  // P1.2 prototype overrides of registry values (logged in DUMMIES_Prototype_Log.md).
  const OVERRIDES = {
    'props.cone.radius': 7.2, 'run.appearances.road': 100,
    // P1.7 Standard driver, derived from UK Highway Code stopping distances at 12.2 world units per metre.
    // P2.2: reaction 0.67 -> 0.3 s (playtest: cars hit a dummy standing well ahead). Braking unchanged.
    'perception.reactionDelay': 0.3, 'traffic.comfortBraking': 37, 'traffic.hardBraking': 79,
    'traffic.acceleration': 43, 'traffic.timeGap': 2.0, 'perception.forwardLength': 560,
    // P3: 640 × 360 screen, 400 × 300 field. One art pixel = 2 reference units (Edit 37 proposed 3).
    'ui.artScale': 2,
  };

  const NODES = {
    hips: { name: 'Hips', branch: 'Torso', price: 'economy.price.torso.hips', pre: null,
      desc: 'Turn twice as fast. Face a new target before it passes.' },
    spine: { name: 'Spine', branch: 'Torso', price: 'economy.price.torso.spine', pre: 'hips',
      desc: 'Steer during a lunge, within a limited angle.' },
    carry: { name: 'Carry', branch: 'Arms', price: 'economy.price.arms.carry', pre: null,
      desc: 'B picks up a cone. B again places it. Lay traps in a car’s path.' },
    throw: { name: 'Throw', branch: 'Arms', price: 'economy.price.arms.throw', pre: 'carry',
      desc: 'Tap B to throw a held cone. Hold B to drop it close.' },
    bigBattery: { name: 'Big battery', branch: 'Battery', price: 'economy.price.battery', pre: null,
      desc: 'Three dash charges, not two. Chain a feint into a strike.' },
    // Edit 75 (P6.5): Legs. Jump on B clears cars and anything tagged jumpable; Ricochet doubles the bounce off a hit.
    jump: { name: 'Jump', branch: 'Legs', price: 'economy.price.legs.jump', pre: null,
      desc: 'B jumps. Clear a car, a handrail or a low planter. Off a walkway, drop onto traffic.' },
    ricochet: { name: 'Ricochet', branch: 'Legs', price: 'economy.price.legs.ricochet', pre: 'jump',
      desc: 'Bounce twice as far off a hit. Carry the bounce into the next car for a combo.' },
  };
  // P6.5 (four buttons): X grabs, Y throws; Spine stands alone (Hips has no job under DIRECT turning, D48)
  const NODES4 = { carry: { desc: 'X picks up a cone. X again places it. Lay traps in a car’s path.' }, throw: { desc: 'Y throws a held cone.' }, spine: { pre: null, desc: 'Steer a dash as it goes, within a limited angle.' } };

  // Edit 77 (P6.7, proto.abilities): four ability tracks, one per button, bought by level. Edit 78 (P6.8): four levels, each a
  // linear step, and every level cuts the wear its body part does to the ability by abilities.wearCut.
  //   Battery (A): a charge every battery.secondsPerCharge − abilities.battery.rechargeCut × level; shields the torso.
  //   Legs (B): jumps; airtime abilities.legs.airtimeBase + abilities.legs.airtimeStep × (level − 1); shields the legs.
  //   Arms (X): grabs; carries abilities.arms.conesPerLevel × level cones; shields the grip.
  //   Throw (Y): throws, needs Arms 1; upgrades.throwDistance + abilities.throw.distanceStep × (level − 1); shields the throw.
  const TRACKS = {
    battery: { name: 'Battery', button: 'A', verb: 'DASH', part: 'torso',
      desc: ['Dash recharges faster. Torso damage slows it less.', 'Faster again. Torso damage slows it less.', 'Faster again. Torso damage slows it less.', 'Fastest recharge. Torso damage slows it least.'] },
    legs: { name: 'Legs', button: 'B', verb: 'JUMP', part: 'legs',
      desc: ['B jumps. Run and jump to clear a rail; a dash jump clears a sedan.', 'Longer in the air. Leg damage slows you less.', 'Longer again: a running jump clears a sedan.', 'Longest in the air. Leg damage slows you least.'] },
    arms: { name: 'Arms', button: 'X', verb: 'GRAB', part: 'arms',
      desc: ['X picks up a cone. X again places it.', 'Carry two cones. Arm damage loosens the grip less.', 'Carry three cones.', 'Carry four cones. The grip barely loosens.'] },
    throw: { name: 'Throw', button: 'Y', verb: 'THROW', part: 'arms', needs: 'arms1',
      desc: ['Y throws a held cone. Needs Arms.', 'Throws further. Arm damage shortens it less.', 'Further again.', 'Furthest throw. Arm damage barely shortens it.'] },
  };
  const NODES7 = {};
  for (const [t, tr] of Object.entries(TRACKS)) for (let L = 1; L <= 4; L++) NODES7[t + L] = { name: tr.name + ' ' + L, branch: tr.name, track: t, level: L, price: 'economy.price.ability.level' + L, pre: L > 1 ? t + (L - 1) : tr.needs || null, desc: tr.desc[L - 1] };
  // Edit 79 (P6.9, proto.abilities 2): three tracks, three levels. Throw joins Arms; Arms 3 hitches a passing car
  const TRACKS9 = {
    battery: { name: 'Battery', button: 'A', verb: 'DASH', part: 'torso',
      desc: ['Dash charges faster. Torso damage slows them less.', 'Faster again. Torso damage slows them less.', 'Fastest charge. Torso damage slows them least.'] },
    legs: { name: 'Legs', button: 'B', verb: 'JUMP', part: 'legs',
      desc: ['B jumps. Run and jump to clear a rail; a dash jump clears a sedan.', 'Longer in the air: a dash jump clears a van.', 'Longest in the air: a running jump clears a sedan.'] },
    arms: { name: 'Arms', button: 'X', verb: 'GRAB', part: 'arms',
      desc: ['X picks up a cone. X again puts it down.', 'Hold X to throw the cone. A cone that hits a car links a combo.', 'Hitch: X beside a moving car grabs it. X lets go; A slings you off it with a dash.'] },
  };
  const NODES9 = {};
  for (const [t, tr] of Object.entries(TRACKS9)) for (let L = 1; L <= 3; L++) NODES9[t + L] = { name: tr.name + ' ' + L, branch: tr.name, track: t, level: L, price: 'economy.price.ability.level' + L, pre: L > 1 ? t + (L - 1) : null, desc: tr.desc[L - 1] };
  // Edit 80 (P6.10, proto.abilities 3): Battery (A), Legs (B), Hands (X), Arms (Y). Hands: cones, two levels. Arms: the push off a car
  const TRACKS10 = {
    battery: TRACKS9.battery, legs: TRACKS9.legs,
    hands: { name: 'Hands', button: 'X', verb: 'GRAB', part: 'arms', max: 2,
      desc: ['X picks up a cone. Hold X to put it down.', 'Two hands: carry two cones.'] },
    arms: { name: 'Arms', button: 'Y', verb: 'PUSH', part: 'arms',
      desc: ['Y pushes off a car you hit or touch: a ricochet. One push before you land.', 'A stronger push; two before you land.', 'The strongest push; three before you land.'] },
  };
  const NODES10 = {};
  for (const [t, tr] of Object.entries(TRACKS10)) for (let L = 1; L <= (tr.max || 3); L++) NODES10[t + L] = { name: tr.name + ' ' + L, branch: tr.name, track: t, level: L, price: 'economy.price.ability.level' + L, pre: L > 1 ? t + (L - 1) : null, desc: tr.desc[L - 1] };
  // Edit 91 (P7.10, proto.batteryModel 1): Battery 1 is the dash; 2 a second charge; 3 a faster recharge
  const TRACKS10D = Object.assign({}, TRACKS10, { battery: Object.assign({}, TRACKS10.battery, {
    desc: ['A dashes. One charge; a jump out of a dash is free.', 'A second charge: two dashes before a recharge.', 'A faster recharge.'] }) });
  const NODES10D = Object.assign({}, NODES10); for (let L = 1; L <= 3; L++) NODES10D['battery' + L] = Object.assign({}, NODES10['battery' + L], { desc: TRACKS10D.battery.desc[L - 1] });
  const ABIL10_HAS = { jump: ['legs', 1], carry: ['hands', 1], push: ['arms', 1], throw: null, hitch: null, bigBattery: null, ricochet: null, spine: null, hips: null, grip: null };
  const ABIL9_HAS = { jump: ['legs', 1], carry: ['arms', 1], throw: ['arms', 2], hitch: ['arms', 3], bigBattery: null, ricochet: null, spine: null, hips: null, grip: null };
  const ABIL_HAS = { jump: 'legs', carry: 'arms', throw: 'throw', bigBattery: null, ricochet: null, spine: null, hips: null, grip: null }; // the old names, read from the tracks

  // ---------- math
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const hyp = Math.hypot;
  const wrap = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  const turnTo = (from, to, step) => { const d = wrap(to - from); return Math.abs(d) <= step ? to : from + Math.sign(d) * step; };

  // ---------- paths
  function makePath(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, length: cum[cum.length - 1] };
  }
  // Prototype 6.3 (Edit 71): the heading under the hood is smooth. A path is a polyline, so its tangent steps at every
  // vertex; within proto.headingBlend of a vertex (at most half of either segment) the tangent blends from one segment's to
  // the next, so a car's heading turns continuously round a ring or a fillet. Position stays on the polyline. The sprite
  // shows the nearest of its 32 headings, separately.
  function pathTangents(path) {
    const { pts, cum } = path, n = pts.length, tan = [], blend = [];
    for (let i = 0; i + 1 < n; i++) { const l = cum[i + 1] - cum[i] || 1; tan.push([(pts[i + 1][0] - pts[i][0]) / l, (pts[i + 1][1] - pts[i][1]) / l]); }
    for (let i = 0; i < n; i++) blend.push(i === 0 || i === n - 1 ? 0 : Math.min(HEADING_BLEND, (cum[i] - cum[i - 1]) / 2, (cum[i + 1] - cum[i]) / 2));
    path.tan = tan; path.blend = blend;
  }
  let HEADING_BLEND = 12;
  function pathAt(path, s, smooth) { // smooth: a car's pose (the blended tangent); geometry reads the segment's own
    const { pts, cum } = path;
    s = clamp(s, 0, path.length);
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
    const seg = cum[hi] - cum[lo] || 1, f = (s - cum[lo]) / seg;
    let tx = (pts[hi][0] - pts[lo][0]) / seg, ty = (pts[hi][1] - pts[lo][1]) / seg;
    const x = pts[lo][0] + tx * seg * f, y = pts[lo][1] + ty * seg * f;
    if (smooth && HEADING_BLEND > 0 && pts.length > 2) {
      if (!path.tan) pathTangents(path);
      const a = s - cum[lo], b = cum[hi] - s, bl = path.blend[lo], bh = path.blend[hi];
      let u = null, w = 0;
      if (bl > 0 && a < bl) { u = path.tan[lo - 1]; w = 0.5 * (1 - a / bl); } // just past a vertex: still part the last segment's way
      else if (bh > 0 && b < bh) { u = path.tan[hi]; w = 0.5 * (1 - b / bh); } // nearing a vertex: part the next segment's way
      if (u) { const qx = tx * (1 - w) + u[0] * w, qy = ty * (1 - w) + u[1] * w, l = hyp(qx, qy) || 1; tx = qx / l; ty = qy / l; }
    }
    return { x, y, tx, ty, nx: -ty, ny: tx };
  }
  // Edit 71: a route's turn, for its signals. side: +1 right, −1 left (a U-turn is left), 0 straight on; s0..s1: where the
  // heading turns (junction routes); exitSide: the way a ring route turns off the ring.
  function pathSignal(p) {
    if (p.sig) return p.sig;
    const L = p.length, h = (s) => { const q = pathAt(p, clamp(s, 0, L)); return Math.atan2(q.ty, q.tx); }, h0 = h(5), h1 = h(L - 5), tot = wrap(h1 - h0);
    const side = Math.abs(Math.abs(tot) - Math.PI) < 0.35 ? -1 : Math.abs(tot) > 0.6 ? Math.sign(tot) : 0;
    let s0 = null, s1 = null;
    for (let s = 0; s <= L; s += 4) { if (s0 == null && Math.abs(wrap(h(s) - h0)) > 0.17) s0 = s; if (Math.abs(wrap(h(s) - h1)) > 0.17) s1 = s; }
    let exitSide = 0;
    if (p.ring) { const e = p.ring.exitS; exitSide = Math.sign(wrap(h(e + 60) - h(e - 10))) || 1; }
    return (p.sig = { side, s0, s1, exitSide });
  }
  function offsetPts(pts, off) {
    return pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = hyp(dx, dy) || 1;
      return [p[0] + (-dy / l) * off, p[1] + (dx / l) * off];
    });
  }
  const ease = (f) => (1 - Math.cos(Math.PI * f)) / 2;
  const easeD = (f) => Math.PI / 2 * Math.sin(Math.PI * f);
  // Nearest point on a path: arc length s and signed lateral offset (+ = right of travel).
  function pathProject(path, x, y) {
    const { pts, cum } = path;
    let best = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i][0], ay = pts[i][1], dx = pts[i + 1][0] - ax, dy = pts[i + 1][1] - ay, l2 = dx * dx + dy * dy || 1;
      const f = clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1), px = ax + dx * f, py = ay + dy * f;
      const d2 = (x - px) * (x - px) + (y - py) * (y - py);
      if (!best || d2 < best.d2) { const l = Math.sqrt(l2); best = { d2, s: cum[i] + f * l, lat: (x - px) * (-dy / l) + (y - py) * (dx / l) }; }
    }
    return best;
  }
  function arcPts(cx, cy, r, a0, a1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return out;
  }

  // ---------- levels (world units; 800 × 600 field)
  const LEVELS = {
    straight: {
      name: 'L1 Straight', blurb: 'Flyover pillars line the road. Hide from side sensors, then step out.',
      center: () => [[-200, 300], [1000, 300]],
      statics: [
        { x: 136, y: 214, w: 28, h: 28, kind: 'pillar' }, { x: 416, y: 214, w: 28, h: 28, kind: 'pillar' }, { x: 676, y: 214, w: 28, h: 28, kind: 'pillar' },
        { x: 276, y: 358, w: 28, h: 28, kind: 'pillar' }, { x: 546, y: 358, w: 28, h: 28, kind: 'pillar' },
      ],
      cones: [[110, 196], [310, 190], [500, 414], [690, 420]],
      spawns: [{ x: 400, y: 480, f: -90 }, { x: 160, y: 480, f: -90 }, { x: 640, y: 480, f: -90 }, { x: 400, y: 120, f: 90 }],
      // P3 city (proto.city): jersey barriers and blocks are solid. They collide and cast sensor shadows like any static.
      city: [ // city v2 (20 Oct): blocks 27% of the level, jerseys 8% of the road edge
        { x: 148, y: 384, w: 44, h: 8, kind: 'jersey' }, { x: 748, y: 208, w: 44, h: 8, kind: 'jersey' }, { x: 438, y: 384, w: 44, h: 8, kind: 'jersey' },
        { x: 640, y: 48, w: 160, h: 120, kind: 'block', height: 80 }, { x: 128, y: 48, w: 160, h: 120, kind: 'block', height: 100 }, { x: 448, y: 48, w: 152, h: 120, kind: 'block', height: 130 },
        { x: 448, y: 480, w: 144, h: 120, kind: 'block', height: 90 }, { x: 208, y: 480, w: 144, h: 120, kind: 'block', height: 100 }, { x: 688, y: 480, w: 112, h: 120, kind: 'block', height: 120 },
        { x: 0, y: 480, w: 112, h: 120, kind: 'block', height: 120 }, { x: 0, y: 48, w: 88, h: 120, kind: 'block', height: 130 },
      ],
    },
    barrier: {
      name: 'L2 Barrier', blurb: 'Hide behind the barrier. Ambush through the gaps.',
      center: () => [[-200, 300], [1000, 300]],
      statics: [
        { x: 0, y: 388, w: 250, h: 12, kind: 'barrier' }, { x: 290, y: 388, w: 220, h: 12, kind: 'barrier' },
        { x: 550, y: 388, w: 250, h: 12, kind: 'barrier' },
        { x: 186, y: 214, w: 28, h: 28, kind: 'pillar' }, { x: 466, y: 214, w: 28, h: 28, kind: 'pillar' }, { x: 686, y: 214, w: 28, h: 28, kind: 'pillar' },
      ],
      cones: [[90, 202], [260, 198], [540, 202], [150, 428], [700, 428]],
      spawns: [{ x: 400, y: 500, f: -90 }, { x: 140, y: 500, f: -90 }, { x: 660, y: 500, f: -90 }, { x: 300, y: 110, f: 90 }],
      // P3 city (proto.city): jersey barriers and blocks are solid. They collide and cast sensor shadows like any static.
      city: [ // city v2 (20 Oct): blocks 26% of the level, jerseys 8% of the road edge
        { x: 388, y: 208, w: 44, h: 8, kind: 'jersey' }, { x: 8, y: 208, w: 44, h: 8, kind: 'jersey' }, { x: 748, y: 208, w: 44, h: 8, kind: 'jersey' },
        { x: 0, y: 48, w: 160, h: 120, kind: 'block', height: 70 }, { x: 640, y: 48, w: 160, h: 120, kind: 'block', height: 110 }, { x: 424, y: 48, w: 160, h: 120, kind: 'block', height: 120 },
        { x: 192, y: 480, w: 160, h: 120, kind: 'block', height: 80 }, { x: 448, y: 480, w: 160, h: 120, kind: 'block', height: 80 }, { x: 712, y: 480, w: 88, h: 120, kind: 'block', height: 90 },
        { x: 0, y: 480, w: 88, h: 120, kind: 'block', height: 120 }, { x: 200, y: 48, w: 48, h: 120, kind: 'block', height: 70 },
      ],
    },
    corner: {
      name: 'L3 Corner', blurb: 'A right-angle bend. Read curved approaches.',
      center: () => [[-200, 440], [450, 440], ...arcPts(450, 340, 100, Math.PI / 2, 0, 24).slice(1), [550, -200]],
      statics: [{ x: 382, y: 312, w: 36, h: 36, kind: 'pillar' }, { x: 404, y: 232, w: 32, h: 32, kind: 'pillar' },
        { x: 236, y: 336, w: 28, h: 28, kind: 'pillar' }, { x: 626, y: 456, w: 32, h: 32, kind: 'pillar' }],
      cones: [[200, 330], [320, 552], [660, 220], [420, 120]],
      spawns: [{ x: 300, y: 560, f: -90 }, { x: 700, y: 400, f: 180 }, { x: 200, y: 160, f: 0 }, { x: 720, y: 140, f: 180 }],
      // P3 city (proto.city): jersey barriers and blocks are solid. They collide and cast sensor shadows like any static.
      city: [ // city v2 (20 Oct): blocks 25% of the level, jerseys 7% of the road edge
        { x: 634, y: 248, w: 8, h: 44, kind: 'jersey' }, { x: 8, y: 524, w: 44, h: 8, kind: 'jersey' }, { x: 378, y: 524, w: 44, h: 8, kind: 'jersey' },
        { x: 0, y: 216, w: 160, h: 120, kind: 'block', height: 70 }, { x: 0, y: 48, w: 152, h: 120, kind: 'block', height: 120 }, { x: 248, y: 48, w: 136, h: 120, kind: 'block', height: 110 },
        { x: 688, y: 232, w: 112, h: 120, kind: 'block', height: 130 }, { x: 696, y: 480, w: 104, h: 120, kind: 'block', height: 60 }, { x: 200, y: 208, w: 144, h: 88, kind: 'block', height: 130 },
        { x: 504, y: 528, w: 152, h: 72, kind: 'block', height: 80 }, { x: 96, y: 536, w: 152, h: 64, kind: 'block', height: 80 }, { x: 648, y: 48, w: 152, h: 40, kind: 'block', height: 120 },
        { x: 752, y: 392, w: 48, h: 48, kind: 'block', height: 110 },
      ],
    },
  };
  const ROADS = ['straight', 'barrier', 'corner']; // the P2.2 roads: legacy campaign and test fixtures
  // Body health is a difficulty setting, constant across roads. More health = harder contract.
  const DIFFICULTIES = [{ key: 'fragile', name: 'Fragile' }, { key: 'standard', name: 'Standard' }, { key: 'reinforced', name: 'Reinforced' }];

  function lanesOf(c, P) { const half = P['world.laneWidth'] / 2; return [makePath(offsetPts(c, half)), makePath(offsetPts(c, -half).reverse())]; }
  function buildLevel(id, P) {
    const L = LEVELS[id], c = L.center();
    const lv = {
      id, key: id, name: L.name, blurb: L.blurb, center: c, lanes: lanesOf(c, P),
      statics: L.statics.concat(P['proto.city'] ? L.city || [] : []).map((s, i) => Object.assign({ id: 's' + i }, s)),
      coneHomes: L.cones.slice(), spawns: L.spawns.slice(), canal: true, gates: {}, theme: 'start',
    };
    lv.patches = makePatches(lv, P, prng(5150 + ROADS.indexOf(id) * 97 + Math.round(P['proto.district.seed'] || 0) * 131));
    return lv;
  }

  // ---------- geometry helpers for generated screens
  const liftOf = (P, h) => Math.round(h * P['proto.art.extrusion'] / P['ui.artScale']) * P['ui.artScale']; // a height drawn as a screen-up offset, world units
  const rectDist = (x, y, r) => hyp(Math.max(r.x - x, 0, x - (r.x + r.w)), Math.max(r.y - y, 0, y - (r.y + r.h)));
  const overlapGap = (a, b, g) => a.x < b.x + b.w + g && a.x + a.w + g > b.x && a.y < b.y + b.h + g && a.y + a.h + g > b.y;
  function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  function roadDist(center) { // distance from a point to the road centre line
    const segs = [];
    for (let i = 1; i < center.length; i++) { const a = center[i - 1], b = center[i], dx = b[0] - a[0], dy = b[1] - a[1], len = hyp(dx, dy) || 1; segs.push([a[0], a[1], dx / len, dy / len, len]); }
    return (x, y) => { let best = Infinity; for (const [ax, ay, tx, ty, len] of segs) { const px = x - ax, py = y - ay, t = clamp(px * tx + py * ty, 0, len); best = Math.min(best, hyp(px - tx * t, py - ty * t)); } return best; };
  }

  // ---------- surfaces (D18, 20 Oct; GDD 11.3): one ground per tile, patches painted on top. Puddles on world.puddleShare of tiles.
  // Spots of 1 to world.puddleSpotMax tiles, alternating road and verge, never under a static, a spawn or a cone.
  function makePatches(lv, P, r, avoid, share) {
    const T = P['world.tileSize'], W = P['world.width'], H = P['world.height'], cols = Math.ceil(W / T), rows = Math.ceil(H / T);
    const want = Math.round((share != null ? share : P['world.puddleShare']) * cols * rows);
    avoid = avoid || [];
    if (!(want > 0)) return [];
    const top = lv.canal ? 48 : 0, d = roadDist(lv.center), lw = P['world.laneWidth'];
    const ok = (i, j) => {
      const rc = { x: i * T, y: j * T, w: T, h: T };
      if (i < 0 || j < 0 || rc.x + T > W || rc.y + T > H || rc.y < top) return false;
      return lv.statics.every((st) => !overlapGap(rc, st, 4)) && lv.spawns.every((sp) => rectDist(sp.x, sp.y, rc) > 24) &&
        lv.coneHomes.every((cn) => rectDist(cn[0], cn[1], rc) > 12) && avoid.every((q) => !overlapGap(rc, q, 0));
    };
    const onRoad = (i, j) => d((i + 0.5) * T, (j + 0.5) * T) < lw - 8;
    const out = [];
    let tiles = 0;
    for (let tries = 0; tries < 2000 && tiles < want; tries++) {
      const i = Math.floor(r() * cols), j = Math.floor(r() * rows), road = out.length % 2 === 0;
      if (!ok(i, j) || (tries < 1500 && onRoad(i, j) !== road)) continue;
      if (out.some((p) => i * T > p.x - 3 * T && i * T < p.x + p.w + 2 * T && j * T > p.y - 3 * T && j * T < p.y + p.h + 2 * T)) continue; // spots stay apart
      let w = 1, h = 1;
      if (Math.min(Math.round(P['world.puddleSpotMax']), want - tiles) >= 2 && r() < 0.6) {
        if (r() < 0.5 && ok(i + 1, j) && onRoad(i + 1, j) === onRoad(i, j)) w = 2; else if (ok(i, j + 1) && onRoad(i, j + 1) === onRoad(i, j)) h = 2;
      }
      out.push({ x: i * T, y: j * T, w: w * T, h: h * T, kind: 'puddle' }); tiles += w * h;
    }
    return out;
  }

  // ---------- district (D24, 20 Oct): a level is world.districtColumns × world.districtRows screens, Zelda-style.
  // One road snakes through every screen; both ends leave the district. Each screen is a full play area (7.1).
  // The start screen (top middle, river to the north) is the handcrafted road. The rest are generated from the seed.
  // Only the screen the dummy stands on runs. Its edges are solid except at gates: the road crossing and pedestrian gates.
  const SIDE = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }, OPP = { N: 'S', E: 'W', S: 'N', W: 'E' }, SIDES = ['N', 'E', 'S', 'W'];
  // Where a road may cross an edge: 220/300/380 on side edges and 280/400/520 on top and bottom at 800 × 600; scaled with the screen.
  const across = (sd, W, H) => (horiz(sd) ? [0.3667, 0.5, 0.6333].map((f) => Math.round(H * f / 4) * 4) : [0.35, 0.5, 0.65].map((f) => Math.round(W * f / 4) * 4));
  const BEND_R = 100, S_SPAN = 300, S_MAX = 160, GRID = 16, THEMES = ['flyover', 'barrier', 'plain', 'flyover', 'barrier'];
  const horiz = (sd) => sd === 'W' || sd === 'E';
  const sideOf = (a, b) => (b[0] > a[0] ? 'E' : b[0] < a[0] ? 'W' : b[1] > a[1] ? 'S' : 'N');
  function edgeCrossings(center, W, H) {
    const out = [];
    for (let i = 1; i < center.length; i++) {
      const [x0, y0] = center[i - 1], [x1, y1] = center[i];
      const at = (side, t) => {
        if (t < 0 || t > 1) return;
        const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        if (horiz(side) ? y >= 0 && y <= H : x >= 0 && x <= W) out.push({ side, off: Math.round(horiz(side) ? y : x) });
      };
      if (x1 !== x0) { at('W', -x0 / (x1 - x0)); at('E', (W - x0) / (x1 - x0)); }
      if (y1 !== y0) { at('N', -y0 / (y1 - y0)); at('S', (H - y0) / (y1 - y0)); }
    }
    return out;
  }
  // P5.3 (Edit 53.1): how far across a seam cars see each other: the lead-in, or the fastest highway car's stopping distance
  // at traffic.hardBraking plus a bus length, whichever is longer.
  const seamSight = (P) => Math.max(P['world.spawnLeadIn'], Math.max(...['sedan', 'van', 'hatchback', 'police', 'bus'].map((k) => P['vehicles.' + k + '.cruiseSpeed'] || 0)) ** 2 * P['traffic.deckSpeedScale'] ** 2 / (2 * P['traffic.hardBraking']) + P['vehicles.bus.length']);
  // P5.3 (Edit 53): where a lane enters the screen (first inward crossing) and leaves it (last outward crossing).
  // Each: side, offset along that edge, s on the lane, heading. A lane that starts or ends on screen has none at that end.
  function laneEnds(path, W, H) {
    const { pts, cum } = path, xs = [];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], seg = cum[i] - cum[i - 1];
      if (seg < 1e-9) continue;
      const hit = (t, side) => {
        if (!(t > 0 && t <= 1)) return;
        const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
        if (horiz(side) ? y < -0.5 || y > H + 0.5 : x < -0.5 || x > W + 0.5) return;
        xs.push({ side, off: horiz(side) ? y : x, s: cum[i - 1] + seg * t, x, y, tx: (x1 - x0) / seg, ty: (y1 - y0) / seg });
      };
      if (x1 !== x0) { hit(-x0 / (x1 - x0), 'W'); hit((W - x0) / (x1 - x0), 'E'); }
      if (y1 !== y0) { hit(-y0 / (y1 - y0), 'N'); hit((H - y0) / (y1 - y0), 'S'); }
    }
    xs.sort((a, b) => a.s - b.s);
    const inward = (c) => (c.side === 'W' ? c.tx > 0 : c.side === 'E' ? c.tx < 0 : c.side === 'N' ? c.ty > 0 : c.ty < 0), ins = xs.filter(inward), outs = xs.filter((c) => !inward(c));
    return { in: ins[0] || null, out: outs[outs.length - 1] || null };
  }
  const edgePoint = (sd, off, W, H, out) => (sd === 'W' ? [-out, off] : sd === 'E' ? [W + out, off] : sd === 'N' ? [off, -out] : [off, H + out]);
  function roadCenter(a, b, W, H, lead) {
    if (horiz(a.side) === horiz(b.side)) { // opposite edges: straight, or an S-bend between two offsets
      const p0 = edgePoint(a.side, a.off, W, H, lead), p1 = edgePoint(b.side, b.off, W, H, lead);
      if (a.off === b.off) return [p0, p1];
      const hz = horiz(a.side), mid = (hz ? W : H) / 2, fwd = a.side === 'W' || a.side === 'N';
      const s0 = mid + (fwd ? -1 : 1) * S_SPAN / 2, s1 = mid + (fwd ? 1 : -1) * S_SPAN / 2, pts = [p0];
      for (let i = 0; i <= 16; i++) { const t = i / 16, al = s0 + (s1 - s0) * t, lat = a.off + (b.off - a.off) * ease(t); pts.push(hz ? [al, lat] : [lat, al]); }
      pts.push(p1);
      return pts;
    }
    const h = horiz(a.side) ? a : b, v = horiz(a.side) ? b : a; // adjacent edges: a right-angle bend filleted at BEND_R
    const dxh = h.side === 'W' ? -1 : 1, dyv = v.side === 'N' ? -1 : 1, ox = v.off + dxh * BEND_R, oy = h.off + dyv * BEND_R;
    const a1 = Math.atan2(h.off - oy, v.off + dxh * BEND_R - ox), a2 = a1 + wrap(Math.atan2(h.off + dyv * BEND_R - oy, v.off - ox) - a1);
    const pts = [edgePoint(h.side, h.off, W, H, lead), ...arcPts(ox, oy, BEND_R, a1, a2, 24), edgePoint(v.side, v.off, W, H, lead)];
    return h === a ? pts : pts.reverse();
  }
  function hamiltonPaths(C, R) {
    const out = [], n = C * R, seen = new Uint8Array(n), path = [];
    const go = (k) => {
      path.push(k); seen[k] = 1;
      if (path.length === n) out.push(path.slice());
      else {
        const x = k % C, y = (k - x) / C;
        for (const sd of SIDES) { const xx = x + SIDE[sd][0], yy = y + SIDE[sd][1]; if (xx >= 0 && yy >= 0 && xx < C && yy < R && !seen[yy * C + xx]) go(yy * C + xx); }
      }
      path.pop(); seen[k] = 0;
    };
    for (let k = 0; k < n; k++) go(k);
    return out;
  }
  // A strip along one edge, from the edge to a body length inside, between a0 and a1: clear of every static?
  function edgeClear(statics, sd, a0, a1, W, H, R) {
    const D = 56, rc = sd === 'W' ? { x: 0, y: a0, w: D, h: a1 - a0 } : sd === 'E' ? { x: W - D, y: a0, w: D, h: a1 - a0 } :
      sd === 'N' ? { x: a0, y: 0, w: a1 - a0, h: D } : { x: a0, y: H - D, w: a1 - a0, h: D };
    return statics.every((st) => !overlapGap(rc, st, R + 1));
  }
  // The approach to each gate stays open: a rectangle from the edge inward, a little wider than the gate.
  function gateZones(gates, W, H) {
    const out = [], D = 64;
    for (const sd of SIDES) for (const [a, b] of gates[sd] || []) {
      out.push(sd === 'W' ? { x: 0, y: a - 8, w: D, h: b - a + 16 } : sd === 'E' ? { x: W - D, y: a - 8, w: D, h: b - a + 16 } :
        sd === 'N' ? { x: a - 8, y: 0, w: b - a + 16, h: D } : { x: a - 8, y: H - D, w: b - a + 16, h: D });
    }
    return out;
  }
  function planDistrict(levelId, P) {
    const C = Math.round(P['world.districtColumns']), R = Math.round(P['world.districtRows']), W = P['world.width'], H = P['world.height'];
    const seed = 9001 + ROADS.indexOf(levelId) * 7919 + Math.round(P['proto.district.seed']) * 104729, r = prng(seed);
    const inside = (x, y) => x >= 0 && y >= 0 && x < C && y < R, xy = (k) => [k % C, Math.floor(k / C)];
    const outsides = (c) => SIDES.filter((sd) => !inside(c[0] + SIDE[sd][0], c[1] + SIDE[sd][1]));
    const fixed = edgeCrossings(LEVELS[levelId].center(), W, H); // the start screen keeps its handcrafted road
    const all = hamiltonPaths(C, R);
    // The start screen sits on the top row, by the river: the middle if its road allows, else a corner.
    // (A path's ends fall on the corners of a 3 × 3 grid, so a road that ends on the start screen starts in a corner.)
    let start = null, paths = [];
    for (const st of [[Math.floor(C / 2), 0], [C - 1, 0], [0, 0]]) {
      const sk = st[0];
      paths = all.filter((p) => {
        const i = p.indexOf(sk), nb = [p[i - 1], p[i + 1]].filter((k) => k != null).map((k) => sideOf(st, xy(k)));
        const outs = fixed.filter((f) => !inside(st[0] + SIDE[f.side][0], st[1] + SIDE[f.side][1]));
        if (nb.length + outs.length !== 2 || !nb.every((sd) => fixed.some((f) => f.side === sd))) return false;
        return [p[0], p[p.length - 1]].every((k) => outsides(xy(k)).length > 0); // both road ends leave the district
      });
      if (paths.length) { start = st; break; }
    }
    if (!start) return null;
    const isStart = (c) => c[0] === start[0] && c[1] === start[1];
    const startStatics = buildLevel(levelId, P).statics, OUTER = P['world.laneWidth'] + P['proto.shoulderWidth'];
    const gw = P['world.gateWidth'], gap = P['world.pedestrianGap'], br = P['body.radius'];
    for (let attempt = 0; attempt < 400; attempt++) {
      const path = pick(r, paths).map(xy), ends = path.map(() => []);
      const fixedOff = (c, sd) => { if (!isStart(c)) return null; const f = fixed.find((q) => q.side === sd); return f ? f.off : null; };
      for (let i = 0; i + 1 < path.length; i++) {
        const a = path[i], b = path[i + 1], sa = sideOf(a, b), sb = OPP[sa];
        let off = fixedOff(a, sa); if (off == null) off = fixedOff(b, sb); if (off == null) off = pick(r, across(sa, W, H));
        ends[i].push({ side: sa, off }); ends[i + 1].push({ side: sb, off });
      }
      for (const i of [0, path.length - 1]) {
        const c = path[i], fo = isStart(c) ? fixed.find((f) => !inside(c[0] + SIDE[f.side][0], c[1] + SIDE[f.side][1])) : null;
        const sd = fo ? fo.side : pick(r, outsides(c)), e = { side: sd, off: fo ? fo.off : pick(r, across(sd, W, H)), outer: true };
        if (i === 0) ends[i].unshift(e); else ends[i].push(e);
      }
      if (ends.some(([a, b]) => horiz(a.side) === horiz(b.side) && Math.abs(a.off - b.off) > S_MAX)) continue; // S-bends stay gentle
      const cells = Array.from({ length: R }, (_, y) => Array.from({ length: C }, (_, x) => null));
      path.forEach((c, i) => {
        cells[c[1]][c[0]] = { cell: c, order: i, ends: ends[i], start: isStart(c), canal: c[1] === 0, gates: { N: [], E: [], S: [], W: [] },
          theme: isStart(c) ? 'start' : pick(r, THEMES), center: isStart(c) ? LEVELS[levelId].center() : roadCenter(ends[i][0], ends[i][1], W, H, P['world.spawnLeadIn']),
          level: null, cones: null };
      });
      // gates on every shared edge: the road crossing, plus one pedestrian gate (always where no road crosses)
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) for (const sd of ['E', 'S']) {
        const nx = x + SIDE[sd][0], ny = y + SIDE[sd][1];
        if (!inside(nx, ny)) continue;
        const A = cells[y][x], B = cells[ny][nx], len = horiz(sd) ? H : W, road = A.ends.find((e) => e.side === sd), spans = [];
        if (road) spans.push([road.off - OUTER, road.off + OUTER]);
        const free = (a) => [[A, sd], [B, OPP[sd]]].every(([q, s]) => !q.start || edgeClear(startStatics, s, a - 4, a + gw + 4, W, H, br)) &&
          spans.every(([s0, s1]) => a + gw + gap <= s0 || a >= s1 + gap) && !(horiz(sd) && (A.canal || B.canal) && a < 56);
        const cand = [];
        for (let a = 48; a + gw <= len - 48; a += 8) if (free(a)) cand.push(a);
        if (cand.length && (!road || r() < 0.5)) { const a = pick(r, cand); spans.push([a, a + gw]); }
        A.gates[sd] = spans.map((s) => s.slice()); B.gates[OPP[sd]] = spans.map((s) => s.slice());
      }
      return { levelId, cols: C, rows: R, seed, start, cur: start.slice(), path, cells, visited: new Set([start[1] * C + start[0]]), lastFlip: null };
    }
    return null;
  }
  // Axis-aligned straight runs of the road inside the screen: theme features and jerseys sit along them.
  function straightRuns(c, W, H) {
    const out = [];
    for (let i = 1; i < c.length; i++) {
      const [x0, y0] = c[i - 1], [x1, y1] = c[i];
      if (y0 === y1) { const a = Math.max(0, Math.min(x0, x1)), b = Math.min(W, Math.max(x0, x1)); if (b - a > 160) out.push({ hz: true, c: y0, a, b }); }
      else if (x0 === x1) { const a = Math.max(0, Math.min(y0, y1)), b = Math.min(H, Math.max(y0, y1)); if (b - a > 160) out.push({ hz: false, c: x0, a, b }); }
    }
    return out;
  }
  // A generated screen: theme features (flyover pillars or a barrier run with gaps), verge spawns and cones,
  // jersey barriers on world.jerseyShare of the road edge, then city blocks to world.blockShare of the screen (7.9 clause 6).
  function generateScreen(D, cell, P, r, ctx) { // ctx (Edit 48, city): incoming neighbour buildings, room(side, rc), give(side, blk, e)
    const W = P['world.width'], H = P['world.height'], lw = P['world.laneWidth'], OUTER = lw + P['proto.shoulderWidth'];
    const BR = P['body.radius'], ALLEY = P['world.pedestrianGap'], top = cell.canal ? 48 : 0, c = cell.center, d0 = roadDist(c), dr = cell.ring ? roadDist(cell.ring) : null;
    const d = dr ? (x, y) => Math.min(d0(x, y), dr(x, y)) : d0; // the roundabout ring counts as road
    const keep = gateZones(cell.gates, W, H), path = makePath(c), statics = [];
    const city = D.kind === 'city', dp = (f, dflt) => (city ? dpar(P, D.levelId, f) : dflt), focalPatches = [];
    const DW = P['world.deckWidth'], deckBands = (cell.decks || []).map((dk) => dk.hz ? { x: 0, y: dk.off - DW / 2, w: W, h: DW } : { x: dk.off - DW / 2, y: 0, w: DW, h: H });
    const per = perimeter(D, cell, P, W, H, top), B = per.bounds; // Edit 42: walls, river, checkpoints
    const shared = city ? SIDES.filter((sd) => { const x = cell.cell[0] + SIDE[sd][0], y = cell.cell[1] + SIDE[sd][1]; return x >= 0 && y >= 0 && x < D.cols && y < D.rows; }) : [];
    statics.push(...per.statics);
    // Edit 48: a lot that touches a shared screen edge carries across it, so the building draws on both screens.
    // Pieces of neighbours' buildings arrive first; everything else here keeps clear of them.
    const incoming = (ctx && ctx.incoming) || [], onScreen = (b) => Math.max(0, Math.min(W, b.x + b.w) - Math.max(0, b.x)) * Math.max(0, Math.min(H, b.y + b.h) - Math.max(0, b.y));
    const edgeSides = (rc) => shared.filter((sd) => (sd === 'W' && rc.x <= 0.5) || (sd === 'E' && rc.x + rc.w >= W - 0.5) || (sd === 'N' && rc.y <= 0.5) || (sd === 'S' && rc.y + rc.h >= H - 0.5));
    const crossOK = (rc) => { const es = edgeSides(rc); return !es.length || (es.length === 1 && !!ctx && ctx.room(es[0], rc) > 0); }; // one shared edge per building
    statics.push(...incoming);
    if (cell.focal) { const lm = placeLandmark(cell, P, d, keep, B, W, H, r); statics.push(...lm.statics); focalPatches.push(...lm.patches); }
    if (cell.focal === 'roundabout') focalPatches.push({ x: W / 2 - 32, y: H / 2 - 32, w: 64, h: 64, kind: 'matting' }); // the island: a springboard (7.3)
    if (cell.focal === 'plate') focalPatches.push(...placePlates(c, P, top, W, H, 3, r));
    const roadsHere = [c].concat(cell.ring ? [cell.ring] : []);
    const dk = buildDecks(cell, P, d, roadsHere, keep, statics.concat(focalPatches), B, W, H, r);
    statics.push(...dk.statics);
    const reserved = dk.stairs.concat(dk.landing); // stairs and drop landings stay open ground
    // stair sides and checkpoint zones stop the dummy on the ground: blocks keep an alley from them, and the flood fill counts them
    const stairs = dk.stairs.slice(), stairRects = stairs.map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h })), cpZones = per.checkpoints.filter((cp) => !cp.deck).map((cp) => checkZone(cp, P, W, H));
    // Edit 44 floors: raised walkable areas. Decks first (floor k = deck k), then platform roofs, then skybridges.
    const PW = P['world.parapetWidth'], half = P['world.deckWidth'] / 2, floors = dk.decks.map((q, k) => ({ kind: 'deck', z: q.z, deck: k, x: 0, y: q.off - half + PW, w: W, h: 2 * (half - PW),
      ledges: q.gaps.map(([a0, a1, sd]) => ({ side: sd < 0 ? 'N' : 'S', a0, a1 })) }));
    const nBase = statics.length;
    const inside = (rc, m) => rc.x >= B.l + m && rc.y >= B.t + m && rc.x + rc.w <= B.r - m && rc.y + rc.h <= B.b - m;
    const offRoad = (rc, m) => [[rc.x, rc.y], [rc.x + rc.w, rc.y], [rc.x, rc.y + rc.h], [rc.x + rc.w, rc.y + rc.h], [rc.x + rc.w / 2, rc.y + rc.h / 2]].every(([x, y]) => d(x, y) >= m);
    const clearKeep = (rc, m) => keep.every((k) => !overlapGap(rc, k, m));
    const runs = straightRuns(c, W, H).sort((p, q) => (q.b - q.a) - (p.b - p.a));
    if (cell.theme === 'flyover') for (const run of runs) {
      for (let p = run.a + 100, k = Math.floor(r() * 2); p + 28 <= run.b - 60; p += 240 + Math.round(r() * 3) * 10, k++) {
        const off = k % 2 ? run.c + lw + 2 : run.c - lw - 30;
        const rc = run.hz ? { x: p, y: off, w: 28, h: 28, kind: 'pillar' } : { x: off, y: p, w: 28, h: 28, kind: 'pillar' };
        if (inside(rc, 4) && offRoad(rc, lw) && clearKeep(rc, 8) && !incoming.some((b) => overlapGap(rc, b, ALLEY))) statics.push(rc);
      }
    }
    if (cell.theme === 'barrier' && runs.length) { // one side of the longest run: a crash barrier with world.barrierGapsMin gaps
      const run = runs[0], s = r() < 0.5 ? 1 : -1, off = s > 0 ? run.c + OUTER + 8 : run.c - OUTER - 20, a0 = run.a + 48, a1 = run.b - 48;
      const n = Math.round(P['world.barrierGapsMin']), seg = (a1 - a0 - n * ALLEY) / (n + 1);
      for (let k = 0; k <= n; k++) {
        const p = a0 + k * (seg + ALLEY), rc = run.hz ? { x: Math.round(p), y: off, w: Math.round(seg), h: 12, kind: 'barrier' } : { x: off, y: Math.round(p), w: 12, h: Math.round(seg), kind: 'barrier' };
        if (seg > 40 && inside(rc, 4) && offRoad(rc, OUTER) && clearKeep(rc, 8) && !incoming.some((b) => overlapGap(rc, b, ALLEY))) statics.push(rc);
      }
    }
    if (cell.theme !== 'plain' && cell.theme !== 'focal' && statics.length === nBase) cell.theme = 'plain'; // too little straight road for the feature
    const verge = (dist, okFn) => { // points on both verges at a set distance from the centre line
      const out = [];
      for (let s = 0; s <= path.length; s += 24) {
        const p = pathAt(path, s);
        if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) continue;
        for (const side of [-1, 1]) { const x = p.x + p.nx * side * dist, y = p.y + p.ny * side * dist; if (okFn(x, y)) out.push({ x, y, px: p.x, py: p.y }); }
      }
      return out;
    };
    const spread = (cands, n, from) => { // farthest-point picks, so spawns and cones spread over the screen
      const got = [];
      while (got.length < n && cands.length) {
        let bi = -1, bd = -1;
        for (let k = 0; k < cands.length; k++) { const q = cands[k], m = got.concat(from || []).reduce((mm, g) => Math.min(mm, hyp(g.x - q.x, g.y - q.y)), Infinity); const v = m === Infinity ? r() : m; if (v > bd) { bd = v; bi = k; } }
        got.push(cands.splice(bi, 1)[0]);
      }
      return got;
    };
    const keepDist = (x, y) => keep.reduce((m, k) => Math.min(m, rectDist(x, y, k)), Infinity);
    const SB = P['world.buildingSetback'], FRONT = OUTER + SB, vSp = city ? OUTER + SB / 2 : OUTER + 44; // Edit 43: spawns stand in the forecourt
    const spawns = spread(verge(vSp, (x, y) => x >= B.l + 40 && x <= B.r - 40 && y >= B.t + 44 && y <= B.b - 40 && d(x, y) >= vSp - 4 &&
      statics.every((st) => rectDist(x, y, st) >= 40) && keepDist(x, y) >= 20 && reserved.every((q) => rectDist(x, y, q) >= 32) && deckBands.every((q) => rectDist(x, y, q) >= 16)), 4)
      .map((q) => ({ x: Math.round(q.x), y: Math.round(q.y), f: Math.round(Math.atan2(q.py - q.y, q.px - q.x) / DEG) }));
    const cones = spread(verge(OUTER + 24, (x, y) => x >= B.l + 20 && x <= B.r - 20 && y >= B.t + 20 && y <= B.b - 20 && d(x, y) >= OUTER + 16 &&
      statics.every((st) => rectDist(x, y, st) >= 24) && spawns.every((sp) => hyp(sp.x - x, sp.y - y) >= 60) && reserved.every((q) => rectDist(x, y, q) >= 24)), 3, spawns).map((q) => [Math.round(q.x), Math.round(q.y)]);
    // jersey barriers, just off the pavement on straight runs
    let edgeLen = 0;
    for (let s = 0; s < path.length; s += 4) { const p = pathAt(path, s); if (p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H) edgeLen += 8; }
    const want = Math.max(1, Math.round(edgeLen * dp('jerseyShare', P['world.jerseyShare']) / 44)), jc = [];
    for (const run of runs) for (const side of [-1, 1]) for (let p = run.a + 40; p < run.b - 40; p += 10) {
      const o = run.c + side * (OUTER + 4) - (side < 0 ? 8 : 0);
      const rc = run.hz ? { x: Math.round(p - 22), y: Math.round(o), w: 44, h: 8, kind: 'jersey' } : { x: Math.round(o), y: Math.round(p - 22), w: 8, h: 44, kind: 'jersey' };
      if (!inside(rc, 4) || !offRoad(rc, OUTER + 2) || !clearKeep(rc, 8) || !statics.every((st) => !overlapGap(rc, st, 26))) continue;
      if (!spawns.every((sp) => rectDist(sp.x, sp.y, rc) > 56) || !cones.every((cn) => rectDist(cn[0], cn[1], rc) > 26) || reserved.some((q) => overlapGap(rc, q, 2 * BR + 6))) continue; // never across a stair foot
      jc.push(rc);
    }
    const jerseys = [];
    while (jerseys.length < want && jc.length) {
      let bi = -1, bd = -1;
      for (let k = 0; k < jc.length; k++) { const q = jc[k]; if (jerseys.some((j) => overlapGap(q, j, 60))) continue; const m = jerseys.length ? Math.min(...jerseys.map((j) => hyp(j.x - q.x, j.y - q.y))) : r() * 100; if (m > bd) { bd = m; bi = k; } }
      if (bi < 0) break;
      jerseys.push(jc.splice(bi, 1)[0]);
    }
    statics.push(...jerseys);
    // city blocks: greedy, largest legal footprint first on a GRID-unit lattice; every open spot stays reachable
    const G = 8, GW = W / G, GH = H / G, forb = new Uint8Array(GW * GH);
    const edgeKinds = { wall: 1, river: 1 }, inner = statics.filter((st) => !edgeKinds[st.kind]); // blocks may stand flush against the perimeter
    const tooNear = (x, y) => d(x, y) < OUTER + 16 + 4 || y < B.t || x < B.l || x > B.r || y > B.b || inner.some((st) => rectDist(x, y, st) < ALLEY + 4) || reserved.some((q) => rectDist(x, y, q) < 12) ||
      stairRects.some((q) => rectDist(x, y, q) < ALLEY + 4) || keep.some((k) => rectDist(x, y, k) < 4) || spawns.some((sp) => hyp(sp.x - x, sp.y - y) < 52) || cones.some((cn) => hyp(cn[0] - x, cn[1] - y) < 36) ||
      deckBands.some((k) => rectDist(x, y, k) < 8) || focalPatches.some((k) => rectDist(x, y, k) < 12); // no building under a flyover or on a plaza
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) forb[j * GW + i] = tooNear(i * G + G / 2, j * G + G / 2) ? 1 : 0;
    const mark = (b) => { for (let j = Math.max(0, Math.floor((b.y - ALLEY - G) / G)); j < Math.min(GH, Math.ceil((b.y + b.h + ALLEY + G) / G)); j++) for (let i = Math.max(0, Math.floor((b.x - ALLEY - G) / G)); i < Math.min(GW, Math.ceil((b.x + b.w + ALLEY + G) / G)); i++) if (rectDist(i * G + G / 2, j * G + G / 2, b) < ALLEY + 4) forb[j * GW + i] = 1; };
    let before = null; // Edit 48: ground already cut off before the lots (a coarse-grid artefact, or open only through a neighbour) is not held against a lot
    const reachable = (list) => { // flood fill from the spawns over open ground: no lot walls off ground that was reachable
      if (!before) { before = true; before = flood(statics.concat(stairRects, cpZones)).seen; }
      const { free, seen } = flood(list), gwh = free.length;
      for (let k = 0; k < gwh; k++) if (free[k] && !seen[k] && before[k]) return false;
      return true;
    };
    const flood = (list) => {
      const S = 8, gw = W / S, gh = H / S, free = new Uint8Array(gw * gh), seen = new Uint8Array(gw * gh), q = [];
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const x = i * S + S / 2, y = j * S + S / 2; free[j * gw + i] = x > BR && x < W - BR && y > BR && y < H - BR && list.every((st) => rectDist(x, y, st) > BR + 0.5) ? 1 : 0; }
      for (const sp of spawns) { const k = Math.floor(sp.y / S) * gw + Math.floor(sp.x / S); if (free[k] && !seen[k]) { seen[k] = 1; q.push(k); } }
      while (q.length) { const k = q.pop(), i = k % gw, j = (k - i) / gw; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= gw || jj >= gh) continue; const kk = jj * gw + ii; if (free[kk] && !seen[kk]) { seen[kk] = 1; q.push(kk); } } }
      return { free, seen };
    };
    const blocks = [], banned = new Set(), storey = P['world.storeyHeight'];
    let area = incoming.reduce((n, b) => n + onScreen(b), 0);
    const bMax = dp('blockMax', 160), cap = P['world.occludedFractionMax'] * W * H; // never past the occlusion cap (7.9 clause 6)
    const ground = city ? buildableArea(c, cell.ring, cell.decks, statics, P) : W * H - deckBands.reduce((n, q) => n + q.w * q.h, 0); // Edit 43: share of buildable ground
    // building form (Edit 43): single- or double-storey (world.storeyHeight each; doubleShare), towers on a share of the larger lots
    const form = (b) => {
      if (!city) return { height: 60 + Math.round(r() * 8) * 10 };
      if (b.w >= 96 && b.h >= 80 && r() < dp('towerShare', 0)) { const n = Math.round((P['world.towerHeightMin'] + r() * (P['world.towerHeightMax'] - P['world.towerHeightMin'])) / storey); return { height: n * storey, storeys: n, tower: true }; }
      const n = r() < dp('doubleShare', 0.5) ? 2 : 1; return { height: n * storey, storeys: n };
    };
    const take = (rc, over) => {
      const blk = Object.assign({ x: rc.x, y: rc.y, w: rc.w, h: rc.h, kind: 'block' }, over || form(rc)), es = edgeSides(rc);
      if (es.length && ctx) { // Edit 48: across the shared edge by the most the neighbour has room for
        const sd = es[0], e = ctx.room(sd, rc);
        if (sd === 'E') blk.w += e; if (sd === 'W') { blk.x -= e; blk.w += e; } if (sd === 'S') blk.h += e; if (sd === 'N') { blk.y -= e; blk.h += e; }
        ctx.give(sd, blk);
      }
      blocks.push(blk); mark(blk); area += rc.w * rc.h; return blk;
    };
    // platform blocks (Edit 44): built to world.highHeight with a walkable roof at Z2, reached by a stair
    const SWD = P['world.stairWidth'], hiH = P['world.highHeight'], platform = { height: hiH, storeys: Math.round(hiH / storey), platform: true };
    const roofOf = (blk) => { floors.push({ kind: 'roof', z: 2, x: blk.x + PW, y: blk.y + PW, w: blk.w - 2 * PW, h: blk.h - 2 * PW, ledges: [], bx: blk.x, by: blk.y, bw: blk.w, bh: blk.h }); return floors.length - 1; };
    const addStair = (st) => { stairs.push(st); stairRects.push({ x: st.x, y: st.y, w: st.w, h: st.h }); mark(st); }; // no lot within an alley of a stair or its foot
    // a skybridge (Edit 44): world.stairWidth wide, from inside one roof to inside the other across an alley or lane at Z2
    const bridged = new Set();
    const bridge = (i, j) => {
      const A = floors[i], Bq = floors[j], m = PW + BR + 2, key = Math.min(i, j) + ',' + Math.max(i, j);
      if (bridged.has(key)) return false;
      const [L, Rr] = A.bx <= Bq.bx ? [A, Bq] : [Bq, A], [T, Bt] = A.by <= Bq.by ? [A, Bq] : [Bq, A];
      const gx = Rr.bx - (L.bx + L.bw), gy = Bt.by - (T.by + T.bh), max = P['world.skybridgeMax'];
      const ox0 = Math.max(A.y, Bq.y), ox1 = Math.min(A.y + A.h, Bq.y + Bq.h), oy0 = Math.max(A.x, Bq.x), oy1 = Math.min(A.x + A.w, Bq.x + Bq.w);
      let rc = null;
      if (gx >= ALLEY - 1 && gx <= max && ox1 - ox0 >= SWD + 8) rc = { x: L.bx + L.bw - m, y: Math.round((ox0 + ox1 - SWD) / 16) * 8, w: gx + 2 * m, h: SWD, axis: 'x' };
      else if (gy >= ALLEY - 1 && gy <= max && oy1 - oy0 >= SWD + 8) rc = { x: Math.round((oy0 + oy1 - SWD) / 16) * 8, y: T.by + T.bh - m, w: SWD, h: gy + 2 * m, axis: 'y' };
      if (!rc) return false;
      bridged.add(key); floors.push(Object.assign({ kind: 'bridge', z: 2, ledges: [], ends: [i, j] }, rc));
      return true;
    };
    // frontage rows (Edit 43, city): along every straight run, buildings face the road at one setback (FRONT from the centre line),
    // world.pedestrianGap alleys between them. Lots from 64 to 160 wide, 64 to world.district.<id>.blockMax deep.
    if (city) {
      const thin = { jersey: 1, pillar: 1, barrier: 1 }, widths = [64, 80, 96, 112, 128, 160], depths = [64, 80, 96, 112, 128, 160].filter((v) => v <= bMax);
      const lotOK = (rc) => {
        if (rc.x < B.l || rc.y < B.t || rc.x + rc.w > B.r || rc.y + rc.h > B.b) return false;
        if (!(rc.x === B.l || rc.x - B.l >= ALLEY) || !(rc.x + rc.w === B.r || B.r - rc.x - rc.w >= ALLEY) || !(rc.y === B.t || rc.y - B.t >= ALLEY) || !(rc.y + rc.h === B.b || B.b - rc.y - rc.h >= ALLEY)) return false;
        for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) if (d(rc.x + rc.w * i / 4, rc.y + rc.h * j / 4) < FRONT - 1) return false;
        if (keep.some((k) => overlapGap(rc, k, 4)) || stairRects.some((q) => overlapGap(rc, q, ALLEY)) || deckBands.some((q) => overlapGap(rc, q, 8)) || cpZones.some((q) => overlapGap(rc, q, 8))) return false;
        if (focalPatches.some((q) => overlapGap(rc, q, 12)) || reserved.some((q) => overlapGap(rc, q, 12))) return false;
        if (statics.some((st) => !edgeKinds[st.kind] && overlapGap(rc, st, thin[st.kind] ? 2 * BR + 2 : ALLEY))) return false;
        if (spawns.some((sp) => rectDist(sp.x, sp.y, rc) < BR + 6) || cones.some((cn) => rectDist(cn[0], cn[1], rc) < 24)) return false;
        return !blocks.some((q) => overlapGap(rc, q, ALLEY - 1)) && crossOK(rc);
      };
      const dMaxAll = Math.max(...depths), snap = (v) => Math.round(v / 8) * 8, TSL = stairRun(P, 0, 2), L12 = stairRun(P, 1, 2);
      // a Z1→Z2 link: a platform beside a low highway, a short stair from the deck's shoulder up to its roof
      dk.decks.forEach((q, k) => {
        if (q.z !== 1) return;
        const cands = [];
        for (const side of [1, -1]) for (const w of [96, 112, 128]) for (const h of [80, 96, 112]) for (let x = B.l; x + w <= B.r; x += 16) cands.push({ side, w, h, x, key: r() + (side > 0 ? 0 : 1) });
        cands.sort((a, b) => a.key - b.key);
        for (const cd of cands) {
          const e0 = q.off - half, e1 = q.off + half, blk = { x: cd.x, y: cd.side > 0 ? e1 + L12 : e0 - L12 - cd.h, w: cd.w, h: cd.h };
          const sx = cd.x + snap((cd.w - SWD) / 2), st = { x: sx, y: cd.side > 0 ? e1 : e0 - L12, w: SWD, h: L12, axis: 'y', low: cd.side > 0 ? e1 : e0, high: cd.side > 0 ? e1 + L12 : e0 - L12, from: 1, to: 2, foot: k, head: -1 };
          const sp = [[st.x, st.y], [st.x + SWD, st.y], [st.x, st.y + L12], [st.x + SWD, st.y + L12]];
          if (!lotOK(blk) || edgeSides(blk).length || sp.some(([x, y]) => d(x, y) < OUTER + 8) || keep.some((g) => overlapGap(st, g, 4)) || statics.some((g) => overlapGap(st, g, 4)) || dk.landing.some((g) => overlapGap(st, g, 8))) continue;
          if (stairRects.some((g) => overlapGap(st, g, 16)) || q.gaps.some(([g0, g1]) => st.x < g1 + 32 && st.x + SWD > g0 - 32)) continue;
          if (!reachable(statics.concat(blocks, [blk, st], stairRects, cpZones))) continue;
          take(blk, platform); st.head = roofOf(blk); addStair(st); q.openings.push([st.x, st.x + SWD, cd.side]);
          break;
        }
      });
      // a frontage lot becomes a platform: its stair runs along the frontage from the alley up to the roof (Z0→Z2)
      // the stair climbs along the lot's road-facing edge; a single-storey annex fills the strip behind it
      const platformize = (lot, hz, side) => {
        const along = hz ? lot.w : lot.h;
        if (along < TSL + 64 || edgeSides(lot).length) return null; // Edit 48: a walkable roof stays on one screen
        for (const end of r() < 0.5 ? [0, 1] : [1, 0]) {
          const a0 = hz ? lot.x : lot.y, a1 = a0 + along, lo = hz ? B.l : B.t, hi = hz ? B.r : B.b;
          if ((end === 0 && a0 - lo < ALLEY) || (end === 1 && hi - a1 < ALLEY)) continue; // the foot needs an alley
          const cross0 = hz ? lot.y : lot.x, depth = hz ? lot.h : lot.w, c0 = side < 0 ? cross0 + depth - SWD : cross0, n0 = side < 0 ? cross0 : cross0 + SWD;
          const sA = end === 0 ? a0 : a1 - TSL, bA = end === 0 ? a0 + TSL : a0;
          const st = hz ? { x: sA, y: c0, w: TSL, h: SWD, axis: 'x' } : { x: c0, y: sA, w: SWD, h: TSL, axis: 'y' };
          Object.assign(st, { low: end === 0 ? a0 : a1, high: end === 0 ? a0 + TSL : a1 - TSL, from: 0, to: 2, foot: null, head: -1 });
          const fx = hz ? st.low + (end === 0 ? -1 : 1) * (BR + 4) : c0 + SWD / 2, fy = hz ? c0 + SWD / 2 : st.low + (end === 0 ? -1 : 1) * (BR + 4);
          if (statics.concat(blocks).some((g) => rectDist(fx, fy, g) < BR + 2)) continue;
          const blk = hz ? { x: bA, y: lot.y, w: along - TSL, h: lot.h } : { x: lot.x, y: bA, w: lot.w, h: along - TSL };
          const annex = hz ? { x: sA, y: n0, w: TSL, h: depth - SWD } : { x: n0, y: sA, w: depth - SWD, h: TSL };
          take(blk, platform); take(annex, { height: storey, storeys: 1, annex: true }); st.head = roofOf(blk); addStair(st);
          return { roof: st.head, end: hz ? blk.x + blk.w : blk.y + blk.h };
        }
        return null;
      };
      const runs = straightRuns(c, W, H).sort((p, q) => (q.b - q.a) - (p.b - p.a));
      for (const run of runs) for (const side of [-1, 1]) {
        const lo = run.hz ? B.l : B.t, hi = run.hz ? B.r : B.b, back = side < 0 ? run.c - (run.hz ? B.t : B.l) : (run.hz ? B.b : B.r) - run.c;
        const a0 = Math.max(run.a <= lo + ALLEY ? lo : run.a, lo), a1 = Math.min(run.b >= hi - ALLEY ? hi : run.b, hi);
        for (let front = FRONT, k = 0; k < 4 && front + 48 <= back; k++) { // rows behind rows, a service lane (world.pedestrianGap) between them
          const dRow = pick(r, depths);
          let any = false, chain = null; // chain: the last platform roof in this row, which a skybridge may join to the next lot
          for (let p = Math.ceil(a0 / 8) * 8; p + 48 <= a1;) {
            const w0 = pick(r, widths), want = !chain && r() < dp('platformShare', 0); // a platform lot is a roof plus its stair's run
            let got = null;
            for (const w of (want ? [TSL + 96, TSL + 80, TSL + 64] : []).concat([w0], widths.filter((v) => v < w0).reverse())) {
              let e = Math.min(p + w, a1); if (e - p < 48) break;
              if (a1 - e > 0 && a1 - e < ALLEY + 48) e = a1; // the last lot runs flush to the end
              for (let dpt of depths.filter((v) => v <= dRow).reverse()) {
                const rest = back - front - dpt; if (rest < 0) continue;
                if (rest > 0 && rest < ALLEY && dpt + rest <= dMaxAll + ALLEY) dpt += rest; // flush to the wall or screen edge behind
                const near = side < 0 ? run.c - front - dpt : run.c + front;
                const rc = run.hz ? { x: p, y: near, w: e - p, h: dpt } : { x: near, y: p, w: dpt, h: e - p };
                if (want && w >= TSL + 64 && edgeSides(rc).length) continue; // Edit 48: a platform lot stays on one screen
                if (lotOK(rc) && reachable(statics.concat(blocks, [rc], stairRects, cpZones))) { got = rc; break; }
              }
              if (got) break;
            }
            if (got && area + got.w * got.h > cap) got = null;
            if (got) {
              const gap = chain ? (run.hz ? got.x : got.y) - chain.end : Infinity, pf = want ? platformize(got, run.hz, side) : null;
              if (chain && gap <= P['world.skybridgeMax'] && !edgeSides(got).length && r() < P['world.skybridgeChance']) { take(got, platform); const k2 = roofOf(got); bridge(chain.roof, k2); chain = chain.n + 1 < P['world.platformChain'] ? { roof: k2, end: run.hz ? got.x + got.w : got.y + got.h, n: chain.n + 1 } : null; }
              else if (pf) chain = Object.assign(pf, { n: 1 });
              else { take(got); chain = null; }
              any = true; p = (run.hz ? got.x + got.w : got.y + got.h) + ALLEY;
            } else p += 16;
          }
          if ((!any && k > 0) || area >= dp('blockShare', P['world.blockShare']) * ground) break; // rows behind rows until the share is met
          front += dRow + ALLEY;
        }
      }
    }
    // back lots: greedy, largest legal footprint first on a GRID-unit lattice, never nearer the road than the frontage line
    for (let iter = 0; iter < 60 && area < dp('blockShare', P['world.blockShare']) * ground; iter++) {
      const sat = new Int32Array((GW + 1) * (GH + 1));
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) sat[(j + 1) * (GW + 1) + i + 1] = forb[j * GW + i] + sat[j * (GW + 1) + i + 1] + sat[(j + 1) * (GW + 1) + i] - sat[j * (GW + 1) + i];
      const bad = (x, y, w, h) => { const i0 = x / G, j0 = y / G, i1 = (x + w) / G, j1 = (y + h) / G; return sat[j1 * (GW + 1) + i1] - sat[j0 * (GW + 1) + i1] - sat[j1 * (GW + 1) + i0] + sat[j0 * (GW + 1) + i0]; };
      let best = null;
      for (let w = Math.min(160, bMax); w >= 48; w -= GRID) for (let h = Math.min(128, bMax); h >= 48; h -= GRID) {
        if (best && w * h + 2400 < best.score) continue;
        for (let y = B.t; y + h <= B.b; y += GRID) for (let x = B.l; x + w <= B.r; x += GRID) {
          if (!(x === B.l || x - B.l >= ALLEY) || !(x + w === B.r || B.r - (x + w) >= ALLEY) || !(y + h === B.b || B.b - (y + h) >= ALLEY) || !(y === B.t || y - B.t >= ALLEY)) continue;
          if (bad(x, y, w, h) || banned.has(x + ',' + y + ',' + w + ',' + h)) continue;
          if (city && [[x, y], [x + w, y], [x, y + h], [x + w, y + h], [x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2]].some(([px, py]) => d(px, py) < FRONT + ALLEY)) continue; // back lots stand behind the frontage line
          const align = blocks.reduce((n, b) => n + (b.y === y || b.y + b.h === y + h ? 1 : 0) + (b.x === x || b.x + b.w === x + w ? 1 : 0), 0) + (x === B.l || x + w === B.r ? 1 : 0) + (y + h === B.b || y === B.t ? 1 : 0);
          const score = w * h + align * 400 + r() * 50;
          if ((!best || score > best.score) && crossOK({ x, y, w, h })) best = { x, y, w, h, score }; // Edit 48: at a shared edge only where the neighbour has room
        }
      }
      if (!best || area + best.w * best.h > cap) break;
      if (!reachable(statics.concat(blocks, [best], stairRects, cpZones))) { banned.add(best.x + ',' + best.y + ',' + best.w + ',' + best.h); continue; }
      take(best);
    }
    // skybridges (Edit 44): also across the lane between platform roofs in neighbouring rows, at Z2
    const roofIdx = floors.map((f, i) => i).filter((i) => floors[i].kind === 'roof'), roofs = roofIdx.map((i) => floors[i]);
    for (const i of roofIdx) for (const j of roofIdx) if (i < j && floors.filter((f) => f.kind === 'bridge').length < P['world.skybridgeCount']) bridge(i, j);
    // roof ledges: the edge that faces a road drops to the forecourt; the others have parapets
    for (const f of roofs) for (const sd of SIDES) {
      const mx = sd === 'W' ? f.bx - 24 : sd === 'E' ? f.bx + f.bw + 24 : f.bx + f.bw / 2, my = sd === 'N' ? f.by - 24 : sd === 'S' ? f.by + f.bh + 24 : f.by + f.bh / 2;
      if (d(mx, my) >= FRONT + 16) continue;
      const a0 = horiz(sd) ? f.y : f.x, a1 = horiz(sd) ? f.y + f.h : f.x + f.w, out = BR + 6, solid = statics.concat(blocks, stairRects);
      const clear = [0.1, 0.3, 0.5, 0.7, 0.9].filter((u) => { const a = a0 + (a1 - a0) * u, px = sd === 'W' ? f.bx - out : sd === 'E' ? f.bx + f.bw + out : a, py = sd === 'N' ? f.by - out : sd === 'S' ? f.by + f.bh + out : a; return solid.every((g) => rectDist(px, py, g) > BR + 1); }).length;
      if (clear >= 3) f.ledges.push({ side: sd, a0, a1 }); // a ledge needs open ground to land on
    }
    const info = INFO(D.levelId);
    return { id: D.levelId, name: info.name, blurb: info.blurb, center: c, lanes: lanesOf(c, P), statics: P['proto.city'] ? statics.concat(blocks) : statics.filter((st) => st.kind !== 'jersey'),
      coneHomes: cones, spawns: spawns.length ? spawns : [{ x: 400, y: 120, f: 90 }], focalPatches, decks: dk.decks, ring: cell.ring || null,
      stairs, floors, checkpoints: per.checkpoints, reserved };
  }
  // The level for one screen of a district, built on first entry and kept.
  function cellLevel(D, c, P) {
    const cell = D.cells[c[1]][c[0]];
    if (cell.level) return cell.level;
    if (D.kind === 'city' && !D.stitched) { stitchCity(D, P); return cell.level; } // Edit 48: buildings across shared edges
    const r = prng(D.seed + (c[1] * 31 + c[0]) * 7477);
    return finishLevel(D, c, P, cell.start ? buildLevel(D.levelId, P) : generateScreen(D, cell, P, r), r);
  }
  function finishLevel(D, c, P, lv, r) {
    const cell = D.cells[c[1]][c[0]];
    lv.statics = lv.statics.map((s, i) => Object.assign({}, s, { id: 's' + i }));
    const solid = SIDES.filter((sd) => { const x = c[0] + SIDE[sd][0], y = c[1] + SIDE[sd][1]; return x < 0 || y < 0 || x >= D.cols || y >= D.rows; });
    Object.assign(lv, { key: D.levelId + '@' + c[0] + ',' + c[1], cell: c.slice(), gates: cell.gates, solid, canal: cell.canal, theme: cell.theme, order: cell.order });
    if (!cell.start) { const base = lv.focalPatches || []; lv.patches = base.concat(makePatches(lv, P, r, base.concat(lv.reserved || []), D.kind === 'city' ? dpar(P, D.levelId, 'puddleShare') : null)); delete lv.focalPatches; delete lv.reserved; }
    lv.decks = lv.decks || []; lv.focal = cell.focal || null; lv.stairs = lv.stairs || []; lv.floors = lv.floors || []; lv.checkpoints = lv.checkpoints || [];
    lv.deckLanes = deckLanesOf(lv.decks, P);
    cell.level = lv;
    return lv;
  }
  // Edit 48: a building never ends at a shared screen edge. A lot that touches one carries across it, at least
  // world.edgeOverlap into the neighbour, and the same building draws on both screens. Screens build one at a time:
  // a neighbour already built is checked as built (roomFor); one still to come is checked against its plan (planRoom).
  // The landmark screen builds first, so its neighbours know where the landmark stands.
  // and receives the piece before its own lots.
  function stitchCity(D, P) {
    const W = P['world.width'], H = P['world.height'], ALLEY = P['world.pedestrianGap'], BR = P['body.radius'], E = P['world.edgeOverlap'];
    const FRONT = P['world.laneWidth'] + P['proto.shoulderWidth'] + P['world.buildingSetback'], half = P['world.deckWidth'] / 2, cap = P['world.occludedFractionMax'] * W * H;
    const raw = D.cells.map((row) => row.map((q) => ({ r: prng(D.seed + (q.cell[1] * 31 + q.cell[0]) * 7477), lv: null, q, incoming: [] })));
    const onScreen = (b) => Math.max(0, Math.min(W, b.x + b.w) - Math.max(0, b.x)) * Math.max(0, Math.min(H, b.y + b.h) - Math.max(0, b.y));
    let art = 0;
    const order = raw.flat().sort((a, b) => (b.q.focal ? 1 : 0) - (a.q.focal ? 1 : 0)).map((e) => e.q.cell); // the landmark screen first, then reading order
    for (const [x, y] of order) {
      const me = raw[y][x], memo = new Map(), nbOf = (sd) => raw[y + SIDE[sd][1]][x + SIDE[sd][0]];
      const piece = (sd, rc, e) => (sd === 'E' ? { x: 0, y: rc.y, w: e, h: rc.h } : sd === 'W' ? { x: W - e, y: rc.y, w: e, h: rc.h } : sd === 'S' ? { x: rc.x, y: 0, w: rc.w, h: e } : { x: rc.x, y: H - e, w: rc.w, h: e });
      const ctx = {
        incoming: me.incoming,
        room: (sd, rc) => {
          const key = sd + rc.x + ',' + rc.y + ',' + rc.w + ',' + rc.h;
          if (!memo.has(key)) {
            const nb = nbOf(sd), built = nb.lv ? nb.lv.statics.filter((b) => b.kind === 'block').reduce((n, b) => n + onScreen(b), 0) : 0;
            memo.set(key, [64, 48, E].filter((v) => v >= E).find((e) => { const pc = piece(sd, rc, e);
              return nb.lv ? built + pc.w * pc.h <= cap && roomFor(nb, pc, OPP[sd], P, W, H, ALLEY, BR, FRONT, half, []) : !nb.incoming.some((b) => overlapGap(pc, b, ALLEY - 1)) && planRoom(D, nb.q, pc, P, W, H, FRONT, half); }) || 0);
          }
          return memo.get(key);
        },
        give: (sd, blk) => {
          blk.stitch = true; blk.art = ++art + D.seed % 997;
          const nb = nbOf(sd), copy = Object.assign({}, blk);
          if (sd === 'E') copy.x -= W; if (sd === 'W') copy.x += W; if (sd === 'S') copy.y -= H; if (sd === 'N') copy.y += H;
          (nb.lv ? nb.lv.statics : nb.incoming).push(copy);
        },
      };
      me.lv = generateScreen(D, me.q, P, me.r, ctx);
    }
    D.stitched = true;
    for (const row of raw) for (const { r, lv, q } of row) finishLevel(D, q.cell, P, lv, r);
  }
  // Room in a screen still to be built: its road setback, flyover bands, gates, perimeter and checkpoints are planned.
  function planRoom(D, q, pc, P, W, H, FRONT, half) {
    if (q.focal) return false; // the landmark is placed when the screen builds
    const per = perimeter(D, q, P, W, H, q.canal ? 48 : 0), B = per.bounds;
    if (pc.x < B.l || pc.y < B.t || pc.x + pc.w > B.r || pc.y + pc.h > B.b) return false;
    if (per.checkpoints.some((cp) => !cp.deck && overlapGap(pc, checkZone(cp, P, W, H), 8))) return false;
    if ((q.decks || []).some((dk) => overlapGap(pc, dk.hz ? { x: 0, y: dk.off - half, w: W, h: 2 * half } : { x: dk.off - half, y: 0, w: 2 * half, h: H }, 8))) return false;
    if (gateZones(q.gates || {}, W, H).some((k) => overlapGap(pc, k, 4))) return false;
    const d0 = roadDist(q.center), dr = q.ring ? roadDist(q.ring) : null, d = (x, y) => Math.min(d0(x, y), dr ? dr(x, y) : Infinity);
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) if (d(pc.x + pc.w * i / 4, pc.y + pc.h * j / 4) < FRONT - 1) return false;
    return true;
  }
  // Is there room in this screen for the part of a neighbour's building that crosses the shared edge?
  function roomFor(T, pc, side, P, W, H, ALLEY, BR, FRONT, half, skip) { // side: the edge of T the piece stands on; skip: the building it extends
    const lv = T.lv, thin = { jersey: 1, pillar: 1, barrier: 1 }, statics = lv.statics.filter((st) => !skip.includes(st));
    for (const st of statics) if (!(st.kind === 'wall' || st.kind === 'river') && overlapGap(pc, st, st.kind === 'block' ? ALLEY - 1 : thin[st.kind] ? 2 * BR + 2 : ALLEY)) return false;
    if ((lv.stairs || []).some((q) => overlapGap(pc, q, ALLEY)) || (lv.floors || []).some((f) => f.kind === 'bridge' && overlapGap(pc, f, 4))) return false;
    if ((lv.decks || []).some((dk) => overlapGap(pc, { x: 0, y: dk.off - half, w: W, h: 2 * half }, 8))) return false;
    if ((lv.checkpoints || []).some((cp) => !cp.deck && overlapGap(pc, checkZone(cp, P, W, H), 8))) return false;
    if ((lv.reserved || []).concat(lv.focalPatches || []).some((q) => overlapGap(pc, q, 12))) return false;
    if (lv.spawns.some((sp) => rectDist(sp.x, sp.y, pc) < BR + 6) || (lv.coneHomes || []).some((cn) => rectDist(cn[0], cn[1], pc) < 24)) return false;
    const d0 = roadDist(lv.center), dr = lv.ring ? roadDist(lv.ring) : null, d = (x, y) => Math.min(d0(x, y), dr ? dr(x, y) : Infinity);
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) if (d(pc.x + pc.w * i / 4, pc.y + pc.h * j / 4) < FRONT - 1) return false;
    const gates = (T.q.gates || {})[side] || [], l0 = horiz(side) ? pc.y : pc.x, l1 = l0 + (horiz(side) ? pc.h : pc.w);
    if (gates.some(([a, b]) => l0 < b + BR && l1 > a - BR)) return false;
    // no ground walled off: flood fill from the spawns, 8-unit grid
    const S = 8, gw = W / S, gh = H / S, solid = lv.statics.concat([pc], (lv.stairs || []).map((q) => ({ x: q.x, y: q.y, w: q.w, h: q.h })), (lv.checkpoints || []).filter((cp) => !cp.deck).map((cp) => checkZone(cp, P, W, H)));
    const free = new Uint8Array(gw * gh), seen = new Uint8Array(gw * gh), qq = [];
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const x = i * S + S / 2, y = j * S + S / 2; free[j * gw + i] = x > BR && x < W - BR && y > BR && y < H - BR && solid.every((st) => rectDist(x, y, st) > BR + 0.5) ? 1 : 0; }
    for (const sp of lv.spawns) { const k = Math.floor(sp.y / S) * gw + Math.floor(sp.x / S); if (free[k]) { seen[k] = 1; qq.push(k); } }
    while (qq.length) { const k = qq.pop(), i = k % gw, j = (k - i) / gw; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= gw || jj >= gh) continue; const kk = jj * gw + ii; if (free[kk] && !seen[kk]) { seen[kk] = 1; qq.push(kk); } } }
    for (let k = 0; k < free.length; k++) if (free[k] && !seen[k]) return false;
    return true;
  }
  const cellName = (c) => 'ABCDEFGH'[c[0]] + (c[1] + 1); // columns A–C, rows 1–3 from the river
  // Edge stretches that stop the dummy although this side is open: the far side is built up, or it is the district edge.
  // The renderer marks them, so a wall the player cannot see yet still reads (Edit 40.1).
  function edgeSpans(D, c, P) {
    const cell = D.cells[c[1]][c[0]];
    if (cell.edgeSpans) return cell.edgeSpans;
    const W = P['world.width'], H = P['world.height'], r = P['body.radius'], lv = cellLevel(D, c, P), out = {};
    for (const sd of SIDES) {
      const nx = c[0] + SIDE[sd][0], ny = c[1] + SIDE[sd][1], outside = nx < 0 || ny < 0 || nx >= D.cols || ny >= D.rows;
      const nb = outside ? null : cellLevel(D, [nx, ny], P), len = horiz(sd) ? H : W, spans = [];
      let a = null;
      for (let v = 0; v <= len; v += 4) {
        const here = sd === 'E' ? [W - r - 1, v] : sd === 'W' ? [r + 1, v] : sd === 'S' ? [v, H - r - 1] : [v, r + 1];
        const there = sd === 'E' ? [r + 1, v] : sd === 'W' ? [W - r - 1, v] : sd === 'S' ? [v, r + 1] : [v, H - r - 1];
        const open = (q, list) => list.every((st) => !circleRect(q[0], q[1], r, st));
        const stop = open(here, lv.statics) && (outside || !open(there, nb.statics));
        if (stop && a == null) a = v;
        if (!stop && a != null) { spans.push([a, v]); a = null; }
      }
      if (a != null) spans.push([a, len]);
      out[sd] = spans;
    }
    cell.edgeSpans = out;
    return out;
  }

  // ---------- city districts (Edit 41, 20 Oct): five districts in a fixed, rising order. Each is 3 × 3 generated screens with
  // a landmark on the centre screen, its own building form, flyovers, traffic and hazards. Layouts are baked in advance:
  // three per district in content/districts/districts.json; a run picks one (proto.layout). The generator is the design tool.
  const DISTRICT_LIST = ['riverside', 'market', 'interchange', 'cbd', 'campus'];
  const DISTRICTS = {
    riverside: { name: 'Riverside', blurb: 'Low-rise riverfront. A lantern monument marks the centre.', focal: 'monument', themes: ['plain', 'flyover', 'barrier'] },
    market: { name: 'Old Market', blurb: 'Dense low-rise streets around a fountain square. Wet, and busy with vans.', focal: 'fountain', themes: ['plain', 'barrier', 'plain'] },
    interchange: { name: 'Interchange', blurb: 'Two flyovers either side of a roundabout. Its island is crash matting.', focal: 'roundabout', themes: ['flyover', 'barrier', 'plain'] },
    cbd: { name: 'Central Business District', blurb: 'Towers and barriers. FARSIGHT Tower stands at the centre.', focal: 'tower', themes: ['barrier', 'plain'] },
    campus: { name: 'FARSIGHT Campus', blurb: 'The test centre the city was modelled on. Calibrated plates score more.', focal: 'plate', themes: ['plain', 'barrier', 'flyover'] },
  };
  const INFO = (id) => LEVELS[id] || DISTRICTS[id];
  const dpar = (P, id, f) => P['world.district.' + id + '.' + f];
  function chaikin(pts, n) {
    for (let k = 0; k < n; k++) {
      const out = [pts[0]];
      for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; out.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25], [x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]); }
      out.push(pts[pts.length - 1]); pts = out;
    }
    return pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  // Flyovers pass perpendicular to every road beneath them (Edit 43). Within the deck band and one road half-width
  // (lane plus shoulder) either side, the road's centre line runs straight across: within world.deckCrossAngle of square.
  // A curve (the roundabout ring) can never meet that, so it must miss the band.
  function deckCrossOK(center, dk, P, W, H) {
    const m = P['world.deckWidth'] / 2 + P['world.laneWidth'] + P['proto.shoulderWidth'], tol = Math.sin(P['world.deckCrossAngle'] * DEG), path = makePath(center);
    for (let s = 0; s <= path.length; s += 4) {
      const p = pathAt(path, s);
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) continue;
      if (Math.abs(dk.hz ? p.y - dk.off : p.x - dk.off) <= m && Math.abs(dk.hz ? p.tx : p.ty) > tol) return false;
    }
    return true;
  }
  // ---------- roads (Edit 43): a Manhattan skeleton between the two road ends, its corners rounded by the screen's turn style.
  // Tight: world.turnRadiusTight. Circular: world.turnRadiusWide. Stepped: a dog-leg, two tight corners per turn with a jog between.
  const TURN_STYLES = ['tight', 'circular', 'stepped']; // P4: 'diagonal' at world.diagonalShare (45° roads)
  // P4 (Edit 49): a fillet for any bend angle. Tangent length R·tan(θ/2). minR: a bend that cannot keep it fails (null).
  function filletAny(pts, rad, minR) {
    const out = [pts[0]];
    for (let i = 1; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1], l1 = hyp(x1 - x0, y1 - y0), l2 = hyp(x2 - x1, y2 - y1);
      if (l1 < 1e-6 || l2 < 1e-6) continue;
      const ux = (x1 - x0) / l1, uy = (y1 - y0) / l1, vx = (x2 - x1) / l2, vy = (y2 - y1) / l2, cr = ux * vy - uy * vx, th = Math.atan2(Math.abs(cr), ux * vx + uy * vy);
      if (th < 1e-6) { out.push([x1, y1]); continue; }
      const tn = Math.tan(th / 2), R = Math.min(Array.isArray(rad) ? rad[i] : rad, Math.min(i === 1 ? l1 : l1 / 2, i + 2 === pts.length ? l2 : l2 / 2) / tn); // Edit 56: a radius per corner
      if (minR && R < minR - 1e-6) return null;
      const T = R * tn, sg = Math.sign(cr), ax = x1 - ux * T, ay = y1 - uy * T, cx = ax - uy * sg * R, cy = ay + ux * sg * R;
      const t0 = Math.atan2(ay - cy, ax - cx), t1 = Math.atan2(y1 + vy * T - cy, x1 + vx * T - cx), sw = wrap(t1 - t0), n = Math.max(3, Math.round(R * th / 12));
      for (let k = 0; k <= n; k++) { const t = t0 + sw * k / n; out.push([cx + Math.cos(t) * R, cy + Math.sin(t) * R]); }
    }
    out.push(pts[pts.length - 1]);
    return out.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  function fillet(pts, rad) {
    const out = [pts[0]];
    for (let i = 1; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1], l1 = hyp(x1 - x0, y1 - y0), l2 = hyp(x2 - x1, y2 - y1);
      if (l1 < 1e-6 || l2 < 1e-6) continue;
      const ux = (x1 - x0) / l1, uy = (y1 - y0) / l1, vx = (x2 - x1) / l2, vy = (y2 - y1) / l2;
      const R = Math.min(rad, i === 1 ? l1 : l1 / 2, i + 2 === pts.length ? l2 : l2 / 2);
      if (R < 1 || Math.abs(ux * vy - uy * vx) < 1e-6) { out.push([x1, y1]); continue; }
      const ax = x1 - ux * R, ay = y1 - uy * R, cx = ax + vx * R, cy = ay + vy * R, t0 = Math.atan2(-vy, -vx), sw = wrap(Math.atan2(uy, ux) - t0), n = Math.max(4, Math.round(R / 8));
      for (let k = 0; k <= n; k++) { const t = t0 + sw * k / n; out.push([cx + Math.cos(t) * R, cy + Math.sin(t) * R]); }
    }
    out.push(pts[pts.length - 1]);
    return out.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  // Candidate skeletons for a screen's road, best first for the style. Every corner is a right angle.
  function skeletons(a, b, style, W, H, P) {
    const lead = P['world.spawnLeadIn'], Rt = P['world.turnRadiusTight'], A = edgePoint(a.side, a.off, W, H, lead), B = edgePoint(b.side, b.off, W, H, lead), out = [];
    const snap = (v) => Math.round(v / 8) * 8, hzA = horiz(a.side), hzB = horiz(b.side);
    if (hzA === hzB) { // opposite edges: straight, a Z, or a stepped Z
      if (a.off === b.off) return [[A, B]];
      const span = hzA ? W : H, dir = Math.sign((hzA ? B[0] - A[0] : B[1] - A[1])), lat = Math.abs(a.off - b.off);
      const at = (al, la) => (hzA ? [al, la] : [la, al]);
      const mids = []; for (let f = 0.25; f <= 0.751; f += 0.0625) mids.push(snap(span * f));
      if (style === 'diagonal') { // P4: one 45° segment across the offset, centred on the jog point
        for (const m of mids) { const a0 = m - dir * lat / 2, a1 = m + dir * lat / 2; if (Math.min(a0, a1) >= 48 && Math.max(a0, a1) <= span - 48) out.push([A, at(a0, a.off), at(a1, b.off), B]); }
        return out;
      }
      for (const m of mids) {
        if (style === 'stepped' && lat >= 4 * Rt) { const jog = Math.max(2 * Rt, snap(span * 0.2)), lm = snap((a.off + b.off) / 2); out.push([A, at(m - dir * jog / 2, a.off), at(m - dir * jog / 2, lm), at(m + dir * jog / 2, lm), at(m + dir * jog / 2, b.off), B]); }
        out.push([A, at(m, a.off), at(m, b.off), B]);
      }
      return out;
    }
    // adjacent edges: an L, or a stepped L (two steps)
    const h = hzA ? a : b, v = hzA ? b : a, Hp = edgePoint(h.side, h.off, W, H, lead), Vp = edgePoint(v.side, v.off, W, H, lead);
    const hx = h.side === 'W' ? 0 : W, vy = v.side === 'N' ? 0 : H, res = [];
    if (style === 'diagonal') { // P4: the corner cut by a 45° segment
      const sx = Math.sign(v.off - hx), sy = Math.sign(vy - h.off);
      for (const c of [192, 160, 128, 96]) if (Math.abs(v.off - hx) - c >= 48 && Math.abs(vy - h.off) - c >= 48) res.push([Hp, [v.off - sx * c, h.off], [v.off, h.off + sy * c], Vp]);
      for (const k of res) out.push(h === a ? k : k.slice().reverse());
      return out;
    }
    if (style === 'stepped') for (const f of [0.35, 0.5, 0.65]) for (const g of [0.35, 0.5, 0.65]) {
      const x1 = snap(hx + (v.off - hx) * f), y1 = snap(h.off + (vy - h.off) * g);
      if (Math.abs(x1 - hx) >= 2 * Rt && Math.abs(v.off - x1) >= 2 * Rt && Math.abs(y1 - h.off) >= 2 * Rt && Math.abs(vy - y1) >= 2 * Rt) res.push([Hp, [x1, h.off], [x1, y1], [v.off, y1], Vp]);
    }
    res.push([Hp, [v.off, h.off], Vp]);
    for (const k of res) out.push(h === a ? k : k.slice().reverse());
    return out;
  }
  // Buildable ground (Edit 43): the screen inside its walls and river, outside every flyover band and outside the road's
  // frontage setback (lane + shoulder + world.buildingSetback from the centre line). Block share is measured against it.
  function buildableArea(center, ring, decks, statics, P) {
    const W = P['world.width'], H = P['world.height'], half = P['world.deckWidth'] / 2, FRONT = P['world.laneWidth'] + P['proto.shoulderWidth'] + P['world.buildingSetback'];
    const d0 = roadDist(center), dr = ring ? roadDist(ring) : null, edge = statics.filter((t) => t.kind === 'wall' || t.kind === 'river');
    let n = 0;
    for (let y = 4; y < H; y += 8) for (let x = 4; x < W; x += 8) {
      if ((decks || []).some((dk) => Math.abs((dk.hz ? y : x) - dk.off) <= half)) continue;
      if (Math.min(d0(x, y), dr ? dr(x, y) : Infinity) < FRONT) continue;
      if (edge.some((t) => x >= t.x && x < t.x + t.w && y >= t.y && y < t.y + t.h)) continue;
      n++;
    }
    return n * 64;
  }
  // The screen's road: the first skeleton, in random order within its style, whose rounded path crosses every deck square.
  function routeCenter(a, b, style, decks, W, H, P, r) {
    // P4 (Edit 49): no bend below world.turnRadiusTight (inner lane ≥ 36). A Z that cannot keep it becomes a 45° diagonal.
    const Rt = P['world.turnRadiusTight'], Rw = P['world.turnRadiusWide'], Rs = style === 'circular' ? [Rw, Rw / 2, Rt] : style === 'diagonal' ? [Rw, Rw / 2, Rt] : [Rt];
    const sk = skeletons(a, b, style, W, H, P);
    const first = sk.filter((k) => k.length > 4 || style !== 'stepped'), rest = sk.filter((k) => !first.includes(k));
    const groups = [first, rest];
    if (style !== 'diagonal' && horiz(a.side) === horiz(b.side) && a.off !== b.off) groups.push(skeletons(a, b, 'diagonal', W, H, P));
    for (const group of groups) {
      const order = group.map((k) => [r(), k]).sort((p, q) => p[0] - q[0]).map((q) => q[1]);
      for (const R of (group === groups[2] ? [Rw, Rw / 2, Rt] : Rs)) for (const k of order) { const c = filletAny(k, R, Rt); if (c && decks.every((dk) => deckCrossOK(c, dk, P, W, H))) return c; }
    }
    return null;
  }
  // Road crossing offsets on a city screen's edge: five per side, scaled with the screen.
  const acrossCity = (sd, W, H) => (horiz(sd) ? [0.25, 0.3667, 0.5, 0.6333, 0.75].map((f) => Math.round(H * f / 4) * 4) : [0.25, 0.35, 0.5, 0.65, 0.75].map((f) => Math.round(W * f / 4) * 4));
  // Roundabout (Interchange): the road enters radially, loops round a central island and leaves radially. Smoothed corners.
  // P4 (Edit 49): radial road → fillet (world.roundaboutEntryRadius) → ring → fillet → radial road. Every bend is an arc.
  function roundaboutCenter(a, b, W, H, lead, Rc, r, Rf) {
    const ang = { W: Math.PI, E: 0, N: -Math.PI / 2, S: Math.PI / 2 }, cx = W / 2, cy = H / 2;
    const ta = a.ang != null ? a.ang : ang[a.side], tb = b.ang != null ? b.ang : ang[b.side]; // P4 (Edit 49.3): an arm may come in at any angle
    let sweep = wrap(tb - ta);
    if (Math.abs(Math.abs(sweep) - Math.PI) < 1e-6) sweep = r() < 0.5 ? Math.PI : -Math.PI; // opposite: round either side
    else if (r() < 0.6) sweep = sweep > 0 ? sweep - 2 * Math.PI : sweep + 2 * Math.PI; // adjacent: the long way, like a roundabout
    const sg = Math.sign(sweep), phi = Math.asin(Rf / (Rc + Rf)), D = (Rc + Rf) * Math.cos(phi), seg = (R, a0, a1) => arcPts(0, 0, R, a0, a1, Math.max(3, Math.round(R * Math.abs(wrap(a1 - a0)) / 10)));
    const fil = (t, s1) => { // the fillet beside the radial road at angle t; s1 = +1 entering, -1 leaving
      const fa = t + sg * s1 * phi, fx = cx + (Rc + Rf) * Math.cos(fa), fy = cy + (Rc + Rf) * Math.sin(fa);
      const foot = Math.atan2(cy + D * Math.sin(t) - fy, cx + D * Math.cos(t) - fx), tang = fa + Math.PI;
      const [p0, p1] = s1 > 0 ? [foot, tang] : [tang, foot];
      return seg(Rf, p0, p0 + wrap(p1 - p0)).map(([x, y]) => [fx + x, fy + y]);
    };
    const pts = [a.pt || edgePoint(a.side, a.off, W, H, lead)].concat(fil(ta, 1));
    const r0 = ta + sg * phi, r1 = tb - sg * phi, sw = sweep - 2 * sg * phi;
    pts.push(...arcPts(cx, cy, Rc, r0, r0 + sw, Math.max(4, Math.round(Rc * Math.abs(sw) / 12))).slice(1, -1));
    pts.push(...fil(tb, -1), b.pt || edgePoint(b.side, b.off, W, H, lead));
    void r1;
    return pts.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  function planCity(id, P, seedIn) {
    const C = Math.round(P['world.districtColumns']), R = Math.round(P['world.districtRows']), W = P['world.width'], H = P['world.height'];
    const seed = seedIn != null ? seedIn : 7001 + DISTRICT_LIST.indexOf(id) * 7919 + Math.round(P['proto.district.seed']) * 104729, r = prng(seed);
    const info = DISTRICTS[id], start = [Math.floor(C / 2), 0], centre = [Math.floor(C / 2), Math.floor(R / 2)];
    const inside = (x, y) => x >= 0 && y >= 0 && x < C && y < R, xy = (k) => [k % C, Math.floor(k / C)];
    const outsides = (c) => SIDES.filter((sd) => !inside(c[0] + SIDE[sd][0], c[1] + SIDE[sd][1]));
    const isC = (c) => c[0] === centre[0] && c[1] === centre[1];
    const paths = hamiltonPaths(C, R).filter((p) => [p[0], p[p.length - 1]].every((k) => outsides(xy(k)).length > 0));
    const gw = P['world.gateWidth'], gap = P['world.pedestrianGap'], OUTER = P['world.laneWidth'] + P['proto.shoulderWidth'];
    const half = P['world.deckWidth'] / 2, Rt = P['world.turnRadiusTight'], nd = Math.round(dpar(P, id, 'decks'));
    for (let attempt = 0; attempt < 400; attempt++) {
      const path = pick(r, paths).map(xy), ends = path.map(() => []);
      // flyovers first (Edit 43): horizontal, one overground level, on rows clear of the roundabout; each road crosses them square
      const rows = [0, 1, 2].filter((y) => y < R && !(info.focal === 'roundabout' && y === centre[1])), decks = [];
      for (let k = 0; k < nd && rows.length; k++) {
        const line = rows.splice(Math.floor(r() * rows.length), 1)[0], cands = [];
        for (let off = 120; off <= H - 120; off += 20) {
          if (off - half - liftOf(P, P['world.deckHeight']) < P['world.deckTopClear'] || off + half > H - P['world.deckBottomClear']) continue; // Edit 48: the drawn deck clears the top edge by four tiles; a building row fits below
          if (acrossCity('W', W, H).some((o) => Math.abs(o - off) >= half + OUTER + Rt / 2)) cands.push(off); // room for a road along the row
        }
        if (cands.length) decks.push({ hz: true, line, off: pick(r, cands), height: P['world.deckHeight'], z: 1 });
      }
      if (decks.length < nd) continue;
      for (let k = 0, nh = Math.round(dpar(P, id, 'highDecks') || 0); k < nh && k < decks.length; k++) { // Edit 44: high highways at Z2
        const lows = decks.filter((dk) => dk.z === 1 && dk.off - half - liftOf(P, P['world.highHeight']) >= P['world.deckTopClear']), dk = lows[Math.floor(r() * lows.length)]; // Edit 48: Z2 lifts further
        if (dk) Object.assign(dk, { z: 2, height: P['world.highHeight'] });
      }
      if (decks.filter((dk) => dk.z === 2).length < Math.round(dpar(P, id, 'highDecks') || 0)) continue;
      const rowDecks = (y) => decks.filter((dk) => dk.line === y);
      const offsFor = (c, sd) => acrossCity(sd, W, H).filter((o) => !horiz(sd) || rowDecks(c[1]).every((dk) => Math.abs(o - dk.off) >= half + OUTER + Rt / 2));
      let bad = false;
      for (let i = 0; i + 1 < path.length; i++) {
        const a = path[i], b = path[i + 1], sa = sideOf(a, b), sb = OPP[sa], os = offsFor(a, sa);
        const off = isC(a) || isC(b) ? (horiz(sa) ? H / 2 : W / 2) : os.length ? pick(r, os) : null; // roads meet the landmark square on
        if (off == null || (horiz(sa) && rowDecks(a[1]).some((dk) => Math.abs(off - dk.off) < half + OUTER + Rt / 2))) { bad = true; break; }
        ends[i].push({ side: sa, off }); ends[i + 1].push({ side: sb, off });
      }
      if (bad) continue;
      for (const i of [0, path.length - 1]) {
        const sd = pick(r, outsides(path[i])), os = offsFor(path[i], sd);
        if (!os.length) { bad = true; break; }
        const e = { side: sd, off: pick(r, os), outer: true };
        if (i === 0) ends[i].unshift(e); else ends[i].push(e);
      }
      if (bad) continue;
      const cells = Array.from({ length: R }, () => Array.from({ length: C }, () => null));
      path.forEach((c, i) => {
        const focal = isC(c) ? info.focal : null, turns = r() < P['world.diagonalShare'] ? 'diagonal' : pick(r, TURN_STYLES), dks = rowDecks(c[1]);
        const center = focal === 'roundabout' ? roundaboutCenter(ends[i][0], ends[i][1], W, H, P['world.spawnLeadIn'], P['world.roundaboutRadius'], r, P['world.roundaboutEntryRadius'])
          : routeCenter(ends[i][0], ends[i][1], turns, dks, W, H, P, r);
        if (!center) { bad = true; return; }
        cells[c[1]][c[0]] = { cell: c, order: i, ends: ends[i], start: false, canal: c[1] === 0, gates: { N: [], E: [], S: [], W: [] }, focal,
          theme: focal ? 'focal' : pick(r, info.themes), level: null, cones: null, turns: focal === 'roundabout' ? 'roundabout' : turns, center,
          // the whole ring is road; traffic uses the part on its route (Edit 41.1)
          ring: focal === 'roundabout' ? arcPts(W / 2, H / 2, P['world.roundaboutRadius'], 0, 2 * Math.PI, 48).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]) : null,
          decks: [] };
      });
      if (bad) continue;
      if (cells.flat().some((q) => q.ring && rowDecks(q.cell[1]).some((dk) => !deckCrossOK(q.ring, dk, P, W, H)))) continue;
      // every flyover crosses at least one road on its row: that is where its parapet breaks (a drop point)
      const crosses = (pts, dk) => pts.some((p, i) => i > 0 && p[0] >= 0 && p[0] <= W && Math.sign(pts[i - 1][1] - dk.off) !== Math.sign(p[1] - dk.off));
      if (decks.some((dk) => !cells[dk.line].some((q) => crosses(q.center, dk)))) continue;
      for (const q of cells.flat()) q.decks = decks.filter((dk) => (dk.hz ? q.cell[1] : q.cell[0]) === dk.line).map((dk) => ({ hz: dk.hz, off: dk.off, height: dk.height, z: dk.z }));
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) for (const sd of ['E', 'S']) {
        const nx = x + SIDE[sd][0], ny = y + SIDE[sd][1];
        if (!inside(nx, ny)) continue;
        const A = cells[y][x], B = cells[ny][nx], len = horiz(sd) ? H : W, road = A.ends.find((e) => e.side === sd), spans = [];
        if (road) spans.push([road.off - OUTER, road.off + OUTER]);
        const cand = [];
        for (let a = 48; a + gw <= len - 48; a += 8) if (spans.every(([s0, s1]) => a + gw + gap <= s0 || a >= s1 + gap) && !(horiz(sd) && (A.canal || B.canal) && a < 56)) cand.push(a);
        if (cand.length && (!road || r() < 0.5)) { const a = pick(r, cand); spans.push([a, a + gw]); }
        A.gates[sd] = spans.map((s) => s.slice()); B.gates[OPP[sd]] = spans.map((s) => s.slice());
      }
      return { kind: 'city', levelId: id, cols: C, rows: R, seed, start, cur: start.slice(), path, cells, decks, visited: new Set([start[1] * C + start[0]]), lastFlip: null };
    }
    return null;
  }
  // The centre screen's landmark: placed where it stands farthest from the road, with a plaza around it.
  function placeLandmark(cell, P, d, keep, B, W, H, r) {
    const T = P['world.tileSize'], OUTER = P['world.laneWidth'] + P['proto.shoulderWidth'], f = cell.focal;
    const size = { monument: [40, 40, 220, 160], fountain: [72, 72, 20, 192], tower: [112, 96, 420, 192] }[f];
    if (!size) return { statics: [], patches: [] };
    const [w, h, height, pz] = size;
    const DW = P['world.deckWidth'], deckBands = (cell.decks || []).map((dk) => dk.hz ? { x: 0, y: dk.off - DW / 2, w: W, h: DW } : { x: dk.off - DW / 2, y: 0, w: DW, h: H });
    let best = null;
    for (let y = B.t + pz / 2 + 8; y <= B.b - pz / 2 - 8; y += 8) for (let x = B.l + pz / 2 + 8; x <= B.r - pz / 2 - 8; x += 8) {
      const plaza = { x: x - pz / 2, y: y - pz / 2, w: pz, h: pz };
      const corners = [[plaza.x, plaza.y], [plaza.x + pz, plaza.y], [plaza.x, plaza.y + pz], [plaza.x + pz, plaza.y + pz], [x, y]];
      const m = Math.min(...corners.map(([px, py]) => d(px, py)));
      if (m < OUTER + 8 || keep.some((k) => overlapGap(plaza, k, 4)) || deckBands.some((k) => overlapGap(plaza, k, 4))) continue;
      const sc = m - hyp(x - W / 2, y - H / 2) * 0.25 + r() * 4; // far from the road, near the middle
      if (!best || sc > best.sc) best = { x, y, sc };
    }
    if (!best) return { statics: [], patches: [] };
    const sx = Math.round((best.x - w / 2) / 8) * 8, sy = Math.round((best.y - h / 2) / 8) * 8;
    const px = Math.round((best.x - pz / 2) / T) * T, py = Math.round((best.y - pz / 2) / T) * T;
    return { statics: [{ x: sx, y: sy, w, h, kind: f === 'tower' ? 'block' : f, height, tower: f === 'tower' || undefined, landmark: f }],
      patches: [{ x: px, y: py, w: pz, h: pz, kind: 'plaza' }] };
  }
  // Calibrated impact plates (Campus): 2 × 2-tile patches on the road. A hit taken on one scores damage.plateMultiplier.
  function placePlates(c, P, top, W, H, n, r) {
    const T = P['world.tileSize'], d = roadDist(c), lw = P['world.laneWidth'], path = makePath(c), out = [];
    const onRoad = (x, y) => d(x + T / 2, y + T / 2) < lw - 6;
    for (let s = 60 + r() * 120; s < path.length && out.length < n; s += 140 + r() * 80) {
      const p = pathAt(path, s), x = Math.round((p.x - T) / T) * T, y = Math.round((p.y - T) / T) * T;
      if (x < 0 || y < top || x + 2 * T > W || y + 2 * T > H) continue;
      if (![[x, y], [x + T, y], [x, y + T], [x + T, y + T]].every(([qx, qy]) => onRoad(qx, qy))) continue;
      if (out.some((q) => overlapGap(q, { x, y, w: 2 * T, h: 2 * T }, 2 * T))) continue;
      out.push({ x, y, w: 2 * T, h: 2 * T, kind: 'plate' });
    }
    return out;
  }
  // Deck columns (Edit 43): a pair under the deck's two edges every world.deckPillarSpacing, world.deckColumn square, never on the
  // road or its pavement. The south row shows below the raised deck; the north row stands hidden beneath it.
  function deckPillars(cell, P, d, keep, W, H) {
    const out = [], OUTER = P['world.laneWidth'] + P['proto.shoulderWidth'], sp = P['world.deckPillarSpacing'], C = P['world.deckColumn'], half = P['world.deckWidth'] / 2;
    (cell.decks || []).forEach((dk, k) => { for (let p = sp / 2; p < (dk.hz ? W : H); p += sp) for (const edge of [-1, 1]) {
      const e = edge < 0 ? dk.off - half + 4 : dk.off + half - 4 - C;
      const rc = dk.hz ? { x: p - C / 2, y: e, w: C, h: C, kind: 'pillar', deck: true, deckIdx: k, edge } : { x: e, y: p - C / 2, w: C, h: C, kind: 'pillar', deck: true, deckIdx: k, edge };
      const pts = [[rc.x, rc.y], [rc.x + C, rc.y], [rc.x, rc.y + C], [rc.x + C, rc.y + C], [rc.x + C / 2, rc.y + C / 2]];
      if (pts.some(([x, y]) => d(x, y) < OUTER + 4) || keep.some((k) => overlapGap(rc, k, 4)) || out.some((q) => overlapGap(rc, q, 16))) continue;
      if (rc.x < 4 || rc.y < 4 || rc.x + C > W - 4 || rc.y + C > H - 4) continue;
      out.push(rc);
    } });
    return out;
  }

  // ---------- Edit 42 (P3.1): bounded districts and three levels
  // Levels: 0 underground, 1 ground (default), 2 overground. Statics are ground-level. The overground is the flyover decks;
  // Edit 44 replaces the underground: Z0 ground, Z1 low highway, Z2 high highway, platform roofs and skybridges.
  const LEVELS3 = { GROUND: 0, LOW: 1, HIGH: 2 }; // Edit 44: Z levels
  // The district's outer edges: the river on the top row, a wall elsewhere. A road leaving the district passes a checkpoint:
  // a booth on the pavement and a boom across both lanes. The dummy cannot cross either.
  function perimeter(D, cell, P, W, H, top) {
    const out = { statics: [], checkpoints: [], bounds: { l: 0, t: top, r: W, b: H } };
    if (D.kind !== 'city') return out;
    const WT = P['world.wallThickness'], lw = P['world.laneWidth'], OUTER = lw + P['proto.shoulderWidth'], half = P['world.deckWidth'] / 2, bd = 32;
    const outside = (sd) => { const nx = cell.cell[0] + SIDE[sd][0], ny = cell.cell[1] + SIDE[sd][1]; return nx < 0 || ny < 0 || nx >= D.cols || ny >= D.rows; };
    for (const sd of SIDES) {
      if (!outside(sd)) continue;
      const road = cell.ends.find((e) => e.outer && e.side === sd), len = horiz(sd) ? H : W, river = sd === 'N' && cell.canal;
      let segs = road ? [[0, road.off - OUTER], [road.off + OUTER, len]] : [[0, len]];
      for (const dk of cell.decks || []) if (dk.hz === horiz(sd)) { // the wall under a flyover is its own module, so the deck draws over it
        const cut = [dk.off - half, dk.off + half];
        segs = segs.flatMap(([a, b]) => [[a, Math.min(b, cut[0])], [Math.max(a, cut[0]), Math.min(b, cut[1])], [Math.max(a, cut[1]), b]].filter(([p, q]) => q - p >= 1));
      }
      for (const [a, b] of segs) {
        if (b - a < 1) continue;
        if (river) out.statics.push({ x: a, y: 0, w: b - a, h: 46, kind: 'river' });
        else out.statics.push(Object.assign(sd === 'W' ? { x: 0, y: a, w: WT, h: b - a } : sd === 'E' ? { x: W - WT, y: a, w: WT, h: b - a }
          : sd === 'N' ? { x: a, y: 0, w: b - a, h: WT } : { x: a, y: H - WT, w: b - a, h: WT }, { kind: 'wall', height: P['proto.art.wallHeight'] }));
      }
      if (!river) { if (sd === 'W') out.bounds.l = WT; if (sd === 'E') out.bounds.r = W - WT; if (sd === 'N') out.bounds.t = Math.max(out.bounds.t, WT); if (sd === 'S') out.bounds.b = H - WT; }
      if (road) {
        const depth = river ? 48 : 8, pv = road.off + lw;
        const bx = sd === 'W' ? { x: depth, y: pv, w: bd, h: OUTER - lw } : sd === 'E' ? { x: W - depth - bd, y: pv, w: bd, h: OUTER - lw }
          : sd === 'N' ? { x: pv, y: depth, w: OUTER - lw, h: bd } : { x: pv, y: H - depth - bd, w: OUTER - lw, h: bd };
        out.statics.push(Object.assign(bx, { kind: 'booth', height: P['proto.art.wallHeight'] }));
        out.checkpoints.push({ side: sd, off: road.off, line: depth + bd / 2 });
      }
      // a flyover leaving the district passes its own checkpoint: a boom across the deck at the same line
      for (const dk of cell.decks || []) if (dk.hz === horiz(sd)) out.checkpoints.push({ side: sd, off: dk.off, line: 8 + bd / 2, deck: true, z: dk.z || 1 });
    }
    return out;
  }
  // Edit 44: level heights. Z0 ground, Z1 low highway (world.deckHeight), Z2 high highway and platform roofs (world.highHeight).
  const zHeight = (P, z) => (z === 2 ? P['world.highHeight'] : z === 1 ? P['world.deckHeight'] : 0);
  // A stair's run grows with its rise: world.stairLength per world.deckHeight, in whole 16-unit steps (Z0–Z1 64, Z0–Z2 112, Z1–Z2 48).
  const stairRun = (P, z0, z1) => Math.max(32, Math.round(P['world.stairLength'] * (zHeight(P, z1) - zHeight(P, z0)) / P['world.deckHeight'] / 16) * 16);
  // Between a checkpoint's boom and the district edge, across the road and both pavements: closed to the dummy.
  function checkZone(cp, P, W, H) {
    const o = cp.deck ? P['world.deckWidth'] / 2 : P['world.laneWidth'] + P['proto.shoulderWidth'];
    return cp.side === 'W' ? { x: 0, y: cp.off - o, w: cp.line, h: 2 * o } : cp.side === 'E' ? { x: W - cp.line, y: cp.off - o, w: cp.line, h: 2 * o }
      : cp.side === 'N' ? { x: cp.off - o, y: 0, w: 2 * o, h: cp.line } : { x: cp.off - o, y: H - cp.line, w: 2 * o, h: cp.line };
  }
  // A flyover on this screen: piers, parapet modules broken over each road it crosses (drop points with a clear landing),
  // and one stair module up from open ground beside it.
  function buildDecks(cell, P, d, roads, keep, blockers, B, W, H, r) {
    const out = { statics: [], decks: [], stairs: [], landing: [] }, T = P['world.tileSize'], half = P['world.deckWidth'] / 2;
    const OUTER = P['world.laneWidth'] + P['proto.shoulderWidth'], SWD = P['world.stairWidth'];
    out.statics.push(...deckPillars(cell, P, d, keep.concat(blockers), W, H));
    const inB = (rc) => rc.x >= B.l && rc.y >= B.t && rc.x + rc.w <= B.r && rc.y + rc.h <= B.b;
    const freeOf = (rc, m) => blockers.concat(out.statics).every((st) => !overlapGap(rc, st, m));
    (cell.decks || []).forEach((dk, k) => {
      const len = dk.hz ? W : H, gaps = [], xs = [], z = dk.z || 1, SL = stairRun(P, 0, z); // Edit 44: a Z2 deck's stair is longer
      for (const poly of roads) {
        const pth = makePath(poly); let prev = null;
        for (let s = 0; s <= pth.length; s += 2) {
          const p = pathAt(pth, s), v = dk.hz ? p.y - dk.off : p.x - dk.off, a = dk.hz ? p.x : p.y;
          if (prev && Math.sign(prev.v) !== Math.sign(v) && a >= 0 && a <= len) xs.push((prev.a + a) / 2);
          prev = { v, a };
        }
      }
      const landingOf = (a0, side) => dk.hz ? { x: a0, y: side > 0 ? dk.off + half : dk.off - half - 48, w: T, h: 48 } : { x: side > 0 ? dk.off + half : dk.off - half - 48, y: a0, w: 48, h: T };
      for (const a of xs) {
        const a0 = Math.floor(a / T) * T;
        for (const side of [-1, 1]) { const L = landingOf(a0, side); if (inB(L) && freeOf(L, 2) && !gaps.some((g) => g[0] === a0 && g[2] === side)) { gaps.push([a0, a0 + T, side]); out.landing.push(L); } }
      }
      const cands = [];
      for (let a0 = T; a0 + SWD <= len - T; a0 += T) for (const side of [-1, 1]) {
        const rc = dk.hz ? { x: a0, y: side > 0 ? dk.off + half : dk.off - half - SL, w: SWD, h: SL } : { x: side > 0 ? dk.off + half : dk.off - half - SL, y: a0, w: SL, h: SWD };
        const pts = [[rc.x, rc.y], [rc.x + rc.w, rc.y], [rc.x, rc.y + rc.h], [rc.x + rc.w, rc.y + rc.h], [rc.x + rc.w / 2, rc.y + rc.h / 2]];
        const room = 2 * P['body.radius'] + 4, around = { x: rc.x - room, y: rc.y - room, w: rc.w + 2 * room, h: rc.h + 2 * room }; // a stair never pens ground against an edge
        if (!inB(around) || pts.some(([x, y]) => d(x, y) < OUTER + 8) || keep.some((q) => overlapGap(rc, q, 4)) || !freeOf(rc, 12) || out.landing.some((q) => overlapGap(rc, q, 8))) continue;
        if (gaps.some(([g0, g1]) => a0 < g1 + T && a0 + SWD > g0 - T)) continue;
        const foot = dk.hz ? { x: rc.x - 8, y: side > 0 ? rc.y + SL : rc.y - room - 8, w: SWD + 16, h: room + 8 } : { x: side > 0 ? rc.x + SL : rc.x - room - 8, y: rc.y - 8, w: room + 8, h: SWD + 16 };
        if (!freeOf(foot, 8)) continue; // Edit 48: a neighbour's building may already stand here; the foot stays open
        cands.push({ rc, side, a0 });
      }
      let st = null;
      if (cands.length) {
        const south = cands.filter((q) => q.side > 0), c0 = pick(r, south.length ? south : cands), rc = c0.rc, sd = c0.side; // Edit 43: south of the deck the flight shows whole
        st = { x: rc.x, y: rc.y, w: rc.w, h: rc.h, axis: dk.hz ? 'y' : 'x', from: 0, to: z, foot: null, head: k, deck: k,
          low: dk.hz ? (sd > 0 ? rc.y + SL : rc.y) : (sd > 0 ? rc.x + SL : rc.x), high: dk.hz ? (sd > 0 ? rc.y : rc.y + SL) : (sd > 0 ? rc.x : rc.x + SL) };
        out.stairs.push(st);
      }
      out.decks.push({ hz: dk.hz, off: dk.off, height: dk.height, z, gaps, openings: st ? [[dk.hz ? st.x : st.y, (dk.hz ? st.x : st.y) + SWD, st.low > st.high ? 1 : -1]] : [] });
    });
    return out;
  }
  // The centre line of a deck's road (two lanes, one each way), lead-in beyond both edges like a ground road.
  const deckCenter = (dk, W, H, lead) => (dk.hz ? [[-lead, dk.off], [W + lead, dk.off]] : [[dk.off, -lead], [dk.off, H + lead]]);
  function deckLanesOf(decks, P) { // per deck: two lanes on the overground level
    const out = [];
    (decks || []).forEach((dk, k) => lanesOf(deckCenter(dk, P['world.width'], P['world.height'], P['world.spawnLeadIn']), P).forEach((path, j) => out.push({ path, deck: k, dir: j })));
    return out;
  }
  // A city district from baked data (content/districts/districts.json), or generated when there is none.
  // Baked layouts for this world size (districts.json carries its size; 800 × 640 since Edit 42).
  function bakedDB(P) {
    const W = P['world.width'], H = P['world.height'], fit = (db) => { const sz = db && (db.size || [800, 600]); return sz && sz[0] === W && sz[1] === H ? db : null; };
    if (typeof window !== 'undefined') return fit(window.DISTRICT_DB);
    try { return typeof require === 'function' ? fit(require('../../content/districts/districts_p5.json')) : null; } catch (e) { return null; }
  }
  function cityDistrict(id, P) {
    const db = P['proto.layout'] >= 0 ? bakedDB(P) : null, list = db && db.districts && db.districts[id];
    if (!list || !list.length) return planCity(id, P);
    const k = clamp(Math.round(P['proto.layout']) || 1, 1, list.length) - 1, L = list[k], C = L.cols, R = L.rows;
    const cells = L.cells.map((row) => row.map((q) => Object.assign({}, q, { level: null, cones: null })));
    const D = { kind: 'city', levelId: id, cols: C, rows: R, seed: L.seed, layout: k + 1, start: L.start.slice(), cur: L.start.slice(), path: L.path, cells, decks: L.decks,
      visited: new Set([L.start[1] * C + L.start[0]]), lastFlip: null, baked: true };
    for (const row of cells) for (const q of row) {
      const lv = { id, name: DISTRICTS[id].name, blurb: DISTRICTS[id].blurb, center: q.center, lanes: lanesOf(q.center, P),
        statics: q.statics.map((s, i) => Object.assign({}, s, { id: 's' + i })), coneHomes: q.coneHomes, spawns: q.spawns, patches: q.patches, decks: q.decks || [], ring: q.ring || null,
        stairs: q.stairs || [], floors: q.floors || [], checkpoints: q.checkpoints || [] };
      lv.deckLanes = deckLanesOf(lv.decks, P);
      const solid = SIDES.filter((sd) => { const x = q.cell[0] + SIDE[sd][0], y = q.cell[1] + SIDE[sd][1]; return x < 0 || y < 0 || x >= C || y >= R; });
      Object.assign(lv, { key: id + '#' + (k + 1) + '@' + q.cell[0] + ',' + q.cell[1], cell: q.cell.slice(), gates: q.gates, solid, canal: q.canal, theme: q.theme, focal: q.focal, order: q.order });
      q.level = lv;
    }
    return D;
  }
  // Serialise a generated city for baking: every screen's geometry, so a layout plays the same after the generator changes.
  function bakeCity(D, P) {
    const r1 = (v) => Math.round(v * 10) / 10;
    const cells = D.cells.map((row) => row.map((q) => {
      const lv = cellLevel(D, q.cell, P);
      return { cell: q.cell, order: q.order, ends: q.ends, canal: q.canal, gates: q.gates, theme: lv.theme, focal: q.focal || null, turns: q.turns || null,
        center: lv.center.map(([x, y]) => [r1(x), r1(y)]), statics: lv.statics.map(({ id: _i, ...s }) => s), coneHomes: lv.coneHomes, spawns: lv.spawns,
        patches: lv.patches, decks: lv.decks || [], ring: q.ring || null, stairs: lv.stairs, floors: lv.floors, checkpoints: lv.checkpoints };
    }));
    return { seed: D.seed, cols: D.cols, rows: D.rows, start: D.start, path: D.path, decks: D.decks, cells };
  }

  // ---------- geometry tests
  function circleRect(px, py, r, s) {
    const qx = clamp(px, s.x, s.x + s.w), qy = clamp(py, s.y, s.y + s.h);
    const dx = px - qx, dy = py - qy, d = hyp(dx, dy);
    if (d >= r) return null;
    if (d > 1e-9) return { nx: dx / d, ny: dy / d, pen: r - d };
    const l = px - s.x, rt = s.x + s.w - px, t = py - s.y, b = s.y + s.h - py, m = Math.min(l, rt, t, b);
    if (m === l) return { nx: -1, ny: 0, pen: l + r };
    if (m === rt) return { nx: 1, ny: 0, pen: rt + r };
    if (m === t) return { nx: 0, ny: -1, pen: t + r };
    return { nx: 0, ny: 1, pen: b + r };
  }
  // Normal points from the car toward the circle (push-out direction).
  function circleCar(px, py, r, c) {
    const ca = Math.cos(c.h), sa = Math.sin(c.h), dx = px - c.x, dy = py - c.y;
    const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, hx = c.L / 2, hy = c.W / 2;
    let qx = clamp(lx, -hx, hx), qy = clamp(ly, -hy, hy), nlx, nly, pen;
    const ex = lx - qx, ey = ly - qy, d = hyp(ex, ey);
    if (d >= r) return null;
    if (d > 1e-9) { nlx = ex / d; nly = ey / d; pen = r - d; }
    else {
      const px_ = hx - Math.abs(lx), py_ = hy - Math.abs(ly);
      if (px_ < py_) { nlx = Math.sign(lx) || 1; nly = 0; pen = px_ + r; qx = nlx * hx; }
      else { nlx = 0; nly = Math.sign(ly) || 1; pen = py_ + r; qy = nly * hy; }
    }
    return { nx: nlx * ca - nly * sa, ny: nlx * sa + nly * ca, pen,
      cx: c.x + qx * ca - qy * sa, cy: c.y + qx * sa + qy * ca, qx, qy };
  }
  function segRect(x0, y0, x1, y1, s) {
    let t0 = 0, t1 = 1; const dx = x1 - x0, dy = y1 - y0;
    const tests = [[-dx, x0 - s.x], [dx, s.x + s.w - x0], [-dy, y0 - s.y], [dy, s.y + s.h - y0]];
    for (const [p, q] of tests) {
      if (Math.abs(p) < 1e-12) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return true;
  }
  function segCar(x0, y0, x1, y1, c) {
    const ca = Math.cos(c.h), sa = Math.sin(c.h);
    const loc = (x, y) => [(x - c.x) * ca + (y - c.y) * sa, -(x - c.x) * sa + (y - c.y) * ca];
    const [a0, b0] = loc(x0, y0), [a1, b1] = loc(x1, y1);
    return segRect(a0, b0, a1, b1, { x: -c.L / 2, y: -c.W / 2, w: c.L, h: c.W });
  }
  // Zone from normalised car-local contact position (Engineering §8.2).
  function zoneOf(qx, qy, c) {
    const ux = qx / (c.L / 2), uy = qy / (c.W / 2);
    if (Math.abs(ux) < 1e-9 && Math.abs(uy) < 1e-9) return 'side';
    const a = Math.atan2(Math.abs(uy), ux) / DEG;
    if (a <= 30) return 'front'; if (a <= 60) return 'frontDiagonal'; if (a <= 120) return 'side';
    if (a <= 150) return 'rearDiagonal'; return 'rear';
  }
  // P1.3 impulse model. n points from dummy into car. Velocities in world units/s.
  // Newtonian two-body impact: J = (1+e)·μ·u, μ = m_d·m_c/(m_d+m_c). Damage ∝ (dummy Δv)^p; p = 2 tracks dissipated energy.
  // The dummy's own approach speed is capped at a sprint (the one non-Newtonian rule).
  // P5.1 (Edit 50.1): dash says whether the dummy is dashing (or thrown). A dash strikes at its own speed, up to
  // proto.dummyStrikeSpeed. Walking or running adds only damage.walkShare of the dummy's speed into the car.
  function impulseImpact(P, bvx, bvy, cvx, cvy, nx, ny, cls, dash) {
    const md = P['proto.dummyMass'], mc = P['vehicles.' + cls + '.mass'], ms = P['vehicles.sedan.mass'], e = P['proto.restitution'];
    const vdn = bvx * nx + bvy * ny, vcn = cvx * nx + cvy * ny, share = dash || P['damage.walkShare'] == null ? 1 : P['damage.walkShare'];
    const strike = Math.min(Math.max(vdn, 0) * share, P['proto.dummyStrikeSpeed']) + Math.min(vdn, 0);
    const un = Math.max(0, strike - vcn);
    const mu = md * mc / (md + mc), J = (1 + e) * mu * un, dvd = J / md;
    const rx = bvx - cvx, ry = bvy - cvy, rn = rx * nx + ry * ny, rl = hyp(rx, ry);
    const angle = rl > 1e-9 && rn > 0 ? Math.acos(clamp(rn / rl, -1, 1)) / DEG : 90;
    const tx = rx - rn * nx, ty = ry - rn * ny, tl = hyp(tx, ty);
    const dvt = tl > 1e-9 ? Math.min(P['proto.contactFriction'] * J, mu * tl) / md : 0;
    const ref = (1 + e) * (ms / (md + ms)) * P['damage.referenceSpeed'];
    const raw = P['damage.baseImpact'] * Math.pow(dvd / ref, P['proto.damageExponent']);
    // Recoil: physical post-impact velocity, scaled down, but always clear of an approaching car.
    const sc = P['proto.recoilScale'];
    let kn = (strike - dvd) * sc;
    if (vcn < 0) kn = Math.min(kn, vcn - 5);
    const tdx = tl > 1e-9 ? -tx / tl : 0, tdy = tl > 1e-9 ? -ty / tl : 0;
    const vdtx = bvx - vdn * nx, vdty = bvy - vdn * ny;
    const kx = nx * kn + (vdtx + tdx * dvt) * sc, ky = ny * kn + (vdty + tdy * dvt) * sc;
    return { raw, assessed: Math.min(raw, P['damage.bodyHealth']), un, dvd, dvt, angle, knock: { x: kx, y: ky } };
  }
  // Edit 42: landing on a car from a deck. The dummy meets the car at damage.dropSpeed downward and the car's speed across.
  // Same impulse model as a strike (no sprint cap: gravity does the work). Recoil throws the dummy off the car's side.
  function dropImpact(P, dvx, dvy, c, res, speed) {
    const md = P['proto.dummyMass'], mc = P['vehicles.' + c.cls + '.mass'], ms = P['vehicles.sedan.mass'], e = P['proto.restitution'], vd = speed != null ? speed : P['damage.dropSpeed'];
    const across = hyp(c.vx - dvx, c.vy - dvy), un = hyp(vd, across);
    const mu = md * mc / (md + mc), J = (1 + e) * mu * un, dvd = J / md;
    const ref = (1 + e) * (ms / (md + ms)) * P['damage.referenceSpeed'];
    const raw = P['damage.baseImpact'] * Math.pow(dvd / ref, P['proto.damageExponent']), sc = P['proto.recoilScale'];
    return { raw, assessed: Math.min(raw, P['damage.bodyHealth']), un, dvd, dvt: 0, angle: Math.atan2(across, vd) / DEG,
      knock: { x: c.vx * sc + res.nx * vd * sc, y: c.vy * sc + res.ny * vd * sc } };
  }
  // P5 (Edit 50): the five-model fleet. u in [0, 1): vans by the district's share, then traffic.share.* in turn; sedans the rest.
  const FLEET5 = ['hatchback', 'police', 'bus'];
  function fleetClass(P, vanShare, u) {
    if (u < vanShare) return 'van';
    let acc = vanShare;
    for (const cls of FLEET5) { acc += P['traffic.share.' + cls]; if (u < acc) return cls; }
    return 'sedan';
  }
  // P5 (Edit 50): the tightest bend of a centre line on screen: over each run of four vertices, the path between the outer
  // segments' midpoints over the total turn. On a polyline arc this reads the arc's radius; one vertex alone reads ±15%,
  // as baked points are rounded to 0.1.
  function minBend(pts0, W, H) {
    const pts = pts0.filter((p, i) => i === 0 || hyp(p[0] - pts0[i - 1][0], p[1] - pts0[i - 1][1]) > 0.5), turn = [], len = []; // joins repeat a point
    for (let i = 1; i < pts.length; i++) len.push(hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    for (let i = 1; i + 1 < pts.length; i++) turn.push(Math.abs(wrap(Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) - Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]))));
    let m = Infinity;
    for (let i = 0; i + 4 <= turn.length; i++) {
      const [x, y] = pts[i + 2]; if (x < -40 || y < -40 || x > W + 40 || y > H + 40) continue;
      let L = 0, T = 0;
      for (let k = i; k < i + 4; k++) { L += (len[k] + len[k + 1]) / 2; T += turn[k]; }
      if (T > 1e-6) m = Math.min(m, L / T);
    }
    return m;
  }
  function assess(P, closing, zone, cls) {
    const raw = P['damage.baseImpact'] * P['damage.zone.' + zone] * P['vehicles.' + cls + '.mass'] *
      closing / P['damage.referenceSpeed'];
    return { raw, assessed: Math.min(raw, P['damage.bodyHealth']) };
  }

  // Edit 44: a car's level. Ground traffic is Z0; deck traffic runs at its deck's level.
  const lay = (c) => (c.layer == null ? 0 : c.layer);
  const AWAY_BODY = Object.freeze({ alive: false, x: -1e5, y: -1e5, vx: 0, vy: 0, level: 0, floor: null, stair: null, mode: 'away', facing: 0, parts: null }); // P5.3: the dummy, as a screen it is not near sees it
  // ---------- simulation
  class Sim {
    // carry: campaign state from the previous road (owned nodes, credits, points, chassis count, time).
    constructor(levelId, overrides, carry) {
      this.P = Object.assign({}, REG, PROTO, OVERRIDES, overrides || {});
      this.levelId = levelId; this.carry = carry || null;
      this.isCity = !!DISTRICTS[levelId]; this.list = this.isCity ? DISTRICT_LIST : ROADS; // Edit 41: five city districts; the P2.2 roads stay as fixtures
      this.roadIndex = this.list.indexOf(levelId); this.isFinal = this.roadIndex === this.list.length - 1;
      // D24: a road is a district of screens; the dummy starts on the handcrafted screen (top middle).
      this.district = this.isCity ? cityDistrict(levelId, this.P) : this.P['proto.district'] ? planDistrict(levelId, this.P) : null;
      this.level = this.district ? cellLevel(this.district, this.district.start, this.P) : buildLevel(levelId, this.P);
      const dif = DIFFICULTIES[clamp(Math.round(this.P['proto.difficulty']), 0, DIFFICULTIES.length - 1)];
      this.difficulty = dif.name;
      this.P['damage.bodyHealth'] = this.P['proto.health.' + dif.key];
      this.reset();
    }

    reset() {
      const P = this.P;
      this.t = 0; this.tick = 0; this.phase = 'play'; this.phaseT = 0; this.pendingPhase = null;
      this.cars = []; this.carSeq = 0; this.slot = 0; this.lastAdmit = -1e9; this.nextAt = 0;
      const pat = ['sedan', 'van', 'sedan', 'sedan', 'van'];
      // Deterministic irregular traffic: golden-ratio lane choice and spacing.
      const g = (i, o) => ((i * 0.6180339887 + o) % 1);
      const vs = this.isCity ? dpar(P, this.levelId, 'vanShare') : null; // a city district sets its own van share
      this.schedule = Array.from({ length: P['run.appearances.road'] }, (_, i) => ({ i, cls: vs != null ? fleetClass(P, vs, g(i, 0.53)) : pat[i % 5], lane: g(i, 0.31) < 0.5 ? 0 : 1, mult: 1 + P['proto.traffic.jitter'] * (2 * g(i, 0.77) - 1) }));
      this.cones = this.conesFor(this.level);
      this.drones = []; this.droneSeq = 0; this.deckSeq = 0; this.deckNext = {}; this.booms = {};
      this.models = { sedan: { id: 'SEDAN-01', cls: 'sedan', applied: 0, standoffApplied: 0 }, van: { id: 'VAN-02', cls: 'van', applied: 0, standoffApplied: 0 } };
      for (const [cls, id] of [['hatchback', 'HAT-03'], ['police', 'POL-03'], ['bus', 'BUS-02']]) this.models[cls] = { id, cls, applied: 0, standoffApplied: 0 }; // P5 (Edit 50): the five-model fleet
      const cy = this.carry || {};
      // The fleet remembers stop distances across roads.
      for (const k in cy.standoff || {}) if (this.models[k]) this.models[k].standoffApplied = cy.standoff[k];
      this.run = { writeOffs: 0, credits: cy.credits || 0, points: cy.points || 0, owned: Object.assign({}, cy.owned), chassis: cy.chassis || 0,
        ending: null, admitted: 0, exited: 0, purchases: (cy.purchases || []).slice(), priorWriteOffs: cy.writeOffs || 0 };
      this.tOffset = cy.t || 0;
      this.quota = this.isCity ? dpar(P, this.levelId, 'quota') : P['proto.quota.' + this.levelId] != null ? P['proto.quota.' + this.levelId] : P['run.quota.road'];
      this.events = []; this.effects = []; this.milestones = Object.assign({}, cy.milestones); this.report = null;
      this.turnHist = [];
      this.spawnBody();
      this.netBuild(); // P5.3 (Edit 53): the district's traffic, already running
      if (!this.net) this.fillDeckCars();
    }

    tracks() { const m = this.P['proto.abilities']; return m === 3 ? (this.P['proto.batteryModel'] === 1 ? TRACKS10D : TRACKS10) : m === 2 ? TRACKS9 : TRACKS; } // Edit 79–80; Edit 91
    nodes() { const m = this.P['proto.abilities']; return m === 3 ? (this.P['proto.batteryModel'] === 1 ? NODES10D : NODES10) : m === 2 ? NODES9 : NODES7; }
    trackMax(t) { const tr = this.tracks()[t]; return Math.min(tr && tr.max ? this.P['abilities.' + t + '.maxLevel'] || tr.max : 4, this.P['abilities.maxLevel']); } // Edit 80: Hands stop at two
    has(n) { if (this.P['proto.abilities'] === 3 && n in ABIL10_HAS) { const q = ABIL10_HAS[n]; return q ? this.tier(q[0]) >= q[1] : false; } if (this.P['proto.abilities'] === 2 && n in ABIL9_HAS) { const q = ABIL9_HAS[n]; return q ? this.tier(q[0]) >= q[1] : false; } if (this.P['proto.abilities'] && n in ABIL_HAS) { const t = ABIL_HAS[n]; return t ? this.tier(t) >= 1 : false; } return !!this.run.owned[n]; }
    tier(t) { const mx = this.P['proto.abilities'] === 3 ? this.trackMax(t) : this.P['abilities.maxLevel']; let n = 0; while (n < 4 && n < mx && this.run.owned[t + (n + 1)]) n++; return n; } // Edit 77: an ability track's level, 0–4 (this.level is the screen)
    shield(t) { return this.P['proto.abilities'] ? Math.max(0, 1 - this.P['abilities.wearCut'] * this.tier(t)) : 1; } // the share of wear that gets through
    secondsPerCharge() { // Edit 77: Battery levels speed the recharge; torso damage slows it
      const P = this.P; if (!P['proto.abilities']) return P['battery.secondsPerCharge'];
      const L = this.tier('battery');
      if (P['proto.batteryModel'] === 1) return (L >= 3 ? P['abilities.battery.level3Seconds'] : P['battery.secondsPerCharge']) / this.partEffect('recharge'); // Edit 91: Battery 3 the faster recharge
      if (P['proto.abilities'] >= 2) return (L ? P['abilities.battery.level' + L + 'Seconds'] : P['battery.secondsPerCharge']) / this.partEffect('recharge'); // Edit 79: a value per level
      return Math.max(0.05, P['battery.secondsPerCharge'] - P['abilities.battery.rechargeCut'] * L) / this.partEffect('recharge'); // Edit 78: linear
    }
    // Edit 78 (P6.8): the level steps. Without ability tracks, the P6.5–6.6 values.
    jumpAirtime() { const P = this.P; return P['proto.abilities'] ? P['abilities.legs.airtimeBase'] + P['abilities.legs.airtimeStep'] * Math.max(0, this.tier('legs') - 1) : P['upgrades.jumpAirtime']; }
    coneCapacity() { const P = this.P; return P['proto.abilities'] === 3 ? Math.max(1, P['abilities.hands.conesPerLevel'] * this.tier('hands')) : P['proto.abilities'] === 1 ? Math.max(1, P['abilities.arms.conesPerLevel'] * this.tier('arms')) : 1; } // Edit 80: two hands, two cones
    throwReach() { const P = this.P; return P['upgrades.throwDistance'] + (P['proto.abilities'] === 1 ? P['abilities.throw.distanceStep'] * Math.max(0, this.tier('throw') - 1) : 0); }
    carriedCones() { const b = this.body; return b.carried && b.carried.length ? b.carried : b.held ? [b.held] : []; }
    takeCone(cn) { const b = this.body; cn.state = 'held'; if (!b.carried) b.carried = []; b.carried.push(cn); b.held = cn; this.emit('pickup', { cone: cn.id, n: b.carried.length }); this.mile('use:carry'); }
    popCone() { const b = this.body; let cn = null; if (b.carried && b.carried.length) { cn = b.carried.pop(); b.held = b.carried[b.carried.length - 1] || null; } else { cn = b.held; b.held = null; } return cn; }
    capacity() { if (this.P['proto.batteryModel'] === 1) return this.tier('battery') >= 2 ? this.P['battery.capacity'] : this.P['abilities.battery.dashCharges']; return this.has('bigBattery') ? this.P['upgrades.bigCapacity'] : this.P['battery.capacity']; } // D26: Big battery 3, base 2. Edit 91: Battery 2 the second charge
    dashFitted() { return this.P['proto.batteryModel'] !== 1 || this.tier('battery') >= 1; } // Edit 91: Battery 1 is the dash
    maxHealth() { return this.dashFitted() ? this.P['damage.bodyHealth'] : this.P['damage.bodyHealthOnFoot']; } // Edit 91: on foot, a lighter chassis
    // Each screen keeps its own cones: where you leave one is where you find it.
    conesFor(lv) {
      const cell = this.district && lv.cell ? this.district.cells[lv.cell[1]][lv.cell[0]] : null;
      if (cell && cell.cones) return cell.cones;
      const pre = !lv.cell || lv.theme === 'start' ? 'cone' : 'cone' + cellName(lv.cell) + '-';
      const cones = lv.coneHomes.map((c, i) => ({ id: pre + (i + 1), x: c[0], y: c[1], hx: c[0], hy: c[1], vx: 0, vy: 0, state: 'free', flightT: 0, flightDur: 1 }));
      if (cell) cell.cones = cones;
      return cones;
    }
    // ----- surfaces (D18): the top patch under a point, and its registry multiplier (world.terrain.<id>.<field>; 1 on bare ground)
    surfaceAt(x, y) {
      const ps = this.level.patches || [];
      for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; if (x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) return p.kind; }
      return null;
    }
    terrain(x, y, field) { const k = this.surfaceAt(x, y), v = k ? this.P['world.terrain.' + k + '.' + field] : null; return v == null ? 1 : v; }
    // Low grip: the dummy coasts movement.lowGripStopMultiplier further. Grip (Legs) removes the slide.
    gripK(x, y) { const k = this.surfaceAt(x, y), g = k && this.P['world.terrain.' + k + '.grip']; return (g === 'low' || g === 'very low') && !this.has('grip') ? this.P['movement.lowGripStopMultiplier'] : 1; }
    // Edit 42: surfaces lie on the ground. On a deck, a stair or underground the dummy stands on plain concrete.
    onGround() { const b = this.body; return b.level === 0 && !b.stair && b.mode !== 'drop'; }
    underfoot(field) { const b = this.body; return this.onGround() ? this.terrain(b.x, b.y, field) : 1; }
    // The level the dummy can be met on: none while on a stair or in the air. Cars meet it only on their own level.
    bodyLayer() { const b = this.body; return b && b.alive && !b.stair && b.mode !== 'drop' && b.mode !== 'hitch' ? b.level : null; } // Edit 79: a hitched body rides out of traffic's way
    meets(c) { return this.bodyLayer() === lay(c) && (lay(c) === 0 || this.bodyDeck() === c.deckIdx); } // deck traffic meets the dummy on its own deck
    emit(type, data) { const e = Object.assign({ t: +this.t.toFixed(4), type }, data || {}); if (this.awayCell) e.away = this.awayCell; this.events.push(e); } // P5.3: an event on another screen carries its name
    mile(key, data) { if (!this.milestones[key]) { this.milestones[key] = Object.assign({ t: +(this.tOffset + this.t).toFixed(3), road: this.roadIndex + 1 }, data || {}); this.emit('milestone', { key }); } }
    totalWriteOffs() { return this.run.priorWriteOffs + this.run.writeOffs; }
    carryOut() {
      const r = this.run;
      return { owned: Object.assign({}, r.owned), credits: r.credits, points: r.points, chassis: r.chassis, purchases: r.purchases.slice(),
        writeOffs: this.totalWriteOffs(), t: this.tOffset + this.t, milestones: Object.assign({}, this.milestones),
        standoff: { sedan: this.models.sedan.standoffApplied, van: this.models.van.standoffApplied } };
    }

    // ----- body
    pickSpawn() {
      for (const sp of this.level.spawns) if (this.cars.every((c) => lay(c) !== 0 || hyp(c.x - sp.x, c.y - sp.y) > 80)) return sp;
      return this.level.spawns[0];
    }
    spawnBody() {
      const P = this.P, sp = this.pickSpawn();
      this.run.chassis++;
      this.body = {
        x: sp.x, y: sp.y, vx: 0, vy: 0, facing: sp.f * DEG, health: this.maxHealth(),
        charge: this.capacity(), refillDelay: 0, rampT: 0, mode: 'idle', parts: { head: 0, torso: 0, armL: 0, armR: 0, legL: 0, legR: 0 },
        coastVx: 0, coastVy: 0, coastT: 0, counterVx: 0, counterVy: 0, counterT: 0, counterDur: 0,
        lunge: null, recoverT: 0, held: null, carried: [], gesture: null, alive: true, chassis: this.run.chassis, // Edit 78: carried, every cone held (held: the top)
        level: 0, floor: null, stair: null, drop: null, // Edit 44: level 0 ground, 1 low highway, 2 high (highway, roofs, skybridges)
        hits: [], denied: 0, points0: this.run.points, z: 0, jump: null, combo: null, landT: 0, // Edit 75: jump height; the combo in progress. Edit 76: landing time left
      };
      this.emit('chassis', { chassis: this.run.chassis, x: sp.x, y: sp.y });
    }
    // Dash reach. With part effects on, leg damage alone shortens it (D19, 20 Oct); otherwise total wear does.
    // Either way it never falls below movement.wearFloor, so a worn body still reaches a passing flank (pillar 1).
    reach() {
      const P = this.P, b = this.body;
      return P['movement.lungeDistance'] * (P['proto.parts.effects'] ? this.partEffect('dash')
        : Math.max(P['movement.wearFloor'], Math.min(1, b.health / this.maxHealth())));
    }
    deny(action, why) { this.body.denied = 0.25; this.emit('denied', why ? { action, why } : { action }); } // Edit 75: why (locked: not installed)

    startLunge(facing0, k) {
      const P = this.P, b = this.body, T = P['movement.lungeDuration'];
      const R = this.reach() * (k == null ? 1 : k); // terrain lunge multiplier at take-off
      b.charge -= P['battery.lungeCost']; b.refillDelay = P['battery.refillDelaySeconds'];
      b.lunge = { dir0: facing0, dir: facing0, R, T, tf: T * P['movement.lungeFastTimeFraction'],
        df: P['movement.lungeFastDistanceFraction'], t: 0, blocked: false, x0: b.x, y0: b.y };
      b.mode = 'lunge'; b.facing = facing0; b.rampT = 0;
      this.emit('lunge', { R: +R.toFixed(2), charge: +b.charge.toFixed(3) });
    }

    bodyControl(cmd, dt) {
      const P = this.P, b = this.body;
      if (!b.alive) return;
      if (b.refillDelay > 0) { b.refillDelay -= dt; if (b.refillDelay < 1e-9) b.refillDelay = 0; }
      else b.charge = Math.min(this.capacity(), b.charge + dt / this.secondsPerCharge());
      b.denied = Math.max(0, b.denied - dt);
      this.comboClock(dt); // Edit 79
      if (b.mode === 'hitch') return this.stepHitch(cmd, dt); // Edit 79: riding a car
      if (b.mode !== 'knock') { b.sling = false; b.pushed = false; } // a sling or a push ends with its flight
      if (P['proto.abilities'] === 3 && (b.mode === 'idle' || b.mode === 'move' || b.mode === 'coast' || b.mode === 'recover') && !b.stair) { b.pushes = P['abilities.arms.pushesPerLevel'] * this.tier('arms'); b.pushFrom = null; } // Edit 80: pushes refill on the ground
      if (b.mode === 'drop') return; // in the air: no control until the landing
      if (b.landT > 0) { b.landT -= dt; if (b.landT < 1e-9) b.landT = 0; }
      const facing0 = b.facing, direct = P['proto.turnModel'] === 2; // Edit 75: DIRECT (P6.5)
      const mx = cmd.mx || 0, my = cmd.my || 0, m = hyp(mx, my), has = m > (direct ? 0.05 : 0.3), mk = direct ? Math.min(1, m) : 1; // DIRECT: speed scales with tilt (the input arrives dead-zoned)
      if (b.mode === 'jump') { // Edit 76: a normal jump steers toward the input; a dash jump holds its line. Facing follows the flight
        JUMP.air(P, b.jump, has ? mx : 0, has ? my : 0, dt);
        if (hyp(b.jump.vx, b.jump.vy) > 1) b.facing = Math.atan2(b.jump.vy, b.jump.vx);
        return;
      }
      const ix = has ? mx / m : 0, iy = has ? my / m : 0, inAng = has ? Math.atan2(iy, ix) : 0;
      const rate = (direct ? P['movement.directTurnRate'] : this.has('hips') ? P['upgrades.hipsTurnRate'] : P['movement.turnRate']) * DEG * this.partEffect('turn');
      // leg damage slows every ground speed; so does the surface underfoot (world.terrain.<id>.dummySpeed)
      const carryF = (b.held ? P['upgrades.carrySpeed'] : 1) * this.partEffect('speed') * this.underfoot('dummySpeed') * (b.stair ? P['world.stairSpeed'] : 1);

      if (cmd.aPress && !this.dashFitted()) { this.deny('lunge', 'locked'); if (cmd.bRelease) b.gesture = null; } // Edit 91: no dash before Battery 1
      else if (cmd.aPress) {
        const lk = this.underfoot('lunge');
        if (b.mode !== 'lunge' && b.mode !== 'recover' && !b.stair && !(b.landT > 0) && b.charge >= P['battery.lungeCost'] - 1e-9 && lk > 0) this.startLunge(direct && has ? inAng : facing0, lk); // DIRECT: the dash goes where the player points
        else { if (lk <= 0 && b.mode !== 'lunge' && b.mode !== 'recover') this.emit('slip', { surface: this.surfaceAt(b.x, b.y), x: +b.x.toFixed(1), y: +b.y.toFixed(1) }); this.deny('lunge'); }
        if (cmd.bRelease) b.gesture = null; // suppressed gesture cannot fire later
      } else if (P['proto.input.fourButtons']) { // Edit 75: B jump, X grab or place, Y throw
        if (cmd.bPress) this.tryJump();
        if (b.mode !== 'jump') this.handleXY(cmd);
        if (b.mode === 'jump') return;
      } else this.handleB(cmd, dt);

      if (b.mode === 'lunge') {
        if (this.has('spine') && has) {
          const L = b.lunge, lim = P['upgrades.spineLimit'] * DEG;
          let nd = turnTo(L.dir, inAng, P['upgrades.spineRate'] * DEG * dt);
          const off = wrap(nd - L.dir0);
          if (Math.abs(off) > lim) nd = L.dir0 + Math.sign(off) * lim;
          L.dir = nd; b.facing = nd;
        }
        return;
      }
      if (b.mode === 'recover') {
        b.recoverT += dt;
        if (has) b.facing = turnTo(b.facing, inAng, rate * dt);
        const f = clamp(b.recoverT / P['movement.lungeRecovery'], 0, 1);
        b.vx = has ? ix * P['movement.walkSpeed'] * f * carryF * mk : 0;
        b.vy = has ? iy * P['movement.walkSpeed'] * f * carryF * mk : 0;
        if (b.recoverT >= P['movement.lungeRecovery'] - 1e-9) { b.mode = has ? 'move' : 'idle'; b.rampT = 0; }
        return;
      }
      if (b.mode === 'knock') {
        b.knockT += dt;
        if (P['proto.bounce.newton']) { // Edit 78: the dummy slides on the ground, slowed by friction; control returns below walking pace
          const sp = hyp(b.vx, b.vy), dec = P['physics.slideFriction'] * P['physics.gravity'] * P['proto.scale.unitsPerMetre'] * dt, ns = Math.max(0, sp - dec);
          if (sp > 1e-9) { b.vx *= ns / sp; b.vy *= ns / sp; }
          if (ns <= 1 || (ns <= P['movement.walkSpeed'] && b.knockT >= P['proto.recoilSeconds'])) { b.mode = ns > 1 ? 'move' : 'idle'; b.rampT = 0; b.sling = false; if (ns <= 1) { b.vx = 0; b.vy = 0; } } // a short bounce slides out; a long throw gives control back after proto.recoilSeconds, under walking pace
          return;
        }
        const k = Math.max(0, 1 - b.knockT / P['proto.recoilSeconds']);
        b.vx = b.knockVx * k; b.vy = b.knockVy * k;
        if (k === 0) { b.mode = 'idle'; b.rampT = 0; b.sling = false; }
        return;
      }
      if (b.mode === 'counter') {
        b.counterT += dt;
        if (has) b.facing = turnTo(b.facing, inAng, rate * dt);
        const k = Math.max(0, 1 - b.counterT / b.counterDur);
        b.vx = b.counterVx * k; b.vy = b.counterVy * k;
        if (b.counterT >= b.counterDur - 1e-9) { b.mode = has ? 'move' : 'idle'; b.rampT = 0; b.vx = 0; b.vy = 0; }
        return;
      }
      const sp = hyp(b.vx, b.vy);
      if (has) {
        if (!direct && sp > 1 && Math.abs(wrap(inAng - Math.atan2(b.vy, b.vx))) > P['movement.counterPressAngle'] * DEG) {
          b.mode = 'counter'; b.counterT = 0; b.counterDur = P['movement.stopSeconds'] * P['movement.counterPressStop'] * (this.onGround() ? this.gripK(b.x, b.y) : 1);
          b.counterVx = b.vx; b.counterVy = b.vy; b.rampT = 0;
          b.facing = turnTo(b.facing, inAng, rate * dt);
          return;
        }
        b.facing = turnTo(b.facing, inAng, rate * dt);
        if (b.mode !== 'move') { b.mode = 'move'; b.rampT = 0; }
        b.rampT += dt;
        let spd = P['movement.walkSpeed'] + (P['movement.runSpeed'] - P['movement.walkSpeed']) *
          clamp(b.rampT / P['movement.rampSeconds'], 0, 1);
        if (!direct && Math.abs(wrap(inAng - b.facing)) > P['movement.alignThreshold'] * DEG) spd *= P['movement.turningSpeedFraction'];
        spd *= carryF * mk;
        b.vx = ix * spd; b.vy = iy * spd;
      } else {
        if (b.mode === 'move') { b.mode = 'coast'; b.coastT = 0; b.coastVx = b.vx; b.coastVy = b.vy; b.rampT = 0; b.coastDur = P['movement.stopSeconds'] * (this.onGround() ? this.gripK(b.x, b.y) : 1); }
        if (b.mode === 'coast') {
          b.coastT += dt;
          const k = Math.max(0, 1 - b.coastT / (b.coastDur || P['movement.stopSeconds'])); // a puddle stretches the slide
          b.vx = b.coastVx * k; b.vy = b.coastVy * k;
          if (k === 0) b.mode = 'idle';
        } else { b.vx = 0; b.vy = 0; }
      }
    }

    handleB(cmd, dt) {
      const P = this.P, b = this.body, busy = b.mode === 'lunge' || b.mode === 'recover';
      if (cmd.bPress) {
        if (!b.held) {
          if (this.has('carry')) {
            const cn = busy || this.armsBroken() || !this.onGround() ? null : this.nearestCone();
            if (cn) this.takeCone(cn);
            else this.deny('pickup');
          }
        } else if (!this.has('throw')) this.dropHeld();
        else b.gesture = { t: 0 };
      }
      if (b.gesture) {
        b.gesture.t += dt;
        if (cmd.bRelease) { const g = b.gesture; b.gesture = null; if (g.t < P['input.dropHoldSeconds']) this.throwHeld(); }
        else if (b.gesture.t >= P['input.dropHoldSeconds']) { b.gesture = null; this.dropHeld(); }
      }
    }
    // Edit 75 (P6.5): X picks up or places a cone (Carry); Y throws the held cone (Throw).
    handleXY(cmd) {
      if (this.P['proto.abilities'] === 3) { this.handleHands(cmd); return this.handlePush(cmd); } // Edit 80
      if (this.P['proto.abilities'] === 2) return this.handleArms(cmd);
      const b = this.body, busy = b.mode === 'lunge' || b.mode === 'recover';
      if (cmd.xPress) { // Edit 78: X grabs while there is room (Arms level) and a cone in reach; else it places the top cone
        if (!this.has('carry')) this.deny('pickup', 'locked');
        else {
          const room = this.carriedCones().length < this.coneCapacity(), cn = !room || busy || this.armsBroken() || !this.onGround() ? null : this.nearestCone();
          if (cn) this.takeCone(cn);
          else if (b.held) this.dropHeld();
          else this.deny('pickup');
        }
      }
      if (cmd.yPress) { if (!this.has('throw')) this.deny('throw', 'locked'); else if (!b.held) this.deny('throw', 'empty'); else if (!this.armsBroken()) this.throwHeld(); else this.deny('throw'); }
    }
    // Edit 79 (P6.9): Arms. X picks up a cone (Arms 1); with a cone, a tap puts it down and a hold throws it (Arms 2, after
    // input.throwHoldSeconds); beside a moving car with no cone, X hitches (Arms 3). Y has no job. cmd.xHeld: X still down.
    handleArms(cmd) {
      const P = this.P, b = this.body, busy = b.mode === 'lunge' || b.mode === 'recover', dt = this.dtLast || 1 / 60;
      if (cmd.xPress) {
        if (!this.has('carry')) this.deny('pickup', 'locked');
        else if (b.held) b.xHold = { t: 0, done: false };
        else {
          const car = this.has('hitch') && b.mode !== 'knock' ? this.hitchTarget() : null;
          if (car) return this.startHitch(car);
          const cn = busy || this.armsBroken() || !this.onGround() ? null : this.nearestCone();
          if (cn) this.takeCone(cn); else this.deny('pickup');
        }
      }
      if (b.xHold) {
        if (cmd.xHeld) {
          b.xHold.t += dt;
          if (!b.xHold.done && b.held && this.has('throw') && b.xHold.t >= P['input.throwHoldSeconds'] - 1e-9) { b.xHold.done = true; if (!this.armsBroken()) this.throwHeld(); else this.deny('throw'); }
        } else { if (!b.xHold.done && b.held) this.dropHeld(); b.xHold = null; }
      }
    }
    // Edit 80 (P6.10): Hands. A tap of X picks up a cone (room for abilities.hands.conesPerLevel × level); holding X
    // input.dropHoldSeconds puts the top one down. A tap with nothing to pick up does nothing: hold to put down.
    handleHands(cmd) {
      const P = this.P, b = this.body, busy = b.mode === 'lunge' || b.mode === 'recover', dt = this.dtLast || 1 / 60;
      if (cmd.xPress) {
        if (!this.has('carry')) { this.deny('pickup', 'locked'); return; }
        b.xHold = { t: 0, done: false };
        const room = this.carriedCones().length < this.coneCapacity();
        const cn = room && !busy && !this.armsBroken() && this.onGround() ? this.nearestCone() : null;
        if (cn) { this.takeCone(cn); b.xHold.done = true; } // a tap that picks up never also puts down
        else if (b.held && P['abilities.hands.tapDrop'] && !busy) { this.dropHeld(); b.xHold = null; } // Edit 90 (P7.9): nothing to pick up: the tap puts a cone down
        else if (!b.held) { this.deny('pickup'); b.xHold = null; }
      }
      if (!b.xHold) return;
      if (cmd.xHeld) { b.xHold.t += dt; if (!b.xHold.done && b.held && b.xHold.t >= P['input.dropHoldSeconds'] - 1e-9) { b.xHold.done = true; this.dropHeld(); } }
      else { if (!b.xHold.done && b.held) this.deny('drop', 'hold'); b.xHold = null; }
    }
    // Edit 80: Arms. Y pushes off a car: the one just hit or touched (within abilities.arms.pushWindow), else one within
    // abilities.arms.pushReach. The push adds pushSpeed + pushStep × (level − 1), × arm wear, away from the car (or along the stick,
    // if it points away); motion into the car is dropped. The flight is a knock: it slides and strikes as a dash (combo kind PUSH).
    // abilities.arms.pushesPerLevel × level pushes, refilled on the ground in control.
    handlePush(cmd) {
      const P = this.P, b = this.body;
      if (!cmd.yPress) return;
      if (!this.has('push')) return this.deny('push', 'locked');
      if (!(b.pushes > 0)) return this.deny('push', 'spent');
      const tg = this.pushTarget(); if (!tg) return this.deny('push', 'nothing');
      const L = this.tier('arms'), sp = (P['abilities.arms.pushSpeed'] + P['abilities.arms.pushStep'] * (L - 1)) * this.partEffect('push');
      let dx = tg.nx, dy = tg.ny; const m = hyp(cmd.mx || 0, cmd.my || 0);
      if (m > 0.3) { const ux = cmd.mx / m, uy = cmd.my / m; if (ux * tg.nx + uy * tg.ny > 0.2) { dx = ux; dy = uy; } }
      let vx = b.vx, vy = b.vy; const vn = vx * tg.nx + vy * tg.ny; if (vn < 0) { vx -= vn * tg.nx; vy -= vn * tg.ny; }
      vx += dx * sp; vy += dy * sp; b.pushes--; b.lastHit = null; b.pushFrom = { id: tg.id, t: this.t }; // one push a contact
      Object.assign(b, { mode: 'knock', knockT: 0, knockVx: vx, knockVy: vy, vx, vy, lunge: null, jump: null, z: 0, pushed: true, sling: false });
      if (hyp(vx, vy) > 1) b.facing = Math.atan2(vy, vx);
      this.emit('push', { car: tg.id, speed: +hyp(vx, vy).toFixed(1), add: +sp.toFixed(1), left: b.pushes, level: L, recent: !!tg.recent }); this.mile('use:push');
    }
    pushTarget() {
      const P = this.P, b = this.body, lh = b.lastHit, pf = b.pushFrom; // the car last pushed off needs a fresh contact
      if (lh && this.t - lh.t <= P['abilities.arms.pushWindow'] + 1e-9 && (!pf || lh.id !== pf.id || lh.t > pf.t) && this.carById(lh.id)) return { id: lh.id, nx: lh.nx, ny: lh.ny, recent: true };
      const r = P['body.radius'] + P['abilities.arms.pushReach']; let best = null;
      for (const c of this.cars) { if (!this.meets(c) || (pf && (c.id === pf.id || (c.real && c.real.id === pf.id)))) continue; const res = circleCar(b.x, b.y, r, c); if (res && (!best || res.pen > best.pen)) best = { id: c.id, nx: res.nx, ny: res.ny, pen: res.pen }; }
      return best;
    }
    carById(id) { return this.cars.find((q) => q.id === id || (q.real && q.real.id === id)) || null; }
    hitchTarget() { // a moving car on the dummy's level, its side within abilities.arms.hitchReach of the body
      const P = this.P, b = this.body, r = P['body.radius'] + P['abilities.arms.hitchReach'];
      let best = null, bp = -1;
      for (const c of this.cars) {
        if (!this.meets(c) || !(c.v >= P['abilities.arms.hitchMinSpeed'])) continue;
        const res = circleCar(b.x, b.y, r, c); if (res && res.pen > bp) { best = c; bp = res.pen; }
      }
      return best;
    }
    startHitch(c) { // ride on the car's side, where the body is, just clear of the bodywork
      const P = this.P, b = this.body, r = P['body.radius'], ca = Math.cos(c.h), sa = Math.sin(c.h), dx = b.x - c.x, dy = b.y - c.y;
      let lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      if (Math.abs(lx) <= c.L / 2 + r) { lx = clamp(lx, -c.L / 2, c.L / 2); ly = (ly >= 0 ? 1 : -1) * (c.W / 2 + r + 1); }
      else lx = (lx >= 0 ? 1 : -1) * (c.L / 2 + r + 1);
      Object.assign(b, { mode: 'hitch', hitch: { id: c.id, lx, ly, t: 0 }, lunge: null, jump: null, z: 0, vx: c.vx, vy: c.vy, facing: c.h, sling: false });
      this.emit('hitch', { car: c.id, speed: +c.v.toFixed(1) }); this.mile('use:hitch');
    }
    stepHitch(cmd, dt) {
      const P = this.P, b = this.body, H = b.hitch, c = this.carById(H.id), e = P['abilities.arms.hitchEdge'];
      H.t += dt;
      const off = b.x < e || b.y < e || b.x > P['world.width'] - e || b.y > P['world.height'] - e;
      if (!c || c.v < 1 || (c.elev || 0) !== b.level || H.t >= P['abilities.arms.hitchSeconds'] - 1e-9 || off || cmd.xPress) return this.releaseHitch(c, false, cmd);
      if (cmd.aPress) return this.releaseHitch(c, true, cmd);
    }
    // Let go: flung at the car's velocity × abilities.arms.slingScale; with A, a dash's push (abilities.arms.slingDash) along the
    // stick, for a charge. The flight is a knock: it slides, and strikes the next car as a dash does.
    releaseHitch(c, dash, cmd) {
      const P = this.P, b = this.body, k = P['abilities.arms.slingScale'];
      let vx = c ? c.vx * k : b.vx, vy = c ? c.vy * k : b.vy, dashed = false;
      if (dash && b.charge >= P['battery.lungeCost'] - 1e-9) {
        const m = hyp(cmd.mx || 0, cmd.my || 0), a = m > 0.05 ? Math.atan2(cmd.my, cmd.mx) : Math.atan2(vy, vx);
        vx += Math.cos(a) * P['abilities.arms.slingDash']; vy += Math.sin(a) * P['abilities.arms.slingDash'];
        b.charge -= P['battery.lungeCost']; b.refillDelay = P['battery.refillDelaySeconds']; dashed = true;
      }
      Object.assign(b, { hitch: null, mode: 'knock', knockT: 0, knockVx: vx, knockVy: vy, vx, vy, sling: true });
      if (hyp(vx, vy) > 1) b.facing = Math.atan2(vy, vx);
      this.emit('sling', { car: c ? c.id : null, speed: +hyp(vx, vy).toFixed(1), dash: dashed });
    }
    // Edit 79: the combo clock. With scoring.comboAirPause it runs only on the ground: a jump, a knock (a bounce or a sling),
    // a drop or a hitch hold it. A combo ends when it passes scoring.comboWindow.
    comboClock(dt) {
      const P = this.P, b = this.body, cb = b.combo; this.dtLast = dt;
      if (!cb || cb.ended) return;
      const air = b.mode === 'jump' || b.mode === 'knock' || b.mode === 'hitch' || b.mode === 'drop';
      if (!(P['scoring.comboAirPause'] && air)) cb.clock = (cb.clock || 0) + dt;
      if (cb.clock > P['scoring.comboWindow'] + 1e-9) { cb.ended = true; if (cb.n > 1) this.emit('combo-end', { n: cb.n, mult: cb.mult, kinds: cb.kinds.slice(), points: Math.round(cb.pts || 0) }); }
    }
    comboLink(kind, base) { // a link: a hit, or a cone into a car. Returns the chain and its multiplier; banks base × it
      const P = this.P, b = this.body, cb = b.combo;
      if (!P['proto.combo']) return { n: 1, mult: 1, kinds: [kind] };
      const live = cb && !cb.ended && (cb.clock || 0) <= P['scoring.comboWindow'] + 1e-9;
      const n = live ? cb.n + 1 : 1, kinds = live ? (cb.kinds.includes(kind) ? cb.kinds.slice() : cb.kinds.concat([kind])) : [kind];
      const mult = Math.min(P['scoring.comboMax'], 1 + P['scoring.comboStep'] * (n - 1) + (P['scoring.comboVariety'] || 0) * (kinds.length - 1));
      b.combo = { n, t: this.t, mult, clock: 0, kinds, pts: (live ? cb.pts || 0 : 0) + base * mult, ended: false };
      return b.combo;
    }
    // B jumps (Legs: Jump), Edit 76 (Link's Awakening): straight up from standing; at walking or running speed it carries that
    // speed; during a dash it carries the dash's (a long jump). Capped at upgrades.jumpMaxSpeed. upgrades.jumpHeight at the top,
    // upgrades.jumpAirtime in the air; costs battery.jumpCost. The ground speeds already carry leg damage. Rules: jump.js.
    tryJump() {
      const P = this.P, b = this.body;
      if (!this.has('jump')) return this.deny('jump', 'locked');
      const dash = b.mode === 'lunge' && !!b.lunge, cost = dash && P['battery.dashJumpCost'] != null ? P['battery.dashJumpCost'] : P['battery.jumpCost']; // Edit 90 (P7.9): a jump out of a dash is paid by the dash
      if (b.mode === 'knock' || b.mode === 'jump' || b.mode === 'drop' || b.mode === 'rescue' || b.stair || b.landT > 0 || b.charge < cost - 1e-9) return this.deny('jump', b.charge < cost - 1e-9 ? 'charge' : undefined);
      let vx = b.vx, vy = b.vy;
      if (dash) { const L = b.lunge, sp = L.t < L.tf - 1e-9 ? L.R * L.df / L.tf : L.R * (1 - L.df) / (L.T - L.tf); vx = Math.cos(L.dir) * sp; vy = Math.sin(L.dir) * sp; }
      b.charge -= cost; if (cost > 0) b.refillDelay = P['battery.refillDelaySeconds'];
      const J = JUMP.takeoff(P, vx, vy, dash, this.jumpAirtime()); // Edit 78: Legs levels lengthen the airtime
      Object.assign(J, { x0: b.x, y0: b.y, level: b.level, rampT: b.rampT });
      b.mode = 'jump'; b.lunge = null; b.z = 0; b.jump = J;
      if (J.v0 > 1) b.facing = Math.atan2(J.vy, J.vx);
      this.emit('jump', { x: +b.x.toFixed(1), y: +b.y.toFixed(1), kind: J.kind, speed: +J.v0.toFixed(1), level: b.level, clear: J.clear !== false }); // Edit 77: clear false: a hop
      this.mile('use:jump');
      if (dash) this.mile('use:dashJump');
    }
    landJump() { // the momentum carries on: moving, at the speed it landed with; no dash or jump for upgrades.jumpRecovery
      const P = this.P, b = this.body, J = b.jump, sp = hyp(J.vx, J.vy), walk = P['movement.walkSpeed'], run = P['movement.runSpeed'];
      b.jump = null; b.z = 0; b.landT = P['upgrades.jumpRecovery'];
      b.vx = J.vx; b.vy = J.vy;
      if (sp > 1) { b.mode = 'move'; b.rampT = P['movement.rampSeconds'] * clamp((sp - walk) / Math.max(1, run - walk), 0, 1); } else { b.mode = 'idle'; b.vx = b.vy = 0; }
      this.emit('jump-land', { x: +b.x.toFixed(1), y: +b.y.toFixed(1), d: +hyp(b.x - J.x0, b.y - J.y0).toFixed(1), kind: J.kind, speed: +J.v0.toFixed(1), level: b.level });
    }
    // Ricochet (Legs): the bounce off a hit goes upgrades.ricochetScale as far
    bounce(knock) {
      const P = this.P, k = this.has('ricochet') ? P['upgrades.ricochetScale'] : 1, out = k === 1 ? knock : { x: knock.x * k, y: knock.y * k };
      const mt = P['proto.bounce.maxThrow']; if (!(mt > 0)) return out; // Edit 83 (P7.2): a knock throws the dummy at most proto.bounce.maxThrow on its slide (0: no cap)
      const vmax = Math.sqrt(2 * P['physics.slideFriction'] * P['physics.gravity'] * P['proto.scale.unitsPerMetre'] * mt), v = hyp(out.x, out.y);
      return v > vmax ? { x: out.x * vmax / v, y: out.y * vmax / v } : out;
    }
    nearestCone() {
      const P = this.P, b = this.body, rr = P['body.radius'] + P['props.cone.radius'];
      let best = null, bd = Infinity;
      for (const cn of this.cones) {
        if (cn.state !== 'free') continue;
        const edge = hyp(cn.x - b.x, cn.y - b.y) - rr;
        if (edge <= P['props.cone.pickupEdgeRange'] && (edge < bd - 1e-9)) { best = cn; bd = edge; }
      }
      return best;
    }
    coneSpotValid(x, y, ignore) {
      const P = this.P, r = P['props.cone.radius'];
      if (x < r || y < r || x > P['world.width'] - r || y > P['world.height'] - r) return false;
      if (this.level.statics.some((s) => circleRect(x, y, r, s))) return false;
      if (this.cars.some((c) => lay(c) === 0 && circleCar(x, y, r, c))) return false;
      if (this.drones.some((d) => d.target && d.cone !== (ignore && ignore.id) && hyp(d.target.x - x, d.target.y - y) < 2 * r)) return false;
      return !this.cones.some((c) => c !== ignore && (c.state === 'free' || c.state === 'flight') && hyp(c.x - x, c.y - y) < 2 * r);
    }
    releasePoint() {
      const P = this.P, b = this.body, d = P['body.radius'] + P['props.cone.radius'] + P['props.cone.placementClearance'];
      return { x: b.x + Math.cos(b.facing) * d, y: b.y + Math.sin(b.facing) * d };
    }
    dropHeld() {
      const b = this.body, cn = b.held, p = this.releasePoint();
      if (!this.onGround() || !this.coneSpotValid(p.x, p.y, cn)) return this.deny('drop'); // cones stay on the ground (Edit 42)
      this.popCone(); Object.assign(cn, { x: p.x, y: p.y, vx: 0, vy: 0, state: 'free' });
      this.emit('drop', { cone: cn.id, x: +p.x.toFixed(2), y: +p.y.toFixed(2) });
    }
    throwHeld() {
      const P = this.P, b = this.body, cn = b.held, p = this.releasePoint();
      if (!this.onGround() || !this.coneSpotValid(p.x, p.y, cn)) return this.deny('throw');
      const T = P['props.cone.throwSeconds'], X = this.throwReach() * this.partEffect('throw'); // Edit 78: Throw levels add distance
      const vx = b.vx + Math.cos(b.facing) * X / T, vy = b.vy + Math.sin(b.facing) * X / T;
      Object.assign(cn, { x: p.x, y: p.y, vx, vy, state: 'flight', flightT: T, flightDur: T, kind: 'throw', fx: p.x, fy: p.y });
      this.popCone();
      this.emit('throw', { cone: cn.id, vx: +vx.toFixed(2), vy: +vy.toFixed(2) });
      this.mile('use:throw');
    }
    releaseHeldAtDeath() { // Edit 78: every cone carried
      const b = this.body, all = this.carriedCones().slice();
      if (!all.length) return;
      b.held = null; b.carried = []; b.gesture = null;
      for (const cn of all) {
        if (this.coneSpotValid(b.x, b.y, cn)) Object.assign(cn, { x: b.x, y: b.y, vx: 0, vy: 0, state: 'free' });
        else { cn.state = 'pending'; cn.px = b.x; cn.py = b.y; }
        this.emit('cone-release', { cone: cn.id, state: cn.state });
      }
    }
    retryPending() {
      for (const cn of this.cones) {
        if (cn.state !== 'pending') continue;
        const homes = this.level.coneHomes.map((h) => ({ x: h[0], y: h[1] }))
          .sort((a, b) => hyp(a.x - cn.px, a.y - cn.py) - hyp(b.x - cn.px, b.y - cn.py));
        for (const h of [{ x: cn.px, y: cn.py }, ...homes]) {
          if (this.coneSpotValid(h.x, h.y, cn)) { Object.assign(cn, { x: h.x, y: h.y, state: 'free', recovered: true }); break; }
        }
      }
    }

    moveBody(h) {
      const b = this.body;
      if (!b.alive) return;
      if (b.mode === 'drop') { b.x += b.drop.vx * h; b.y += b.drop.vy * h; b.drop.t += h; return; }
      if (b.mode === 'hitch') { // Edit 79: on the car's side, as it moves and turns
        const H = b.hitch, c = this.carById(H.id); if (!c) return;
        const ca = Math.cos(c.h), sa = Math.sin(c.h); b.x = c.x + H.lx * ca - H.ly * sa; b.y = c.y + H.lx * sa + H.ly * ca; b.vx = c.vx; b.vy = c.vy; b.facing = c.h;
        return;
      }
      if (b.mode === 'jump') { // Edit 75: a parabola, upgrades.jumpHeight at the top
        const J = b.jump;
        b.vx = J.vx; b.vy = J.vy; // Edit 76: the take-off velocity, as steered in the air; a wall slides it (world6.js)
        b.x += b.vx * h; b.y += b.vy * h; J.t = Math.min(J.T, J.t + h);
        b.z = JUMP.z(J);
        if (J.t >= J.T - 1e-9) this.landJump();
        return;
      }
      if (b.mode === 'lunge') {
        const L = b.lunge;
        const spd = L.t < L.tf - 1e-9 ? L.R * L.df / L.tf : L.R * (1 - L.df) / (L.T - L.tf);
        if (L.blocked) { b.vx = 0; b.vy = 0; } else { b.vx = Math.cos(L.dir) * spd; b.vy = Math.sin(L.dir) * spd; }
        b.x += b.vx * h; b.y += b.vy * h;
        L.t += h;
        if (Math.abs(wrap(L.dir - L.dir0)) > 10 * DEG) this.mile('use:spine');
        if (L.t >= L.T - 1e-9) { b.mode = 'recover'; b.recoverT = 0; b.lunge = null; b.vx = 0; b.vy = 0; }
        return;
      }
      b.x += b.vx * h; b.y += b.vy * h;
    }

    collideBody(contacts, k) {
      const P = this.P, b = this.body, r = P['body.radius'];
      if (!b.alive || b.stair || b.mode === 'drop') return;
      const block = () => { if (b.mode === 'lunge') b.lunge.blocked = true; };
      const ground = b.level === 0; // statics, stair sides, checkpoints, cones and screen edges are ground-level
      const solids = ground ? this.level.statics.concat((this.level.stairs || []).filter((st) => !this.stairFoot(st)), (this.level.checkpoints || []).filter((cp) => !cp.deck).map((cp) => this.checkZone(cp))) : [];
      for (const s of solids) {
        const res = circleRect(b.x, b.y, r, s);
        if (!res) continue;
        b.x += res.nx * res.pen; b.y += res.ny * res.pen;
        const vn = b.vx * res.nx + b.vy * res.ny;
        if (vn < 0) { b.vx -= vn * res.nx; b.vy -= vn * res.ny; }
        block();
      }
      // Screen edges (D24, Edit 40.1): open wherever the ground is open on both sides, as in Zelda.
      // A building or barrier across the edge stops the dummy; so does the district's outer edge. The flip follows in step().
      const W = P['world.width'], H = P['world.height'];
      let ex = clamp(b.x, r, W - r), ey = clamp(b.y, r, H - r);
      if (!ground || (b.x < r && this.edgeOpen('W', b.y)) || (b.x > W - r && this.edgeOpen('E', b.y))) ex = b.x;
      if (!ground || (b.y < r && this.edgeOpen('N', b.x)) || (b.y > H - r && this.edgeOpen('S', b.x))) ey = b.y;
      if (ex !== b.x || ey !== b.y) { b.x = ex; b.y = ey; block(); }
      for (const c of this.cars) {
        if (!this.meets(c)) continue; // cars meet the dummy on their own level only
        const res = circleCar(b.x, b.y, r, c);
        if (!res) continue;
        c.touched = true;
        const nx = -res.nx, ny = -res.ny; // from body into car
        const rel = (b.vx - c.vx) * nx + (b.vy - c.vy) * ny;
        let knock = null;
        if (!c.inEpisode) {
          c.inEpisode = true;
          const ph = impulseImpact(P, b.vx, b.vy, c.vx, c.vy, nx, ny, c.cls, b.mode === 'lunge' || b.mode === 'knock');
          contacts.push({ k, car: c, closing: Math.max(0, rel), ph, px: res.cx, py: res.cy, zone: zoneOf(res.qx, res.qy, c),
            carState: this.carCue(c), cause: c.cause, lunging: b.mode === 'lunge', bodySpeed: hyp(b.vx, b.vy), carSpeed: c.v, stopped: c.v < 5 || !!(c.man && c.man.standoff) });
          if (P['proto.damageModel'] && ph.un > 1e-6) knock = ph.knock;
        }
        b.x += res.nx * res.pen; b.y += res.ny * res.pen;
        if (knock) {
          b.mode = 'knock'; b.lunge = null; b.knockT = 0; b.knockVx = knock.x; b.knockVy = knock.y; b.vx = knock.x; b.vy = knock.y;
          this.emit('knock', { car: c.id, speed: +hyp(knock.x, knock.y).toFixed(2) });
        } else if (rel > 0) { b.vx -= rel * nx; b.vy -= rel * ny; }
        block();
      }
      const rr = r + P['props.cone.radius'];
      for (const cn of ground ? this.cones : []) {
        if (cn.state !== 'free') continue;
        const dx = cn.x - b.x, dy = cn.y - b.y, d = hyp(dx, dy);
        if (d >= rr || d < 1e-9) continue;
        const ux = dx / d, uy = dy / d, sp = hyp(b.vx, b.vy);
        if (b.vx * ux + b.vy * uy > 1 && sp > 5) {
          const v = P['props.cone.puntDistance'] / P['props.cone.puntSeconds'];
          Object.assign(cn, { state: 'flight', vx: b.vx / sp * v, vy: b.vy / sp * v, flightT: P['props.cone.puntSeconds'], flightDur: P['props.cone.puntSeconds'], kind: 'punt' });
          this.emit('punt', { cone: cn.id });
        }
        cn.x = b.x + ux * rr; cn.y = b.y + uy * rr;
      }
      if (b.level > 0 && b.mode !== 'drop' && !b.stair) this.floorMove(); // a car's shove obeys the parapet too, and can push the dummy through a gap
    }

    // ----- levels (Edit 44): Z0 ground, Z1 low highway, Z2 high highway, platform roofs and skybridges.
    // Raised floors are rectangles at a level; stairs join levels; ledges and broken parapets drop to the level below.
    stairT(st, x, y) { return ((st.axis === 'y' ? y : x) - st.low) / (st.high - st.low); }
    stairSpan(st) { const y = st.axis === 'y', l0 = y ? st.x : st.y; return [l0, l0 + (y ? st.w : st.h)]; }
    // The foot of a ground stair is open; its sides and head are solid on the ground. A stair footed on a deck is solid below.
    stairFoot(st) {
      const b = this.body, [l0, l1] = this.stairSpan(st), lat = st.axis === 'y' ? b.x : b.y;
      return st.foot == null && st.from === 0 && lat >= l0 + 2 && lat <= l1 - 2 && this.stairT(st, b.x, b.y) < 0.35;
    }
    checkZone(cp) { return checkZone(cp, this.P, this.P['world.width'], this.P['world.height']); } // boom up or down
    boomPoint(cp) { const W = this.P['world.width'], H = this.P['world.height']; return cp.side === 'W' ? { x: cp.line, y: cp.off } : cp.side === 'E' ? { x: W - cp.line, y: cp.off } : cp.side === 'N' ? { x: cp.off, y: cp.line } : { x: cp.off, y: H - cp.line }; }
    stepBooms(dt) { // a boom lifts for a car on its level within world.boomRange, over world.boomSeconds
      const P = this.P;
      (this.level.checkpoints || []).forEach((cp, i) => {
        const p = this.boomPoint(cp), z = cp.deck ? cp.z || 1 : 0, near = this.cars.some((c) => lay(c) === z && hyp(c.x - p.x, c.y - p.y) < P['world.boomRange']);
        this.booms[i] = clamp((this.booms[i] || 0) + (near ? 1 : -1) * dt / P['world.boomSeconds'], 0, 1);
      });
    }
    floorOf() { const b = this.body; return b.floor != null ? (this.level.floors || [])[b.floor] || null : null; }
    bodyDeck() { const f = this.floorOf(); return f && f.kind === 'deck' ? f.deck : null; }
    enterStair(st, how) {
      const b = this.body;
      if (b.mode === 'lunge' || b.mode === 'knock') return false; // stairs are walked, not dashed into
      b.stair = st; b.floor = null;
      this.emit('stair', { from: b.level, toward: how === 'foot' ? st.to : st.from });
      return true;
    }
    floorStep(contacts, k) {
      const b = this.body;
      if (!b.alive) return;
      if (b.mode === 'drop') { if (b.drop.t >= b.drop.T - 1e-9) this.land(contacts, k); return; }
      if (b.stair) return this.stairStep();
      if (b.level > 0) return this.floorMove();
      for (const st of this.level.stairs || []) {
        const t = this.stairT(st, b.x, b.y);
        if (t >= 0 && t < 0.35 && this.stairFoot(st) && this.enterStair(st, 'foot')) return;
      }
    }
    stairStep() {
      const P = this.P, b = this.body, st = b.stair, r = P['body.radius'], [l0, l1] = this.stairSpan(st), m = Math.min(r, (l1 - l0) / 4);
      if (st.axis === 'y') b.x = clamp(b.x, l0 + m, l1 - m); else b.y = clamp(b.y, l0 + m, l1 - m);
      const len = Math.abs(st.high - st.low), t = this.stairT(st, b.x, b.y), ext = (P['world.parapetWidth'] + r) / len;
      const onto = () => { const f = this.floorOf(); if (f) { b.x = clamp(b.x, f.x + r, f.x + f.w - r); b.y = clamp(b.y, f.y + r, f.y + f.h - r); } return f; }; // step off fully onto the floor
      if (t < (st.foot != null ? -ext : 0)) { b.stair = null; b.level = st.from; b.floor = st.foot; onto(); this.emit('level', { level: b.level }); }
      else if (t > 1 + ext) {
        b.stair = null; b.level = st.to; b.floor = st.head;
        const f = onto();
        this.emit('level', { level: b.level, floor: f ? f.kind : null }); this.mile(f && f.kind === 'roof' ? 'firstRoof' : st.to === 2 ? 'firstHighway' : 'firstDeck');
      }
    }
    // On a raised floor: its rectangle, less the dummy's radius. Crossing an edge leads onto another floor at the level
    // (a skybridge), onto a stair, off a ledge or broken parapet, or into the next screen along a deck; else the parapet holds.
    floorMove() {
      const P = this.P, b = this.body, r = P['body.radius'], W = P['world.width'], H = P['world.height'], floors = this.level.floors || [], f = this.floorOf();
      if (!f) { b.level = 0; b.floor = null; return; }
      const block = () => { if (b.mode === 'lunge') b.lunge.blocked = true; };
      const deck = f.kind === 'deck' ? this.level.decks[f.deck] : null;
      const x0 = f.x + r, x1 = f.x + f.w - r, y0 = f.y + r, y1 = f.y + f.h - r;
      for (const [sd, out, ax, sg] of [['W', b.x < x0, 'x', -1], ['E', b.x > x1, 'x', 1], ['N', b.y < y0, 'y', -1], ['S', b.y > y1, 'y', 1]]) {
        if (!out) continue;
        if (deck && horiz(sd) === deck.hz) { // along the deck: the next screen, or the district edge
          if ((ax === 'x' ? b.x < r || b.x > W - r : b.y < r || b.y > H - r) && !this.deckEdgeOpen(sd, deck)) { if (ax === 'x') b.x = clamp(b.x, r, W - r); else b.y = clamp(b.y, r, H - r); block(); }
          continue;
        }
        const g = floors.findIndex((q, i) => i !== b.floor && q.z === b.level && b.x >= q.x && b.x <= q.x + q.w && b.y >= q.y && b.y <= q.y + q.h);
        if (g >= 0) { b.floor = g; return; }
        const along = ax === 'x' ? b.y : b.x, inSpan = (q) => { const [l0, l1] = this.stairSpan(q); return q.axis === ax && along >= l0 + 2 && along <= l1 - 2; };
        const st = (this.level.stairs || []).find((q) => inSpan(q) && ((q.head === b.floor && Math.sign(q.low - q.high) === sg) || (q.foot === b.floor && Math.sign(q.high - q.low) === sg)));
        if (st && this.enterStair(st, st.head === b.floor ? 'head' : 'foot')) return;
        if ((f.ledges || []).some((L) => L.side === sd && along >= L.a0 && along <= L.a1)) return this.startDrop(ax, sg);
        if (ax === 'x') { b.x = clamp(b.x, x0, x1); if (b.vx * sg > 0) b.vx = 0; } else { b.y = clamp(b.y, y0, y1); if (b.vy * sg > 0) b.vy = 0; }
        block();
      }
      if (deck) for (const cp of this.level.checkpoints || []) { // the deck's own checkpoint at the district edge
        if (!cp.deck || cp.off !== deck.off) continue;
        const res = circleRect(b.x, b.y, r, this.checkZone(cp));
        if (res) { b.x += res.nx * res.pen; b.y += res.ny * res.pen; block(); }
      }
    }
    deckEdgeOpen(sd, dk) {
      const D = this.district;
      if (!D || dk.hz !== horiz(sd)) return false;
      const nx = D.cur[0] + SIDE[sd][0], ny = D.cur[1] + SIDE[sd][1];
      if (nx < 0 || ny < 0 || nx >= D.cols || ny >= D.rows) return false;
      return (cellLevel(D, [nx, ny], this.P).decks || []).some((q) => q.hz === dk.hz && q.off === dk.off && (q.z || 1) === (dk.z || 1));
    }
    // Off a ledge or broken parapet: velocity carries on, outward at least far enough to clear the edge. The dummy lands on the
    // nearest level below its landing point (a deck, else the ground). Fall time and landing speed grow with √height.
    startDrop(ax, sg) {
      const P = this.P, b = this.body, r = P['body.radius'], vmax = P['movement.runSpeed'], fromZ = b.level, ref = P['world.deckHeight'], fromKind = (this.floorOf() || {}).kind || null;
      let vx = b.vx, vy = b.vy;
      const sp = hyp(vx, vy);
      if (sp > vmax) { vx *= vmax / sp; vy *= vmax / sp; }
      const plan = (T) => { const o = Math.max((ax === 'y' ? vy : vx) * sg, (P['world.parapetWidth'] + 2 * r) / T) * sg; return ax === 'y' ? [vx, o] : [o, vy]; };
      let T = P['world.dropSeconds'] * Math.sqrt(zHeight(P, fromZ) / ref), [ux, uy] = plan(T), toZ = 0, toFloor = null;
      const lx = b.x + ux * T, ly = b.y + uy * T;
      (this.level.floors || []).forEach((q, i) => { if (q.z < fromZ && q.z > toZ && lx >= q.x && lx <= q.x + q.w && ly >= q.y && ly <= q.y + q.h) { toZ = q.z; toFloor = i; } });
      const h = zHeight(P, fromZ) - zHeight(P, toZ);
      T = P['world.dropSeconds'] * Math.sqrt(h / ref); [ux, uy] = plan(T);
      b.mode = 'drop'; b.lunge = null; b.stair = null; b.floor = null;
      b.drop = { t: 0, T, vx: ux, vy: uy, x0: b.x, y0: b.y, fromZ, toZ, toFloor, h, fromKind }; b.vx = ux; b.vy = uy;
      this.emit('deck-drop', { x: +b.x.toFixed(1), y: +b.y.toFixed(1), from: fromZ, to: toZ, h, fromKind }); // fromKind: 'deck' or 'roof'
      this.mile('firstDeckDrop');
    }
    // Landing: on open ground or a deck the dummy recovers; on a car it scores a hit from above (dropImpact) to the legs.
    land(contacts, k) {
      const P = this.P, b = this.body, r = P['body.radius'], d = b.drop, v = P['damage.dropSpeed'] * Math.sqrt(d.h / P['world.deckHeight']);
      b.level = d.toZ; b.floor = d.toFloor; b.drop = null; b.vx = 0; b.vy = 0; b.mode = 'recover'; b.recoverT = 0; // on its level again: meets() sees it
      for (const c of this.cars) {
        if (!this.meets(c)) continue;
        const res = circleCar(b.x, b.y, r, c);
        if (!res) continue;
        c.touched = true; c.inEpisode = true;
        const ph = dropImpact(P, d.vx, d.vy, c, res, v);
        contacts.push({ k, car: c, closing: ph.un, ph, px: b.x, py: b.y, zone: zoneOf(res.qx, res.qy, c), carState: this.carCue(c), cause: c.cause, lunging: false,
          bodySpeed: v, carSpeed: c.v, stopped: c.v < 5 || !!(c.man && c.man.standoff), drop: true, dropZ: d.fromZ, dropFrom: d.fromKind });
        b.x += res.nx * res.pen; b.y += res.ny * res.pen;
        this.emit('land', { car: c.id, x: +b.x.toFixed(1), y: +b.y.toFixed(1), level: b.level, fromZ: d.fromZ, h: d.h, fromKind: d.fromKind });
        const kn = this.bounce(ph.knock); b.mode = 'knock'; b.lunge = null; b.knockT = 0; b.knockVx = kn.x; b.knockVy = kn.y; b.vx = kn.x; b.vy = kn.y;
        return;
      }
      this.emit('land', { car: null, x: +b.x.toFixed(1), y: +b.y.toFixed(1), level: b.level, fromZ: d.fromZ, h: d.h, fromKind: d.fromKind });
      b.mode = 'recover'; b.recoverT = 0;
    }
    moveCones(h) {
      const P = this.P, r = P['props.cone.radius'];
      for (const cn of this.cones) {
        if (cn.state !== 'free' && cn.state !== 'flight') continue;
        if (cn.state === 'flight') {
          const ox = cn.x, oy = cn.y;
          cn.x += cn.vx * h; cn.y += cn.vy * h; cn.flightT -= h;
          const carHit = this.cars.find((c) => lay(c) === 0 && circleCar(cn.x, cn.y, r, c));
          const hit = cn.x < r || cn.y < r || cn.x > P['world.width'] - r || cn.y > P['world.height'] - r ||
            this.level.statics.some((s) => circleRect(cn.x, cn.y, r, s)) || !!carHit;
          if (hit) {
            cn.x = ox; cn.y = oy; cn.state = 'free'; cn.vx = cn.vy = 0; this.emit('cone-stop', { cone: cn.id });
            if (carHit && cn.kind === 'throw' && P['scoring.coneLink'] && carHit.v > 5 && !carHit.coned && this.body && this.body.alive) { // Edit 79: a thrown cone into a moving car links the combo, once a car
              carHit.coned = true; const cl = this.comboLink('cone', P['scoring.coneHitPoints']); this.run.points += P['scoring.coneHitPoints'] * cl.mult;
              this.emit('cone-hit', { cone: cn.id, car: carHit.id, n: cl.n, mult: cl.mult, kinds: cl.kinds.slice(), points: Math.round(P['scoring.coneHitPoints'] * cl.mult) });
            }
          }
          else if (cn.flightT <= 1e-9) { cn.state = 'free'; cn.vx = cn.vy = 0; this.emit('cone-rest', { cone: cn.id, x: +cn.x.toFixed(2), y: +cn.y.toFixed(2) }); }
          continue;
        }
        for (const c of this.cars) {
          if (lay(c) !== 0) continue;
          const res = circleCar(cn.x, cn.y, r, c);
          if (!res) continue;
          // Cars shove cones sideways, never ahead of themselves.
          const ca = Math.cos(c.h), sa = Math.sin(c.h), dx = cn.x - c.x, dy = cn.y - c.y;
          const lx = clamp(dx * ca + dy * sa, -c.L / 2, c.L / 2), side = (-dx * sa + dy * ca) >= 0 ? 1 : -1, ly = side * (c.W / 2 + r + 1);
          cn.x = c.x + lx * ca - ly * sa; cn.y = c.y + lx * sa + ly * ca;
          this.emit('cone-struck', { cone: cn.id, car: c.id });
        }
      }
    }

    // ----- fleet (P1.1: path-following sensors, distance-based eased swerves, signalled returns)
    admit() {
      const P = this.P;
      if (this.slot >= this.schedule.length) return;
      if (this.t + 1e-9 < this.nextAt) return;
      if (this.jammed(0)) return; // P4 (Edit 49): no new cars while the ground traffic is jammed
      const sl = this.schedule[this.slot];
      if (sl.cls === 'bus' && !(this.netOn() ? this.net.busOK : this.busRoad())) sl.cls = 'sedan'; // P5 (Edit 50): a bus only on a road whose bends all keep vehicles.bus.minRadius
      const L = P['vehicles.' + sl.cls + '.length'], vc = P['vehicles.' + sl.cls + '.cruiseSpeed'];
      const room = L * P['traffic.entryRoomLengths'] + P['traffic.minimumGap'] + L / 2;
      // P4 (Edit 49): also room to stop from cruise behind the last car in, at hard braking (no car spawns into a queue)
      const path = this.level.lanes[sl.lane], along = (c) => { if (c.lane === sl.lane) return c.s; if (!P['traffic.followRoad']) return Infinity; const pr = pathProject(path, c.x, c.y); return Math.abs(pr.lat) < 30 ? pr.s : Infinity; }; // P4: routes that share a lane share its entry
      if (this.cars.some((c) => lay(c) === 0 && along(c) - c.L / 2 < room + Math.max(0, vc * vc - c.v * c.v) / (2 * P['traffic.hardBraking']))) return;
      const c = this.newCar('car' + (++this.carSeq), sl.cls, sl.lane, this.level.lanes[sl.lane], L / 2, 0);
      c.slot = sl.i;
      this.cars.push(c); this.slot++; this.lastAdmit = this.t; this.run.admitted++;
      const nx = this.schedule[this.slot];
      this.nextAt = this.t + this.admissionInterval() * (nx ? nx.mult : 1);
      this.emit('admit', { car: c.id, cls: c.cls, model: c.model, lane: c.lane, fwdLen: +c.fwdLen.toFixed(2) });
    }
    // P4 (Edit 49.1): give way at a roundabout entry. A lane may carry giveWay = { s, cx, cy, R, dir, aj }: the stop line
    // (s, the nose stops there), the circulating lane it joins (centre, radius, direction of travel in angle) and the join angle.
    // Wait while a circulating car would reach the join within traffic.giveWayGap seconds, or is passing it.
    giveWayHold(c) {
      c._gwSkip = false; c._gwWhy = null; // Edit 71: _gwSkip: a leaving car's signal was read; _gwWhy: why the car holds (for tools/p6_rings.js and diagnostics)
      const g = c.path.giveWay, gap0 = this.P['traffic.giveWayGap'] > 0 ? (this.P['traffic.ringEntryGap'] != null ? this.P['traffic.ringEntryGap'] : this.P['traffic.giveWayGap']) : 0; // Edit 71: the ring's own entry gap
      if (!g || !(gap0 > 0) || lay(c) !== 0) return null;
      const toLine = g.s - (c.s + c.L / 2);
      if (toLine > this.P['traffic.giveWayWindow']) return null;
      // Over the line: committed (6.1). Edit 72: a car held as it rolls up (under half traffic.giveWaySpeed) overshoots by its
      // braking distance at traffic.comfortBraking; it still holds until it is past the line by more than 4 plus that.
      if (toLine < -4 && (c.v >= this.P['traffic.giveWaySpeed'] / 2 || toLine < -4 - c.v * c.v / (2 * this.P['traffic.comfortBraking']))) return null;
      const gap = gap0, line = g.s - c.L / 2;
      const om = this.P['traffic.ringOrbitMax'];
      if (om > 0 && c.path.ring && this.ringExitBlocked(c)) { // Edit 56: a car whose exit is blocked waits at the line once traffic.ringOrbitMax cars already orbit (orbiters fill a ring and lock it)
        let n = 0; for (const o of this.cars) if (o !== c && o.orbit && o.path.ring && o.path.ring.cx === g.cx && o.path.ring.cy === g.cy) n++;
        if (n >= om) { c._gwWhy = 'orbiters'; return { line: g.s - c.L / 2 }; }
      }
      const fill = this.P['traffic.ringFill'];
      if (fill > 0) { // Edit 53.1: the ring takes a car only while its cars fill less than traffic.ringFill of the outer lane (a full ring locks)
        let used = c.L + this.P['traffic.minimumGap'];
        for (const o of this.cars) if (o !== c && lay(o) === 0 && o.path.giveWay && o.path.giveWay.cx === g.cx && o.path.giveWay.cy === g.cy && o.s + o.L / 2 > o.path.giveWay.s && o.path.ring && o.s < o.path.ring.exitS) used += o.L + this.P['traffic.minimumGap'];
        if (used > fill * 2 * Math.PI * g.R) { c._gwWhy = 'fill'; return { line: g.s - c.L / 2 }; }
      }
      for (const o of this.cars) {
        if (o === c || lay(o) !== 0 || (Math.abs(hyp(o.x - g.cx, o.y - g.cy) - g.R) > 22 && !(o.orbit && o.orbit.lane === 'out' && hyp(o.x - g.cx, o.y - g.cy) < g.R))) continue; // P5 (Edit 52): a car moving out of the inner lane counts as circulating
        if (o.path.giveWay && o.path === c.path) continue;
        const ao = Math.atan2(o.y - g.cy, o.x - g.cx), d = ((((g.aj - ao) * g.dir) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), arc = d * g.R;
        const og = o.path.giveWay, org = o.path.ring;
        if (og && org && og.cx === g.cx && og.cy === g.cy && !o.orbit && o.s < org.exitS && this.turnSignal(o) === pathSignal(o.path).exitSide && org.exitS - o.s + o.L < arc - c.L / 2 && !this.ringExitBlocked(o)) { c._gwSkip = true; continue; } // (in the outer lane, its exit clear: it will leave) // Edit 71: it signals to leave before this entry, as a real driver reads it: go
        if (arc < Math.max(o.v, 20) * gap + o.L || arc > 2 * Math.PI * g.R - o.L) { c._gwWhy = ['gap', o.id, Math.round(arc), Math.round(o.v)]; return { line }; }
        if (o.v < 15 && 2 * Math.PI * g.R - arc < c.L + o.L / 2 + this.P['traffic.minimumGap'] + this.P['traffic.ringLaneChange']) { c._gwWhy = ['stopped', o.id, Math.round(2 * Math.PI * g.R - arc), Math.round(o.v)]; return { line }; } // Edit 53.1: never join onto a stopped ring (the ring would fill and lock)
      }
      return null;
    }
    // P4 (Edit 49.1): c is joining a ring past its give-way line; o circulates upstream of c's join. The give-way rule has
    // already judged o; c does not also follow it (else c and o each wait for the other).
    mergingPast(c, o) {
      const g = c.path.giveWay, go = o.path.giveWay;
      if (!g || !go || c.yielding || go.cx !== g.cx || go.cy !== g.cy || c.s + c.L / 2 <= g.s || c.s > g.sj + c.L) return false;
      if (o.s <= go.sj || Math.abs(hyp(o.x - g.cx, o.y - g.cy) - g.R) > 22) return false;
      const ao = Math.atan2(o.y - g.cy, o.x - g.cx), d = ((((g.aj - ao) * g.dir) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * g.R;
      return d > 0 && d < 300;
    }
    // P4 (Edit 49.3): give way at a junction. A lane may carry junction = { rank, line, zones: [{ lane, s0, s1, o0, o1 }] }:
    // its priority (0 = major road), the give-way line (s where the nose stops) and the spans where it meets each other lane.
    jRank(o) { const j = o.path.junction; return j ? j.rank : 0; }
    jCommitted(o) { const j = o.path.junction; return !!(j && j.line != null && o.s + o.L / 2 > j.line + 1); }
    // Wait at the line while a car with priority is in a shared span, or would reach it within traffic.giveWayGap s, or before
    // this car, from a standstill, is into a merge or clear of a crossing (plus perception.reactionDelay). A car of lower
    // priority counts only once it has crossed its own line. Same rank: first in goes.
    junctionHold(c) {
      const J = c.path.junction, P = this.P, gap = P['traffic.giveWayGap'];
      if (!J || J.line == null || !(gap > 0) || lay(c) !== 0) return null;
      const nose = c.s + c.L / 2, toLine = J.line - nose;
      if (toLine < -1 || toLine > 200) return null; // over the line: committed
      const patient = (c.stopT || 0) >= P['traffic.gridlockSeconds']; // P5.3: after a long wait, go when every approaching car can stop for it (it lets a committed car in)
      for (const z of J.zones) {
        const ln = this.level.lanes[z.lane];
        for (const o of this.cars) {
          if (o === c || o.path !== ln || lay(o) !== 0) continue;
          const ro = this.jRank(o), oc = this.jCommitted(o);
          if (ro > J.rank && !oc) continue;
          if (ro === J.rank && !oc && !(o.slot < c.slot && o.path.junction.line - (o.s + o.L / 2) < 60)) continue;
          const on = o.s + o.L / 2, ot = o.s - o.L / 2;
          if (on > z.o0 && ot < z.o1 + 2) return { line: J.line - c.L / 2 };
          const dist = z.o0 - on; if (dist < 0) continue;
          const away = !oc && dist > o.L; // P5.3: only a car short of its line and a length off the conflict, never one already in the junction
          if (away && o.v < 2 && ((o.stopT || 0) >= P['traffic.gridlockSeconds'] || this.queuedBehind(o))) continue; // P5.3: a car stopped in a queue, or stopped traffic.gridlockSeconds, is not coming (waits that would close a circle)
          if (patient && away && dist > o.v * o.v / (2 * P['traffic.comfortBraking']) + P['traffic.minimumGap'] + o.L / 2) continue;
          const tc = Math.sqrt(2 * Math.max(0, (z.merge ? z.s0 : z.s1 + c.L) - nose) / P['traffic.acceleration']); // from a standstill: into a merge, or tail clear of a crossing
          if (dist < Math.max(o.v, 20) * Math.max(gap, tc + P['perception.reactionDelay']) + o.L) return { line: J.line - c.L / 2 };
        }
      }
      return null;
    }
    queuedBehind(o) { const ld = this.leadGap(o); return !!(ld && ld.car && ld.car.v < 2 && ld.gap < this.P['traffic.minimumGap'] + o.L / 2); } // P5.3: stopped nose to tail behind a stopped car
    // A car that has crossed its line: the cars it gives way to let it in. Returns the speed limit for c (Infinity if none).
    junctionLetIn(c) {
      const J = c.path.junction, P = this.P;
      c.letIn = null;
      if (!J || !(P['traffic.giveWayGap'] > 0) || lay(c) !== 0) return Infinity;
      const nose = c.s + c.L / 2; let v = Infinity;
      for (const z of J.zones) {
        const ahead = z.s0 - nose; if (ahead < -2 || ahead > 300) continue;
        const ln = this.level.lanes[z.lane];
        for (const o of this.cars) {
          if (o === c || o.path !== ln || lay(o) !== 0 || this.jRank(o) <= J.rank || !this.jCommitted(o) || o.s - o.L / 2 > z.o1 + 2) continue;
          if (o === c.untangle) continue; // P5.3: a car locked against this one is not let in (it cannot come)
          const lim = Math.sqrt(2 * P['traffic.comfortBraking'] * Math.max(0, ahead - P['traffic.minimumGap']));
          if (lim < v) { v = lim; c.letIn = o; }
        }
      }
      return v;
    }
    // c need not follow o: o waits at its line for c, or c is going and the give-way already judged o.
    junctionPast(c, o) {
      const J = c.path.junction; if (!J || !o.path.junction) return false;
      const z = J.zones.find((q) => this.level.lanes[q.lane] === o.path); if (!z || o.s + o.L / 2 > z.o0) return false;
      if (this.jRank(o) > J.rank) return !this.jCommitted(o);
      return this.jCommitted(c) && c.s + c.L / 2 < z.s1 + c.L;
    }
    // P4 (Edit 49): jammed traffic on a level. A car stopped traffic.gridlockSeconds whose wait leads, car by car, to no dummy
    // or cone (a cycle, or a car that waits for nothing) is jammed. Waiting behind a dummy in the road is play, not a jam.
    jamCause(c, seen) {
      if (c.hz && c.hz.inPath) return 'body';
      if (c.yielding) return 'giveway'; // P4 (Edit 49.1): waiting for a gap at a roundabout entry
      if (c.orbit && c.orbit.wait != null && c.orbit.wait < 4) return 'ring'; // P5 (Edit 52): on the inner lane, waiting to move out
      if (c.letOut && this.cars.includes(c.letOut) && c.v < 2) { if (seen.has(c.letOut)) return 'cycle'; seen.add(c); return this.jamCause(c.letOut, seen); } // letting an inner-lane car out
      const ln = c.path.junction && c.path.junction.line != null ? c.path.junction.line : c.path.giveWay ? c.path.giveWay.s : null;
      if (ln != null && this.P['traffic.giveWayGap'] > 0 && Math.abs(c.s + c.L / 2 - ln) < 4) return 'giveway'; // P4 (Edit 49.3): at its line, waiting or just let go
      if (c.letIn && this.cars.includes(c.letIn) && c.v < 2) { if (seen.has(c.letIn)) return 'cycle'; seen.add(c); return this.jamCause(c.letIn, seen); } // P4 (Edit 49.3)
      if (this.blockingCone(c)) return 'cone';
      if (c.v >= 2) return 'moving';
      const lead = this.leadGap(c); // the car it waits behind, however far back it stopped
      if (!lead) return 'none';
      if (seen.has(lead.car)) return 'cycle';
      seen.add(c);
      return this.jamCause(lead.car, seen);
    }
    // Should this stopped car back up to clear a jam? (P4, Edit 49)
    needsRoom(c, depth) {
      const P = this.P, GT = P['traffic.gridlockSeconds'], lw2 = P['world.laneWidth'] / 2;
      if ((depth || 0) > 6 || (c.stopT || 0) < GT) return false;
      const cause = this.jamCause(c, new Set([c])), lead = this.leadGap(c);
      if (Math.abs(c.d) > lw2 && ['cycle', 'none'].includes(cause)) return true; // on the wrong side, going nowhere
      if (!lead) return false;
      const a = lead.car;
      if (!lead.oncoming && (a.stopT || 0) >= GT && this.rearBlocked(a) && (Math.abs(a.d) > lw2 && ['cycle', 'none'].includes(this.jamCause(a, new Set([a]))) || this.needsRoom(a, (depth || 0) + 1))) return true; // make room behind it
      const facing = lead.oncoming && Math.abs(a.d) <= lw2 && Math.abs(c.d) <= lw2 && (this.leadGap(a) || {}).car === c;
      return !!(facing && (this.rearBlocked(a) || this.cars.indexOf(c) > this.cars.indexOf(a)));
    }
    jammed(layer) {
      const T = this.P['traffic.gridlockSeconds'];
      if (!(T > 0)) return false;
      const jam = this.cars.filter((c) => lay(c) === layer && (c.stopT || 0) >= T && ['cycle', 'none'].includes(this.jamCause(c, new Set([c]))));
      const was = !!(this.jams && this.jams[layer]);
      if (!this.jams) this.jams = {};
      this.jams[layer] = jam.length > 0;
      if (jam.length && !was) this.emit('gridlock', { layer, cars: jam.map((c) => c.id) });
      if (!jam.length && was) this.emit('gridlock-clear', { layer });
      return jam.length > 0;
    }
    // One car of a model on a lane path. layer: 0 ground, 1 or 2 its deck's level (Edit 44). Deck cars run the same driver.
    newCar(id, cls, lane, path, s, layer) {
      const P = this.P, m = this.models[cls], step = P['learning.playerHitStep'], cruise = P['vehicles.' + cls + '.cruiseSpeed'] * (layer > 0 ? P['traffic.deckSpeedScale'] : 1); // P5: highways run faster
      const c = {
        id, slot: -1, cls, model: m.id, lane, path, layer, deck: layer > 0,
        L: P['vehicles.' + cls + '.length'], W: P['vehicles.' + cls + '.width'], cruise,
        s, d: 0, v: cruise, slope: 0,
        applied: m.applied, fwdLen: P['perception.forwardLength'] * (1 + step * m.applied), standoff: this.modelStandoff(m), standoffApplied: m.standoffApplied,
        state: 'cruise', senseT: 0, man: null, cause: null, spent: false, inEpisode: false, touched: false,
        clearT: 0, interruptT: 0, det: { fwd: null, side: false }, intent: null, intentFor: null, signal: null, dodge: null,
        x: 0, y: 0, h: 0, vx: 0, vy: 0,
      };
      this.pose(c);
      return c;
    }
    // Learned stopping distance: each hit taken while stopped for the dummy pushes that model's stop line back.
    modelStandoff(m) { const P = this.P; return Math.min(P['proto.learn.standoffMax'], P['proto.standoffDistance'] + P['proto.learn.standoffStep'] * m.standoffApplied); }
    admissionInterval() { const v = this.isCity ? dpar(this.P, this.levelId, 'interval') : this.P['proto.traffic.' + this.levelId + '.interval']; return v != null ? v : this.P['run.admissionInterval']; }
    // ----- overground traffic (Edit 42): full drivers on each deck lane (level 2), one car every world.deckInterval.
    // They are off the run's schedule: not admitted, not counted in CARS LEFT, and gone when they leave the screen.
    deckCls(n) { const vs = this.isCity ? dpar(this.P, this.levelId, 'vanShare') : 0; return fleetClass(this.P, vs, (n * 0.6180339887 + 0.21) % 1); } // P5: decks run straight, so buses ride them
    // P5 (Edit 50): may a bus run this screen's ground road? Every on-screen bend of its centre line keeps vehicles.bus.minRadius; no ring.
    busRoad() {
      const lv = this.level;
      if (lv._busR == null) lv._busR = lv.ring ? 0 : minBend(lv.center, this.P['world.width'], this.P['world.height']);
      return lv._busR >= this.P['vehicles.bus.minRadius'] * 0.9; // measured on screen, 10% polyline tolerance (as contract clause 25)
    }
    addDeckCar(i, s, cls) {
      const n = ++this.deckSeq, ln = this.level.deckLanes[i], dk = this.level.decks[ln.deck], c = this.newCar('deck' + n, cls || this.deckCls(n), 2 + i, ln.path, s, (dk && dk.z) || 1);
      c.deckIdx = ln.deck;
      this.cars.push(c);
      return c;
    }
    fillDeckCars() { // a screen is entered with its flyovers already running; never on top of a dummy on the deck
      const P = this.P, b = this.body, gap = P['world.deckInterval'] * P['traffic.deckGapScale'] * P['vehicles.sedan.cruiseSpeed'] * P['traffic.deckSpeedScale'], lanes = this.level.deckLanes || []; // P5: fewer, faster
      this.deckNext = {};
      lanes.forEach((ln, i) => {
        for (let s = ln.path.length - P['vehicles.van.length'] - gap * (0.3 + 0.4 * ((i * 0.618 + 0.1) % 1)); s > P['vehicles.van.length']; s -= gap) {
          const p = pathAt(ln.path, s);
          if (b && b.alive && this.bodyDeck() === ln.deck && hyp(p.x - b.x, p.y - b.y) < P['vehicles.van.length'] * 2) continue;
          this.addDeckCar(i, s);
        }
        this.deckNext[i] = this.t + P['world.deckInterval'] * P['traffic.deckGapScale'] * (0.4 + 0.5 * ((i * 0.618 + 0.3) % 1));
      });
    }
    admitDeck() {
      const P = this.P;
      const src = this.netOn() ? this.netCur.tr.deckSrc : this.deckSrc || null; // P5.3: a highway is fed only where it enters the district (deckSrc: set by a district mock-up)
      (this.level.deckLanes || []).forEach((ln, i) => {
        if (src && !src.has(i)) return;
        if (this.t + 1e-9 < this.deckNext[i]) return;
        const dk = this.level.decks[ln.deck]; if (this.jammed((dk && dk.z) || 1)) return; // P4: nor onto a jammed deck
        const cls = this.deckCls(this.deckSeq + 1), L = P['vehicles.' + cls + '.length'], room = L * P['traffic.entryRoomLengths'] + P['traffic.minimumGap'] + L / 2, vc = P['vehicles.' + cls + '.cruiseSpeed'] * P['traffic.deckSpeedScale'];
        if (this.cars.some((c) => c.lane === 2 + i && c.s - c.L / 2 < room + Math.max(0, vc * vc - c.v * c.v) / (2 * P['traffic.hardBraking']))) return; // P5.3: as on the ground, never into a queue (room to stop from highway cruise)
        const c = this.addDeckCar(i, 0, cls); c.s = c.L / 2; this.pose(c);
        this.deckNext[i] = this.t + P['world.deckInterval'] * P['traffic.deckGapScale'] * (0.8 + 0.4 * ((this.deckSeq * 0.618) % 1)); // P5: traffic.deckGapScale
      });
    }
    pose(c, h) {
      HEADING_BLEND = this.P['proto.headingBlend'] || 0; // Edit 71: smooth heading under the hood (0: the stepped heading of P3–P5)
      const p = pathAt(c.path, c.s, true);
      c.x = p.x + p.nx * c.d; c.y = p.y + p.ny * c.d;
      c.vx = (p.tx + p.nx * c.slope) * c.v; c.vy = (p.ty + p.ny * c.slope) * c.v;
      const target = Math.atan2(p.ty + p.ny * c.slope, p.tx + p.nx * c.slope);
      c.h = h ? turnTo(c.h, target, this.P['proto.carYawRate'] * DEG * h) : target;
    }
    // P3: which body part took the hit. Side from the contact point against the dummy's facing;
    // height from the hit's size: bumper height hits the legs, harder hits reach the torso and arms, the hardest the head.
    partShare(k) { const b = this.body; return b && b.parts ? b.parts[k] / this.maxHealth() : 0; }
    // Ability multiplier from part damage, in [floor, 1]. 1 when proto.parts.effects is off.
    partEffect(kind) {
      const P = this.P;
      if (!P['proto.parts.effects']) return 1;
      const legs = this.partShare('legL') + this.partShare('legR'), arms = this.partShare('armL') + this.partShare('armR'); // Edit 77: × the track's shield
      if (kind === 'dash') return Math.max(P['movement.wearFloor'], 1 - P['proto.parts.legDashLoss'] * legs * this.shield('legs'));
      if (kind === 'push') return Math.max(P['proto.parts.armPushFloor'], 1 - P['proto.parts.armPushLoss'] * arms * this.shield('arms')); // Edit 80: arm damage weakens the push; Arms shields it
      if (kind === 'recharge') return P['proto.abilities'] ? Math.max(P['proto.parts.torsoRechargeFloor'], 1 - P['proto.parts.torsoRechargeLoss'] * this.partShare('torso') * this.shield('battery')) : 1;
      const t = { speed: ['legSpeed', legs * this.shield('legs')], turn: ['torsoTurn', this.partShare('torso') * this.shield('battery')],
        view: ['headCone', this.partShare('head')], throw: ['armThrow', arms * this.shield(P['proto.abilities'] === 2 ? 'arms' : 'throw')] }[kind];
      return Math.max(P['proto.parts.' + t[0] + 'Floor'], 1 - P['proto.parts.' + t[0] + 'Loss'] * t[1]);
    }
    armsBroken() { const P = this.P, k = this.shield(P['proto.abilities'] === 3 ? 'hands' : 'arms'); return !!P['proto.parts.effects'] && this.partShare('armL') * k >= P['proto.parts.brokenShare'] && this.partShare('armR') * k >= P['proto.parts.brokenShare']; } // Edit 77: Arms levels hold the grip
    coneWidth() { return this.P['sensing.coneWidth'] * this.partEffect('view'); }
    partOf(px, py, assessed, legs) {
      const P = this.P, b = this.body, a = Math.atan2(py - b.y, px - b.x) - b.facing, side = Math.sin(a) >= 0 ? 'R' : 'L';
      if (legs) return 'leg' + side;
      if (assessed >= P['proto.parts.headFrom']) return 'head';
      if (assessed >= P['proto.parts.torsoFrom']) return Math.abs(Math.sin(a)) >= 0.7 ? 'arm' + side : 'torso';
      return 'leg' + side;
    }
    occluded(self, x0, y0, x1, y1) { // ground statics hide only from ground cars; vans hide on their own level
      const l = self ? lay(self) : 0;
      if (l === 0 && this.level.statics.some((s) => segRect(x0, y0, x1, y1, s))) return true;
      return this.cars.some((c) => c !== self && lay(c) === l && (c.cls === 'van' || c.cls === 'bus') && segCar(x0, y0, x1, y1, c)); // P5: a bus hides like a van
    }
    // Lateral offset the car will hold at path coordinate s under its current plan.
    plannedD(c, s) {
      const m = c.man;
      if (!m || m.type !== 'shift') return c.d;
      return m.d0 + (m.d1 - m.d0) * ease(clamp((s - m.s0) / m.len, 0, 1));
    }
    perceive(c) {
      const P = this.P, b = this.body, res = { fwd: null, side: false };
      const ca = Math.cos(c.h), sa = Math.sin(c.h), nx = c.x + ca * c.L / 2, ny = c.y + sa * c.L / 2;
      const targets = [];
      if (this.meets(c)) targets.push({ kind: 'body', id: 'body', x: b.x, y: b.y, r: P['body.radius'] });
      if (lay(c) === 0) for (const cn of this.cones) if (cn.state === 'free' || cn.state === 'flight') targets.push({ kind: 'cone', id: cn.id, x: cn.x, y: cn.y, r: P['props.cone.radius'] });
      for (const tg of targets) {
        const pr = pathProject(c.path, tg.x, tg.y), ahead = pr.s - c.s - c.L / 2, lat = pr.lat - c.d;
        const dx = tg.x - nx, dy = tg.y - ny, d = hyp(dx, dy), lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        // On the route ahead, and (straight sensor) inside the beam along the car's heading.
        const inFwd = tg.kind === 'cone' && ahead >= -tg.r && ahead <= c.fwdLen && Math.abs(lat) <= c.W / 2 + tg.r &&
          (!P['proto.sensorStraight'] || this.inBeam(c, lx, ly, tg.r));
        const inSide = tg.kind === 'body' && d <= P['perception.sideRadius'] && d > 1e-9 &&
          Math.acos(Math.min(1, Math.abs(ly) / d)) <= P['perception.sideHalfAngle'] * DEG && lx > -c.L;
        if (!inFwd && !inSide) continue;
        if (this.occluded(c, nx, ny, tg.x, tg.y)) continue;
        if (inFwd && (!res.fwd || ahead < res.fwd.lx)) res.fwd = Object.assign({}, tg, { lx: ahead, ly: lat, s: pr.s });
        if (inSide) res.side = true;
      }
      return res;
    }
    // Forward sensor: a rectangle from the nose along the heading. It does not bend with the road.
    inBeam(c, lx, ly, r) { return lx >= -r && lx <= c.fwdLen && Math.abs(ly) <= c.W / 2 + r; }
    // The dummy as a pedestrian hazard. inPath: inside the car's swept width ahead. Otherwise near: within the caution zone.
    // Straight sensor: the driver sees a straight field ahead; the stop needs the dummy in the forward beam.
    assessBody(c) {
      const P = this.P, b = this.body;
      if (!this.meets(c)) return null; // a dummy on another level, on a stair or in the air is out of the driver's world
      const pr = pathProject(c.path, b.x, b.y), ahead = pr.s - c.s - c.L / 2;
      if (ahead < -c.L || ahead > c.fwdLen) return null;
      const lat = pr.lat - c.d, gapLat = Math.abs(lat) - c.W / 2 - P['body.radius'];
      if (gapLat > P['proto.driver.cautionZone']) return null;
      const ca = Math.cos(c.h), sa = Math.sin(c.h), nx = c.x + ca * c.L / 2, ny = c.y + sa * c.L / 2, br = P['body.radius'];
      let inPath = gapLat <= 0 && ahead > -br;
      if (P['proto.sensorStraight']) {
        const dx = b.x - nx, dy = b.y - ny, fx = dx * ca + dy * sa, fy = -dx * sa + dy * ca;
        if (fx < -c.L - br || fx > c.fwdLen + br || Math.abs(fy) > c.W / 2 + br + P['proto.driver.cautionZone']) return null;
        if (inPath && !this.inBeam(c, fx, fy, br)) inPath = false;
      }
      if (this.occluded(c, nx, ny, b.x, b.y)) return null;
      return { kind: 'body', id: 'body', inPath, lx: ahead, ly: lat, gapLat, s: pr.s, r: br };
    }
    // P5 (Edit 52): the inner ring lane. Cars join the ring on its outer lane (giving way, Edit 49.1). A circulating car
    // whose exit is blocked, or that is stuck behind a car crawling below traffic.ringPassRatio of its cruise, moves to the
    // inner lane when it is clear (traffic.ringMergeGap s behind) and orbits there. It moves back out only in the window
    // before its exit, when the exit and the outer lane beside it are clear; else it goes round again, up to
    // traffic.ringMaxLaps, then waits on the inner lane for a gap. Entering cars give way to the outer lane only.
    ringStep(c) {
      const P = this.P, rg = c.path.ring;
      if (!rg || !(P['traffic.ringOrbit'] > 0) || lay(c) !== 0) return false;
      const g = c.path.giveWay, Lc = P['traffic.ringLaneChange'];
      if (c.orbit && c.orbit.lane === 'out' && Math.abs(c.d) < 0.5) { c.orbit = null; c.ringOutT = this.t; }
      const shift = (d1, vR) => this.commit(c, { type: 'shift', d1, len: Lc, vCap: Math.min(c.cruise, Math.sqrt(P['traffic.cornerAccel'] * vR)) }, 'ring', null);
      if (c.orbit && c.orbit.lane === 'in' && c.s >= rg.exitS - 2) { // past the change point on the inner lane (never planned): move out when the lane is clear
        if (this.ringLaneClear(c, false)) { c.orbit.lane = 'out'; c.orbit.wait = null; shift(0, rg.Rout); return true; }
        c.orbit.wait = 0; return false;
      }
      if (c.s <= g.sj + c.L / 2 || c.s >= rg.exitS) return false;
      const q = pathAt(c.path, c.s), inward = (rg.cx - q.x) * q.nx + (rg.cy - q.y) * q.ny > 0 ? 1 : -1, dIn = inward * P['world.laneWidth'];
      const lap = 2 * Math.PI * rg.Rout, rem0 = rg.exitS - c.s;
      if (!c.orbit) { // move in for a blocked exit, or to pass a stopped or crawling car, any time before the change point
        const spare = rem0 - Lc - 20, ie = P['traffic.ringInnerExit'], far = !(ie > 0) || (rg.exitNo || 0) >= ie, blocked = this.ringExitBlocked(c);
        if (!far && !blocked) return false; // Edit 54: only a car leaving at traffic.ringInnerExit or later (the third exit, 270°) uses the inner lane; a blocked exit means a full lap more, so that car may too
        const plan = far && ie > 0 && !c.ringInnerDone; // ...and it moves in once it has joined
        if (spare < 0 || this.t - (c.ringOutT || -9) < 3 || !(plan || blocked || (far && spare > Lc && this.ringCrawl(c))) || !this.ringLaneClear(c, true)) return false;
        if (plan) c.ringInnerDone = true;
        c.orbit = { lane: 'in', laps: 0 }; shift(dIn, rg.Rin); this.emit('ring', { car: c.id, to: 'inner', planned: plan }); return true;
      }
      if (c.orbit.lane === 'out' && Math.abs(c.d) > 0.5) { // a move out was cut short: finish it, or go back in
        if (this.ringLaneClear(c, false)) shift(0, rg.Rout); else { c.orbit.lane = 'in'; shift(dIn, rg.Rin); } return true;
      }
      if (c.orbit.lane !== 'in') return false;
      if (Math.abs(c.d - dIn) > 0.5) { shift(dIn, rg.Rin); return true; } // a move in was cut short: finish it
      const rem = rg.exitS - c.s, last = false; // Edit 53.1: every lap can repeat
      if (rem < Lc + 0.5 * lap && rem > (last ? 0 : Lc + 8) && (last || !this.ringExitBlocked(c)) && this.ringLaneClear(c, false)) {
        c.orbit.lane = 'out'; c.orbit.wait = false; shift(0, rg.Rout); this.emit('ring', { car: c.id, to: 'outer', laps: c.orbit.laps }); return true;
      }
      if (rem <= Lc + 10) { this.ringLap(c); c.orbit.laps++; }
      c.orbit.wait = null; // Edit 53.1: no last lap; the car orbits until its exit and the outer lane are clear (a waiting car could lock the ring)
      return false;
    }
    ringKeep(c) {
      const rg = c.path.ring, P = this.P;
      if (!rg || !c.orbit || c.orbit.lane !== 'in' || !(P['traffic.ringOrbit'] > 0)) return;
      if (rg.exitS - c.s <= P['traffic.ringLaneChange'] + 10) { this.ringLap(c); c.orbit.laps++; }
    }
    ringLap(c) { // the same route with one more lap: identical up to here, so s carries over
      const rg = c.path.ring, nx = rg.variants[rg.k + 1];
      if (nx) { c.path = nx; return true; }
      if (rg.k < 1 || c.man) return false;
      c.s -= rg.exitS - rg.variants[rg.k - 1].ring.exitS; return true; // Edit 53.1: past traffic.ringMaxLaps the last lap repeats (the ring is periodic, so the car stays where it is)
    }
    ringExitBlocked(c) { // a stopped car, or the dummy, on the first traffic.ringExitCheck of the exit
      const rg = c.path.ring, P = this.P, pts = [];
      for (let ds = 0; ds <= P['traffic.ringExitCheck']; ds += 12) pts.push(pathAt(c.path, rg.exitS + ds));
      for (const o of this.cars) if (o !== c && lay(o) === 0 && o.v < 15 && pts.some((p) => hyp(o.x - p.x, o.y - p.y) < (o.L + c.W) / 2)) return true;
      const b = this.body;
      return !!(b && b.alive && lay(b) === 0 && pts.some((p) => hyp(b.x - p.x, b.y - p.y) < P['body.radius'] + c.W / 2 + 8));
    }
    ringCrawl(c) {
      const a = this.leadGap(c), P = this.P;
      return !!(a && a.gap < P['traffic.minimumGap'] + 2 * P['traffic.timeGap'] * Math.max(c.v, 20) && a.v < P['traffic.ringPassRatio'] * c.cruise);
    }
    ringLaneClear(c, inner) { // the target lane is clear beside, ahead and traffic.ringMergeGap s behind
      const rg = c.path.ring, P = this.P, R = inner ? rg.Rin : rg.Rout, ac = Math.atan2(c.y - rg.cy, c.x - rg.cx);
      for (const o of this.cars) {
        if (o === c || lay(o) !== 0) continue;
        const go = o.path.giveWay, joining = !inner && go && go.cx === rg.cx && go.cy === rg.cy && o.s + o.L / 2 > go.s - 30 && o.s < go.sj + o.L; // over (or at) its line: it is about to take the outer lane at its join
        if (!joining && Math.abs(hyp(o.x - rg.cx, o.y - rg.cy) - R) > 34) continue;
        const ao = joining ? go.aj + (go.sj - o.s) / R * (-rg.dir) : Math.atan2(o.y - rg.cy, o.x - rg.cx);
        let d = ((((ao - ac) * rg.dir) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI;
        const arc = d * R, body = (c.L + o.L) / 2;
        if (arc > -body - 6 - Math.max(0, o.v - c.v) * P['traffic.ringMergeGap'] - 0.25 * o.v && arc < body + 12 + (o.v < c.v ? P['traffic.ringLaneChange'] + (c.v - o.v) * 0.6 : 0)) return false; // room behind for a faster car; room ahead to finish the change behind a slower one
      }
      return true;
    }
    leadGap(c) {
      let best = null;
      const ca = Math.cos(c.h), sa = Math.sin(c.h), road = this.P['traffic.followRoad'];
      const rgc = c.path.ring, band = (q) => { const r = hyp(q.x - rgc.cx, q.y - rgc.cy); return r > rgc.Rin - 22 && r < rgc.Rout + 22; };
      const cRing = !!(rgc && lay(c) === 0 && c.s < rgc.exitS + 2 && band(c)), ac = cRing ? Math.atan2(c.y - rgc.cy, c.x - rgc.cx) : 0, rc = cRing ? hyp(c.x - rgc.cx, c.y - rgc.cy) : 0;
      for (const o of this.cars) {
        if (o === c || lay(o) !== lay(c)) continue;
        if (cRing && band(o)) { // P5 (Edit 52): on a two-lane ring, follow by arc and lane (radius); a path may loop, so no projection
          const ro = hyp(o.x - rgc.cx, o.y - rgc.cy);
          const wide = (q) => !!(q.orbit && q.man && q.man.type === 'shift'); // a car changing lanes holds both
          if (Math.abs(ro - rc) < (c.W + o.W) / 2 + 6 + (wide(c) || wide(o) ? this.P['world.laneWidth'] : 0)) {
            const arc = ((((Math.atan2(o.y - rgc.cy, o.x - rgc.cx) - ac) * rgc.dir) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * rc;
            if (arc > 0 && arc < 420 && !this.mergingPast(c, o)) { const gap = arc - (c.L + o.L) / 2; if (!best || gap < best.gap) best = { gap, v: o.v, car: o, oncoming: false }; }
          }
          continue;
        }
        if (cRing && Math.abs(c.d) > 1) continue; // in or moving to the inner lane: only ring traffic matters (its offset would line up with the oncoming arm lane)
        let gap = null, v = 0, oncoming = false;
        if (o.lane === c.lane && (o.path === c.path || !(o.path.ring && c.path.ring))) { // Prototype 6.1: two laps of one ring route measure s apart by a lap; they follow by projection
          if (o.s > c.s && Math.abs(o.d - c.d) < (c.W + o.W) / 2 + 6) { gap = o.s - c.s - (c.L + o.L) / 2; v = o.v; }
        } else if (road) { // P4 (Edit 49): another lane's car counts only where it stands on this car's own route ahead, as the road bends
          if (hyp(o.x - c.x, o.y - c.y) > 460 || this.mergingPast(c, o) || this.junctionPast(c, o)) continue;
          const pr = pathProject(c.path, o.x, o.y), ahead = pr.s - c.s;
          if (ahead > 0 && ahead < 420 && Math.abs(pr.lat - c.d) < (c.W + o.W) / 2 + 6) {
            const q = pathAt(c.path, pr.s); gap = ahead - (c.L + o.L) / 2; v = o.vx * q.tx + o.vy * q.ty; oncoming = Math.cos(o.h - Math.atan2(q.ty, q.tx)) < -0.5;
            if (oncoming) v = Math.min(0, v);
          }
        } else {
          const dx = o.x - c.x, dy = o.y - c.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
          if (lx > 0 && lx < 420 && Math.abs(ly) < (c.W + o.W) / 2 + 6) { gap = lx - (c.L + o.L) / 2; v = o.vx * ca + o.vy * sa; oncoming = Math.cos(o.h - c.h) < -0.5; if (oncoming) v = Math.min(0, v); }
        }
        if (gap != null && gap < 420 && (!best || gap < best.gap)) best = { gap, v, car: o, oncoming };
      }
      return best;
    }
    // Another car in the target lateral corridor. Oncoming traffic blocks it from much further away.
    corridorBlocked(c, dShift, crosses) {
      const ca = Math.cos(c.h), sa = Math.sin(c.h);
      return this.cars.some((o) => {
        if (o === c || lay(o) !== lay(c)) return false;
        const dx = o.x - c.x, dy = o.y - c.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        const oncoming = Math.cos(o.h - c.h) < -0.5;
        return lx > -c.L && lx < (oncoming && crosses && o.v >= 2 ? 900 : 280) && Math.abs(ly - dShift) < (c.W + o.W) / 2 + 6; // P5.3: a stopped oncoming car blocks only the pass itself
      });
    }
    oncomingAhead(c, range) {
      const ca = Math.cos(c.h), sa = Math.sin(c.h);
      return this.cars.some((o) => {
        if (o === c || lay(o) !== lay(c) || Math.cos(o.h - c.h) > -0.5) return false;
        const dx = o.x - c.x, dy = o.y - c.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        return lx > 0 && lx < range && Math.abs(ly) < (c.W + o.W) / 2 + 6;
      });
    }
    carBeside(c, shift) {
      const ca = Math.cos(c.h), sa = Math.sin(c.h);
      return this.cars.some((o) => {
        if (o === c || lay(o) !== lay(c)) return false;
        const dx = o.x - c.x, dy = o.y - c.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
        return Math.abs(lx) < (c.L + o.L) / 2 + 10 && Math.abs(ly - shift) < (c.W + o.W) / 2 + 4;
      });
    }
    bodyBeside(c, shift) {
      const b = this.body;
      if (!this.meets(c)) return false;
      const ca = Math.cos(c.h), sa = Math.sin(c.h), dx = b.x - c.x, dy = b.y - c.y;
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      return lx > -c.L / 2 - 40 && lx < c.L / 2 + 60 && Math.abs(ly - shift) < c.W / 2 + this.P['body.radius'] + 8;
    }
    // Smallest lateral move that clears the target and every free cone on the new route.
    // Prefer staying in lane; cross the centre line only into an empty lane.
    choose(c, tg, opts) {
      const P = this.P, lw = P['world.laneWidth'], r = P['props.cone.radius'];
      const passing = !!(opts && opts.pass);
      // The dummy in the lane: stop short of lunge range and wait. Pass only when asked, slowly, with clearance.
      if (tg.kind === 'body' && !passing) {
        const dist = tg.lx - c.standoff;
        if (c.v < 1) return { type: 'brake', v0: 0, a: P['traffic.comfortBraking'], vTarget: 0, sStop: Math.max(c.s, tg.s - c.L / 2 - c.standoff), standoff: true };
        const need = dist > 1 ? c.v * c.v / (2 * dist) : Infinity;
        if (need <= P['traffic.hardBraking']) {
          const a = need > P['traffic.comfortBraking'] ? P['traffic.hardBraking'] : P['traffic.comfortBraking'];
          return { type: 'brake', v0: c.v, a, vTarget: 0, sStop: tg.s - c.L / 2 - c.standoff, standoff: true };
        }
        // Slight overrun of the line at hard braking still counts as a planned stop (< 2 m).
        const sHard = c.s + c.v * c.v / (2 * P['traffic.hardBraking']);
        if (sHard - (tg.s - c.L / 2 - c.standoff) < 24) return { type: 'brake', v0: c.v, a: P['traffic.hardBraking'], vTarget: 0, sStop: sHard, standoff: true };
        return { type: 'brake', v0: c.v, a: P['traffic.hardBraking'], vTarget: 0, emergency: true };
      }
      const clear = passing ? P['proto.driver.passClearance'] : 4, ground = lay(c) === 0;
      // on a deck the parapet bounds the swerve: the car's outer side stays on the hard shoulder
      const dMin = -lw, dMax = ground ? P['proto.swerveOuter'] : Math.min(P['proto.swerveOuter'], P['world.deckWidth'] / 2 - P['world.parapetWidth'] - lw / 2 - c.W / 2), need = c.W / 2 + tg.r + clear;
      // A pass from a close stop pulls out steeply at walking pace. Edit 99 (P8.4): so does a slow car at a cone (proto.driver.coneSteepPass)
      const steep = passing || (tg.kind === 'cone' && P['proto.driver.coneSteepPass'] > 0 && c.v < P['proto.driver.passSpeed']);
      const len = steep ? clamp(tg.lx * 1.1, 40, P['proto.swerveLength']) : P['proto.swerveLength'];
      const cones = [];
      for (const cn of ground ? this.cones : []) {
        if (cn.state !== 'free') continue;
        const pr = pathProject(c.path, cn.x, cn.y);
        if (pr.s > c.s - c.L && pr.s < c.s + c.L / 2 + len + 160) cones.push(pr);
      }
      const statics = !ground ? [] : this.level.statics.filter((st) => hyp(st.x + st.w / 2 - c.x, st.y + st.h / 2 - c.y) < len + 260);
      const staticsClear = (d1) => {
        if (!statics.length) return true;
        for (let ds = 0; ds <= len + 60; ds += 12) {
          const s = c.s + ds, d = c.d + (d1 - c.d) * ease(clamp(ds / len, 0, 1)), p = pathAt(c.path, s);
          for (const o of [-c.L / 2, 0, c.L / 2]) {
            const q = pathAt(c.path, s + o), x = q.x + q.nx * d, y = q.y + q.ny * d;
            if (statics.some((st) => circleRect(x, y, c.W / 2 + 2, st))) return false;
          }
          void p;
        }
        return true;
      };
      const tgt = { s: tg.s != null ? tg.s : c.s + c.L / 2 + tg.lx, lat: c.d + tg.ly, rr: tg.r + clear };
      const targetClear = (d1) => [-c.L / 2, 0, c.L / 2].every((o) => {
        const d = c.d + (d1 - c.d) * ease(clamp((tgt.s + o - c.s) / len, 0, 1));
        return Math.abs(tgt.lat - d) >= c.W / 2 + tgt.rr;
      });
      const routeClear = (d1) => targetClear(d1) && staticsClear(d1) && cones.every((pr) => [-c.L / 2, 0, c.L / 2].every((o) => {
        const d = c.d + (d1 - c.d) * ease(clamp((pr.s + o - c.s) / len, 0, 1));
        return Math.abs(pr.lat - d) >= c.W / 2 + r + 2;
      }));
      const cands = new Set([Math.min(c.d, c.d + tg.ly - need), Math.max(c.d, c.d + tg.ly + need), dMin, dMax]);
      for (let d = Math.ceil(dMin / 4) * 4; d <= dMax; d += 4) cands.add(d);
      let best = null;
      if (P['vehicles.' + c.cls + '.swerve'] === 0) cands.clear(); // P5 (Edit 50): a bus only brakes; it cannot swerve (canon, fleet database)
      for (const d1 of cands) {
        const shift = d1 - c.d;
        if (Math.abs(shift) < 1 || d1 < dMin - 1e-9 || d1 > dMax + 1e-9) continue;
        if (Math.abs(tg.ly - shift) < need || !routeClear(d1)) continue;
        const crosses = d1 < -(lw / 2 - c.W / 2);
        if (this.corridorBlocked(c, shift, crosses)) continue;
        const cost = Math.abs(shift) + (crosses ? lw : 0);
        if (!best || cost < best.cost - 1e-9) best = { d1, cost };
      }
      if (best) return { type: 'shift', d0: c.d, d1: best.d1, len, v0: c.v, vCap: P['proto.driver.passSpeed'] };
      if (passing) return { type: 'brake', v0: 0, a: P['traffic.comfortBraking'], vTarget: 0, sStop: c.s, standoff: true };
      // Stop just short of the target, braking as late as comfort allows.
      const margin = 12 + tg.r, dist = Math.max(1, tg.lx - margin);
      const a = c.v * c.v / (2 * dist) > P['traffic.comfortBraking'] ? P['traffic.hardBraking'] : P['traffic.comfortBraking'];
      return { type: 'brake', v0: c.v, a, vTarget: 0, sStop: tg.s - c.L / 2 - margin };
    }
    // Corner speed (Edit 43): ahead within braking reach, never faster than √(traffic.cornerAccel × radius) at each bend,
    // braking for it at traffic.comfortBraking. Path radii are measured once per lane.
    cornerSpeed(c) {
      const P = this.P, path = c.path, a = P['traffic.cornerAccel'], b = P['traffic.comfortBraking'];
      if (!(a > 0)) return Infinity;
      if (!path.rad) path.rad = path.pts.map((q, i) => { const p0 = path.pts[i - 1], p2 = path.pts[i + 1]; if (!p0 || !p2) return Infinity; const A = hyp(q[0] - p0[0], q[1] - p0[1]), Bq = hyp(p2[0] - q[0], p2[1] - q[1]), Cq = hyp(p2[0] - p0[0], p2[1] - p0[1]), cr = Math.abs((q[0] - p0[0]) * (p2[1] - p0[1]) - (q[1] - p0[1]) * (p2[0] - p0[0])); return cr < 1e-6 ? Infinity : A * Bq * Cq / (2 * cr); });
      const s0 = c.s + c.L / 2, reach = c.v * c.v / (2 * b) + c.L, out = path.netOut || null; // set only where a lane goes on next door
      let v = Infinity;
      for (let i = 0; i < path.pts.length; i++) {
        const ds = path.cum[i] - s0;
        if (ds < -c.L) continue;
        if (ds > reach || (out && path.cum[i] > out.s)) break; // P5.3: past a shared edge the next screen's lane holds the road
        if (path.rad[i] === Infinity) continue;
        v = Math.min(v, Math.sqrt(a * path.rad[i] + 2 * b * Math.max(0, ds)));
      }
      if (out && s0 + reach > out.s) v = Math.min(v, this.cornerSpeed(Object.assign(Object.create(c), { path: out.path, s: c.s + out.ds })));
      return v;
    }
    manSpeed(c, man, tau, sAt) {
      const u = Math.max(0, tau - ((man.tv != null ? man.tv : man.t0) - man.t0));
      if (man.type === 'reverse') return -Math.min(this.P['proto.unstick.reverseSpeed'], this.P['traffic.acceleration'] * u);
      if (man.halt) return Math.max(0, man.v0 - this.P['traffic.hardBraking'] * u);
      if (man.type === 'brake' && man.sStop != null) {
        const s = sAt != null ? sAt : c.s, rem = Math.max(0, man.sStop - s);
        return Math.min(Math.max(man.v0, 0), Math.sqrt(2 * man.a * rem));
      }
      if (man.type === 'shift') {
        const top = man.vCap != null ? man.vCap : Math.max(c.cruise, man.v0);
        if (man.v0 > top) return Math.max(top, man.v0 - this.P['traffic.comfortBraking'] * u);
        return Math.min(top, man.v0 + this.P['traffic.acceleration'] * u);
      }
      return Math.max(man.vTarget, man.v0 - man.a * u);
    }
    // Seconds left on a commitment: at least the horizon, and long enough to finish the swerve.
    remaining(c, m) {
      const hz = m.t0 + this.P['traffic.commitHorizon'] - this.t;
      if (m.type !== 'shift') return Math.max(0, hz);
      let s = c.s, t = 0;
      const end = m.s0 + m.len;
      while (s < end && t < 8) { s += this.manSpeed(c, m, this.t - m.t0 + t) * 0.02; t += 0.02; }
      return Math.max(hz, t);
    }
    commit(c, man, cause, tg) {
      const m = Object.assign({}, man);
      m.t0 = this.t; m.tv = this.t; m.halt = false;
      if (m.type === 'shift') { m.s0 = c.s; m.d0 = c.d; m.v0 = c.v; }
      else m.v0 = c.v;
      m.until = this.t + this.remaining(c, m);
      c.man = m; c.state = 'committed'; c.cause = cause; c.intent = null; c.intentFor = null; c.signal = null;
      if (tg) c.dodge = { s: tg.s, id: tg.id };
      this.emit('commit', { car: c.id, man: m.type, cause, d1: m.d1 != null ? +m.d1.toFixed(2) : null });
    }
    obstacleAhead(c) {
      const P = this.P, r = P['props.cone.radius'];
      const stop = c.v * c.v / (2 * P['traffic.comfortBraking']) + P['traffic.minimumGap'] + 4;
      const ahead = this.leadGap(c);
      if (ahead && ahead.gap < stop + Math.max(0, -ahead.v) * 0.3) return 'car';
      for (const cn of lay(c) === 0 ? this.cones : []) {
        if (cn.state !== 'free') continue;
        const pr = pathProject(c.path, cn.x, cn.y), ds = pr.s - c.s - c.L / 2;
        if (ds > 0 && ds < stop + r && Math.abs(pr.lat - this.plannedD(c, pr.s)) < c.W / 2 + r + 1) return 'cone';
      }
      return null;
    }
    rearBlocked(c) {
      const ca = Math.cos(c.h), sa = Math.sin(c.h), r = this.P['props.cone.radius'];
      const behind = (x, y, len, half) => { const dx = x - c.x, dy = y - c.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca; return lx < 0 && lx > -c.L / 2 - len - 12 && Math.abs(ly) < c.W / 2 + half + 6; };
      if (this.cars.some((o) => o !== c && lay(o) === lay(c) && behind(o.x, o.y, o.L / 2, o.W / 2))) return true;
      if (lay(c) === 0 && this.cones.some((cn) => cn.state === 'free' && behind(cn.x, cn.y, r, r))) return true;
      const b = this.body; return !!(this.meets(c) && behind(b.x, b.y, this.P['body.radius'] + 20, this.P['body.radius']));
    }
    reasonToWait(c, det, hz) {
      if ((hz && hz.inPath) || det.fwd || this.blockingCone(c) || this.obstacleAhead(c)) return true;
      const lead = this.leadGap(c);
      return !!(lead && (lead.gap < this.P['traffic.minimumGap'] + 30 || lead.v < 5));
    }
    blockingCone(c) {
      const r = this.P['props.cone.radius'];
      let best = null;
      for (const cn of lay(c) === 0 ? this.cones : []) {
        if (cn.state !== 'free') continue;
        const pr = pathProject(c.path, cn.x, cn.y), ds = pr.s - c.s - c.L / 2;
        if (ds > -r && ds < 70 && Math.abs(pr.lat - this.plannedD(c, pr.s)) < c.W / 2 + r + 2 && (!best || ds < best.ds)) best = { cn, ds };
      }
      return best && best.cn;
    }
    // ----- maintenance drones
    dispatchDrone(cn) {
      if (cn.droneT != null && this.t - cn.droneT < 20) return; // a screen's sims share its cones: one drone a cone
      cn.droneT = this.t;
      const P = this.P, hx = P['world.width'] + 80, hy = -80;
      this.drones.push({ id: 'drone' + (++this.droneSeq), cone: cn.id, x: hx, y: hy, hx, hy, alt: 1, state: 'inbound', t: 0, target: null });
      this.emit('drone-dispatch', { cone: cn.id });
    }
    droneTarget(cn) {
      const homes = [{ x: cn.hx, y: cn.hy }, ...this.level.coneHomes.map((h) => ({ x: h[0], y: h[1] }))
        .sort((a, b) => hyp(a.x - cn.hx, a.y - cn.hy) - hyp(b.x - cn.hx, b.y - cn.hy))];
      return homes.find((h) => this.coneSpotValid(h.x, h.y, cn)) || null;
    }
    stepDrones(dt) {
      const P = this.P, spd = P['proto.droneSpeed'], lift = P['proto.droneLiftSeconds'], CS = P['proto.droneConeSeconds'];
      if (CS > 0 && this.cones.length && this.t - (this._coneChk || -9) >= 0.25) { // Edit 71: a cone left in a lane fetches a drone, whether cars stop or steer round it
        this._coneChk = this.t; const half = P['world.laneWidth'] / 2 + P['props.cone.radius'];
        for (const cn of this.cones) {
          if (cn.state !== 'free' || this.drones.some((d) => d.cone === cn.id)) { cn.roadAt = null; continue; }
          const inLane = (this.level.lanes || []).some((ln) => { const pr = pathProject(ln, cn.x, cn.y); return pr && Math.abs(pr.lat) < half && pr.s > 0 && pr.s < ln.length; });
          if (!inLane) { cn.roadAt = null; continue; }
          if (cn.roadAt == null) cn.roadAt = this.t; else if (this.t - cn.roadAt >= CS) { this.dispatchDrone(cn); cn.roadAt = null; }
        }
      }
      const fly = (d, x, y) => { const dx = x - d.x, dy = y - d.y, l = hyp(dx, dy), st = spd * dt; if (l <= st) { d.x = x; d.y = y; return true; } d.x += dx / l * st; d.y += dy / l * st; return false; };
      for (const d of this.drones) {
        const cn = this.cones.find((c) => c.id === d.cone);
        if (d.state === 'inbound') {
          if (!cn || cn.state !== 'free') { d.state = 'outbound'; continue; }
          if (fly(d, cn.x, cn.y)) { d.state = 'lift'; d.t = 0; }
        } else if (d.state === 'lift') {
          if (cn.state !== 'free') { d.state = 'outbound'; d.alt = 1; continue; }
          d.t += dt; d.alt = 1 - 0.6 * Math.sin(Math.PI * Math.min(1, d.t / lift));
          if (d.t >= lift) {
            d.target = this.droneTarget(cn);
            if (!d.target) { d.state = 'outbound'; d.alt = 1; continue; }
            cn.state = 'drone'; d.state = 'carry'; d.alt = 1;
            this.emit('drone-pickup', { cone: cn.id });
          }
        } else if (d.state === 'carry') {
          cn.x = d.x; cn.y = d.y;
          if (fly(d, d.target.x, d.target.y)) { cn.x = d.x; cn.y = d.y; d.state = 'drop'; d.t = 0; }
        } else if (d.state === 'drop') {
          d.t += dt; d.alt = 1 - 0.6 * Math.sin(Math.PI * Math.min(1, d.t / lift));
          if (d.t >= lift) {
            const tg = d.target; d.target = null;
            if (this.coneSpotValid(tg.x, tg.y, cn)) {
              Object.assign(cn, { x: tg.x, y: tg.y, vx: 0, vy: 0, state: 'free' });
              this.emit('drone-drop', { cone: cn.id, x: tg.x, y: tg.y }); d.state = 'outbound'; d.alt = 1;
            } else { d.target = this.droneTarget(cn); d.state = d.target ? 'carry' : 'drop'; d.t = 0; if (!d.target) d.target = tg; }
          }
        } else if (d.state === 'outbound') {
          if (fly(d, d.hx, d.hy)) d.state = 'gone';
        }
      }
      this.drones = this.drones.filter((d) => d.state !== 'gone');
    }
    carAI(dt) {
      const P = this.P;
      for (const c of this.cars) {
        if (c.ghost) continue; // P5.3: a car next door drives on its own screen
        c.stopT = c.v < 2 ? (c.stopT || 0) + dt : 0; // P4: time stopped, whatever the plan (jam test)
        const det = this.perceive(c);
        c.det = det;
        c.senseT = det.fwd ? c.senseT + dt : 0;
        // the dummy as a pedestrian: noticed nearby, then in the path; holding time while it stands still
        const hz = this.assessBody(c), b = this.body;
        c.hz = hz;
        c.nearT = hz ? (c.nearT || 0) + dt : 0;
        c.pathT = hz && hz.inPath ? (c.pathT || 0) + dt : 0;
        const covering = c.nearT - c.pathT >= P['perception.reactionDelay'] - 1e-9;
        const reactPath = covering ? P['proto.driver.coveredReaction'] : P['perception.reactionDelay'];
        if (hz && hz.inPath && c.v < 1) {
          if (c.holdT == null || hyp(b.x - c.holdX, b.y - c.holdY) > 10) { c.holdT = 0; c.holdX = b.x; c.holdY = b.y; }
          c.holdT += dt;
        } else c.holdT = null;
        // blocked: horn at the dummy (a road user posing danger); flash lights at cones and call a FARSIGHT drone
        const blk = c.v < 2 ? (this.blockingCone(c) || (hz && hz.inPath && hz.lx < c.standoff + 40 ? { id: 'body', body: true } : null)) : null;
        c.blockT = blk ? (c.blockT || 0) + dt : 0;
        if (!blk) c.honking = false;
        else if (c.blockT >= P['proto.honkSeconds'] - 1e-9) {
          if (!c.honking) { c.honking = true; c.honkAt = blk.body ? 'body' : 'cone'; this.emit('honk', { car: c.id, at: blk.body ? 'body' : blk.id }); }
          if (!blk.body && !this.drones.some((d) => d.cone === blk.id)) this.dispatchDrone(blk);
        }
        this.ringKeep(c); // P5 (Edit 52): an inner-lane car's route keeps looping until it is back out
        // reversing to unstick: stop at the target, after the time limit, or when something is behind
        if (c.man && c.man.type === 'reverse') {
          const m = c.man, rs = P['proto.unstick.reverseSpeed'];
          if (c.s <= m.sTarget + 0.5 || this.rearBlocked(c) || this.t - m.t0 >= P['proto.unstick.reverseSeconds']) {
            c.man = null; c.v = 0; c.state = 'cruise'; c.stillT = 0; c.stopT = 0; this.emit('release', { car: c.id }); // P4: a fresh wait after backing up
          } else { m.until = this.t + Math.max(P['traffic.commitHorizon'], (c.s - m.sTarget) / rs); continue; }
        }
        // P4 (Edit 49): a jam clears. A jammed car on the wrong side of the road (a pass that met oncoming traffic) backs up
        // proto.unstick.reverseGap when the way behind is clear, then returns to its lane. A stopped car behind it backs up first
        // to give it room. Two cars on their own sides that each wait for the other: the later car backs up, or the one with room.
        const GT = P['traffic.gridlockSeconds'];
        if (GT > 0 && P['traffic.jamReverse'] && c.stopT >= GT && !c.orbit && !(c.man && c.man.type === 'reverse') && c.s - c.L / 2 > 20 && !this.rearBlocked(c) && this.needsRoom(c)) {
          c.man = null; c.dodge = null; c.intent = null; c.signal = null;
          this.commit(c, { type: 'reverse', sTarget: Math.max(c.L / 2, c.s - P['proto.unstick.reverseGap']) }, 'unstick', null); // never back off the road's start
          this.emit('unstick', { car: c.id, how: 'jam' });
          continue;
        }
        // finish or extend the current commitment
        if (c.man && c.state !== 'interrupted') {
          const m = c.man, swerveDone = m.type !== 'shift' || c.s >= m.s0 + m.len - 1e-6;
          if (swerveDone && this.t >= m.t0 + P['traffic.commitHorizon'] - 1e-9) {
            if (m.type === 'shift') { c.d = m.d1; c.slope = 0; }
            c.man = null; c.state = 'released'; c.releasedT = this.t;
            this.emit('release', { car: c.id });
          } else m.until = this.t + this.remaining(c, m);
        }
        // safety interruption inside a commitment
        if (c.man && c.state === 'committed' && c.man.type !== 'reverse') {
          const ob = this.obstacleAhead(c);
          if (ob) {
            c.state = 'interrupted'; c.interruptT = this.t; c.clearT = 0;
            Object.assign(c.man, { halt: true, v0: c.v, tv: this.t, until: Infinity });
            this.emit('interrupt', { car: c.id, by: ob });
          }
        }
        if (c.state === 'interrupted') {
          const ob = this.obstacleAhead(c);
          c.clearT = ob ? 0 : c.clearT + dt;
          if (c.clearT > 0.3) {
            Object.assign(c.man, { halt: false, v0: c.v, tv: this.t });
            if (c.man.type === 'brake') { c.man = null; c.state = 'cruise'; }
            else { c.state = 'committed'; c.man.until = this.t + this.remaining(c, c.man); }
            this.emit('resume', { car: c.id });
          } else if (ob === 'cone' && c.v < 1 && this.t - c.interruptT > 1 && det.fwd) {
            const plan = this.choose(c, det.fwd);
            if (plan.type === 'shift') { c.man = null; this.commit(c, plan, 'cone', det.fwd); }
          } else if (ob === 'car' && this.t - c.interruptT > P['traffic.deadlockTimeout'] && Math.abs(c.d) > P['world.laneWidth'] / 2) {
            // Unstick: the car on the wrong side gives way. It backs up to make room, then returns to its lane.
            const lead = this.leadGap(c), back = Math.max(0, P['proto.unstick.reverseGap'] - (lead ? lead.gap : 0));
            c.man = null; c.dodge = null;
            this.commit(c, { type: 'reverse', sTarget: c.s - back }, 'unstick', null);
            this.emit('unstick', { car: c.id, how: 'reverse' });
          }
          continue;
        }
        // Unstick: stopped with nothing left to wait for. Forget the old plan and drive on.
        c.stillT = c.v < 2 ? (c.stillT || 0) + dt : 0;
        if (c.stillT >= P['traffic.deadlockTimeout'] && (c.man || c.intent || c.dodge || c.signal != null) && !this.reasonToWait(c, det, hz)) {
          c.man = null; c.intent = null; c.intentFor = null; c.dodge = null; c.signal = null; c.stillT = 0;
          c.state = 'cruise'; this.emit('unstick', { car: c.id, how: 'replan' });
        }
        if (c.man) continue;
        if (this.ringStep(c)) continue; // P5 (Edit 52): move to or from the inner ring lane
        const lw = P['world.laneWidth'];
        const inPath = !!(hz && hz.inPath);
        const urgent = Math.abs(c.d) > lw / 2 && this.oncomingAhead(c, 420);
        const passed = !c.dodge || c.s - c.L / 2 > c.dodge.s + P['proto.returnClearance'];
        const canReturn = !(c.orbit && c.orbit.lane === 'in') && Math.abs(c.d) > 0.5 && !this.bodyBeside(c, -c.d) && !this.carBeside(c, -c.d) &&
          (urgent || (!det.fwd && !inPath && passed && !this.corridorBlocked(c, -c.d)));
        let holdSpeed = false;
        if (canReturn) {
          c.intentFor = null;
          if (c.signal == null || !c.intent || !c.intent.ret) { c.signal = this.t; c.intent = { type: 'shift', d0: c.d, d1: 0, len: P['proto.swerveLength'], v0: c.v, ret: true }; }
          if (this.t - c.signal >= P['proto.returnSignalSeconds'] - 1e-9) { const plan = c.intent; c.dodge = null; if (c.v < P['proto.driver.passSpeed']) plan.vCap = P['proto.driver.passSpeed']; this.commit(c, plan, urgent ? 'yield' : 'return', null); continue; }
          c.state = 'intention'; holdSpeed = true;
        } else if (inPath) {
          // Pedestrian in the road: stop beyond lunge range and wait. After waiting, pass slowly with 2 m clearance if the way is clear.
          c.signal = null;
          if (c.pathT >= reactPath - 1e-9) {
            if (c.holdT != null && c.holdT >= P['proto.driver.patienceSeconds']) {
              const plan = this.choose(c, hz, { pass: true });
              if (plan.type === 'shift') { c.holdT = 0; this.commit(c, plan, 'pass', hz); continue; }
            }
            this.commit(c, this.choose(c, hz), 'body', hz); continue;
          }
          if (!c.intent || c.intentFor !== 'body') { c.intent = this.choose(c, hz); c.intentFor = 'body'; }
          c.state = 'intention';
        } else if (det.fwd) {
          // Obstruction (cone): pass slowly around it if the way is clear, else stop short of it.
          c.signal = null;
          if (!c.intent || c.intentFor !== det.fwd.id || c.intent.ret) { c.intent = this.choose(c, det.fwd); c.intentFor = det.fwd.id; }
          if (c.senseT >= P['perception.reactionDelay'] - 1e-9) { this.commit(c, c.intent, 'cone', det.fwd); continue; }
          c.state = 'intention';
        } else {
          c.signal = null; c.intent = null; c.intentFor = null;
          c.state = c.state === 'released' && this.t - c.releasedT < 0.25 ? 'released' : 'cruise';
        }
        // speed control: speed limit, corners (Edit 43), caution near a pedestrian, two-second following gap
        let vT = Math.min(c.cruise, this.cornerSpeed(c)), decel = null;
        if (c.orbit && c.path.ring) { vT = Math.min(vT, Math.sqrt(P['traffic.cornerAccel'] * c.path.ring.Rin)); if (c.orbit.wait != null) vT = Math.min(vT, Math.sqrt(2 * P['traffic.comfortBraking'] * c.orbit.wait)); } // the inner lane is tighter; at the last lap, wait for a gap
        if (hz && !inPath && c.nearT >= P['perception.reactionDelay'] - 1e-9 && !holdSpeed) {
          const vc = P['proto.driver.cautionSpeed'];
          vT = Math.min(vT, vc);
          if (c.v > vc) decel = clamp((c.v * c.v - vc * vc) / (2 * Math.max(1, hz.lx + c.L)), P['traffic.comfortBraking'], P['traffic.hardBraking']);
          if (c.state === 'cruise' || c.state === 'released') c.state = 'caution';
        }
        // P5.3: two cars locked body to body, each the other's lead, stopped traffic.gridlockSeconds: the one with priority
        // (lower junction rank, then id) drives clear of the other, and keeps doing so until they part
        { const ld = this.leadGap(c), GT = P['traffic.gridlockSeconds'];
          if (ld && ld.gap < 0 && ld.car === c.untangle) { /* still parting */ }
          else if (ld && ld.gap < 0 && GT > 0 && Math.min(c.stopT || 0, ld.car.stopT || 0) >= GT) {
            const o = ld.car, back = this.leadGap(o), rc = this.jRank(c), ro = this.jRank(o);
            c.untangle = back && (back.car === c || back.car.real === c) && (rc < ro || (rc === ro && c.id < o.id)) ? o : null;
          } else c.untangle = null; }
        // P4 (Edit 49.1): approach a give-way line slowly enough to stop at it (traffic.giveWaySpeed at the line); stop for circulating traffic
        const sg = !c.path.giveWay && c.seamGW ? c.seamGW : null; // Prototype 6.1: the give-way line just past a seam, read by the world (seamGiveWay)
        const gw = this.giveWayHold(c) || this.junctionHold(c) || (sg && sg.hold ? { line: c.s + sg.toLine } : null), jl = c.path.junction && c.path.junction.line != null ? { s: c.path.junction.line } : null;
        const gl = c.path.giveWay || jl, toLine = gl ? gl.s - (c.s + c.L / 2) : null;
        c.yielding = !!gw;
        const reach = Math.max(P['traffic.giveWayWindow'], c.v * c.v / (2 * P['traffic.comfortBraking']) + P['traffic.giveWayLookahead']); // Prototype 6.1: a car off a highway starts slowing a full stopping distance out
        if (gl && P['traffic.giveWayGap'] > 0 && lay(c) === 0 && toLine > -4 && toLine < reach) vT = Math.min(vT, Math.max(P['traffic.giveWaySpeed'], Math.sqrt(2 * P['traffic.comfortBraking'] * Math.max(0, toLine))));
        if (sg && P['traffic.giveWayGap'] > 0) vT = Math.min(vT, Math.max(P['traffic.giveWaySpeed'], Math.sqrt(2 * P['traffic.comfortBraking'] * Math.max(0, sg.toLine))));
        if (c.path.junction) vT = Math.min(vT, this.junctionLetIn(c)); // P4 (Edit 49.3): let in a car that has crossed its line
        if (gw) { const rem = gw.line - c.s; vT = Math.min(vT, rem < 1 ? 0 : Math.sqrt(2 * P['traffic.comfortBraking'] * rem)); }
        const rg = c.path.giveWay;
        if (rg && P['traffic.giveWayGap'] > 0 && lay(c) === 0 && c.s > rg.sj && Math.abs(hyp(c.x - rg.cx, c.y - rg.cy) - rg.R) < 22) { // circulating: let a car that has crossed its line in
          const ac = Math.atan2(c.y - rg.cy, c.x - rg.cx);
          for (const o of this.cars) {
            const go = o.path.giveWay;
            if (o === c || lay(o) !== 0 || !go || go.cx !== rg.cx || go.cy !== rg.cy || o.yielding || o.s + o.L / 2 <= go.s || o.s > go.sj + o.L / 2) continue; // only a car that is going
            const d = ((((go.aj - ac) * rg.dir) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * rg.R;
            if (d < 300) vT = Math.min(vT, Math.sqrt(2 * P['traffic.comfortBraking'] * Math.max(0, d - (c.L + o.L) / 2 - P['traffic.minimumGap'])));
          }
        }
        const ring = c.path.ring; c.letOut = null;
        if (ring && P['traffic.ringOrbit'] > 0 && !c.orbit && lay(c) === 0 && Math.abs(hyp(c.x - ring.cx, c.y - ring.cy) - ring.Rout) < 22) { // P5 (Edit 52): let a waiting inner-lane car out
          const ac = Math.atan2(c.y - ring.cy, c.x - ring.cx);
          for (const o of this.cars) {
            if (o === c || !o.orbit || o.orbit.lane !== 'in' || o.orbit.wait == null || o.orbit.wait > 4 || !o.path.ring || o.path.ring.cx !== ring.cx || o.path.ring.cy !== ring.cy) continue;
            const d = ((((Math.atan2(o.y - ring.cy, o.x - ring.cx) - ac) * ring.dir) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * ring.Rout;
            if (d < 300) { const v2 = Math.sqrt(2 * P['traffic.comfortBraking'] * Math.max(0, d - (c.L + o.L) / 2 - P['traffic.minimumGap'] - 40)); if (v2 < vT) { vT = v2; c.letOut = o; } }
          }
        }
        let ahead = this.leadGap(c);
        if (ahead && ahead.car === c.untangle) ahead = null; // P5.3: driving clear of a car it is locked against
        let hard = !!gw;
        if (ahead) {
          const need = P['traffic.minimumGap'] + P['traffic.timeGap'] * c.v;
          if (ahead.gap < need) vT = Math.min(vT, Math.max(0, ahead.v) * clamp(ahead.gap / need, 0, 1));
          if (ahead.gap < P['traffic.minimumGap'] || ahead.oncoming) vT = 0;
          hard = hard || ahead.gap < P['traffic.minimumGap'] + c.v * c.v / (2 * P['traffic.comfortBraking']); // P4: a give-way stop stays hard
        }
        const kb = lay(c) === 0 ? this.terrain(c.x, c.y, 'carBraking') : 1; // wet tarmac: braking × world.terrain.puddle.carBraking
        if (c.v < vT) c.v = Math.min(vT, c.v + P['traffic.acceleration'] * dt);
        else c.v = Math.max(vT, c.v - Math.min(hard ? P['traffic.hardBraking'] : decel != null ? decel : P['traffic.comfortBraking'], P['traffic.hardBraking'] * kb) * dt);
      }
    }
    moveCars(h, ts) {
      const P = this.P;
      for (const c of this.cars) {
        if (c.ghost) { c.s += c.v * h; this.pose(c, h); continue; } // P5.3: a ghost keeps pace with its car
        if (c.man) {
          let v = this.manSpeed(c, c.man, ts - c.man.t0);
          const kb = lay(c) === 0 ? this.terrain(c.x, c.y, 'carBraking') : 1; // on a puddle the plan asks for more braking than the tyres give
          if (kb < 1 && c.man.type !== 'reverse' && c.v > 0 && v < c.v - P['traffic.hardBraking'] * kb * h) {
            v = c.v - P['traffic.hardBraking'] * kb * h;
            if (!c.skid) { c.skid = true; this.emit('skid', { car: c.id, surface: this.surfaceAt(c.x, c.y) }); }
          } else if (kb >= 1) c.skid = false;
          c.v = v;
        }
        c.s += c.v * h;
        c.slope = 0;
        if (c.man && c.man.type === 'shift') {
          const m = c.man, f = clamp((c.s - m.s0) / m.len, 0, 1);
          c.d = m.d0 + (m.d1 - m.d0) * ease(f);
          c.slope = f > 0 && f < 1 ? (m.d1 - m.d0) * easeD(f) / m.len : 0;
        }
        this.pose(c, h);
      }
    }
    // Predicted path for a manoeuvre (render helper). Swerves are fixed in space.
    predict(c, man, from, until) {
      const pts = [], m = man;
      if (!m) return pts;
      const t0 = m.t0 != null ? m.t0 : from, s0 = m.s0 != null ? m.s0 : c.s, d0 = m.d0 != null ? m.d0 : c.d;
      let s = c.s, t = from;
      const end = Math.min(until, from + 3);
      while (t <= end + 1e-9) {
        const d = m.type === 'shift' ? d0 + (m.d1 - d0) * ease(clamp((s - s0) / m.len, 0, 1)) : c.d;
        const p = pathAt(c.path, s);
        pts.push({ x: p.x + p.nx * d, y: p.y + p.ny * d, h: Math.atan2(p.ty, p.tx) });
        s += this.manSpeed(c, m, t - t0, s) * 0.05; t += 0.05;
      }
      return pts;
    }
    carCue(c) {
      if (c.state === 'committed' && c.man) {
        const P = this.P, rem = c.man.until - this.t;
        return rem < P['movement.lungeDuration'] + P['movement.lungeRecovery'] ? 'expiring' : 'committed';
      }
      return c.state;
    }
    signalSide(c) { // +1 right, −1 left: a lane change first, else a turn (Edit 71)
      const m = c.state === 'intention' ? c.intent : c.man;
      if (m && m.type === 'shift' && !(c.man === m && c.s >= m.s0 + m.len)) return Math.sign(m.d1 - (m.d0 != null ? m.d0 : c.d));
      return this.turnSignal(c);
    }
    // Edit 71: turn signals, from traffic.signalDistance before the turn. A junction's route: toward its turn, until the turn
    // is done. Edit 72: a roundabout signals as drivers do (the Highway Code's rule 186, mirrored for right-hand traffic), and
    // holds each signal steady:
    //   - approach, from traffic.signalDistance before the line: right for the first exit; left past 12 o'clock or for a
    //     U-turn; none straight on. Held onto the ring.
    //   - once past the exit before its own, or moving out of the inner lane: toward the exit, held until
    //     traffic.signalCancel past the exit point. The first exit has no exit before it: right all the way.
    //   - circulating on the inner lane: left for a left turn or U-turn, else none, until it moves out.
    turnSignal(c) {
      const p = c.path, D = this.P['traffic.signalDistance'];
      if (!(D > 0) || c.deck || !p || c.ghost) return 0;
      const nose = c.s + c.L / 2;
      if (p.ring && p.giveWay) {
        const sg = pathSignal(p), g = p.giveWay, rg = p.ring;
        if (c.s > rg.exitS + (this.P['traffic.signalCancel'] || 0)) return 0;
        if (c.orbit && c.orbit.lane === 'in') { c._sigExit = null; return sg.side < 0 ? -1 : 0; } // circulating on the inner lane: no exit signal until it moves out
        if (nose >= g.s && (rg.exitS - c.s <= this.ringPrevArc(p) || (c.orbit && c.orbit.lane === 'out') || c._sigExit === rg.exitS)) { c._sigExit = rg.exitS; return sg.exitSide; }
        return g.s - nose <= D ? sg.side : 0;
      }
      if (p.junction) { const sg = pathSignal(p); return sg.side && sg.s0 != null && nose >= sg.s0 - D && c.s <= sg.s1 ? sg.side : 0; }
      return 0;
    }
    ringPrevArc(p) { // Edit 72: the arc from the exit before this route's own to its own (from the join for the first exit)
      const rg = p.ring;
      if (rg._dPrev != null) return rg._dPrev;
      const base = (rg.variants && rg.variants[0]) || p, br = base.ring, g = base.giveWay, n = br.exitNo || 0, p0 = base.pts[0];
      let prev = null;
      if (n > 1) for (const l of this.level.lanes) {
        const lr = l.ring; if (!lr || !l.giveWay || lr.exitNo !== n - 1 || (lr.k || 0) !== 0 || hyp(l.pts[0][0] - p0[0], l.pts[0][1] - p0[1]) > 1) continue;
        prev = l; break;
      }
      const d = n === 1 ? br.exitS - g.sj : prev ? br.exitS - prev.ring.exitS : this.P['traffic.signalDistance'];
      if (rg.variants) for (const v of rg.variants) v.ring._dPrev = d; else rg._dPrev = d;
      return d;
    }
    exitCars() {
      this.cars = this.cars.filter((c) => {
        if (c.s - c.L / 2 <= c.path.length) return true;
        if (!c.deck) { this.run.exited++; this.emit('exit', { car: c.id, spent: c.spent }); }
        return false;
      });
    }

    // ----- accounting
    account(contacts) {
      const P = this.P;
      contacts.sort((a, b) => a.k - b.k || (a.car.id < b.car.id ? -1 : a.car.id > b.car.id ? 1 : 0));
      let positive = false;
      for (const ct of contacts) {
        const b = this.body, c = ct.car;
        if (!b.alive) { this.emit('contact-ignored', { car: c.id }); continue; }
        if (c.spent) { this.emit('touch-spent', { car: c.id }); this.effects.push({ type: 'touch', x: ct.px, y: ct.py, t: this.t }); continue; }
        const { raw, assessed } = P['proto.damageModel'] ? ct.ph : assess(P, ct.closing, ct.zone, c.cls);
        if (raw <= 1e-9) { this.emit('touch', { car: c.id, closing: 0 }); continue; }
        c.spent = true;
        const plate = b.level === 0 && this.surfaceAt(b.x, b.y) === 'plate' ? P['damage.plateMultiplier'] : 1; // a calibrated plate scores more (7.3)
        const hw = c.deck ? P['damage.deckMultiplier'] : 1; // P5 (Edit 50): a highway hit scores more
        // Edit 75: a hit within scoring.comboWindow of the last chains a combo; each link adds scoring.comboStep, to scoring.comboMax.
        // Edit 79: each new kind of move in the chain adds scoring.comboVariety; the clock stops in the air (comboClock)
        const kind = ct.drop ? 'drop' : ct.kind || (ct.jump ? 'jump' : ct.lunging ? 'dash' : 'struck');
        const cl = this.comboLink(kind, assessed * plate * hw), combo = cl.n, mult = cl.mult;
        let lost = Math.min(b.health, assessed); // Edit 91: a hit that would write the chassis off can be held at a floor (Story: a miss of the brief)
        const floor = lost >= b.health - 1e-9 && this.hitFloor ? this.hitFloor({ kind, cause: ct.cause, cls: c.cls, combo, level: b.level }) : 0;
        const held = floor > 0 && b.health - lost < floor;
        if (held) lost = Math.max(0, b.health - floor);
        b.health = Math.max(0, b.health - lost);
        this.run.points += assessed * plate * hw * mult;
        if (combo > 1) { this.emit('combo', { n: combo, mult, kinds: cl.kinds.slice(), bonus: Math.round(assessed * plate * hw * (mult - 1)), car: c.id }); this.mile('firstCombo', { n: combo }); }
        const bait = ct.carState === 'committed' || ct.carState === 'expiring' || ct.carState === 'interrupted';
        let learned = null;
        if (P['proto.learningEnabled'] && lost > 0) {
          const m = this.models[c.cls], cap = Math.round(P['learning.playerHitCap'] / P['learning.playerHitStep']);
          if (m.applied < cap) { m.applied++; learned = m.applied; }
        }
        let learnedStandoff = null;
        if (P['proto.learn.standoffEnabled'] && lost > 0 && ct.stopped) {
          const m = this.models[c.cls], before = this.modelStandoff(m);
          if (before < P['proto.learn.standoffMax']) { m.standoffApplied++; learnedStandoff = this.modelStandoff(m); this.emit('learn-standoff', { model: m.id, from: before, to: learnedStandoff }); }
        }
        const part = this.partOf(ct.px, ct.py, assessed, ct.drop); // a landing takes the legs (Edit 42)
        b.parts[part] += lost;
        const ev = { car: c.id, model: c.model, cls: c.cls, zone: ct.zone, part, closing: +ct.closing.toFixed(3),
          angle: +ct.ph.angle.toFixed(1), dv: +ct.ph.dvd.toFixed(2), strike: +ct.ph.un.toFixed(2),
          raw: +raw.toFixed(3), assessed: +assessed.toFixed(3), lost: +lost.toFixed(3), health: +b.health.toFixed(3),
          carState: ct.carState, cause: ct.cause, bait, lunging: ct.lunging, learned, stopped: ct.stopped, learnedStandoff, plate: plate > 1, highway: hw > 1, drop: !!ct.drop, deck: !!c.deck, dropZ: ct.drop ? ct.dropZ : 0, dropFrom: ct.drop ? ct.dropFrom : null,
          combo, mult, kind, jump: !!ct.jump, ricochet: !!ct.ricochet, held };
        this.emit('impact', ev); b.hits.push(ev);
        if (held) this.emit('held', { health: b.health, kind, car: c.id });
        this.effects.push({ type: 'burst', x: ct.px, y: ct.py, v: assessed * plate * hw * mult, mult: hw, combo, cmult: mult, t: this.t, zone: ct.zone, angle: ct.ph.angle, layer: lay(c) });
        this.mile('firstHit');
        if (bait) this.mile('firstBaitHit');
        if (ct.cause === 'cone' && bait) this.mile('firstConeAssistHit');
        positive = true;
        if (b.health <= 0) this.writeOff();
      }
      return positive;
    }
    writeOff() {
      const P = this.P, b = this.body;
      b.alive = false; b.mode = 'dead'; b.vx = b.vy = 0;
      this.run.writeOffs++; this.run.points += P['rewards.writeOff'];
      this.releaseHeldAtDeath();
      this.emit('writeoff', { chassis: b.chassis, writeOffs: this.run.writeOffs });
      this.mile('firstWriteOff');
      this.effects.push({ type: 'wreck', x: b.x, y: b.y, t: this.t, facing: b.facing, layer: b.level });
    }
    end(kind) {
      const r = this.run;
      r.ending = { kind, t: +(this.tOffset + this.t).toFixed(3), road: this.roadIndex + 1, writeOffs: this.totalWriteOffs(), points: Math.round(r.points), purchases: r.purchases.slice() };
      this.emit('ending', { kind });
      this.mile('ending', { kind });
      if (!this.body.alive && kind !== 'Non-compliant') {
        this.phase = 'writeoff'; this.phaseT = this.P['feedback.writeOffSeconds']; this.pendingPhase = 'ending';
      } else this.phase = 'ending';
    }
    checkTerminal() {
      const P = this.P, r = this.run;
      if (r.ending) return;
      const cleared = r.writeOffs >= this.quota;
      if (cleared && this.isFinal) return this.end('Licensed');
      if (!cleared && this.slot >= this.schedule.length && this.allCars().every((c) => c.spent || c.deck)) return this.end('Failed test'); // P5.3: every car in the district
      if (!this.body.alive) {
        r.credits += P['economy.creditsPerWriteOff']; // Edit 82: a credit a body (registered; 1 as before)
        const b = this.body;
        this.report = { chassis: b.chassis, hits: b.hits.slice(), points: Math.round(r.points - b.points0), credits: r.credits,
          roadCleared: cleared, nextRoad: cleared ? this.list[this.roadIndex + 1] : null };
        if (cleared) { this.emit('road-cleared', { road: this.roadIndex + 1 }); this.mile('road' + (this.roadIndex + 1) + 'Cleared'); }
        this.emit('credit', { credits: r.credits });
        this.phase = 'writeoff'; this.phaseT = P['feedback.writeOffSeconds']; this.pendingPhase = 'report';
      }
    }

    trackUse() {
      const b = this.body;
      if (!b.alive || !this.has('hips')) return;
      this.turnHist.push(b.facing);
      if (this.turnHist.length > 16) this.turnHist.shift();
      let sum = 0;
      for (let i = 1; i < this.turnHist.length; i++) sum += Math.abs(wrap(this.turnHist[i] - this.turnHist[i - 1]));
      if (this.turnHist.length >= 16 && sum > 50 * DEG) this.mile('use:hips');
    }

    // ----- public step
    step(cmd) {
      const P = this.P, dt = 1 / P['simulation.tickRate'];
      cmd = cmd || {};
      if (this.phase === 'hitstop' || this.phase === 'writeoff' || this.phase === 'scroll') {
        this.phaseT -= dt;
        if (this.phaseT <= 1e-9) this.phase = this.phase === 'writeoff' ? this.pendingPhase : 'play';
        return;
      }
      if (this.phase !== 'play') return;
      this.tick++; this.t += dt;
      const net = this.netOn();
      if (net) this.netBegin(dt); // P5.3: admissions at the district edge, ghosts, the other screens' drivers
      else { this.admit(); this.admitDeck(); }
      this.carAI(dt);
      for (const c of this.cars) c.touched = false;
      this.bodyControl(cmd, dt);
      const N = Math.max(1, Math.round(P['proto.substeps'])), h = dt / N, contacts = [];
      for (let k = 0; k < N; k++) {
        const ts = this.t - dt + (k + 1) * h;
        this.moveCars(h, ts);
        this.moveBody(h);
        this.floorStep(contacts, k);
        this.collideBody(contacts, k);
        this.moveCones(h);
      }
      for (const c of this.cars) if (!c.touched) c.inEpisode = false;
      const positive = this.account(contacts);
      this.retryPending();
      this.stepDrones(dt);
      this.stepBooms(dt);
      if (net) this.netEnd(dt); else this.exitCars(); // P5.3: the other screens move; cars cross shared edges
      this.trackUse();
      this.checkTerminal();
      if (this.phase === 'play') this.checkFlip();
      if (this.phase === 'play' && positive && P['feedback.hitStop'] > 0) { this.phase = 'hitstop'; this.phaseT = P['feedback.hitStop']; }
      this.effects = this.effects.filter((e) => this.t - e.t < 1.5);
    }

    // ----- districts (D24): crossing a gate flips to the next screen, Zelda-style
    checkFlip() {
      const D = this.district, b = this.body, P = this.P;
      if (!D || !b.alive || b.stair || b.mode === 'drop' || (b.level > 0 && this.bodyDeck() == null)) return; // off roofs and skybridges only by stair or ledge
      const W = P['world.width'], H = P['world.height'];
      const sd = b.x > W ? 'E' : b.x < 0 ? 'W' : b.y > H ? 'S' : b.y < 0 ? 'N' : null;
      if (!sd) return;
      const to = [D.cur[0] + SIDE[sd][0], D.cur[1] + SIDE[sd][1]];
      if (to[0] < 0 || to[1] < 0 || to[0] >= D.cols || to[1] >= D.rows) { b.x = clamp(b.x, 0, W); b.y = clamp(b.y, 0, H); return; }
      this.flip(sd, to);
    }
    flip(sd, to) {
      const D = this.district, b = this.body, P = this.P, from = D.cur.slice();
      // settle the screen being left: cones in flight land, cones on a drone go home, the held cone travels
      for (const cn of this.cones) {
        if (cn.state === 'flight') Object.assign(cn, { state: 'free', vx: 0, vy: 0 });
        if (cn.state === 'drone') Object.assign(cn, { state: 'free', x: cn.hx, y: cn.hy });
      }
      const held = this.carriedCones().slice(), net = this.netOn(); // Edit 78: every cone carried travels
      if (net) this.saveCell(this.cellOf(from)); // P5.3: the screen left keeps running
      if (held.length) { const old = D.cells[from[1]][from[0]]; old.cones = old.cones.filter((c) => !held.includes(c)); }
      if (net) this.effects = [];
      else { this.cars = []; this.drones = []; this.effects = []; this.booms = {}; } // only the active screen runs: its traffic, drones and effects end here
      const dk0 = this.bodyDeck() != null ? this.level.decks[this.bodyDeck()] : null;
      D.cur = to; D.visited.add(to[1] * D.cols + to[0]);
      if (net) this.loadCell(this.cellOf(to)); else this.level = cellLevel(D, to, P);
      this.cones = this.conesFor(this.level);
      for (const h of held) this.cones.push(h);
      b.x -= SIDE[sd][0] * P['world.width']; b.y -= SIDE[sd][1] * P['world.height'];
      if (dk0) { const k = this.level.decks.findIndex((q) => q.hz === dk0.hz && q.off === dk0.off && (q.z || 1) === (dk0.z || 1)); b.floor = k >= 0 ? (this.level.floors || []).findIndex((f) => f.kind === 'deck' && f.deck === k) : -1; if (b.floor < 0) { b.level = 0; b.floor = null; } } // the level carries over
      if (net) this.netView(); // the traffic is already here
      else { this.fillDeckCars(); this.nextAt = this.t + 0.5; } // traffic on the new screen arrives from its own road ends
      D.lastFlip = { side: sd, from, to, t: this.t };
      this.phase = 'scroll'; this.phaseT = P['world.flipSeconds'];
      this.emit('screen', { from: cellName(from), to: cellName(to), side: sd, theme: this.level.theme, focal: this.level.focal || null, level: b.level, turns: D.cells[to[1]][to[0]].turns || null });
      this.mile('firstScreen', { to: cellName(to) });
      if (D.visited.size === D.cols * D.rows) this.mile('districtExplored', { road: this.roadIndex + 1 });
    }
    screenName() { return this.district ? cellName(this.district.cur) : null; }
    // Can the dummy cross this edge at this point? Only inside the district, and only onto open ground on the far side.
    edgeOpen(sd, v) {
      const D = this.district;
      if (!D) return false;
      const nx = D.cur[0] + SIDE[sd][0], ny = D.cur[1] + SIDE[sd][1];
      if (nx < 0 || ny < 0 || nx >= D.cols || ny >= D.rows) return false;
      const P = this.P, r = P['body.radius'], W = P['world.width'], H = P['world.height'], nb = cellLevel(D, [nx, ny], P);
      const lx = sd === 'E' ? r + 1 : sd === 'W' ? W - r - 1 : v, ly = sd === 'S' ? r + 1 : sd === 'N' ? H - r - 1 : v;
      return lx >= r && lx <= W - r && ly >= r && ly <= H - r && nb.statics.every((st) => !circleRect(lx, ly, r, st));
    }

    // ----- P5.3 (Edit 53): one traffic for the whole district (traffic.continuous; city districts).
    // Every screen's traffic steps every tick. The dummy, its cones' flights and the effects stay on the active screen.
    // A car whose centre crosses a shared edge moves to the matching lane next door with its id, speed, offset and plan.
    // Cars within world.spawnLeadIn of a shared edge are seen next door as ghosts: drivers follow them, the dummy can be hit
    // by them, both screens draw them. The shift's cars enter only where a road crosses the district boundary; at the start
    // every lane is already running at its steady headway.
    netOn() { return !!(this.net && this.P['traffic.continuous'] > 0); }
    cellOf(c) { return this.district.cells[c[1]][c[0]]; }
    netBuild() {
      const D = this.district, P = this.P, W = P['world.width'], H = P['world.height'];
      this.net = null;
      if (!D || !this.isCity || !(P['traffic.continuous'] > 0)) return;
      const cells = D.cells.flat();
      for (const q of cells) {
        const lv = cellLevel(D, q.cell, P), lanes = lv.lanes.map((path, i) => ({ i, path, layer: 0, deck: null, ends: laneEnds(path, W, H), next: null, prev: null }));
        (lv.deckLanes || []).forEach((ln, j) => { const dk = lv.decks[ln.deck]; lanes[2 + j] = { i: 2 + j, path: ln.path, layer: (dk && dk.z) || 1, deck: ln.deck, ends: laneEnds(ln.path, W, H), next: null, prev: null }; });
        q.tr = { cars: [], lanes, deckNext: {}, deckSrc: new Set(), jams: {}, booms: {}, drones: [], ghosts: [], body: null };
        this.conesFor(lv);
      }
      const inside = (x, y) => x >= 0 && y >= 0 && x < D.cols && y < D.rows;
      for (const q of cells) for (const a of q.tr.lanes) { // a lane leaving by a shared edge continues on the lane entering next door at the same point
        if (!a || !a.ends.out) continue;
        const sd = a.ends.out.side, x = q.cell[0] + SIDE[sd][0], y = q.cell[1] + SIDE[sd][1];
        if (!inside(x, y)) continue;
        const n = D.cells[y][x], b = n.tr.lanes.find((l) => l && !l.prev && l.layer === a.layer && l.ends.in && l.ends.in.side === OPP[sd] && Math.abs(l.ends.in.off - a.ends.out.off) < 6);
        if (!b) continue;
        a.next = { q: n, lane: b, ds: b.ends.in.s - a.ends.out.s }; b.prev = { q, lane: a, ds: a.ends.out.s - b.ends.in.s };
        a.path.netOut = { s: a.ends.out.s, path: b.path, ds: a.next.ds }; // corner speed looks past the edge
      }
      const ground = [], decks = [];
      for (const q of cells) for (const l of q.tr.lanes) if (l && !l.prev && l.ends.in && !inside(q.cell[0] + SIDE[l.ends.in.side][0], q.cell[1] + SIDE[l.ends.in.side][1])) (l.layer === 0 ? ground : decks).push({ q, lane: l });
      for (const d of decks) d.q.tr.deckSrc.add(d.lane.i - 2);
      const busR = (lv) => (lv.ring ? 0 : minBend(lv.center, W, H));
      this.net = { cells, ground, decks, busOK: cells.every((q) => busR(q.level) >= P['vehicles.bus.minRadius'] * 0.9) }; // a bus never leaves its route: every screen must keep the radius
      this.netCur = this.cellOf(D.cur); this.loadCell(this.netCur);
      this.netFill();
      this.netView();
    }
    saveCell(q) { const t = q.tr; t.cars = this.cars; t.deckNext = this.deckNext; t.jams = this.jams || {}; t.booms = this.booms; t.drones = this.drones; q.cones = this.cones; }
    loadCell(q) { const t = q.tr; this.level = q.level; this.cars = t.cars; this.cones = q.cones; this.deckNext = t.deckNext; this.jams = t.jams; this.booms = t.booms; this.drones = t.drones; this.netCur = q; }
    inCell(q, fn) { // run fn with another screen's traffic loaded; the dummy there is its proxy across a shared edge, or away
      if (q === this.netCur) return fn();
      const keep = { level: this.level, cars: this.cars, cones: this.cones, deckNext: this.deckNext, jams: this.jams, booms: this.booms, drones: this.drones, effects: this.effects, body: this.body, netCur: this.netCur };
      this.loadCell(q); this.effects = []; this.body = q.tr.body || AWAY_BODY; this.awayCell = cellName(q.cell);
      try { return fn(); } finally { this.saveCell(q); Object.assign(this, keep); this.awayCell = null; }
    }
    allCars() { return this.netOn() ? [].concat(...this.net.cells.map((q) => (q === this.netCur ? this.cars : q.tr.cars))) : this.cars; }
    netBodies() { // the dummy as the next screen's drivers see it: across the shared edge, on the same deck if it stands on one
      const D = this.district, b = this.body, W = this.P['world.width'], H = this.P['world.height'];
      for (const q of this.net.cells) q.tr.body = null;
      if (!b || !b.alive) return;
      const dk = this.bodyDeck() != null ? this.level.decks[this.bodyDeck()] : null;
      if (b.level > 0 && !dk) return;
      for (const sd of SIDES) {
        const x = D.cur[0] + SIDE[sd][0], y = D.cur[1] + SIDE[sd][1];
        if (x < 0 || y < 0 || x >= D.cols || y >= D.rows) continue;
        const q = D.cells[y][x], pb = Object.create(b);
        pb.x = b.x - SIDE[sd][0] * W; pb.y = b.y - SIDE[sd][1] * H;
        if (dk) {
          const k = q.level.decks.findIndex((o) => o.hz === dk.hz && o.off === dk.off && (o.z || 1) === (dk.z || 1));
          pb.floor = k < 0 ? -1 : (q.level.floors || []).findIndex((f) => f.kind === 'deck' && f.deck === k);
          if (pb.floor < 0) continue;
        }
        q.tr.body = pb;
      }
    }
    ghostOf(o, ln, s) { // a car as the next screen sees it: on that screen's lane, at the same point
      const g = Object.create(o), p = pathAt(ln.path, s);
      g.ghost = true; g.real = o; g.lane = ln.i; g.path = ln.path; g.s = s;
      if (ln.deck != null) g.deckIdx = ln.deck;
      g.x = p.x + p.nx * o.d; g.y = p.y + p.ny * o.d; g.h = o.h; g.vx = o.vx; g.vy = o.vy;
      return g;
    }
    netGhosts(q) {
      const D = this.district, G = seamSight(this.P), out = [];
      for (const sd of SIDES) {
        const x = q.cell[0] + SIDE[sd][0], y = q.cell[1] + SIDE[sd][1];
        if (x < 0 || y < 0 || x >= D.cols || y >= D.rows) continue;
        const n = D.cells[y][x];
        for (const o of n === this.netCur ? this.cars : n.tr.cars) {
          if (o.ghost) continue;
          const ln = n.tr.lanes[o.lane];
          if (!ln) continue;
          if (ln.prev && ln.prev.q === q && o.s - ln.ends.in.s < G) out.push(this.ghostOf(o, ln.prev.lane, o.s + ln.prev.ds)); // just arrived from q
          else if (ln.next && ln.next.q === q && ln.ends.out.s - o.s < G) out.push(this.ghostOf(o, ln.next.lane, o.s + ln.next.ds)); // about to cross into q
        }
      }
      return out;
    }
    netView() { // what the active screen draws: its cars, and the cars next door whose bodies reach onto it
      const W = this.P['world.width'], H = this.P['world.height'];
      const gs = this.netGhosts(this.netCur).filter((g) => { const r = (g.L + g.W) / 2 + 8; return g.x > -r && g.x < W + r && g.y > -r && g.y < H + r; });
      this.view = this.cars.concat(gs);
    }
    emitAt(q, type, data) { if (q === this.netCur) return this.emit(type, data); this.awayCell = cellName(q.cell); this.emit(type, data); this.awayCell = null; }
    netAdmit() {
      const act = this.netCur;
      if (this.slot < this.schedule.length && this.t + 1e-9 >= this.nextAt) {
        const sl = this.schedule[this.slot], src = this.net.ground.find((g) => g.lane.i === sl.lane) || this.net.ground[0];
        if (src) { sl.lane = src.lane.i; this.inCell(src.q, () => this.admit()); }
      }
      for (const q of new Set(this.net.decks.map((d) => d.q))) this.inCell(q, () => this.admitDeck());
      void act;
    }
    netBegin(dt) {
      const D = this.district, act = this.cellOf(D.cur);
      if (this.netCur !== act) this.netCur = act; // a screen made active by hand: its traffic is this.cars
      this.saveCell(act);
      this.netBodies();
      this.netAdmit();
      for (const q of this.net.cells) q.tr.ghosts = this.netGhosts(q);
      for (const q of this.net.cells) if (q !== act) this.inCell(q, () => { const own = this.cars; this.cars = own.concat(q.tr.ghosts); this.carAI(dt); this.cars = own; });
      this.cars = act.tr.cars.concat(act.tr.ghosts);
    }
    netEnd(dt) {
      const P = this.P, act = this.netCur, own = Object.prototype.hasOwnProperty;
      for (const g of this.cars) if (g.ghost) for (const k of ['touched', 'inEpisode', 'spent']) if (own.call(g, k)) g.real[k] = g[k]; // what the dummy did to a ghost happened to its car
      this.cars = this.cars.filter((c) => !c.ghost);
      this.saveCell(act);
      const N = Math.max(1, Math.round(P['proto.substeps'])), h = dt / N;
      for (const q of this.net.cells) if (q !== act) this.inCell(q, () => {
        for (let k = 0; k < N; k++) this.moveCars(h, this.t - dt + (k + 1) * h);
        this.stepDrones(dt); this.stepBooms(dt);
      });
      this.netHandover();
      this.loadCell(act);
      this.netView();
    }
    netHandover() {
      const W = this.P['world.width'], H = this.P['world.height'], moved = [];
      for (const q of this.net.cells) {
        q.tr.cars = q.tr.cars.filter((c) => {
          const ln = q.tr.lanes[c.lane];
          if (ln && ln.next && c.s >= ln.ends.out.s) { moved.push([c, q, ln.next]); return false; }
          if (c.s - c.L / 2 <= c.path.length) return true;
          if (!c.deck) { this.run.exited++; this.emitAt(q, 'exit', { car: c.id, spent: c.spent }); } // left the district
          return false;
        });
      }
      for (const [c, q, nx] of moved) {
        const ds = nx.ds, dx = (nx.q.cell[0] - q.cell[0]) * W, dy = (nx.q.cell[1] - q.cell[1]) * H;
        c.lane = nx.lane.i; c.path = nx.lane.path; c.s += ds;
        if (nx.lane.deck != null) c.deckIdx = nx.lane.deck;
        for (const m of [c.man, c.intent]) if (m) for (const k of ['s0', 'sTarget', 'sStop']) if (m[k] != null) m[k] += ds;
        if (c.dodge && c.dodge.s != null) c.dodge = Object.assign({}, c.dodge, { s: c.dodge.s + ds });
        if (c.holdX != null) { c.holdX -= dx; c.holdY -= dy; }
        const p = pathAt(c.path, c.s); c.x = p.x + p.nx * c.d; c.y = p.y + p.ny * c.d;
        nx.q.tr.cars.push(c);
        this.emitAt(nx.q, 'cross', { car: c.id, from: cellName(q.cell), to: cellName(nx.q.cell), v: +c.v.toFixed(3) });
      }
    }
    netFill() { // the start: every lane already running, the shift's first cars spread along the road at the steady headway
      const P = this.P, net = this.net, b = this.body, iv = this.admissionInterval(), g = (i, o) => ((i * 0.6180339887 + o) % 1);
      const chain = (src) => {
        const segs = []; let q = src.q, ln = src.lane, s0 = 0, at = 0;
        for (let k = 0; k < 64 && ln; k++) {
          const s1 = ln.next ? ln.ends.out.s : ln.path.length;
          segs.push({ q, ln, s0, s1, at }); at += s1 - s0;
          if (!ln.next) break;
          s0 = ln.next.lane.ends.in.s; q = ln.next.q; ln = ln.next.lane;
        }
        return { segs, length: at };
      };
      const where = (ch, x) => { const z = ch.segs.find((sg) => x >= sg.at && x < sg.at + sg.s1 - sg.s0); return z ? { q: z.q, ln: z.ln, s: z.s0 + x - z.at } : null; };
      const clear = (q, ln, s, layer) => { if (q !== this.netCur || !b || !b.alive) return true; const p = pathAt(ln.path, s); return !(this.bodyLayer() === layer && hyp(p.x - b.x, p.y - b.y) < P['vehicles.van.length'] * 2); };
      // ground: two lanes share the shift's admission clock, so each lane runs at twice traffic interval
      // the spacing is phased so a car stands on each lane of the start screen from the first frame
      const hw = 2 * iv * P['vehicles.sedan.cruiseSpeed'], spots = net.ground.map((src, li) => {
        const ch = chain(src), out = [], st = ch.segs.find((sg) => sg.q === this.netCur), lo = 0.4 * hw, hi = ch.length - P['vehicles.bus.length'];
        const x0 = st ? st.at + (st.s1 - st.s0) * (0.35 + 0.3 * g(li, 0.5)) : lo, xs = [];
        for (let x = x0, j = 0; x >= lo; j++, x -= hw * (0.8 + 0.4 * g(j, 0.37 + 0.21 * li))) xs.push(x);
        for (let x = x0, j = 0; ; j++) { x += hw * (0.8 + 0.4 * g(j, 0.71 + 0.21 * li)); if (x >= hi) break; xs.push(x); }
        for (const x of xs.filter((v) => v < hi).sort((a, b2) => a - b2)) { // a spot beside the dummy slides along the lane until clear
          const w = [0, -80, 80, -160, 160, -240, 240].map((d) => where(ch, x + d)).find((q) => q && clear(q.q, q.ln, q.s, 0));
          if (w && !out.some((o) => o.q === w.q && Math.abs(o.s - w.s) < 0.5 * hw)) out.push(w);
        }
        return out.reverse(); // farthest first: the shift's first car has come furthest
      });
      while (this.slot < this.schedule.length && spots.some((l) => l.length)) {
        const sl = this.schedule[this.slot];
        let k = net.ground.findIndex((src) => src.lane.i === sl.lane);
        if (k < 0 || !spots[k].length) k = spots.findIndex((l) => l.length);
        const w = spots[k].shift(); sl.lane = net.ground[k].lane.i;
        if (sl.cls === 'bus' && !net.busOK) sl.cls = 'sedan';
        this.inCell(w.q, () => {
          const c = this.newCar('car' + (++this.carSeq), sl.cls, w.ln.i, w.ln.path, w.s, 0);
          c.slot = sl.i; c.v = Math.min(c.v, this.cornerSpeed(c)); this.pose(c);
          this.cars.push(c); this.emit('admit', { car: c.id, cls: c.cls, model: c.model, lane: c.lane, fwdLen: +c.fwdLen.toFixed(2), prefill: true });
        });
        this.slot++; this.run.admitted++;
      }
      const nx = this.schedule[this.slot];
      this.nextAt = this.t + 0.5 * iv * (nx ? nx.mult : 1);
      // highways: fillDeckCars along each deck from the district edge
      const gap = P['world.deckInterval'] * P['traffic.deckGapScale'] * P['vehicles.sedan.cruiseSpeed'] * P['traffic.deckSpeedScale'];
      net.decks.forEach((src, li) => {
        const ch = chain(src);
        for (let x = ch.length - P['vehicles.van.length'] - gap * (0.3 + 0.4 * g(li, 0.1)); x > P['vehicles.van.length']; x -= gap) {
          const w = where(ch, x);
          if (!w || !clear(w.q, w.ln, w.s, src.lane.layer)) continue;
          this.inCell(w.q, () => { const c = this.addDeckCar(w.ln.i - 2, w.s); c.v = Math.min(c.v, this.cornerSpeed(c)); this.pose(c); });
        }
        src.q.tr.deckNext[src.lane.i - 2] = this.t + P['world.deckInterval'] * P['traffic.deckGapScale'] * (0.4 + 0.5 * g(li, 0.3));
      });
      this.deckNext = this.netCur.tr.deckNext;
    }

    // ----- menus
    continueReport() { if (this.phase === 'report') { this.phase = 'shop'; this.emit('shop-open', { credits: this.run.credits }); } }
    canBuy(n) {
      if (this.P['proto.abilities']) { // Edit 77: ability tracks by level (Edit 79: three tracks)
        const N = this.nodes(), nd = N[n], r = this.run;
        if (!nd || nd.level > (this.P['proto.abilities'] === 3 ? this.trackMax(nd.track) : this.P['abilities.maxLevel'])) return { ok: false, why: 'not sold' };
        if (r.owned[n]) return { ok: false, why: 'owned' };
        if (nd.pre && !r.owned[nd.pre]) return { ok: false, why: 'needs ' + N[nd.pre].name };
        const price = this.P[nd.price];
        return r.credits < price ? { ok: false, why: 'short by ' + (price - r.credits) } : { ok: true, price };
      }
      const node = NODES[n], r = this.run, n4 = this.P['proto.input.fourButtons'] && NODES4[n], pre = n4 && 'pre' in n4 ? n4.pre : node && node.pre;
      if (!node || r.owned[n]) return { ok: false, why: 'owned' };
      if (pre && !r.owned[pre]) return { ok: false, why: 'needs ' + NODES[pre].name };
      const price = this.P[node.price];
      if (r.credits < price) return { ok: false, why: 'short by ' + (price - r.credits) };
      return { ok: true, price };
    }
    buy(n) {
      if (this.phase !== 'shop') return { ok: false, why: 'shop closed' };
      const chk = this.canBuy(n);
      if (!chk.ok) { this.emit('purchase-denied', { node: n, why: chk.why }); return chk; }
      this.run.credits -= chk.price; this.run.owned[n] = true; this.run.purchases.push(n);
      this.emit('purchase', { node: n, price: chk.price, credits: this.run.credits });
      this.mile('firstPurchase', { node: n });
      return chk;
    }
    leaveShop() {
      if (this.phase !== 'shop') return;
      if (this.report && this.report.roadCleared) { this.phase = 'next'; return; }
      this.spawnBody(); this.phase = 'play'; this.report = null;
    }
    withdraw() {
      if (this.totalWriteOffs() < 1 || this.run.ending) return false;
      this.end('Non-compliant');
      return true;
    }
    trace() {
      const D = this.district;
      return { build: 'dummies-p3', level: this.levelId, params: this.P, run: this.run, milestones: this.milestones,
        models: this.models, events: this.events,
        district: D ? { start: cellName(D.start), cur: cellName(D.cur), path: D.path.map(cellName), visited: [...D.visited].map((k) => cellName([k % D.cols, Math.floor(k / D.cols)])) } : null };
    }
  }

  const api = { Sim, JUMP, REG, PROTO, OVERRIDES, NODES, NODES4, NODES7, TRACKS, NODES9, TRACKS9, NODES10, TRACKS10, NODES10D, TRACKS10D, LEVELS, LEVEL_LIST: DISTRICT_LIST, ROADS, DISTRICT_LIST, DISTRICTS, INFO, planCity, cityDistrict, bakeCity, DIFFICULTIES, assess, impulseImpact, zoneOf, circleCar, pathAt, pathProject, DEG,
    planDistrict, cellLevel, cellName, edgeSpans, edgeCrossings, laneEnds, seamSight, deckCrossOK, roadCenter, makePatches, roadDist, SIDE, dropImpact, checkZone, buildableArea, zHeight, stairRun, LEVELS3,
    lanesOf, makePath, offsetPts, fillet, filletAny, arcPts, roundaboutCenter, skeletons, routeCenter, edgePoint, deckLanesOf, fleetClass, minBend }; // P4: the Turn Lab builds its tracks with these
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DUMMIES = api;
})(typeof window !== 'undefined' ? window : globalThis);
