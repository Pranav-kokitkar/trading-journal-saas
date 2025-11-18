const { z } = require("zod");

const loginSchema = z.object({
  password: z
    .string({ required_error: "password is required" })
    .min(3, { message: "password must be atleast 3 char" })
    .max(300, { message: "password must not be greater than 300 char" }),

  email: z
    .string({ required_error: "email is required" })
    .trim()
    .email({ message: "Invalid email address" })
    .min(3, { message: "email must me atleast 3 char" })
    .max(255, { message: "email must not be more that 255 char" }),
});

const registerSchema = loginSchema.extend({
  name: z
    .string({ required_error: "name is required" })
    .trim()
    .min(3, { message: "name must be of 3 character" })
    .max(300, { message: "name must not be greater than 300 char" }),
});

module.exports = { registerSchema, loginSchema };
