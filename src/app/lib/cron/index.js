require("./avoid-render-sleep");
const scheduleStartAdvertise = require("./scheduler-start-advertise");
const scheduleSyncNewPayment = require("./scheduler-sync-new-payment");
// require("./scheduler-update-advertise-anaylytics");

scheduleStartAdvertise.start();
scheduleSyncNewPayment.start();
