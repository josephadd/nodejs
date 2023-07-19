const WebSocket = require("ws");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });
const speech = require("@google-cloud/speech");
require("dotenv").config();

const {
  removeDuplicateKeywords
} = require("./Helper");
const client = new speech.SpeechClient({
  keyFilename: "../server/routes/geohilfev1-1b4d84da44a9.json",
});


// Configure Transcription Request
const request = {
  config: {
    encoding: "MULAW",
    sampleRateHertz: 8000,
    languageCode: "en-GB",
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
            const caller = "Connected...";
            console.log(data.results[0].alternatives[0].transcript);
            
            // Process the data as required (removed axios post request)
            
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    event: "interim-transcription",
                    text: data.results[0].alternatives[0].transcript,
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

// Handle HTTP Request
app.get("/", async (req, res) => {
  res.sendStatus(200);
});

app.post("/", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
    <Response>
      <Start>
        <Stream url="ws://geohilfe.eu-central-1.elasticbeanstalk.com"/>
      </Start>
      <Say>Emergency Fire and Rescue Services. Where exactly is the location of the emergency? </Say>
      <Pause length="30" />
    </Response>
  `);
});

const PORT = process.env.PORT || 4000;

console.log("Listening at Port", PORT);
server.listen(PORT);
