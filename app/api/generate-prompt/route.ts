import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import type { DirectorSettings, Character } from '@/lib/types';

type Body = {
  input: string;
  settings: DirectorSettings;
  characters: Character[];
  mode: 'image' | 'video';
};

function buildUserMessage(
  input: string,
  settings: DirectorSettings,
  characters: Character[],
  mode: 'image' | 'video'
): string {
  const charBlock =
    characters.length > 0
      ? `Characters:\n${characters.map(c => `- ${c.name}${c.age ? `, ${c.age}세` : ''}${c.gender ? `, ${c.gender}` : ''}${c.appearance ? `, ${c.appearance}` : ''}${c.clothing ? `, wearing ${c.clothing}` : ''}`).join('\n')}`
      : '';
  const settingsBlock = [
    `Genre: ${settings.genre}`,
    `Shot: ${settings.shotType}`,
    `Camera angle: ${settings.cameraAngle}`,
    `Lighting: ${settings.lighting}`,
    settings.weather ? `Weather: ${settings.weather}` : '',
    settings.fieldOfView ? `FOV: ${settings.fieldOfView}` : '',
    mode === 'video' && settings.cameraMovement ? `Camera movement: ${settings.cameraMovement}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  return [
    `[Scene description in Korean]`,
    input.trim(),
    '',
    charBlock,
    '',
    `[Director settings] ${settingsBlock}`,
    '',
    `Output a single, detailed English prompt for ${mode === 'video' ? 'video' : 'image'} generation. No preamble, no explanation.`,
  ]
    .filter(Boolean)
    .join('\n');
}

const SYSTEM_PROMPT = `You are a cinematic prompt writer for AI image/video generators (e.g. Runway, Midjourney, Sora).
Given a Korean scene description and director settings (genre, shot type, camera angle, lighting, characters), output ONE concise, vivid English prompt only.
- Use present tense, descriptive adjectives, and clear visual language.
- Include the director settings naturally in the prompt (e.g. "wide shot", "low angle", "dramatic lighting").
- Do not add titles, explanations, or multiple options. Output only the single prompt.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not set. 배포 환경 변수에 GROQ_API_KEY를 추가한 뒤 재배포하세요.' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as Body;
    const { input, settings, characters, mode } = body;

    if (!input?.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const userMessage = buildUserMessage(input, settings, characters, mode);

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: SYSTEM_PROMPT,
      prompt: userMessage,
    });

    const prompt = (text ?? '').trim();
    return NextResponse.json({ prompt });
  } catch (e) {
    console.error('[generate-prompt]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
