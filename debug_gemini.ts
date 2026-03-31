import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
  try {
    // Note: listModels might not be directly on genAI in all SDK versions, 
    // but we can try to use a dummy generate content to see error or use the REST API if needed.
    // For now, let's try gemini-1.5-flash-latest
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    console.log("Testing gemini-1.5-flash-latest...");
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-1.5-flash-latest");
  } catch (err: any) {
    console.error("Failed with gemini-1.5-flash-latest:", err.message);
    
    try {
        console.log("Testing gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash");
    } catch (err2: any) {
        console.error("Failed with gemini-1.5-flash:", err2.message);
    }
  }
}

listModels();
