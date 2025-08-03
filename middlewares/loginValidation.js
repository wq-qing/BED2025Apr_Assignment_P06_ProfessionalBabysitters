const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

async function validateLogin(req, res, next) {
  try {
    await loginSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (err) {
    const errorMessages = err.details.map(d => d.message).join(", ");
    res.status(400).json({ error: errorMessages });
  }
}

module.exports = { validateLogin };
