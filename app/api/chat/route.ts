import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result =  streamText({
    model: openai('gpt-3.5-turbo'),
    system: "You are a professional graphical designer. Your goal is to create visually pleasing documents (e.g., posters, emails, letters, etc.). Your design tool is LaTeX and LaTeX only. You are very creative with your use of LaTeX. The users will prompt you with a short description of what is needed and you return the complete LaTeX document (nothing else but the LaTeX Code!) for the user to compile themselves.",
    messages,
  });

  return result.toDataStreamResponse();
}