dotenv.config(); // Charger les variables d'environnement

const Stripe = require("stripe");
const dotenv = require("dotenv");
const { Plan } = require("./modeles/AbonnementModal");

// const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



router.post('/create-checkout-session', async (req, res) => {
  const { planId, apprenantId } = req.body;

  // Récupérer le plan depuis la base de données
  const plan = await Plan.findById(planId);
  if (!plan) {
    return res.status(404).json({ error: 'Plan non trouvé' });
  }

  // Créer une session de paiement Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: plan.name,
        },
        unit_amount: plan.price * 100, // Le montant est en cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: 'https://votre_domaine/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://votre_domaine/cancel',
    metadata: {
      planId: plan._id.toString(),
      apprenantId: apprenantId,
    },
  });

  res.json({ id: session.id });
});

// 🟢 2. Route pour récupérer une session de paiement
router.get("/session/:session_id", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.session_id);
    console.log(session)
    res.json(session);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;

