const fs = require('fs');
const content = fs.readFileSync('C:/Users/rishi/.gemini/antigravity-ide/brain/e92c8075-9477-49e7-abfc-8d79f889d47b/.system_generated/logs/transcript_full.jsonl', 'utf-8');
const lines = content.split('\n');
for(let i=lines.length-1; i>=0; i--) {
  let l = lines[i];
  if(!l.trim()) continue;
  try {
    const j = JSON.parse(l);
    if(j.source === "USER_EXPLICIT" && j.content && j.content.includes("==Start of PDF==")) {
      fs.mkdirSync('d:/Isha repos/Annpurna/apps/api/scratch', {recursive:true});
      fs.writeFileSync('d:/Isha repos/Annpurna/apps/api/scratch/ocr.txt', j.content);
      console.log("Success");
      break;
    }
  } catch(e) {}
}
