import fs from 'fs';

const worldcupJson = JSON.parse(fs.readFileSync('src/lib/worldcup.json', 'utf-8'));

console.log("Rounds in worldcup.json:");
const rounds = [...new Set(worldcupJson.matches.map(m => m.round))];
console.log(rounds);

console.log("\nMatches that are not Group Stage:");
const ko = worldcupJson.matches.filter(m => !m.group);
ko.forEach(m => {
  console.log(`Num: ${m.num}, Round: ${m.round}, Teams: ${m.team1} vs ${m.team2}`);
});
