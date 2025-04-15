const { Abonnement, Plan, Payment } = require("../modeles/AbonnementModal");
const Apprenant = require("../modeles/ApprenantModal");
const User = require("../modeles/userModal");
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
  try {
    const { planId, userId } = req.body;

    // Récupérer le plan depuis la base de données
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan non trouvé" });
    }

    // Round the price to avoid floating point errors and ensure it's an integer
    const unitAmount = Math.round(plan.price * 100); // Amount in cents

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
            unit_amount: unitAmount, // The amount in cents (rounded)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url:
        `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "http://localhost:3000/cancel",
      metadata: {
        planId: plan._id.toString(),
        userId: userId.toString(),
      },
    });

    res.json({ id: session.id });
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  } 
};


//Gère les événements Stripe pour les paiements et les abonnements.
exports.handleWebhook = async (req, res) => {
  // let event = req.body; // Pas besoin de JSON.parse() ici
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    // we use stripe.webhooks.constructEvent to ensures the request is genuinely from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
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

// async function handleSubscriptionCreation(session) {
//   try {
//     // const apprenant_id = session.metadata.apprenantId;
//     const userId = session.metadata.userId;
//     const planId = session.metadata.planId;
//     const user = await User.findById(userId);
//     const planExists = await Plan.exists({ _id: planId });

//     if (!user || !planExists) {
//       throw new Error("Invalid userId or planId");
//     }

//     const abonnement = new Abonnement({
//       userId: user._id,
//       planId: planId,
//       stripeSubscriptionId: session.subscription.id,
//       statut: session.subscription.status || "actif",
//       dateDebut: new Date(), // Add timestamp
//     });

//     await abonnement.save();
//     // Créer un profil d'apprenant et associer l'abonnement
//       const newApprenant = new Apprenant({
//         userId: user._id,
//         abonnement_id: abonnement._id, // Associez l'ID de l'abonnement
//       });
    
//       await newApprenant.save();
//       abonnement.apprenant_id = newApprenant._id;
//       await abonnement.save();
    
//       await User.findByIdAndUpdate(userId, { apprenantId: newApprenant._id });
    
//       console.log("✅ Apprenant et abonnement créés avec succès.");
//   } catch (error) {
//     console.error("❌ Subscription creation failed:", error.message);
//   }
// }
async function handleSubscriptionCreation(session) {
  const mongooseSession = await mongoose.startSession();
  mongooseSession.startTransaction();

  try {
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;

    // Validate inputs
    if (!userId || !planId) {
      throw new Error("Missing userId or planId in metadata");
    }

    // Get data with session
    const [user, plan] = await Promise.all([
      User.findById(userId).session(mongooseSession),
      Plan.findById(planId).session(mongooseSession)
    ]);

    if (!user || !plan) {
      throw new Error("Invalid userId or planId");
    }

    if (user.apprenantId) {
      throw new Error("User already has an Apprenant profile");
    }

    // Create subscription
    const abonnement = new Abonnement({
      userId: user._id,
      planId: planId,
      stripeSubscriptionId: session.subscription.id,
      statut: session.subscription.status || "actif",
      dateDebut: new Date(session.subscription.current_period_start * 1000),
    });

    await abonnement.save({ session: mongooseSession });

    // Create Apprenant
    const newApprenant = new Apprenant({
      userId: user._id,
      abonnement_id: abonnement._id,
    });

    await newApprenant.save({ session: mongooseSession });

    // Update relationships
    abonnement.apprenant_id = newApprenant._id;
    await abonnement.save({ session: mongooseSession });

    user.apprenantId = newApprenant._id;
    await user.save({ session: mongooseSession });

    await mongooseSession.commitTransaction();
    console.log("✅ Apprenant et abonnement créés avec succès.");
  } catch (error) {
    await mongooseSession.abortTransaction();
    console.error("❌ Subscription creation failed:", error.message);
    // Re-throw for upstream handling
    throw error;
  } finally {
    mongooseSession.endSession();
  }
}
async function handlePaymentSuccess(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    const amount = invoice.amount_paid / 100;

    // 1. Update Abonnement
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

    // 2. Create Payment document
    const abonnement = await Abonnement.findOne({
      stripeSubscriptionId: subscriptionId,
    });

    if (abonnement) {
      const payment = new Payment({
        abonnement_id: abonnement._id,
        montant: amount,
        methodePaiement: "card", // From Stripe data
        statut: "paid",
      });

      await payment.save();
      console.log("✅ Payment saved:", payment);
    }
  } catch (error) {
    console.error("❌ Payment handling failed:", error.message);
  }
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
      .populate({
        path: 'apprenant_id',  // Peupler le champ 'apprenant_id' avec les informations de l'apprenant
        populate: {
          path: 'userId',  // Peupler le champ 'userId' de l'apprenant pour récupérer les informations de l'utilisateur
          select: 'name email'  // Inclure le nom et l'email de l'utilisateur de l'apprenant
        }
      })
      .sort({ dateDebut: -1 });

    res.json(abonnements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const paiements = await Payment.find()
      .populate({
        path: "abonnement_id",
        populate: [
          { path: "planId", select: "name" },
          {path: 'apprenant_id',  
            populate: {
              path: 'userId',  
              select: 'name email' 
            } },
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