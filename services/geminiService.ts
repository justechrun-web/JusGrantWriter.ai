
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Stage 1: Compliance Agent
   * Handles both raw text and PDF file inputs via multimodal parts.
   */
  async evaluateCompliance(nofoText: string, orgProfile: string, pdfBase64?: string) {
    const parts: any[] = [
      {
        text: `You are the Compliance Checker Agent. 
        Analyze the provided solicitation (NOFO/BAA) and Organization Profile.
        
        ORG PROFILE: ${orgProfile}
        
        TASKS:
        1. Verify applicant eligibility.
        2. Identify disqualifiers and fatal flaws.
        3. Extract deadlines, page limits, formatting rules.
        4. List required attachments.
        5. Extract scoring criteria and weights.
        
        If the solicitation is provided as a PDF attachment, prioritize its content.`
      }
    ];

    if (nofoText) {
      parts.push({ text: `SOLICITATION TEXT: ${nofoText}` });
    }

    if (pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            decision: { type: Type.STRING, description: 'GO or NO-GO' },
            rationale: { type: Type.STRING },
            checks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  status: { type: Type.STRING, description: 'pass, fail, or warning' },
                  blocking: { type: Type.BOOLEAN },
                  reason: { type: Type.STRING },
                  fatalFlaw: { type: Type.BOOLEAN }
                },
                required: ['item', 'status', 'blocking']
              }
            }
          },
          required: ['decision', 'rationale', 'checks']
        }
      }
    });
    return JSON.parse(response.text);
  },

  /**
   * Stage 2: Grant Architecture Agent
   */
  async generateArchitecture(nofo: string, pdfBase64?: string) {
    const parts: any[] = [
      {
        text: `You are the Grant Architecture Agent. 
        Build a section outline mapped to scoring points and a Logic Model based on the solicitation.
        Identify funder priority language to mirror.`
      }
    ];

    if (nofo) parts.push({ text: `NOFO TEXT: ${nofo}` });
    if (pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalPoints: { type: Type.NUMBER },
            competitiveThreshold: { type: Type.NUMBER },
            pageLimit: { type: Type.NUMBER },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  points: { type: Type.NUMBER },
                  subsections: { type: Type.NUMBER }
                }
              }
            },
            logicModel: {
              type: Type.OBJECT,
              properties: {
                inputs: { type: Type.ARRAY, items: { type: Type.STRING } },
                activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                outputs: { type: Type.ARRAY, items: { type: Type.STRING } },
                outcomes: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  },

  /**
   * Stage 5: Budget & Allowability Agent
   */
  async generateBudget(nofo: string, logicModel: any) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are the Budget & Allowability Agent. 
      Build a budget by category tied to project activities.
      Check allowability under 2 CFR 200.
      Logic Model: ${JSON.stringify(logicModel)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              justification: { type: Type.STRING },
              allowable: { type: Type.BOOLEAN }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  },

  /**
   * Stage 6: Red Team Agent
   */
  async runRedTeamReview(proposalData: any) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are the Red Team Agent. 
      Re-score the proposal based on the architecture and identify weak areas.
      Data: ${JSON.stringify(proposalData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedScore: { type: Type.NUMBER },
            fixes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                }
              }
            },
            readinessVerdict: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text);
  }
};
