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
Follow this EXACT structure and rules:

1) STYLE PRESET (fixed opener)
- Always start with a strong cinematic style preset like:
  "A cinematic film still shot on 35mm, ultra detailed, high dynamic range, film grain,"
- You may vary details slightly but keep the meaning: cinematic, 35mm/film-like, high quality movie still.

2) BLOCK SYSTEM (sectioned prompt)
- Structure the prompt into clear semantic blocks separated by labels, for example:
  "--- STYLE PRESET ---", "--- SHOT ---", "--- SCENE / ACTION ---", "--- MOOD & LIGHTING ---", "--- CAMERA & LENS ---".
- Each block should contain only information relevant to that aspect, and avoid contradicting other blocks.
- The final output is still ONE prompt string, but with these block labels included so that the image model does not receive conflicting information.

3) MOOD & LIGHTING (Korean nuance → cinematic English)
- Korean emotional words like "측은하다" should be translated into cinematic, evocative English mood words such as "pitiable", "heart‑wrenching", "melancholic", etc.
- Combine mood with lighting terms to create a filmic mise‑en‑scène, e.g. "heart‑wrenching mood, cold blue backlighting, soft rim light".

4) DIRECTOR SETTINGS INTEGRATION
- Use the director settings (genre, shot type, camera angle, lighting, weather, FOV, camera movement) NATURALLY inside the appropriate blocks:
  - SHOT block: wide shot / close‑up / extreme close‑up / establishing shot, etc.
  - CAMERA & LENS block: low angle / high angle / eye level, FOV or lens length if present.
  - MOOD & LIGHTING block: lighting style, weather, time of day, atmosphere.

5) GENERAL RULES
- Output must be ONE English prompt string only, following the block structure above.
- Use present tense, descriptive, concrete visual language.
- Do NOT add explanations, multiple options, lists of prompts, or any Korean text.`;

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
