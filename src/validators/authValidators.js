import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

export const validateRequest = (schema) => (req, res, next) => {
  try {
    schema.parse({ body: req.body });
    next();
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: err.errors.map((e) => e.message),
    });
  }
};
