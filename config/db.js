const mongoose = require('mongoose');
const dns = require('dns');           // ← Add this

dns.setServers(['8.8.8.8', '8.8.4.4']);  // ← Add this (forces Google DNS for Node)

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These are deprecated in newer Mongoose but harmless if present
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

module.exports = connectDB;