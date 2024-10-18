const { ERRORS } = require("../constants/error");
const { CurrencyConverter } = require("../lib/convert");
const { adsService } = require("../services/ads.service");
const { handleRequest } = require("../utils/handle-request");

class AdsController {
  constructor() {
    this.clicks = {};
    this.impressions = {};
    this.clickRateLimit = 5; // Allow 5 clicks per hour
    this.impressionRateLimit = 10; // Allow 10 impressions per hour
  }


  async createAd(req, res) {
    await handleRequest(req, res, async () => {
      const { schedule_start, ...body } = req.body;

      // Initialize adData
      const adData = {
        userID: req.userId,
        link_action: "https://i.pinimg.com/enabled_hi/564x/cd/aa/56/cdaa5630b421cb002ba19ce817e8e80c.jpg",
        ...body,
        schedule_start: schedule_start ? new Date(schedule_start) : new Date(),
      };

      // Compare schedule_start with the current date
      if (adData.schedule_start < new Date()) {
        adData.status = "schedule";
      }

      // Set schedule_start to today's date if not provided
      if (!adData.schedule_start) {
        adData.schedule_start = new Date();
      }

      const InitializeResult = [
        {
          date: new Date(),
          impressions: 0,
          clicks: 0,
          conversions: 0,
        },
      ];
      adData.result = InitializeResult;
      return await adsService.createAd(adData);
    });
  }

  async updateAd(req, res) {
    await handleRequest(req, res, async () => {
      const adId = req.params.id;
      const ad = await adsService.getAdById(adId);
      const updateData = req.body;

      if (updateData.currency && ad.currency !== updateData.currency) {
        const convertedBudget = new CurrencyConverter().convert(
          ad.budget,
          ad.currency,
          updateData.currency,
        );

        updateData.budget = convertedBudget;
        // eslint-disable-next-line no-self-assign
        updateData.currency = updateData.currency;
      }

      const updatedAd = await adsService.updateAd(adId, updateData);
      if (!updatedAd) {
        throw new Error(ERRORS.DEFAULT);
      }
      return updatedAd;
    });
  }

  async deleteAd(req, res) {
    await handleRequest(req, res, async () => {
      const adId = req.params.id;
      const result = await adsService.deleteAd(adId);
      if (result.error) {
        throw new Error(ERRORS.NOT_FOUND);
      }
      return { message: "Ad deleted successfully" };
    });
  }

  async getAllAds(req, res) {
    await handleRequest(req, res, async () => {
      const { limit, skip } = req.query;

      return await adsService.getAllAds(limit, skip);
    });
  }

  async getAdById(req, res) {
    await handleRequest(req, res, async () => {
      const adId = req.params.id;
      const ad = await adsService.getAdById(adId);
      if (!ad) {
        throw new Error(ERRORS.NOT_FOUND);
      }
      return ad;
    });
  }

  async getAdByUser(req, res) {
    await handleRequest(req, res, async () => {
      const userId = req.params.userId;
      const ads = await adsService.getAdByUser(userId);
      if (!ads.length) {
        throw new Error(ERRORS.NOT_FOUND);
      }
      return ads;
    });
  }

  async deleteAllAdByUser(req, res) {
    await handleRequest(req, res, async () => {
      const userId = req.params.userId;
      return await adsService.deleteAllAdByUser(userId);
    });
  }

  async getAdByTrend(req, res) {
    await handleRequest(req, res, async () => {
      return await adsService.getAdByTrend();
    });
  }

  async getSchedulingAdvertise(req, res) {
    await handleRequest(req, res, async () => {
      const result = await adsService.getSchedulingAdvertise();
      return result;
    });
  }

  async handleClick(req, res) {
    const adId = req.params.id;
    const userId = req.userId;
    const now = Date.now();

    // Rate limiting logic for clicks
    if (!this.clicks[userId]) this.clicks[userId] = {};
    if (!this.clicks[userId][adId]) this.clicks[userId][adId] = { count: 0, lastTimestamp: 0 };

    const userClickData = this.clicks[userId][adId];
    if (now - userClickData.lastTimestamp < 3600000 && userClickData.count >= this.clickRateLimit) {
      return res.status(429).send({ message: "Too many clicks. Please try again later." });
    }

    userClickData.count += 1;
    userClickData.lastTimestamp = now;

    await adsService.recordClick(adId); // Call service to record click
    return res.status(200).send({ message: "Click recorded." });
  }

  async handleImpression(req, res) {
    const adId = req.params.id;
    const userId = req.userId;
    const now = Date.now();

    // Rate limiting logic for impressions
    if (!this.impressions[userId]) this.impressions[userId] = {};
    if (!this.impressions[userId][adId]) this.impressions[userId][adId] = { count: 0, lastTimestamp: 0 };

    const userImpressionData = this.impressions[userId][adId];
    if (now - userImpressionData.lastTimestamp < 3600000 && userImpressionData.count >= this.impressionRateLimit) {
      return res.status(429).send({ message: "Too many impressions. Please try again later." });
    }

    userImpressionData.count += 1;
    userImpressionData.lastTimestamp = now;

    await adsService.recordImpression(adId); // Call service to record impression
    return res.status(200).send({ message: "Impression recorded." });
  }

  async handleClicks(req, res) {
    await handleRequest(req, res, async () => {
      const adId = req.params.id;
      return await adsService.handleClicks(adId);
    })
  }
}

const adsController = new AdsController();

module.exports = { adsController };
