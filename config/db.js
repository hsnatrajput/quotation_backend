const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer necessary in Mongoose 6+ / 7+ but harmless
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;