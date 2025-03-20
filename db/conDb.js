const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection failed");
  }
}

module.exports = connectDb;