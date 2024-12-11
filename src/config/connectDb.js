import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log(
      `Database connected: ${connection.connection.host}:${connection.connection.port}`
    );

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    });

    return connection;
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

export default connectToDB;
