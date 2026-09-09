const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const studentSchema = new mongoose.Schema({
  _id: String,
  name: String,
  year: String,
  branch: String,
  room: String,
  mobile: String,
});
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  await Student.deleteMany({});
  console.log("Cleared existing");

  const rawText = fs.readFileSync('d:/Isha repos/Annpurna/apps/api/scratch/raw.txt', 'utf8');
  // Find where student 1 starts
  let startIdx = rawText.indexOf('\n1\n');
  if (startIdx === -1) startIdx = rawText.indexOf('\r\n1\r\n');
  if (startIdx === -1) startIdx = rawText.indexOf('\r1\r');
  
  if (startIdx === -1) {
    console.log("Lines sample:", rawText.split('\n').slice(0, 20));
    console.error("Could not find start");
    process.exit(1);
  }

  const textToParse = rawText.substring(startIdx).replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l);
  
  const students = [];
  let currentStudent = null;

  for (let i = 0; i < textToParse.length; i++) {
    const line = textToParse[i];
    
    // Check if line is the next student ID (1, 2, 3...)
    if (/^\d{1,3}$/.test(line)) {
      const nextId = parseInt(line);
      const expectedId = currentStudent ? parseInt(currentStudent._id) + 1 : 1;
      
      // If it's roughly the expected ID (allowing for a couple missed records)
      if ((nextId >= expectedId && nextId <= expectedId + 5) || (!currentStudent && nextId === 1)) {
        if (currentStudent) students.push(currentStudent);
        currentStudent = { _id: line, name: "", year: "", branch: "", room: "", mobile: "" };
        continue;
      }
    }
    
    // If we are currently parsing a student, try to assign the remaining fields
    if (currentStudent) {
      if (/^(FE|SE|TE|BE)$/.test(line)) {
        currentStudent.year = line;
      } else if (/^(COMP|IT|AIDS|ETC|CIVIL|MECH|A&R|E&TC|ENTC)/.test(line)) {
        currentStudent.branch = line;
      } else if (/^\d{3}$/.test(line)) {
        currentStudent.room = line;
      } else if (/[\d\/]{10,}/.test(line)) {
        currentStudent.mobile = line;
      } else if (!currentStudent.name && !/^\d{1,3}$/.test(line)) {
        currentStudent.name = line; // Fallback for name
      }
    }
  }
  
  if (currentStudent) students.push(currentStudent);

  console.log("Found " + students.length + " students.");
  if(students.length > 0) {
    await Student.insertMany(students);
    console.log("Inserted!");
  }
  process.exit(0);
}
run().catch(console.error);
