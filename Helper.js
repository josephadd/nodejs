// const natural = require('natural');
// const { Pool } = require('pg');
// const path = require('path');
const axios = require('axios');

// const language = "EN"
// const defaultCategory = 'N';
// const defaultCategoryCapitalized = 'NNP';

// var lexicon = new natural.Lexicon(language, defaultCategory, defaultCategoryCapitalized);
// var ruleSet = new natural.RuleSet('EN');
// var tagger = new natural.BrillPOSTagger(lexicon, ruleSet);

// const pool = new Pool({
//   user: 'postgres',
//   password: 'postgres',
//   host: 'localhost',
//   port: 5432,
//   database: 'postgres',
// });

// const storeKeywordAndLocation = async (keywordData) => {
//   try {
//     // Insert the keyword and location data into the database
//     const query = 'INSERT INTO keywords (keyword, latitude, longitude, address) VALUES ($1, $2, $3, $4)';
//     const values = [keywordData.keyword, keywordData.location.latitude, keywordData.location.longitude, keywordData.location.address];

//     await pool.query(query, values);
//     console.log('Keyword and location stored successfully');
//   } catch (error) {
//     console.error('Error storing keyword and location:', error);
//   }
// };

// const queryKeywordsAndLocations = async () => {
//   try {
//     const query = 'SELECT * FROM keywords ORDER BY created_at';
//     const result = await pool.query(query);
//     return result.rows;
//   } catch (error) {
//     console.error('Error querying keywords and locations:', error);
//     return [];
//   }
// };


// const extractKeywords = async (transcription) => {
//   // Tokenize the transcription into individual sentences
//   const tokenizer = new natural.SentenceTokenizer();
//   const sentences = tokenizer.tokenize(transcription);

//   // Perform part-of-speech tagging on each sentence using the tagger
//   const taggedSentences = sentences.map((sentence) => {
//     const taggedWords = tagger.tag(sentence.split(" ")).taggedWords;
//     return { sentence, taggedWords };
//   });

//   // Extract nouns and adjectives from each tagged sentence
//   const keywords = taggedSentences.reduce((result, { sentence, taggedWords }) => {
//     let sentenceKeywords = [];
//     let phrase = "";

//     for (let i = 0; i < taggedWords.length; i++) {
//       const { token, tag } = taggedWords[i];

//       if (tag.slice(0, 2) === "NN" || tag.slice(0, 2) === "JJ") {
//         sentenceKeywords.push(token);
//       }

//       if (tag.slice(0, 2) === "NN") {
//         // Add the current word to the phrase
//         phrase += (phrase.length > 0 ? " " : "") + token;

//         // Check if the next word is also a noun
//         if (i + 1 < taggedWords.length && taggedWords[i + 1].tag.slice(0, 2) === "NN") {
//           continue;
//         }

//         // Add the phrase to the sentenceKeywords
//         if (phrase.length > 0) {
//           sentenceKeywords.push(phrase);
//           phrase = "";
//         }
//       }
//     }

//     if (sentenceKeywords.length > 0) {
//       result.push(sentenceKeywords.join(" "));
//     }

//     return result;
//   }, []);

//   return keywords;
// };


const geocode = async (keyword, apiKey) => {
  try {
    // Make a request to the geocoding API using the keyword and API key
    const url = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(keyword)}.json`);

    // const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(keyword)}.json?access_token=${apiKey}`);


    const params = {
      access_token: apiKey,
      limit: 10,  
      // country: "de",
      // bbox: "11.385,48.039,11.799,48.248",
      // language: "en",
      // proximity: "11, 48"
    };
    const response = await axios.get(url, { params });

    if (response.status !== 200 || response.data.features.length === 0) {
      // If the response status is not 200 or there are no features, consider it as a failed geocoding request
      throw new Error(`Geocoding request failed for keyword "${keyword}"`);
    }else {
      console.log(`No geocoding results found for ${keyword}`);
    }

    // Parse the response and extract the location data
    const feature = response.data.features[0];
    const { center, place_name: address } = feature;
    const [longitude, latitude] = center;

    // Return the geocoded location object
    return {
      latitude,
      longitude,
      address,
    };
  } catch (error) {
    // Catch any errors that occur during the geocoding process
    throw new Error(`Geocoding failed for keyword "${keyword}": ${error.message}`);
  }
};



const geocodeKeywords = async (keywords, apiKey) => {
  const geocodedKeywords = [];

  for (const keyword of keywords) {
    try {
      const location = await geocode(keyword, apiKey);
      geocodedKeywords.push({
        keyword,
        location,
      });
    } catch (error) {
      console.error(`Error geocoding ${keyword}:`, error);
    }
  }

  return geocodedKeywords;
};

function removeDuplicateKeywords(response) {
  const keywords = response?.data?.keywords; // Assuming response is the object containing the data
  let uniqueKeywords = [];


  if (Array.isArray(keywords)) {
    uniqueKeywords = keywords.reduce((accumulator, keyword) => {
      if (!accumulator.includes(keyword)) {
        accumulator.push(keyword);
      }
      return accumulator;
    }, []);
  }

  console.log('accumulateKeywords', uniqueKeywords);

  return uniqueKeywords;
}

module.exports = {
  geocodeKeywords,
  removeDuplicateKeywords
};
