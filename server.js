const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
app.use(cors()); 
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const speech = require("@google-cloud/speech");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const configFile = path.join(__dirname, 'routes/geohilfev1-1b4d84da44a9.json');
const client = new speech.SpeechClient({
  keyFilename: configFile,
});

const configData = JSON.parse(fs.readFileSync(configFile, 'utf8'));

configData.project_id = process.env.PROJECT_ID || configData.project_id;
configData.private_key = process.env.PRIVATE_KEY || configData.private_key;
configData.private_key_id = process.env.PRIVATE_KEY_ID || configData.private_key_id;
configData.client_email = process.env.CLIENT_EMAIL || configData.client_email;
configData.client_id = process.env.CLIENT_ID || configData.client_id;
configData.auth_uri = process.env.AUTH_URI || configData.auth_uri;
configData.token_uri = process.env.TOKEN_URI || configData.token_uri;
configData.auth_provider = process.env.AUTH_PROVIDER || configData.auth_provider;
configData.client_cert_url = process.env.CLIENT_CERT_URL || configData.client_cert_url;

const request = {
  config: {
    encoding: "MULAW", 
    sampleRateHertz: 8000,
    languageCode: "en-GB",
    enableAutomaticPunctuation: true,
    enableWordConfidence: true,
    enableWordTimeOffsets: true,
  },
  interimResults: true,
};

// Handle WebSocket Connection
wss.on("connection", function connection(ws) {
  console.log("New Connection Initiated");

  let recognizeStream = null;

  ws.on("message", function incoming(message) {
    const msg = JSON.parse(message);
    switch (msg.event) {
      case "connected":
        console.log(`A new call has connected.`);
        // Create Stream to the Google Speech to Text API
        recognizeStream = client
          .streamingRecognize(request)
          .on("error", console.error)
          .on("data", async (data) => {
            console.log("speech:", data.results[0].alternatives[0].transcript);

            // Emit the transcription data to the clients over WebSocket
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    event: "interim-transcription",
                    keywords: data.results[0].alternatives[0].transcript,
                  })
                );
              }
            });
          });
        break;
      case "start":
        console.log(`Starting Media Stream ${msg.streamSid}`);
        break;
      case "media":
        // Write Media Packets to the recognize stream if it exists and is not destroyed
        if (recognizeStream && !recognizeStream.destroyed) {
          recognizeStream.write(msg.media.payload);
        }
        break;
      case "stop":
        console.log(`Call Has Ended`);
        // Destroy the recognize stream if it exists and is not destroyed
        if (recognizeStream && !recognizeStream.destroyed) {
          recognizeStream.destroy();
        }
        break;
    }
  });
});

app.post("/keywords", async (req, res) => {
  try {
    const { keywords } = req.body; // Extract the keywords from the request body
    console.log(keywords);
    const response = await axios.post(
      "https://geohilfe-api.com/similarity",
      {
        keywords: keywords,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(response.data); // Send the response data to the frontend
  } catch (error) {
    console.error(error); // Log any errors
    res.sendStatus(500);
  }
});

// Handle Twilio Webhook
app.post("/", (req, res) => {
  res.set("Content-Type", "text/xml");
  // Respond with TwiML containing the next set of instructions
  res.send(`
    <Response>
      <Gather action="wss://geohilfe-api.com/" method="GET" input="speech dtmf" finishOnKey="#" timeout="3" numDigits="1">
      <Say>Emergency Fire and Rescue Services. Where exactly is the location of the emergency? </Say>
      </Gather>
      <Start>
      <Stream url="wss://geohilfe-api.com"/>
    </Start>
      <Say>We didn't receive any input. Goodbye!</Say>
      <Pause length="30" />
    </Response>
  `);
});

// Handle HTTP Request
app.get("/", async (req, res) => {
  res.sendStatus(200);
});

const PORT = process.env.PORT || 4000;

console.log("Listening at Port", PORT);
server.listen(PORT);
