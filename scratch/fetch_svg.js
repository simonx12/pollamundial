import fs from 'fs';

async function main() {
  const url = 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Soccer_ball.svg';
  
  console.log('Fetching SVG from:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }
    
    const text = await res.text();
    console.log('Successfully fetched SVG! Length:', text.length);
    fs.writeFileSync('scratch/soccer_ball_wiki.svg', text);
    console.log('Saved to scratch/soccer_ball_wiki.svg');
  } catch (err) {
    console.error('Error fetching SVG:', err);
  }
}

main();
