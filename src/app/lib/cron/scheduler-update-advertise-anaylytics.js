const cron = require("node-cron");
const { adsAnalyticsService } = require("../../services/ads-analytics.service");
const RUN_PER_DAY = "0 0 * * *";
const ColorConsole = require("../color-console");

cron.schedule(RUN_PER_DAY, async () => {
  try {
    await adsAnalyticsService.updateDailyAnalytics();
    ColorConsole.success("Daily analytics updated successfully.");
  } catch (error) {
    ColorConsole.error("Error updating daily analytics: ", error);
  }
});
