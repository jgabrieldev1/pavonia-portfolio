const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html','utf8');
const css = fs.readFileSync('styles.css','utf8');
const manifest = JSON.parse(fs.readFileSync('.taste/assets.json','utf8'));
for(const asset of manifest.assets) {assert.equal(asset.status,'ready',asset.id);assert.ok(fs.existsSync(asset.destination),asset.id);}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate IDs');
for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(match[1]),'Missing anchor '+match[1]);
for(const match of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g))assert.ok(fs.existsSync(match[1]),'Missing file '+match[1]);
assert.ok(!/transition\s*:\s*all/.test(css));assert.ok(!/opacity\s*:\s*0/.test(css));
assert.ok(html.includes('Estudos conceituais'));assert.equal((html.match(/<h1\b/g)||[]).length,1);
assert.ok(!/autoplay/i.test(html));
console.log('Assets, local paths, unique IDs, anchors, conceptual identification and motion defaults passed.');
