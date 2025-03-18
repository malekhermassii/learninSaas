//Service pour envoyer des notifications

const admin = require('./firebaseConfig'); // Importation de la configuration Firebase

// Fonction pour envoyer une notification push
const sendPushNotification = async (token, title, message) => {
   
    const payload = {
      notification: {
        title: title,
        body: message,
      },
    };
  
    try {
      const messaging = admin.messaging();
      const response = await messaging.sendEachForMulticast({
        
        tokens: [token], 
        notification: payload.notification,
      });
  
      console.log("Notification envoyée avec succès :", JSON.stringify(response, null, 2));
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification:", error);
    }
  };

module.exports = { sendPushNotification };
