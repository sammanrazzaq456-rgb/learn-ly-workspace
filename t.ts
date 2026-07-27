import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import { z } from "zod";
const p = createOpenAICompatible({ name:"lovable-ai-gateway", baseURL:"https://ai.gateway.lovable.dev/v1", supportsStructuredOutputs:true, headers:{ "Lovable-API-Key": process.env.LOVABLE_API_KEY! }});
try {
  const { output } = await generateText({ model: p("google/gemini-3.6-flash"), output: Output.object({ schema: z.object({ keyIdeas: z.array(z.string()), terms: z.array(z.object({term:z.string(),definition:z.string()})) }) }), prompt: "Extract 2 key ideas and 2 terms from: Photosynthesis converts light into chemical energy in chloroplasts." });
  console.log("OK", JSON.stringify(output));
} catch (e:any) { console.log("FAIL", e?.name, e?.message?.slice(0,500), e?.text?.slice(0,300)); }
