import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
import dotenv from 'dotenv';
dotenv.config();

// Connect to the DB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

// Minimal Student model definition
const studentSchema = new mongoose.Schema({
  _id: String, // mess number
  name: String,
  year: String,
  branch: String,
  room: String,
  mobile: String,
});
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Clear existing students just in case
  await Student.deleteMany({});
  console.log("Cleared existing students");

  // Path to raw text
  const rawPath = 'd:/Isha repos/Annpurna/apps/api/scratch/raw.txt';
  
  if (!fs.existsSync(rawPath)) {
    console.error("raw.txt not found");
    process.exit(1);
  }

  const fullText = fs.readFileSync(rawPath, 'utf8');

  const lines = fullText.split('\n');
  console.log("Sample lines:", lines.slice(0, 10));

  const students = [];

  // Loosen regex
  const regex = /^(\d+)\s+([A-Z\s]+?)\s+(FE|SE|TE|BE)(?:\s+([A-Z\&]+))?(?:\s+(\d{3}))?(?:\s+([\d\/]+))?\s*$/;

  for (const row of lines) {
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

  console.log(`Found ${students.length} valid student records from the PDF OCR.`);
  
  if (students.length > 0) {
    await Student.insertMany(students);
    console.log("Successfully inserted all students into the database!");
  } else {
    console.log("No students found. Regex might have failed.");
  }

  process.exit(0);
}

run().catch(console.error);
