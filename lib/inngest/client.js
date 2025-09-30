import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "aspireai",
  name: "Aspireai",
  credentials: {
    deepseek: {
      apiKey: process.env.OPENROUTER_API_KEY,
      siteUrl: process.env.SITE_URL || "https://asp-ai.vercel.app/",
      siteName: "AspireAI",
    },
  },
});
