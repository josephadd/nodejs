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

const client = new speech.SpeechClient({
  keyFilename: "../server/routes/geohilfev1-1b4d84da44a9.json",
});

// Configure Transcription Request
const request = {
  config: {
    encoding: "MULAW",
    sampleRateHertz: 8000,
    languageCode: "en-GB",
    enableAutomaticPunctuation: true, // Enable automatic punctuation
    enableWordConfidence: true, // Enable word-level confidence
    enableWordTimeOffsets: true, // Enable word-level time offsets
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
            // Make a streaming request to the extraction endpoint
            const streamingReq = http.request(
              {
                host: "localhost",
                port: 8000,
                path: "/extract",
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              },
              (res) => {
                res.on("data", (chunk) => {
                  const response = JSON.parse(chunk.toString());
                  console.log(response.keywords);
                  wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(
                        JSON.stringify({
                          event: "interim-transcription",
                          keywords: response.keywords,
                        })
                      );
                    }
                  });
                });
              }
            );

            // Send the transcription data in the request body
            streamingReq.write(
              JSON.stringify({
                text: data.results[0].alternatives[0].transcript,
              })
            );

            streamingReq.end();
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

    console.log(response.data); // Log the response data from the POST request

    res.status(200).json(response.data); // Send the response data to the frontend
  } catch (error) {
    console.error(error); // Log any errors
    res.sendStatus(500);
  }
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
        <Stream url="wss://${req.headers.host}/"/>
      </Start>
      <Say>Emergency Fire and Rescue Services. Where exactly is the location of the emergency? </Say>
      <Pause length="30" />
    </Response>
  `);
});

console.log("Listening at Port 4007");
server.listen(4007);
