import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectToDB from "./config/connectDb.js";
import rateLimit from "express-rate-limit";
import userRouter from "./router/auth.route.js";

const app = express();
dotenv.config();

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});
app.use(limiter);

// JSON parsing with size limit
app.use(
  express.json({
    limit: "10mb",
    strict: true,
  })
);

// Parse URL-encoded bodies
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    credentials: true,
  })
);

//database connection and server startup
const startServer = async () => {
  try {
    await connectToDB();

    const PORT = process.env.PORT;

    app.listen(PORT, () => {
      console.log(`App is listening Port: ${PORT}`);
    });
  } catch (error) {
    console.log("Something went wrong", error);
    process.exit(1);
  }
};

startServer();

app.use("/api/v1", userRouter);

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: "OPsss Route not found",
  });
});
