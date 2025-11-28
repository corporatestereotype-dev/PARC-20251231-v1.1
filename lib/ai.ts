

import { GoogleGenAI, Type } from "@google/genai";
import type { Settings, SyntheticUser, AutonomousSimulationResult, SimulationEvent, ChatMessage, Task, CommunityStyle, Community, Project } from '../types';

type GeneratedUser = Omit<SyntheticUser, 'id' | 'avatarUrl'>;
type GeneratedCommunityProfile = Omit<Community, 'id' | 'projects' | 'feedItems'>;

// Defines the context for a project, used to provide more specific instructions to the AI.
interface ProjectContext {
  title: string;
  description: string;
  messages?: ChatMessage[];
  tasks?: Task[];
}

const callGeminiProWithThinking = async (prompt: string, systemInstruction: string, schema?: any): Promise<any> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-pro';

  try {
    console.log(`Calling Gemini Pro with thinking budget. Schema: ${!!schema}`);
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 },
        ...(schema && {
          responseMimeType: "application/json",
          responseSchema: schema,
        }),
      },
    });

    if (schema) {
      const jsonStr = response.text.trim();
      return JSON.parse(jsonStr);
    } else {
      return response.text;
    }
  } catch (error) {
    console.error(`Gemini API error with model ${model} (thinking mode):`, error);
    throw error;
  }
};


// FIX: Removed model fallback lists to adhere to guideline of using 'gemini-2.5-flash'.
const callGemini = async (prompt: string, systemInstruction?: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  // FIX: Simplified to use the recommended model directly, removing the fallback loop.
  const model = 'gemini-2.5-flash';
  try {
    console.log(`Attempting to call Gemini with model: ${model}`);
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      ...(systemInstruction && { config: { systemInstruction } }),
    });
    console.log(`Successfully received response from model: ${model}`);
    return response.text;
  } catch (error) {
    console.error(`Gemini API error with model ${model}:`, error);
    throw error;
  }
};

const callGeminiWithSchema = async (prompt: string, systemInstruction: string, schema: any): Promise<any> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY environment variable not set.");
    const ai = new GoogleGenAI({ apiKey });
    
    // FIX: Simplified to use the recommended model directly, removing the fallback loop.
    const model = 'gemini-2.5-flash';
    try {
        console.log(`Attempting to call Gemini with JSON schema using model: ${model}`);
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        console.log(`Successfully received JSON response from model: ${model}`);
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error(`Gemini API error with model ${model} and JSON schema:`, error);
        throw error;
    }
}


const callOllama = async (prompt: string, model: string, systemInstruction?: string): Promise<string> => {
  // CONCEPTUAL INTEGRATION POINT FOR CASISS (Corporate ASI Safe Sandbox)
  // To enable the local AI (CASISA) to execute commands, access the file system, or build new features,
  // this function would not call Ollama directly. Instead, it would make a request to a local "PARC Bridge" service
  // (e.g., a Node.js server running on localhost:3001).
  //
  // This bridge service would be responsible for:
  // 1. Receiving the prompt from the PARC UI.
  // 2. Interacting with the Ollama API to get the AI's response/plan.
  // 3. If the AI's plan involves execution (e.g., 'run this python script'), the bridge service would
  //    execute that command *inside* the running CASISS Docker container.
  // 4. It would then return the output from the sandbox back to the PARC UI.
  //
  // The current implementation is a direct-to-Ollama call for text generation only.
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        system: systemInstruction,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Ollama API error:", error);
    // The detailed error message is now in the Settings modal's connection test.
    // This provides a cleaner error for in-app popups.
    throw new Error(
        "Failed to connect to local Ollama server. Please test your connection and configuration in the Settings panel."
    );
  }
};

