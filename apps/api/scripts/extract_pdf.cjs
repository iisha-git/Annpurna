const fs = require('fs');
const pdf = require('pdf-parse');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const studentSchema = new mongoose.Schema({
  _id: String, // mess number
  name: String,
  year: String,
  branch: String,
  room: String,
  mobile: String,
});
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

async function extractAndInsert() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");
  
  await Student.deleteMany({});
  console.log("Cleared existing students");

  const pdfPath = 'C:\\Users\\rishi\\.gemini\\antigravity-ide\\brain\\e92c8075-9477-49e7-abfc-8d79f889d47b\\.user_uploaded\\media_1788969796921.pdf';
  const dataBuffer = fs.readFileSync(pdfPath);
  
  const data = await pdf(dataBuffer);
  const lines = data.text.split('\n');
  
  const students = [];
  const regex = /^(\d+)\s+([A-Z\s]+?)\s+(FE|SE|TE|BE)(?:\s+([A-Z\&]+))?(?:\s+(\d{3}))?(?:\s+([\d\/]+))?\s*$/;

  for (let rawLine of lines) {
    const row = rawLine.trim();
    if (!row) continue;

    const match = row.match(regex);
    if (match) {
      students.push({
        _id: match[1],
        name: match[2].trim(),
        year: match[3],
        branch: match[4] || null,
        room: match[5] || null,
        mobile: match[6] || null
      });
    }
  }

  console.log(`Found ${students.length} valid student records from the PDF.`);
  
  if (students.length > 0) {
    await Student.insertMany(students);
    console.log("Successfully inserted all students into the database!");
  } else {
    console.log("No students found. Regex might have failed. Sample lines:");
    console.log(lines.slice(0, 20));
  }

  process.exit(0);
}

extractAndInsert().catch(console.error);
