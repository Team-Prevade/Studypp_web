type GenerateTextInput = {
  instructions: string;
  prompt: string;
  maxOutputTokens?: number;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type AIProvider = "gemini" | "openai";

export const aiProvider = (process.env.AI_PROVIDER || "gemini") as AIProvider;
export const aiModel =
  process.env.AI_MODEL || (aiProvider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini");

function extractResponseText(data: OpenAIResponse) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter((text): text is string => Boolean(text?.trim()));

  return chunks?.join("\n").trim() || "";
}

function extractGeminiText(data: GeminiResponse) {
  return (
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text)
      .filter((text): text is string => Boolean(text?.trim()))
      .join("\n")
      .trim() || ""
  );
}

export function isAIConfigured() {
  if (aiProvider === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  if (aiProvider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return false;
}

async function generateOpenAIText(input: GenerateTextInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to call the AI provider");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiModel,
      instructions: input.instructions,
      input: input.prompt,
      max_output_tokens: input.maxOutputTokens ?? 900,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider error ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const text = extractResponseText(data);

  if (!text) {
    throw new Error("AI provider returned an empty response");
  }

  return text;
}

async function generateGeminiText(input: GenerateTextInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required to call the AI provider");
  }

  const model = aiModel.startsWith("models/") ? aiModel.slice("models/".length) : aiModel;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: input.instructions }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: input.prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: input.maxOutputTokens ?? 900,
          temperature: 0.4,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini provider error ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(data);

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

export async function generateAIText(input: GenerateTextInput) {
  if (aiProvider === "gemini") return generateGeminiText(input);
  if (aiProvider === "openai") return generateOpenAIText(input);
  throw new Error(`AI provider '${aiProvider}' is not supported yet`);
}
