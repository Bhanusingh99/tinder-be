import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import logger from "../utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

// Secret key for signing JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";

// Cookie options for setting JWT in HttpOnly cookie
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 1000,
  sameSite: "Strict",
};

// ** Sign Up API **
export const signup = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password || !username) {
      return res.status(400).json({
        status: "error",
        message: "Email, password, and username are required",
      });
    }

    // Check for existing user by email or username
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message:
          existingUser.email === email
            ? "Email already in use"
            : "Username already taken",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName: firstName || username.split(/[-_]/)[0],
      lastName: lastName || "User",
    });

    await newUser.save();

    // Generate JWT token
    const payload = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    // Set the JWT in an HttpOnly cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    // Respond with user data and success status
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };

    res.status(201).json({
      status: "success",
      data: userResponse,
    });

    logger.info(`User signed up: ${newUser.username}`);
  } catch (error) {
    logger.error("Signup error:", error);

    // Handle validation errors or Mongo duplicate errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Username or email already exists",
      });
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// ** Login API **
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    // Find user by email and include the password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Incorrect email or password",
      });
    }

    // Compare provided password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Incorrect email or password",
      });
    }

    // Update last login date
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    res.cookie("token", token, COOKIE_OPTIONS);

    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    res.status(200).json({
      status: "success",
      data: userResponse,
    });

    logger.info(`User logged in: ${user.username}`);
  } catch (error) {
    logger.error("Login error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};
