import express from "express";
import { signup, login } from "../controllers/authController.js";
import { signupSchema, validateRequest } from "../validators/authValidators.js";

const userRouter = express.Router();

userRouter.post("/sign-up", validateRequest(signupSchema), signup);
userRouter.post("/login", login);

export default userRouter;