/**
 * A unified AI calling function that abstracts the provider logic.
 * It handles standard text generation, JSON-schema-based generation, and "thinking" mode.
 * @param prompt The main prompt for the AI.
 * @param settings The application settings, including the AI provider.
 * @param options Additional options like system instruction, JSON schema, and thinking mode.
 * @returns A promise that resolves to a string or a parsed JSON object.
 */
const callAI = async (
    prompt: string,
    settings: Settings,
    { systemInstruction, schema, useThinking }: {
        systemInstruction?: string,
        schema?: any,
        useThinking?: boolean
    } = {}
): Promise<any> => { // returns string or parsed JSON object
    if (settings.aiProvider === 'gemini') {
        if (schema) {
            // callGeminiProWithThinking is a more powerful model that also supports schemas.
            // Prefer it if thinking is requested.
            if (useThinking) {
                return callGeminiProWithThinking(prompt, systemInstruction || '', schema);
            }
            return callGeminiWithSchema(prompt, systemInstruction || '', schema);
        }
        if (useThinking) {
            return callGeminiProWithThinking(prompt, systemInstruction || '');
        }
        return callGemini(prompt, systemInstruction);

    } else if (settings.aiProvider === 'ollama') {
        if (!settings.ollamaModel) {
            throw new Error("Ollama model is not configured.");
        }
        
        let finalSystemInstruction = systemInstruction;
        if (schema) {
            // For Ollama, we embed the JSON requirement into the system instruction.
            finalSystemInstruction = `${systemInstruction || ''}\n\nIMPORTANT: You must respond with a single, valid JSON object that strictly adheres to the provided schema. Do not include any explanatory text, markdown formatting like \`\`\`json, or any other text outside of the JSON structure. The JSON schema is: ${JSON.stringify(schema, null, 2)}`;
        }
        
        const responseText = await callOllama(prompt, settings.ollamaModel, finalSystemInstruction);

        if (schema) {
            try {
                // Clean up potential markdown code fences that models sometimes add despite instructions
                const cleanedResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanedResponse);
            } catch (e) {
                console.error("Ollama response was not valid JSON:", responseText);
                throw new Error("Ollama failed to generate a valid JSON response. The selected model may not be suitable for this complex, structured task. Please try a different model or use the Gemini provider.");
            }
        }
        
        return responseText;
    } else {
        throw new Error(`Unsupported AI provider: ${settings.aiProvider}`);
    }
};


export const getAIResponse = async (prompt: string, settings: Settings, projectContext?: ProjectContext): Promise<string> => {
  let systemInstruction = "You are Polymath AI, a helpful and knowledgeable research assistant integrated into the PARC platform. Be concise and clear in your responses.";
  if (projectContext) {
    systemInstruction += ` You are currently assisting with the project "${projectContext.title}", which is about: "${projectContext.description}". Tailor your response to be relevant to this project.`;
    
    if (projectContext.messages && projectContext.messages.length > 0) {
        const recentMessages = projectContext.messages.slice(-4).map(m => `${m.user.name}: ${m.text}`).join('\n');
        systemInstruction += `\n\nHere is the recent conversation history for context:\n${recentMessages}`;
    }

    if (projectContext.tasks && projectContext.tasks.length > 0) {
        const todo = projectContext.tasks.filter(t => t.status === 'todo').length;
        const inprogress = projectContext.tasks.filter(t => t.status === 'inprogress').length;
        const done = projectContext.tasks.filter(t => t.status === 'done').length;
        systemInstruction += `\n\nFor additional context, here is the current status of project tasks: To Do (${todo}), In Progress (${inprogress}), Done (${done}). Use this information to better understand the project's current focus and priorities.`;
    }
  }

  const isTaskPlanningRequest = /plan|tasks|schedule|break down|work plan/i.test(prompt);
  const useThinkingMode = prompt.toLowerCase().startsWith('think:') || isTaskPlanningRequest;
  const actualPrompt = useThinkingMode && !isTaskPlanningRequest ? prompt.slice('think:'.length).trim() : prompt;

  if (isTaskPlanningRequest) {
    systemInstruction += `\n\nWhen asked to create a task plan, you MUST consider dependencies between tasks. Structure your response as a multi-phase plan (e.g., Phase 1, Phase 2). Use markdown headings for phases and bullet points for tasks. Provide a brief description for each task. Suggest a logical order.`;
  }

  return callAI(actualPrompt, settings, {
      systemInstruction,
      useThinking: useThinkingMode
  });
};

