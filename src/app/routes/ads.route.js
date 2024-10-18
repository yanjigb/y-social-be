const express = require("express");
const {
  validateAdCreation,
  validateAdUpdate,
  adAuthorization,
  validateBudget,
  validateAds,
  rateLimitImpressions,
  rateLimitClick,
} = require("../middleware/ads.middleware");
const { adsController } = require("../controllers/ads.controller");

const router = express.Router();

router.put(
  "/update/:id",
  validateAds,
  validateAdUpdate,
  validateBudget,
  adsController.updateAd,
);
router.post("/create", validateAdCreation, adsController.createAd);
router.post("/:id/impressions", rateLimitImpressions, validateAds);
router.post("/:id/clicks", rateLimitClick, validateAds, adsController.handleClicks);
router.get("/user/:userId", validateAds, adsController.getAdByUser);
router.get("/trending", adsController.getAdByTrend);
router.get("/get-all", adsController.getAllAds);
router.get("/scheduling", adsController.getSchedulingAdvertise);
router.get("/:id", validateAds, adsController.getAdById);
router.delete("/delete-all/user/:userId", adsController.deleteAllAdByUser);
router.delete(
  "/delete/:id/user/:userId",
  validateAds,
  adAuthorization,
  adsController.deleteAd,
);

module.exports = router;
