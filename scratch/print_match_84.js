import fs from 'fs';
const json = JSON.parse(fs.readFileSync('src/lib/worldcup.json', 'utf-8'));
const match84 = json.matches.find(m => m.num === 84);
console.log('Match 84:', match84);
