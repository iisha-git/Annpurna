const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const students = await mongoose.model('Student', new mongoose.Schema({_id: String}), 'students').find({});
  const toDelete = students.filter(s => parseInt(s._id) > 418).map(s => s._id);
  await mongoose.model('Student').deleteMany({_id: {$in: toDelete}});
  console.log('Deleted ' + toDelete.length + ' students.');
  process.exit(0);
}).catch(console.error);
