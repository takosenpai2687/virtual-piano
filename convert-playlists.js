import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const playlistFiles = ['unravel', 'flower_dance', 'luv_letter', 'mywar', 'senbonzakura'];

playlistFiles.forEach(name => {
  try {
    const jsPath = path.join('playlist', `${name}.js`);
    const content = fs.readFileSync(jsPath, 'utf8');
    
    // Extract the array from the JS file
    const dataMatch = content.match(/var\s+midifile\s*=\s*(\[[\s\S]*\]);?$/m);
    if (dataMatch) {
      const data = eval(dataMatch[1]);
      const jsonPath = path.join('src', 'data', 'sheets', `${name}.json`);
      
      // Ensure directory exists
      const dir = path.dirname(jsonPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
      console.log(`Converted ${name}.js to ${name}.json`);
    }
  } catch (err) {
    console.error(`Error converting ${name}:`, err.message);
  }
});

console.log('Conversion complete!');
