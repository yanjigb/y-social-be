const { STRATEGY } = require("../constants/ads");
const { IAds } = require("./interfaces/ads.interface");
const AdModel = require("../models/ads.model");
const { ERRORS_ADS_REPOSITORY } = require("./constants/error");
const { formula } = require("../lib/formula");

class AdsRepository extends IAds {
  async create(adData) {
    try {
      const ad = new AdModel(adData);
      return await ad.save();
    } catch (error) {
      console.error("Error creating ad:", error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await AdModel.findById(id).exec();
    } catch (error) {
      console.error("Error finding ad by ID:", error.message);
      throw error;
    }
  }

  async update(id, adData) {
    try {
      return await AdModel.findByIdAndUpdate(
        id,
        { $set: adData },
        { new: true },
      ).exec();
    } catch (error) {
      console.error("Error updating ad:", error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      return await AdModel.findByIdAndDelete(id).exec();
    } catch (error) {
      console.error("Error deleting ad:", error.message);
      throw error;
    }
  }

  async findAll(limit, skip) {
    try {
      if (limit || skip) {
        return await AdModel.find().limit(limit).skip(skip).exec();
      }
      return await AdModel.find().exec();
    } catch (error) {
      console.error("Error finding all ads:", error.message);
      throw error;
    }
  }

  async findByUser(userId) {
    try {
      return await AdModel.find({ userID: userId }).exec();
    } catch (error) {
      console.error("Error finding ads by user ID:", error.message);
      throw error;
    }
  }

  async deleteAllByUser(userId) {
    try {
      return await AdModel.deleteMany({ userID: userId }).exec();
    } catch (error) {
      console.error("Error deleting all ads by user ID:", error.message);
      throw error;
    }
  }

  async calculateAdsScore(ad) {
    const { result, _id } = ad;
    const { impressions, clicks, conversions } = result;

    // Await asynchronous methods
    const totalInteractions = await formula.calculateTotalInteractions(_id);
    const totalCost = await formula.calculateTotalCost(_id);
    const scores = formula.calculateTrendingScore(
      clicks,
      impressions,
      conversions,
      totalCost,
      totalInteractions,
    );

    return scores / STRATEGY.TRENDING; // Average score
  }

  async findTrending() {
    try {
      const adList = await AdModel.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();

      const adsWithScores = [];
      for (const ad of adList) {
        const score = await this.calculateAdsScore(ad);
        adsWithScores.push({
          ...ad.toObject(),
          score,
        });
        console.log(score);
      }

      // Sort ads by score in descending order
      adsWithScores.sort((a, b) => b.score - a.score);

      return adsWithScores;
    } catch (error) {
      console.error(ERRORS_ADS_REPOSITORY.TRENDING_ADS, error.message);
      throw error;
    }
  }

  async getSchedulingAdvertise () {
    try {
      const now = new Date();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999); // End of the day

      const adList = await AdModel.find({
        schedule_start: { $gte: startOfDay, $lte: endOfDay }
      })
      .sort({ createdAt: -1 })
      .exec();

      if (now.getHours() === 0 && now.getMinutes() === 0) {
        // Update status of the ads
        for (const ad of adList) {
          ad.status = 'active'; // or whatever status you want to set
          await ad.save(); // Save the updated ad
        }

        return adList; // Return the updated ad list if needed
      }

      return adList;
    } catch (error) {
      console.error(ERRORS_ADS_REPOSITORY.SCHEDULLING_ADS, error.message);
      throw error;
    }
  }

  async handleClicks(adId) {
    const ad = await AdModel.findById(adId);
    
     // Update the click count in the ad's result array for today
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Find today's analytics entry
    const dailyAnalytics = ad.result.find(
      (analytics) => analytics.date.toISOString().split('T')[0] === todayString
    );

    if (dailyAnalytics) {
      // Update the clicks if today's entry exists
      dailyAnalytics.clicks += 1; // Increment clicks
      dailyAnalytics.impressions += 1;
      const { totalCost } = await formula.calculateCost(dailyAnalytics.impressions, dailyAnalytics.clicks, ad.budget)
      ad.result.cost = totalCost;
    } else {
      // Create a new entry for today's date if it doesn't exist
      ad.result.push({
        date: today,
        clicks: 1,
        impressions: 1,
        conversions: 0,
        cost: 0,
        ctr: 0,
      });

      const { totalCost } = await formula.calculateCost(ad.result.impressions, ad.result.clicks, ad.budget)
      ad.result.cost = totalCost;
    }

    await ad.save(); // Save the updated ad document
    return ad;
  }
}

const adsRepository = new AdsRepository();

module.exports = { adsRepository };
