import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) process.exit(1);

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
  
  const raw = `
1 KARPE VAISHNAVI BE COMP 118 7219607376/9130297384
2 TASKAR SANIKA BE COMP 118 9970886661/9922461916
3 GABHALE ANKITA BE IT 118 9881550838/9765836664
4 ADIK PALLAVI BE A&R 118 9021134853/9373316741
5 THOSAR ANKITA BE ETC 123 8767590701/8766747847
6 NAGUDE GAYATRI BE COMP 123 9623255527/9422942541
7 KOTHAWADE DIVYA BE ETC 123 9518788352/9823848159
8 MATALE KSHITIJA BE IT 124 9511873007/7522918426
9 SAKHARE VAISHNAVI BE COMP 124 9970800385/9922174197
10 PATEL SABIYA BE COMP 124 8999539427/9730602019
11 JATAR SAYALI BE IT 124 9309266456/9423464838
12 SADGIR MANISHA BE CIVIL 125 9022379818/8605537523
13 KADTAN SHREYA BE COMP 125 9730039034/8830434336
14 KADAM SAI BE CIVIL 125 8975988753/9356145656
15 GUNJAL MINAL BE ETC 125 9307885091/7498600835
16 WALHEKAR TANISHKA BE COMP 126 8180835979/7743863638
17 KURHE MANASI BE IT 126 7558705760/9326805760
18 SOLAKE RUTUJA BE AIDS 129 7066776477/9822116212
19 PATIL SUHANI BE IT 129 9552856425/9960200604
20 YENARE RUTUJA BE ETC 129 9075808739/9075800401
`;

  const lines = raw.trim().split('\n');
  const students = [];
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

  await Student.insertMany(students);
  console.log("Successfully inserted " + students.length + " students!");
  process.exit(0);
}
run().catch(console.error);
