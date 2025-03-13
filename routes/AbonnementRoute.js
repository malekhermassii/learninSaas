module.exports = (app) => {
  const abonnement = require("../controllers/AbonnementController");
  app.post("/checkout", abonnement.createCheckoutSession);
  app.post("/webhook", abonnement.handleWebhook);
  app.get("/admin/subscriptions", abonnement.getSubscriptions);
  app.get("/admin/payments", abonnement.getPaymentHistory);
  // gere plan
  app.post("/planabonnement", abonnement.createPlan);
  app.put("/planabonnement/:planId", abonnement.updatePlan);
  app.delete("/planabonnement/:planId", abonnement.deletePlan);
  app.get("/planabonnement", abonnement.findAllplans);
  app.get("/planabonnement/:planId", abonnement.findOneplan);
};
