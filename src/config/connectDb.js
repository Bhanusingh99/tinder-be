import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI);

    console.log(`database connected ${connect.connection.port}`);
  } catch (error) {
    console.error(error);
    console.log("something went wrong");
  }
};

export default connectToDB;
