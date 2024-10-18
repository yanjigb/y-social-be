const { ERRORS } = require("../constants/error");
const { adsRepository } = require("../repositories/ads.repository");
const { ERROR_ADS_SERVICE } = require("./constants/error");
const { IAdsService } = require("./interfaces/ads.interface");

class AdsService extends IAdsService {
  async addDailyAnalytics(adId, date, impressions, clicks, conversions) {
    const ad = await adsRepository.findById(adId);
    if (!ad) {
      throw new Error("Ad not found");
    }

    ad.result.push({
      date: new Date(date),
      impressions,
      clicks,
      conversions,
    });

    await ad.save();
    return ad;
  }

  async createAd(data) {
    try {
      return await adsRepository.create(data);
    } catch (error) {
      console.error("Error creating ad:", error.message);
      throw error;
    }
  }

  async getAdById(id) {
    try {
      const ad = await adsRepository.findById(id);
      if (!ad) {
        throw new Error(ERRORS.NOT_FOUND);
      }
      return ad;
    } catch (error) {
      console.error("Error fetching ad:", error.message);
      throw error;
    }
  }

  async updateAd(id, data) {
    try {
      const updatedAd = await adsRepository.update(id, data);
      if (!updatedAd) {
        throw new Error(ERRORS.NOT_FOUND);
      }
      return updatedAd;
    } catch (error) {
      console.error("Error updating ad:", error.message);
      throw error;
    }
  }

  async deleteAd(id) {
    try {
      const ad = await adsRepository.findById(id);
      if (!ad) {
        throw new Error("Ad not found");
      }
      await adsRepository.delete(id);
      return { message: "Ad deleted successfully" };
    } catch (error) {
      console.error("Error deleting ad:", error.message);
      throw error;
    }
  }

  async getAllAds(limit, skip) {
    try {
      return await adsRepository.findAll(limit, skip);
    } catch (error) {
      console.error("Error fetching all ads:", error.message);
      throw error;
    }
  }

  async getAdByUser(userId) {
    try {
      const ads = await adsRepository.findByUser(userId);
      if (!ads.length) {
        throw new Error(ERRORS.NOT_FOUND);
      }
      return ads;
    } catch (error) {
      console.error("Error fetching ads for user:", error.message);
      throw error;
    }
  }

  async deleteAllAdByUser(userId) {
    try {
      const ads = await adsRepository.findByUser(userId);
      if (!ads.length) {
        return { message: `No Ads Found` };
      }

      const result = await adsRepository.deleteAllByUser(userId);
      return {
        message: "All ads deleted successfully",
        count: result.deletedCount,
      };
    } catch (error) {
      console.error("Error deleting ads for user:", error.message);
      throw new Error(ERRORS.DEFAULT);
    }
  }

  async getAdByTrend() {
    try {
      return await adsRepository.findTrending();
    } catch (error) {
      console.error(ERROR_ADS_SERVICE.TRENDING_ADS, error);
      throw new Error(ERRORS.DEFAULT);
    }
  }

  async getSchedulingAdvertise() {
    try {
      const result = await adsRepository.getSchedulingAdvertise();
      return {
        message: "Successfully",
        count: result.length,
        data: result
      };
    } catch (error) {
      console.error(ERROR_ADS_SERVICE.TRENDING_ADS, error);
      throw new Error(ERRORS.DEFAULT);
    }
  }
  
  async handleClicks(adId) {
    try {
      const result = await adsRepository.handleClicks();
      
      if(!result) {
        return {
          message: "Update Clicks failed",
          adId: adId,
          data: result
        };
      }
      
      return {
        message: "Successfully",
        data: result
      };
    } catch (error) {
      console.error(ERROR_ADS_SERVICE.TRENDING_ADS, error);
      throw new Error(ERRORS.DEFAULT);
    }
  }
}

const adsService = new AdsService();

module.exports = { adsService };
