// example usage

const { ERRORS } = require("../constants/error");
const { IFormula } = require("../interfaces/formula.interface");
const AdModel = require("../models/ads.model");
const { adsService } = require("../services/ads.service");
const ColorConsole = require("./color-console");

// const clicks = 500;
// const impressions = 10000;
// const conversions = 50;
// const totalCost = 1000;
// const totalInteractions = 600;

// const ctr = calculateCTR(clicks, impressions);
// const conversionRate = calculateConversionRate(conversions, clicks);
// const cpa = calculateCPA(totalCost, conversions);
// const engagementRate = calculateEngagementRate(totalInteractions, impressions);

class Formula extends IFormula {
  calculateCTR(clicks, impressions) {
    return impressions ? ((clicks / impressions) * 100).toFixed(2) : 0;
  }

  async calculateTotalCost(adId) {
    try {
      const ad = await adsService.getAdById(adId);
      if (!ad) {
        throw new Error("Ad not found");
      }
      const result = ad.result.reduce((sum, analytics) => {
        const cost = Number(analytics.cost);
        return sum + (isNaN(cost) ? 0 : cost);
      }, 0);

      return result;
    } catch (error) {
      ColorConsole.error("Error calculating total cost: ", error.message);
      throw error;
    }
  }

  async calculateCost(impressions, clicks, budget) {
    try {
      const costPerThousandImpressions = this.calculateCPM(budget, impressions);
      const costPerClick = this.calculateCPC(budget, clicks);
      const costFromImpressions = (impressions * costPerThousandImpressions) / 1000;
      const costFromClicks = clicks * costPerClick;
      const totalCost = costFromImpressions + costFromClicks;

      return {
        costPerThousandImpressions,
        costPerClick,
        costFromImpressions,
        costFromClicks,
        totalCost,
      };
    } catch (error) {
      console.error("Error calculating cost:", error.message);
      throw error;
    }
  }

  calculateConversionRate(conversions, clicks) {
    return clicks ? (conversions / clicks) * 100 : 0;
  }

  async calculateTotalInteractions(adId) {
    try {
      const ad = await AdModel.findById(adId).exec();

      if (!ad) {
        throw new Error(ERRORS.NOT_FOUND);
      }
      const totalInteractions = ad.result.reduce((total, analytics) => {
        return total + (analytics.clicks || 0);
      }, 0);
      return totalInteractions;
    } catch (error) {
      console.error("Error calculating total interactions:", error.message);
      throw error;
    }
  }

  calculateCPM(budget, totalImpressions) {
    const result = budget / (totalImpressions / 1000);
    return result;
  }

  calculateCPC(budget, totalClicks) {
    const result = budget / totalClicks;
    return result;
  }

  calculateCPA(totalCost, conversions) {
    return conversions ? totalCost / conversions : 0;
  }

  calculateEngagementRate(totalInteractions, impressions) {
    return impressions ? (totalInteractions / impressions) * 100 : 0;
  }

  calculateTrendingScore(
    clicks,
    impressions,
    conversions,
    totalCost,
    totalInteractions,
  ) {
    const ctr = this.calculateCTR(clicks, impressions);
    const conversionRate = this.calculateConversionRate(conversions, clicks);
    const cpa = this.calculateCPA(totalCost, conversions);
    const engagementRate = this.calculateEngagementRate(
      totalInteractions,
      impressions,
    );

    // Normalize the scores to make them comparable
    const normalizedCTR = ctr / 100;
    const normalizedConversionRate = conversionRate / 100;
    const normalizedEngagementRate = engagementRate / 100;

    // Inverse CPA to make it a higher score for lower costs
    const normalizedCPA = 1 / (cpa + 1); // Adding 1 to avoid division by zero and smooth the curve

    // Combine the metrics into a single score
    const trendingScore =
      (normalizedCTR +
        normalizedConversionRate +
        normalizedEngagementRate +
        normalizedCPA) /
      4;
    console.log(`CTR: ${ctr}%`);
    console.log(`Conversion Rate: ${conversionRate}%`);
    console.log(`CPA: $${cpa}`);
    console.log(`Engagement Rate: ${engagementRate}%`);
    console.log(`Trending Score: ${trendingScore}`);
    return trendingScore;
  }
}

const formula = new Formula();

module.exports = { formula };
