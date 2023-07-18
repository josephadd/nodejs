// Replace with your actual Twilio phone number
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Replace with your actual Twilio auth token
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

// Replace with your actual Twilio account SID
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;

const mapboxApiKey = process.env.MAPBOXGL_ACCESS_TOKEN;

module.exports = {
  twilioPhoneNumber,
  twilioAuthToken,
  twilioAccountSid,
  mapboxApiKey
};