export const generateImage = async (prompt: string, settings: Settings): Promise<string> => {
    if (settings.aiProvider !== 'gemini') {
        throw new Error("Image generation is currently only supported via Gemini.");
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY environment variable not set.");
    const ai = new GoogleGenAI({ apiKey });

    try {
        console.log(`Generating image with prompt: "${prompt}"`);
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("Image generation failed to return an image.");
        }
    } catch (error) {
        console.error("Image generation error:", error);
        throw error;
    }
};

export const generateCommunityProfile = async (
    themeDescription: string,
    vibe: string,
    settings: Settings
): Promise<GeneratedCommunityProfile> => {
    if (settings.aiProvider !== 'gemini') {
        throw new Error("Community generation currently requires Gemini for its advanced reasoning and JSON schema capabilities.");
    }

    const prompt = `Generate a profile for a new PARC community.
    - **Theme:** "${themeDescription}"
    - **Vibe:** "${vibe}"

    Based on this, create a community name, a welcome message for the global chat, a color palette, and a list of 5 founding AI members.`;

    const systemInstruction = `You are a creative director for the Polymath AI Research Community (PARC). Your task is to generate a complete, thematic community profile in a single JSON object.
- The name should be catchy and relevant to the theme.
- The welcome message should be inviting and set the tone.
- The founding members must have diverse personas and expertise relevant to the theme.
- The color palette must be a set of 9 valid CSS hex color codes that match the requested vibe. Crucially, ensure there is high contrast between text colors (--text-primary, --text-secondary, --text-accent) and background colors (--bg-primary, --bg-secondary, --bg-tertiary) for readability. The color names must be exactly as specified in the schema.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "A creative and fitting name for the community." },
            themeDescription: { type: Type.STRING, description: "A copy of the user's theme description." },
            globalMessages: {
                type: Type.ARRAY,
                description: "An array containing a single welcome message object for the community's main chat.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        user: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Should be 'Polymath AI Assistant'" },
                                email: { type: Type.STRING, description: "Should be 'ai-assistant@science-fair.com'" }
                            },
                             required: ["name", "email"]
                        },
                        text: { type: Type.STRING, description: "The welcome message text." },
                        timestamp: { type: Type.STRING, description: "A timestamp, e.g., '09:00 AM'." }
                    },
                    required: ["id", "user", "text", "timestamp"]
                }
            },
            foundingMembers: {
                type: Type.ARRAY,
                description: "A list of 5 synthetic 'founding member' personas for the community.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Full name of the synthetic user." },
                        personaSummary: { type: Type.STRING, description: "A brief, one-sentence summary of the user's background and research focus related to the theme." }
                    },
                    required: ["name", "personaSummary"]
                }
            },
            style: {
                type: Type.OBJECT,
                description: "A color palette of 9 hex codes.",
                properties: {
                    '--bg-primary': { type: Type.STRING, description: "Hex code for the darkest background color." },
                    '--bg-secondary': { type: Type.STRING, description: "Hex code for a mid-level background color." },
                    '--bg-tertiary': { type: Type.STRING, description: "Hex code for a lighter background/element color." },
                    '--border-primary': { type: Type.STRING, description: "Hex code for borders." },
                    '--text-primary': { type: Type.STRING, description: "Hex code for primary text." },
                    '--text-secondary': { type: Type.STRING, description: "Hex code for secondary/muted text." },
                    '--text-accent': { type: Type.STRING, description: "Hex code for accent text/links." },
                    '--accent-primary': { type: Type.STRING, description: "Hex code for primary buttons/actions." },
                    '--accent-primary-hover': { type: Type.STRING, description: "Hex code for primary button hover state." },
                },
                required: ["--bg-primary", "--bg-secondary", "--bg-tertiary", "--border-primary", "--text-primary", "--text-secondary", "--text-accent", "--accent-primary", "--accent-primary-hover"]
            }
        },
        required: ["name", "themeDescription", "globalMessages", "foundingMembers", "style"]
    };

    return await callGeminiProWithThinking(prompt, systemInstruction, schema);
};


export const runSyntheticUserWorkflow = async (
    userCount: number,
    duration: number,
    domains: string[],
    settings: Settings,
    communityTheme?: string
): Promise<{ users: GeneratedUser[], report: string }> => {
    
    let contextInstruction = `for a research simulation in the domains of: ${domains.join(', ')}.`;
    if (communityTheme) {
        contextInstruction = `for a research simulation within a community themed around "${communityTheme}". The research should focus on the intersection of this theme with the selected domains: ${domains.join(', ')}.`;
    }

    const userGenPrompt = `Generate a list of ${userCount} unique synthetic user personas ${contextInstruction} Each persona should have a unique name and a brief, one-sentence summary of their background and research focus.`;
    const userGenSystemInstruction = `You are a Persona Generator for the Polymath AI Research Community. Your task is to create diverse and believable researcher personas. Respond ONLY with a JSON array of objects, where each object has "name" and "personaSummary" keys. Do not include markdown formatting like \`\`\`json.`;
    
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Full name of the synthetic user." },
                personaSummary: { type: Type.STRING, description: "A brief, one-sentence summary of the user's background and research focus." }
            },
            required: ["name", "personaSummary"]
        }
    };
    const users: GeneratedUser[] = await callAI(userGenPrompt, settings, {
        systemInstruction: userGenSystemInstruction,
        schema,
    });


    if (users.length === 0) {
        throw new Error("The AI failed to generate any synthetic users. Please try again.");
    }

    const reportGenPrompt = `A "Synthetic User Genesis Workflow" simulation was just completed for the Polymath AI Research Community (PARC).
    
    **Simulation Parameters:**
    - Community Theme: ${communityTheme || 'General Research'}
    - Number of Synthetic Researchers: ${userCount}
    - Simulation Duration: ${duration} minutes
    - Focused Research Domains: ${domains.join(', ')}

    **Generated Personas Overview:**
    The simulation spawned ${userCount} diverse AI personas with expertise in the specified domains, like a user whose focus is "${users[0]?.personaSummary || 'a quantum physicist'}" named "${users[0]?.name || 'Dr. Evelyn Reed'}". These personas then interacted with the core Polymath AI system, testing its capabilities, knowledge boundaries, and reasoning skills through complex, multi-step tasks and inquiries related to their fields.

    **Your Task:**
    Based on this simulated workflow, act as a Feedback Aggregator and Analyst. Generate a concise summary report in markdown format. The report should speculate on the likely outcomes of such a large-scale test. It must include:
    1.  A brief **## Analysis** of the simulation's purpose and scope.
    2.  A list of plausible **## Key Insights** that the synthetic users might have uncovered (e.g., "Identified a knowledge gap in the intersection of quantum computing and protein folding," or "Revealed a bias in the AI's ethical reasoning when presented with conflicting principles.").
    3.  A list of actionable **## Recommendations** for improving the core AI model based on these insights (e.g., "Incorporate a new dataset on cryo-electron microscopy," or "Refine the system instruction for ethical dilemmas to handle nuance better.").`;

    const reportGenSystemInstruction = `You are an AI Analyst for the Polymath AI MetaSwarm. Your task is to generate a speculative report analyzing the outcomes of a simulated research workflow. The report should be structured, insightful, and provide concrete recommendations. Use markdown format.`;
    
    const report: string = await callAI(reportGenPrompt, settings, {
        systemInstruction: reportGenSystemInstruction,
        useThinking: true
    });
    
    return { users, report };
}

