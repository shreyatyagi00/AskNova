import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Mongo Error:", error.message);

    // ❗ server band mat karo
    setTimeout(connectDB, 5000); // retry
  }
};

export default connectDB;