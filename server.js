const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const Data = require("../frontend/src/static/Data");
const speech = require("@google-cloud/speech");
require("dotenv").config();
const { VoiceResponse } = require("twilio").twiml;
const twilio = require("twilio");
const {
  twilioPhoneNumber,
  twilioAuthToken,
  twilioAccountSid,
} = require("./config");

//https://3386-196-61-44-164.ngrok-free.app

const port = process.env.PORT || 1337;
const index = require("../server/routes/index");

const app = express();
app.use(cors());
app.use(index);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
  },
});

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.post("/incoming-calls", express.urlencoded({ extended: false }), (req, res) => {
    const twiml = new VoiceResponse();
    twiml.say("Welcome to the Phone Call Transcription Demo.");

    twilioClient.calls
      .create({
        url: "http://demo.twilio.com/docs/voice.xml",
        from: "+233542150637",
        to: twilioPhoneNumber,
      })
      .then((call) => {
        io.emit("call-initiated", "Listening");
        console.log(call);
      })
      .catch((error) => {
        io.emit("call-failed", "Receive Call");
        console.error("Error Call Failed!:", error);
      });

    const gather = twiml.gather({
      action: "/record",
      method: "POST",
      timeout: 5,
      finishOnKey: "#",
    });

    gather.say(
      "Please leave your message after the beep, and press the pound key when finished."
    );

    twiml.record({
      transcribe: true,
      maxLength: 120,
      recordingStatusCallback: "/transcribe",
      recordingStatusCallbackEvent: "completed",
    });

    res.type("text/xml");
    res.send(twiml.toString());
  }
);

app.post("/record", (req, res) => {
  // Handle any additional logic after recording, if needed
  res.sendStatus(200);
});

app.post("/transcribe", (req, res) => {
  // const { RecordingUrl } = req.body;
  

  // Implement code to transcribe the audio file at RecordingUrl using a speech-to-text API
  io.emit("transcription", "Hello Emit my first transcription");

  res.sendStatus(200);
});

server.listen(port, () => console.log(`Listening on port ${port}`));
