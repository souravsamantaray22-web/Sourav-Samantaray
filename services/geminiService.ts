
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartTravelAdvice = async (from: string, to: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user wants to go from ${from} to ${to} within an Indian college campus. 
      Context: ${context}.
      Suggest the best meeting point for the rider and a tip for navigating this specific route safely or efficiently. Keep it concise, friendly, and 'college student' vibes.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Stay safe and wear a helmet! Enjoy your ride.";
  }
};

export const getSimulatedChatResponse = async (message: string, role: string, otherName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are ${otherName}, an Indian college student using a ride-sharing app called CampusRide. 
      You are currently the ${role === 'RIDER' ? 'PASSENGER' : 'RIDER'}.
      The other person said: "${message}". 
      Respond in a very short, friendly, and casual Indian college student style (Hinglish is okay). 
      Keep it under 15 words. Mention things like "Bhai", "rasta clear hai", "2 mins", etc.`,
    });
    return response.text;
  } catch {
    return "Bhai, bas 2 min mein pohanch raha hoon.";
  }
};

export const getPriceEstimate = async (from: string, to: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Estimate the distance and reasonable fare (in INR) for a bike ride from ${from} to ${to} within a typical large engineering campus in India. 
      Base price is usually ₹10-20. Return ONLY a JSON object with 'distance' (km) and 'estimatedFare' (number).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distance: { type: Type.NUMBER },
            estimatedFare: { type: Type.NUMBER }
          },
          required: ["distance", "estimatedFare"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { distance: 1.5, estimatedFare: 15 };
  }
};
