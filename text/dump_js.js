// Loads content.js and lore.js the way Prototype 9 does (lore over content; lore's bark overrides over fleet.json) and prints
// the text sources as JSON for text/inventory.py.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const win = {}; win.window = win;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'prototypes/p6/content.js'), 'utf8'), { window: win });
win.FLEET_DB = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/db/fleet.json'), 'utf8'));
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'prototypes/p8/lore.js'), 'utf8'), { window: win });
process.stdout.write(JSON.stringify({ content: win.DUMMIES_CONTENT, lore: win.DUMMIES_LORE, credits: win.DUMMIES_CREDITS, barks: win.FLEET_DB.barks, tiers: win.FLEET_DB.tiers, classes: win.FLEET_DB.classes, canon: win.FLEET_DB.canon }));
