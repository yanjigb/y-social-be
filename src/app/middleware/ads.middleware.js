const { body, validationResult } = require("express-validator");
const { adsService } = require("../services/ads.service");
const adModel = require("../models/ads.model");
const { MIN_BUDGET } = require("../constants/ads");
const { ERRORS } = require("../constants/error");
const { default: rateLimit } = require("express-rate-limit");

const rateLimitImpressions = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour windows
  message: "Too many requests, please try again later",
});

const rateLimitClick = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 10 clicks per minute
  message: "Too many requests, please try again later."
});

const validateAds = async (req, res, next) => {
  const adId = req.params.id;
  const ad = await adsService.getAdById(adId);
  if (!ad) {
    return res.status(404).json({ error: ERRORS.NOT_FOUND });
  }
  next();
};

const validateAdCreation = [
  body("title").isString().trim().withMessage("Title is required"),
  body("description").isString().trim().withMessage("Description is required"),
  body("budget").isNumeric().withMessage("Budget must be a number"),
  body("schedule_start")
    .isISO8601()
    .withMessage("Schedule start must be a valid date"),
  body("schedule_end")
    .optional()
    .isISO8601()
    .withMessage("Schedule end must be a valid date"),
  body("goal.goalID").isString().withMessage("Goal ID is required"),

  body("schedule_end").custom((value, { req }) => {
    if (new Date(value) < new Date(req.body.schedule_start)) {
      throw new Error("Schedule end date must be after start date");
    }
    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

const validateAdUpdate = [
  body("title").optional().isString().withMessage("Title must be a string"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("budget").optional().isNumeric().withMessage("Budget must be a number"),
  body("schedule_start")
    .optional()
    .isISO8601()
    .withMessage("Schedule start must be a valid date"),
  body("schedule_end")
    .optional()
    .isISO8601()
    .withMessage("Schedule start must be a valid date"),
  // Add more validations as needed

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const isAdExisted = adModel.findById(req.params.id);
    if (!isAdExisted) {
      return res.status(400).json({ errors: ERRORS.NOT_FOUND });
    }

    next();
  },
];

const validateBudget = async (req, res, next) => {
  try {
    const adId = req.params.id;
    const { budget } = req.body;
    const ad = await adsService.getAdById(adId);
    const minBudget = MIN_BUDGET[ad.currency];

    if (budget < 0) {
      throw new Error(ERRORS.BUDGET_POSITIVE);
    }

    if (minBudget !== undefined && budget < minBudget) {
      return res.status(400).json({
        errors: `Budget must be at least ${minBudget} ${ad.currency}`,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ errors: ERRORS.DEFAULT, message: error });
  }
};

const adAuthorization = async (req, res, next) => {
  const userId = req.params.userId;
  const adId = req.params.id;

  if (!userId || !adId) {
    return res.status(401).json({ error: ERRORS.AUTHORIZED });
  }

  next();
};

module.exports = {
  validateAds,
  validateAdCreation,
  validateAdUpdate,
  validateBudget,
  adAuthorization,
  rateLimitImpressions,
  rateLimitClick
};
