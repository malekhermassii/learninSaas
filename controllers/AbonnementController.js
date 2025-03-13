const { Abonnement, Plan, Payment } = require("../modeles/AbonnementModal");
const Apprenant = require("../modeles/ApprenantModal");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.createPlan = async (req, res) => {
  try {
    const { name, price, duration, offers } = req.body;

    if (!name || !price || !duration || !offers) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
      return res.status(409).json({ message: "Ce nom de plan existe déjà" });
    }

    const newPlan = new Plan({ name, price, duration, offers });
    await newPlan.save();

    // Création du produit Stripe
    const stripeProduct = await stripe.products.create({
      name: newPlan.name,
      metadata: { planId: newPlan._id.toString() },
    });

    // Création du prix Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: newPlan.price * 100,
      currency: "usd",
      recurring: { interval: "month" }, // Adaptez selon la durée
    });

    newPlan.stripePriceId = stripePrice.id;
    await newPlan.save();

    res.status(201).json({ message: "Plan créé avec succès", plan: newPlan });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
//update plan
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan non trouvé" });
    }

    const updatedPlan = await Plan.findByIdAndUpdate(planId, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "Plan mis à jour",
      plan: updatedPlan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
//delete
exports.deletePlan = (req, res) => {
  Plan.findByIdAndDelete(req.params.planId)
    .then((plan) => {
      if (!plan) {
        return res.status(404).send({
          message: "plan not fount with the id " + req.params.planId,
        });
      }
      res.send({ message: "plan deleted successfully" });
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while updating the plan by id" + req.params.planId,
      });
    });
};
//Consulter all plan
exports.findAllplans = (req, res) => {
  Plan.find()
    .then((plans) => {
      res.send(plans);
    })
    .catch((error) => {
      res.status(500).send({
        message: error.message || " server error while retreiving our plans",
      });
    });
};
//consulter un plan
exports.findOneplan = (req, res) => {
  Plan.findById(req.params.planId)
    .then((plan) => {
      if (!plan) {
        return res.status(404).send({
          message: "plan not found by id " + req.params.planId,
        });
      }
      res.send(plan);
    })
    .catch((error) => {
      res.status(500).send({
        message:
          error.message ||
          " server error while retreiving the plan by id" + req.params.planId,
      });
    });
};

// Créer une session de paiement Stripe
exports.createCheckoutSession = async (req, res) => {
  const { planId, apprenantId } = req.body;

  // Récupérer le plan depuis la base de données
  const plan = await Plan.findById(planId);
  if (!plan) {
    return res.status(404).json({ error: "Plan non trouvé" });
  }

  // Créer une session de paiement Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: plan.name,
          },
          unit_amount: plan.price * 100, // Le montant est en cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url:
      "https://votre_domaine/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://votre_domaine/cancel",
    metadata: {
      planId: plan._id.toString(),
      apprenantId: apprenantId,
    },
  });

  res.json({ id: session.id });
};

//Gère les événements Stripe pour les paiements et les abonnements.
exports.handleWebhook = async (req, res) => {
  let event = req.body; // Pas besoin de JSON.parse() ici

  console.log("Webhook reçu !");
  console.log("Headers:", req.headers);
  console.log("Body:", event); // Affiche l'objet JSON directement

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      await handleSubscriptionCreation(session);
      break;

    case "invoice.payment_succeeded":
      await handlePaymentSuccess(event.data.object);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionCancellation(event.data.object);
      break;

    default:
      console.log(`⚠️ Événement non pris en charge : ${event.type}`);
      break;
  }

  res.json({ received: true });
};

async function handleSubscriptionCreation(session) {
  const apprenant_id = session.client_reference_id;
  const planId = session.metadata.planId;

  const abonnement = new Abonnement({
    apprenant_id: apprenant_id,
    planId: planId,
    stripeSubscriptionId: session.subscription,
    statut: "actif",
  });

  await abonnement.save();
}

async function handlePaymentSuccess(invoice) {
  const subscriptionId = invoice.subscription;
  const amount = invoice.amount_paid / 100;

  await Abonnement.updateOne(
    { stripeSubscriptionId: subscriptionId },
    {
      $push: {
        payments: {
          date: new Date(),
          amount,
          invoiceId: invoice.id,
        },
      },
    }
  );
}

async function handleSubscriptionCancellation(subscription) {
  await Abonnement.updateOne(
    { stripeSubscriptionId: subscription.id },
    {
      statut: "annulé",
      dateFin: new Date(subscription.current_period_end * 1000),
    }
  );
}

// Gestion des abonnements (Admin)
exports.getSubscriptions = async (req, res) => {
  try {
    const { statut } = req.query;
    const filter = statut ? { statut } : {};

    const abonnements = await Abonnement.find(filter)
      .populate("planId", "name price")
      .populate("apprenant_id", "nom email")
      .sort({ dateDebut: -1 });

    res.json(abonnements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Historique des paiements (Admin)
exports.getPaymentHistory = async (req, res) => {
  try {
    const paiements = await Payment.find()
      .populate({
        path: "abonnement_id",
        populate: [
          { path: "planId", select: "name" },
          { path: "apprenant_id", select: "nom email" },
        ],
      })
      .sort({ createdAt: -1 });

    res.json(
      paiements.map((p) => ({
        id: p._id,
        montant: p.montant,
        methode: p.methodePaiement,
        date: p.createdAt,
        statut: p.statut,
        apprenant: p.abonnement_id.apprenant_id,
        plan: p.abonnement_id.planId,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
