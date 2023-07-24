# Project Name: GeoHilfe Backend System with Node.js, WebSocket, Twilio, and Speech Transcription

## Description
This repository contains the backend system for a real-time communication application built using Node.js and WebSocket. The system incorporates Twilio API and Twilio webhook for handling incoming and outgoing calls. Additionally, it utilizes Google Speech-to-Text transcription for converting voice data to text. Amazon Transcription is an alternative option for the speech-to-text functionality. The deployment is done using AWS Elastic Beanstalk and CodePipeline for a streamlined development process.

## Features
- Real-time communication through WebSocket
- Handle incoming and outgoing calls with Twilio API and Twilio webhook
- Transcribe voice data to text using Google Speech-to-Text or Amazon Transcription
- Efficient deployment using AWS Elastic Beanstalk and CodePipeline

## Prerequisites
Before setting up the backend system, make sure you have the following requirements:

1. Node.js installed on your system.
2. Twilio account with an active API key and webhook. [Twilio Account](https://www.twilio.com/)
3. Google Cloud Console account with the Speech-to-Text API enabled and a valid keyFileName. [Google Cloud Console](https://console.cloud.google.com/)
4. (Alternative) Amazon Web Services account with Amazon Transcription service access.
5. AWS Elastic Beanstalk and CodePipeline set up and configured.

## Installation and Setup
1. Clone this repository to your local machine:
git clone https://github.com/josephadd/nodejs.git


2. Install the required Node.js packages:
cd nodejs
npm install


3. Set up the configuration:
- Rename `.env.example.local` to `.env`.
- Update `.env` with your Twilio API credentials and webhook URLs.
- If using Google Speech-to-Text, add your Google Cloud Console keyFileName in `.env`.
- If using Amazon Transcription, make necessary changes in the code to use that service.

4. Deploy to AWS Elastic Beanstalk using CodePipeline:
- Connect this GitHub repository to your AWS CodePipeline.
- Configure the pipeline to build and deploy to AWS Elastic Beanstalk automatically.

## Usage
Once the backend system is set up and deployed, it will be ready to handle real-time communication and voice transcription. Below are some of the main endpoints and functionalities:

- WebSocket Endpoint: `wss://your-backend-url`. For Twilio websocket to work, it must be 'wss' and not 'ws' and url must be SSL
- Use this endpoint to establish a WebSocket connection for real-time communication.

- Twilio API Endpoints:
- `/twilio/incoming`: Handle incoming calls from Twilio.
- `/twilio/outgoing`: Make outgoing calls through Twilio.

- Transcription:
- The backend system will automatically transcribe incoming voice data to text using the selected transcription service (Google Speech-to-Text or Amazon Transcription).
- Transcribed text can be accessed through WebSocket or API endpoints, depending on your application's requirements.

## Contributing
We welcome contributions to improve this backend system. If you find any issues or have ideas for enhancements, please follow these steps:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your modifications and test thoroughly.
4. Submit a pull request explaining the changes and improvements you've made.

---

Happy coding!
