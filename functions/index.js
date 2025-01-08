const functions = require("firebase-functions");
const fetch = require("node-fetch");

const MAX_RETRIES = 3;
const TIMEOUT = 30000;

const fetchWithRetry = async (url, retryCount = 0) => {
  try {
    console.log(`Attempting to fetch: ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    const response = await fetch(url, {
      timeout: TIMEOUT,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "image/*, */*",
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("image/")) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    return response;
  } catch (error) {
    console.error(`Fetch attempt ${retryCount + 1} failed:`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      const delay = 2000 * (retryCount + 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, retryCount + 1);
    }
    throw error;
  }
};

exports.fetchImage = functions
  .runWith({
    timeoutSeconds: 300,
    memory: "1GB",
    maxInstances: 10
  })
  .https.onCall(async (data, context) => {
    console.log("Function called with data:", data);
    
    const { imageUrl } = data;
    if (!imageUrl) {
      throw new functions.https.HttpsError("invalid-argument", "Image URL is required");
    }

    try {
      const response = await fetchWithRetry(imageUrl);
      const buffer = await response.buffer();
      console.log(`Successfully fetched image: ${imageUrl}`);
      
      return {
        data: buffer.toString("base64"),
        contentType: response.headers.get("content-type"),
        size: buffer.length
      };
    } catch (error) {
      console.error("Function failed:", error);
      throw new functions.https.HttpsError("internal", `Failed to process image: ${error.message}`);
    }
  });