export const generateProjectTeam = async (
    projectContext: { title: string; description: string; tags: string[] }, 
    settings: Settings
): Promise<GeneratedUser[]> => {
    const teamSize = 5;
    const prompt = `Based on the following research project, generate a team of ${teamSize} synthetic collaborators. They should have diverse, complementary skills and personas that are well-suited for "vibe coding" (a highly collaborative, intuitive, and creative coding process) and providing insightful feedback on this topic.

    **Project Title:** "${projectContext.title}"
    **Project Description:** "${projectContext.description}"
    **Project Tags:** ${projectContext.tags.join(', ')}

    For each team member, provide a unique name and a one-sentence summary of their persona, including their primary skill or perspective.`;

    const systemInstruction = `You are a team builder for creative and technical projects. Generate a JSON array of objects, where each object represents a team member and has "name" and "personaSummary" keys. Do not include markdown formatting.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Full name of the synthetic collaborator." },
                personaSummary: { type: Type.STRING, description: "A brief, one-sentence summary of their persona and primary skill." }
            },
            required: ["name", "personaSummary"]
        }
    };
    return callAI(prompt, settings, { systemInstruction, schema, useThinking: true });
};

const summarizeGraph = (timeline: SimulationEvent[]): string => {
    const nodes = new Set<string>();
    timeline.forEach(event => {
        event.graphChanges.newNodes?.forEach(n => nodes.add(`'${n.label}' (${n.domain})`));
    });
    return Array.from(nodes).join(', ') || 'an initial set of domain concepts';
};

const summarizeRepo = (timeline: SimulationEvent[]): string => {
    const files = new Set<string>();
    timeline.forEach(event => {
        event.repositoryCommit?.files.forEach(f => files.add(f.path));
    });
    return Array.from(files).join(', ') || 'no files yet';
};


export const runAutonomousSimulation = async (settings: Settings, previousResult: AutonomousSimulationResult | null): Promise<AutonomousSimulationResult> => {
    let prompt: string;

    if (!previousResult) {
        // Initial run prompt
        prompt = `Simulate an initial 24-hour research cycle for the Polymath AI Research Community (PARC), titled "Emergent Bias in Human-AI Cognitive Systems: A Polymath Exploration".
    
        1.  **Select Domains:** The primary domains are **AI Ethics, Neuroscience, and Complex Systems**.
        2.  **Generate Users:** Create 10 diverse synthetic researchers with expertise in these domains.
        3.  **Simulate Timeline (15 Events):**
            a. **Event 1-3: Kick-off & Planning Phase.** The first three events MUST represent a planning meeting. In this meeting, researchers propose specific projects related to the main title. They must discuss and form a consensus, breaking into 2-3 smaller collaborative groups for the cycle. The commit for these events should be meeting minutes or project proposals.
            b. **Event 4-15: Research Execution.** The remaining events must show these groups working on their chosen projects. The events must build on each other, showing collaboration, challenges, and breakthroughs. Each event must still include a relevant repository commit.
        4.  **Final Report:** Write a comprehensive report summarizing the research journey, the findings of each group, and future directions.
        The entire output must be a single, valid JSON object matching the provided schema.`;
    } else {
        // Continuation run prompt
        const lastEvent = previousResult.simulationTimeline[previousResult.simulationTimeline.length - 1];
        const lastTimestamp = lastEvent ? lastEvent.timestamp : 0;
        
        const graphSummary = summarizeGraph(previousResult.simulationTimeline);
        const repoSummary = summarizeRepo(previousResult.simulationTimeline);

        prompt = `Continue a research cycle for PARC, focusing on "${previousResult.simulationTitle}". This is a continuation of a previous simulation.

        **Established Context (Do NOT change these):**
        - Research Domains: ${previousResult.researchDomains.join(', ')}
        - Researchers: ${previousResult.generatedUsers.map(u => u.name).join(', ')}

        **Previous State Summary:**
        - The last simulation ended at hour ${lastTimestamp}. The last major activities involved: "${lastEvent.summary}".
        - Current knowledge graph concepts include: ${graphSummary}
        - Researcher repositories contain files like: ${repoSummary}
        
        **Your Task:**
        1. **Simulate the next 24 hours (15 new events):**
           a. **Event 1-3: Progress Review & Planning Meeting.** The first three events of this new timeline MUST be a meeting where researchers present their progress from the previous cycle. Based on their findings, they MUST dynamically decide as a group what to prioritize next. This could involve continuing long-term projects, adjusting goals, or re-forming collaborative groups. The commits should be progress reports or updated project plans.
           b. **Event 4-15: New Research Execution.** The remaining events must show the researchers executing the new plan decided upon in the meeting. Events must build logically on the previous state and the new plan.
        2. **Repository Commits:** For each event, a researcher MUST make a "commit" to their repository.
        3. **New Final Report:** Write a new comprehensive final report that summarizes the entire research journey so far, incorporating these new events and their outcomes.
        
        The entire output must be a single, valid JSON object matching the provided schema. You must include the original 'researchDomains' and 'generatedUsers' in your response for schema validation.`;
    }

    const systemInstruction = `You are the Conductor of the Polymath AI Research Community's autonomous workflow. Your task is to orchestrate a complete, simulated research cycle. You must generate a creative, coherent, and logically consistent narrative of scientific discovery. The output MUST be a single, valid JSON object that strictly adheres to the provided schema. Do not include any explanatory text or markdown formatting outside of the JSON structure.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            simulationTitle: { type: Type.STRING },
            researchDomains: { type: Type.ARRAY, items: { type: Type.STRING } },
            generatedUsers: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        personaSummary: { type: Type.STRING }
                    },
                    required: ["name", "personaSummary"]
                }
            },
            simulationTimeline: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        timestamp: { type: Type.INTEGER, description: "Hour of the simulation (e.g., 0-24 for initial, 25-48 for continuation, etc.)" },
                        summary: { type: Type.STRING },
                        details: { type: Type.STRING },
                        triggeredBy: { type: Type.STRING, description: "Name of the synthetic user responsible" },
                        affectedDomains: { type: Type.ARRAY, items: { type: Type.STRING } },
                        graphChanges: {
                            type: Type.OBJECT,
                            properties: {
                                newNodes: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING },
                                            label: { type: Type.STRING },
                                            domain: { type: Type.STRING }
                                        },
                                        required: ["id", "label", "domain"]
                                    }
                                },
                                newLinks: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            source: { type: Type.STRING },
                                            target: { type: Type.STRING },
                                            label: { type: Type.STRING }
                                        },
                                        required: ["source", "target", "label"]
                                    }
                                }
                            }
                        },
                        repositoryCommit: {
                            type: Type.OBJECT,
                            description: "A commit of files to the researcher's virtual repository.",
                            properties: {
                                message: { type: Type.STRING, description: "A descriptive commit message." },
                                files: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            path: { type: Type.STRING, description: "File path, e.g., 'data/results.csv'" },
                                            content: { type: Type.STRING, description: "The full content of the file." },
                                            type: { type: Type.STRING, description: "Type of file: 'script', 'dataset', 'report', 'code', 'document', 'image', 'audio', 'video'." },
                                        },
                                        required: ["path", "content", "type"]
                                    }
                                }
                            },
                            required: ["message", "files"]
                        },
                    },
                     required: ["timestamp", "summary", "details", "triggeredBy", "affectedDomains", "graphChanges", "repositoryCommit"]
                }
            },
            finalReport: { type: Type.STRING, description: "A markdown-formatted final summary report." }
        },
        required: ["simulationTitle", "researchDomains", "generatedUsers", "simulationTimeline", "finalReport"]
    };

    return callAI(prompt, settings, { systemInstruction, schema, useThinking: true });
};

