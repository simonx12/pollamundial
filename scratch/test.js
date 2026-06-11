import fs from 'fs';
const worldcupJson = JSON.parse(fs.readFileSync('src/lib/worldcup.json', 'utf8'));

const TEAM_MAPPING = {
  "Mexico": { name: "México", flag: "🇲🇽", code: "MEX" },
  "South Africa": { name: "Sudáfrica", flag: "🇿🇦", code: "RSA" },
  "South Korea": { name: "Corea del Sur", flag: "🇰🇷", code: "KOR" },
  "Czech Republic": { name: "República Checa", flag: "🇨🇿", code: "CZE" },
  "Canada": { name: "Canadá", flag: "🇨🇦", code: "CAN" },
  "Bosnia & Herzegovina": { name: "Bosnia-Herzegovina", flag: "🇧🇦", code: "BIH" },
  "Qatar": { name: "Catar", flag: "🇶🇦", code: "QAT" },
  "Switzerland": { name: "Suiza", flag: "🇨🇭", code: "SUI" },
  "Brazil": { name: "Brasil", flag: "🇧🇷", code: "BRA" },
  "Morocco": { name: "Marruecos", flag: "🇲🇦", code: "MAR" },
  "Haiti": { name: "Haití", flag: "🇭🇹", code: "HAI" },
  "Scotland": { name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", code: "SCO" },
  "USA": { name: "Estados Unidos", flag: "🇺🇸", code: "USA" },
  "Paraguay": { name: "Paraguay", flag: "🇵🇾", code: "PAR" },
  "Australia": { name: "Australia", flag: "🇦🇺", code: "AUS" },
  "Turkey": { name: "Turquía", flag: "🇹🇷", code: "TUR" },
  "Germany": { name: "Alemania", flag: "🇩🇪", code: "GER" },
  "Curaçao": { name: "Curazao", flag: "🇨🇼", code: "CUW" },
  "Ivory Coast": { name: "Costa de Marfil", flag: "🇨🇮", code: "CIV" },
  "Ecuador": { name: "Ecuador", flag: "🇪🇨", code: "ECU" },
  "Netherlands": { name: "Países Bajos", flag: "🇳🇱", code: "NED" },
  "Japan": { name: "Japón", flag: "🇯🇵", code: "JPN" },
  "Sweden": { name: "Suecia", flag: "🇸🇪", code: "SWE" },
  "Tunisia": { name: "Túnez", flag: "🇹🇳", code: "TUN" },
  "Belgium": { name: "Bélgica", flag: "🇧🇪", code: "BEL" },
  "Egypt": { name: "Egipto", flag: "🇪🇬", code: "EGY" },
  "Iran": { name: "Irán", flag: "🇮🇷", code: "IRN" },
  "New Zealand": { name: "Nueva Zelanda", flag: "🇳🇿", code: "NZL" },
  "Spain": { name: "España", flag: "🇪🇸", code: "ESP" },
  "Cape Verde": { name: "Cabo Verde", flag: "🇨🇻", code: "CPV" },
  "Saudi Arabia": { name: "Arabia Saudita", flag: "🇸🇦", code: "KSA" },
  "Uruguay": { name: "Uruguay", flag: "🇺🇾", code: "URU" },
  "France": { name: "Francia", flag: "🇫🇷", code: "FRA" },
  "Senegal": { name: "Senegal", flag: "🇸🇳", code: "SEN" },
  "Iraq": { name: "Irak", flag: "🇮🇶", code: "IRQ" },
  "Norway": { name: "Noruega", flag: "🇳🇴", code: "NOR" },
  "Argentina": { name: "Argentina", flag: "🇦🇷", code: "ARG" },
  "Algeria": { name: "Argelia", flag: "🇩🇿", code: "ALG" },
  "Austria": { name: "Austria", flag: "🇦🇹", code: "AUT" },
  "Jordan": { name: "Jordania", flag: "🇯🇴", code: "JOR" },
  "Portugal": { name: "Portugal", flag: "🇵🇹", code: "POR" },
  "DR Congo": { name: "R. D. Congo", flag: "🇨🇩", code: "COD" },
  "Uzbekistan": { name: "Uzbekistán", flag: "🇺🇿", code: "UZB" },
  "Colombia": { name: "Colombia", flag: "🇨🇴", code: "COL" },
  "England": { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "ENG" },
  "Croatia": { name: "Croacia", flag: "🇭🇷", code: "CRO" },
  "Ghana": { name: "Ghana", flag: "🇬🇭", code: "GHA" },
  "Panama": { name: "Panamá", flag: "🇵🇦", code: "PAN" }
};

const GROUPS = {
  A: [], B: [], C: [], D: [], E: [], F: [],
  G: [], H: [], I: [], J: [], K: [], L: []
};

worldcupJson.matches.forEach((match, index) => {
  if (match.group) {
    const groupLetter = match.group.replace('Group ', '');
    const team1Info = TEAM_MAPPING[match.team1];
    const team2Info = TEAM_MAPPING[match.team2];
    
    if (!GROUPS[groupLetter]) {
      console.error(`Group Letter "${groupLetter}" not found in GROUPS at index ${index}!`);
      return;
    }

    if (team1Info && !GROUPS[groupLetter].includes(team1Info.code)) {
      GROUPS[groupLetter].push(team1Info.code);
    }
    if (team2Info && !GROUPS[groupLetter].includes(team2Info.code)) {
      GROUPS[groupLetter].push(team2Info.code);
    }
  }
});

console.log('Groups successfully generated:', Object.keys(GROUPS).map(k => k + ':' + GROUPS[k].length).join(', '));
