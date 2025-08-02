const Joi = require("joi");

const registerUserSchema = Joi.object({
  userId: Joi.string().trim().min(1).max(10).required().messages({
    "string.base": "User ID must be a string",
    "string.empty": "User ID cannot be empty",
    "string.min": "User ID must be at least 1 character long",
    "string.max": "User ID cannot exceed 10 characters",
    "any.required": "User ID is required",
  }),
  fullName: Joi.string().trim().min(1).max(100).required().messages({
    "string.base": "Full name must be a string",
    "string.empty": "Full name cannot be empty",
    "string.min": "Full name must be at least 1 character long",
    "string.max": "Full name cannot exceed 100 characters",
    "any.required": "Full name is required",
  }),
  email: Joi.string().email().max(100).required().messages({
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email address",
    "string.max": "Email cannot exceed 100 characters",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).max(255).required().messages({
    "string.base": "Password must be a string",
    "string.min": "Password must be at least 6 characters long",
    "string.max": "Password cannot exceed 255 characters",
    "any.required": "Password is required",
  }),
  role: Joi.string().valid("admin", "user", "moderator").max(20).required().messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be one of: admin, user, moderator",
    "string.max": "Role cannot exceed 20 characters",
    "any.required": "Role is required",
  })
});

async function validateRegisterUser(req, res, next) {
  try {
    await registerUserSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (validationError) {
    const errors = validationError.details.map(d => d.message).join(", ");
    return res.status(400).json({ error: errors });
  }
}

// Additional middleware for checking duplicate emails/IDs before processing
async function checkDuplicateUser(req, res, next) {
  // This could be moved to model layer, but shown here as middleware option
  next();
}

module.exports = {
  validateRegisterUser,
  checkDuplicateUser
};