
import { GoogleGenAI, Type } from "@google/genai";
import { Opportunity, BidStage, BidPacket } from "../types";

// Initialize the Gemini API client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Scout Agent: Search Feed with Google Search Grounding
   */
  async scoutOpportunities(query: any): Promise<Opportunity[]> {
    const prompt = `Search for active federal contract opportunities on SAM.gov and Grants.gov related to ${JSON.stringify(query)}. 
    Return a diverse list of contracts. 
    Use CLARITY and SPECIFICITY. Provide title, agency, notice ID, award value, and response deadline.
    Ensure each opportunity has a valid 'id' and 'noticeId'.
    Return the results in a valid JSON array format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }]
      }
    });

    try {
      const text = response.text || "";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const results: Opportunity[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          title: chunk.web?.title,
          uri: chunk.web?.uri
        }));

      return results.map((opp: any) => ({
        ...opp,
        sources: sources.length > 0 ? sources : undefined
      }));
    } catch (e) {
      console.error("Failed to parse scout results:", e);
      return [];
    }
  },

  /**
   * Analyze Solicitation: systematic breakdown into 5 key areas
   */
  async analyzeSolicitation(opp: Opportunity): Promise<any> {
    const prompt = `Analyze this solicitation with expert precision:
    TITLE: ${opp.title}
    AGENCY: ${opp.agency}
    DESCRIPTION: ${opp.description}

    Break it down into the following 6 sections using active voice and removing robotic AI language:
    1. SUMMARY: A concise overview of the need.
    2. ELIGIBILITY: Clear requirements for who can bid.
    3. DELIVERABLES: List of key outputs/objectives.
    4. INSTRUCTIONS: Submission formatting and deadlines.
    5. BUDGET: Estimated value or duration.
    6. COMPLIANCE: POC info and critical clauses.

    Return the analysis in a valid JSON object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            eligibility: { type: Type.STRING },
            deliverables: { type: Type.STRING },
            instructions: { type: Type.STRING },
            budget: { type: Type.STRING },
            compliance: { type: Type.STRING },
          },
          required: ["summary", "eligibility", "deliverables", "instructions", "budget", "compliance"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Analysis parsing failed:", e);
      return null;
    }
  },

  /**
   * Bid Packet Generator: Enhanced with Active Voice and Expert Context
   */
  async generateTechnicalProposal(opp: Opportunity, companyProfile: any): Promise<string> {
    const prompt = `Write a high-compliance technical proposal section for the following federal solicitation:
    TITLE: ${opp.title}
    AGENCY: ${opp.agency}
    DESCRIPTION: ${opp.description}
    CONTEXT: ${JSON.stringify(companyProfile)}

    EXPERT GUIDELINES:
    1. Use ACTIVE VOICE exclusively.
    2. Eliminate generic marketing fluff and robotic AI patterns.
    3. Ensure SPECIFICITY regarding the deliverables andSection L/M requirements.
    4. Maintain CLARITY in the technical approach.
    5. Incorporate company strengths as relevant context.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    return response.text || "";
  },

  /**
   * Interactive Chatbot: Expert Guide Role
   */
  async askChatbot(question: string): Promise<string> {
    const prompt = `You are the JusGrantWriter.ai guide, an expert in government contracting and proposal writing. 
    Use CLARITY, SPECIFICITY, and CONTEXT. 
    Question: ${question}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional federal contracting expert. Remove robotic AI fillers. Use active voice. Provide specific, actionable advice based on federal procurement rules (FAR, Section L, Section M)."
      }
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  }
};