export const generateSimulationScript = async (metaprompt: string, agentRoles: string, settings: Settings, projectContext?: ProjectContext, communityTheme?: string): Promise<string> => {
    let systemInstruction = `You are an AI system designer for the Polymath AI MetaSwarm. Your task is to generate a simulation plan based on a user's metaprompt and defined agent roles. The plan should be a markdown-formatted, step-by-step script for AI agents to follow. The script should be clear, concise, and actionable. Use markdown for code blocks if you suggest code.
**Crucially, you must adhere to the conceptual domain of the prompt.** If the prompt is abstract (e.g., about AI architecture), do not pivot to a concrete, unrelated domain (e.g., financial markets). Your primary goal is to accurately interpret and model the user's stated objective.`;
    
    if (communityTheme) {
        systemInstruction += `\n**The simulation takes place in a community with the theme: "${communityTheme}". Ensure the output reflects this context.**`;
    }

    let promptContent = `\n\n---\n\n**Metaprompt:**\n${metaprompt}`;
    if (agentRoles) {
        promptContent += `\n\n**Agent Roles:**\n${agentRoles}`;
    }

    let prompt: string;
    if (projectContext) {
        // FIX: Changed 'project.description' to 'projectContext.description' to use the correct variable.
        prompt = `For the project titled "${projectContext.title}", which is about: "${projectContext.description}", generate a simulation script based on the following metaprompt and agent roles:${promptContent}`;
    } else {
        prompt = `Based on the following metaprompt and agent roles, generate a simulation script:${promptContent}`;
    }

    return callAI(prompt, settings, { systemInstruction, useThinking: true });
}

