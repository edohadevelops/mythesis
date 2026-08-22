// Netlify function to send push notifications
// Deploy with: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT env vars
const webpush = require("web-push");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    const { subscription, payload } = JSON.parse(event.body);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { statusCode: 200, body: "sent" };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
