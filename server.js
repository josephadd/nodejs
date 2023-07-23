const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const speech = require("@google-cloud/speech");
require("dotenv").config();
const path = require('path');

const client = new speech.SpeechClient({
  keyFilename: path.join(__dirname, 'routes/geohilfev1-1b4d84da44a9.json')
});

// Configure Transcription Request
const request = {
  config: {
    encoding: "LINEAR16", // Highest quality encoding
    sampleRateHertz: 16000, // Recommended sample rate for LINEAR16
    languageCode: "en-US",
    enableAutomaticPunctuation: true,
    enableWordConfidence: true,
    enableWordTimeOffsets: true,
  },
  interimResults: true, // Enable interim results for real-time streaming
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
      "http://localhost:8000/similarity",
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

  // Extract the transcription text from the Twilio request

  // You can process the transcription text here if needed

  // Respond with TwiML containing the next set of instructions
  res.send(`
    <Response>
      <Start>
        <Stream url="wss://geohilfe-api.com"/>
      </Start>
      <Say>Emergency Fire and Rescue Services. Where exactly is the location of the emergency? </Say>
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