export const generateSimulationLog = async (metaprompt: string, script: string, settings: Settings, communityTheme?: string): Promise<string> => {
    let systemInstruction = `You are a simulation engine for the Polymath AI MetaSwarm. You will receive a metaprompt and a simulation script. Your task is to generate a plausible, concise, and technical-looking simulation log in the specified format. The log should reflect the steps in the script and be directly relevant to the metaprompt's domain.`;
    
    if (communityTheme) {
        systemInstruction += ` The simulation is running inside a community themed around: "${communityTheme}". The log should subtly reflect this context.`;
    }
    
    const prompt = `Metaprompt: "${metaprompt}"\n\nSimulation Script:\n${script}\n\nGenerate a simulation log based on the above. The format should be a series of lines, each starting with a timestamp like '[X.XXs]' followed by a description of an action. The log must not mention cryptocurrency or stock markets unless the metaprompt is explicitly about finance.`;

    return callAI(prompt, settings, { systemInstruction });
};

export const generateSwarmReport = async (metaprompt: string, simulationLog: string, settings: Settings, projectContext?: ProjectContext, communityTheme?: string): Promise<string> => {
    let systemInstruction = `You are an AI analyst for the Polymath AI MetaSwarm. You will receive an original metaprompt and a simulation log. Your task is to generate a concise report in markdown format analyzing the outcomes, identifying key insights, and suggesting concrete refinements for the next iteration. Structure the report with clear headings: ## Analysis, ## Key Insights, and ## Recommendations.`;

    if (communityTheme) {
        systemInstruction += `\n**The simulation took place in a community with the theme: "${communityTheme}". Ensure your analysis considers this context.**`;
    }

    let prompt = `Metaprompt: "${metaprompt}"\n\nSimulation Log:\n${simulationLog}`;
    if (projectContext) {
      prompt = `For the project titled "${projectContext.title}", analyze the following simulation.\n\nMetaprompt: "${metaprompt}"\n\nSimulation Log:\n${simulationLog}`;
    }
    
    return callAI(prompt, settings, { systemInstruction, useThinking: true });
}