import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import type { DirectorSettings, Character } from '@/lib/types';

type Mode = 'image' | 'video';

type Body = {
  input: string;
  settings: DirectorSettings;
  characters: Character[];
  mode: Mode;
};

type ShotSpec = {
  shotSize: string;
  framing: string;
  cameraAngle: string;
  cameraHeight: string;
  lensFov: string;
  composition: string;
  orientation: string;
  movement: string;
  lighting: string;
  weather: string;
  subjectCount: number | null;
  subjectDescription: string;
  action: string;
  environment: string;
  moodVisuals: string[];
  continuityDetails: string[];
  forbiddenElements: string[];
  negatives: string[];
};

function normalizeText(value?: string | null, fallback = 'unspecified'): string {
  const v = (value ?? '').trim();
  return v.length ? v : fallback;
}

function lower(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

function buildCharacterBlock(characters: Character[]): string {
  if (!characters.length) return 'None';

  return characters
    .map((c, i) => {
      const parts = [
        `${i + 1}. ${c.name || 'Unnamed character'}`,
        c.age ? `${c.age} years old` : '',
        c.gender ? `${c.gender}` : '',
        c.appearance ? `appearance: ${c.appearance}` : '',
        c.clothing ? `clothing: ${c.clothing}` : '',
      ].filter(Boolean);

      return `- ${parts.join(', ')}`;
    })
    .join('\n');
}

function inferSubjectCount(input: string, characters: Character[]): number | null {
  if (characters.length > 0) return characters.length;

  const s = lower(input);

  if (/\b(one|single|alone|solitary|a lone|혼자|단독)\b/.test(s)) return 1;
  if (/\b(two|both|둘|2명)\b/.test(s)) return 2;
  if (/\b(three|셋|3명)\b/.test(s)) return 3;
  if (/\b(crowd|many people|group|군중|여럿)\b/.test(s)) return null;

  return 1;
}

function describeCharacters(characters: Character[]): string {
  if (!characters.length) return 'one visible subject';

  if (characters.length === 1) {
    const c = characters[0];
    const parts = [
      c.name || 'one subject',
      c.gender || '',
      c.age ? `${c.age} years old` : '',
      c.appearance || '',
      c.clothing ? `wearing ${c.clothing}` : '',
    ].filter(Boolean);
    return parts.join(', ');
  }

  return `${characters.length} visible characters: ${characters
    .map((c) => {
      const parts = [
        c.name || 'unnamed character',
        c.gender || '',
        c.age ? `${c.age} years old` : '',
        c.appearance || '',
        c.clothing ? `wearing ${c.clothing}` : '',
      ].filter(Boolean);
      return parts.join(', ');
    })
    .join(' ; ')}`;
}

function mapShotPhysicalDescription(shotType: string): string {
  const s = lower(shotType);

  if (s.includes('extreme wide')) return 'subject appears very small within the full environment';
  if (s === 'wide shot' || s.includes('wide')) return 'subject appears small within the environment';
  if (s.includes('full')) return 'full body visible within frame';
  if (s.includes('cowboy')) return 'framed from mid-thigh upward';
  if (s.includes('medium close')) return 'framed from the chest upward';
  if (s === 'medium shot' || s.includes('medium')) return 'framed from around the waist upward';
  if (s.includes('extreme close')) return 'extremely tight framing on a small facial or object detail';
  if (s === 'close-up' || s.includes('close up') || s.includes('close-up'))
    return 'face fills most of the frame';
  if (s.includes('insert')) return 'tight insert framing on the object or detail';
  if (s.includes('over-the-shoulder') || s.includes('ots'))
    return 'rear shoulder edge visible in the foreground';
  if (s.includes('pov')) return 'first-person viewpoint framing';
  if (s.includes('profile')) return 'side view framing of the subject';
  if (s.includes('establishing')) return 'environment-first framing establishing the location';

  return shotType;
}

function mapAnglePhysicalDescription(cameraAngle: string): string {
  const a = lower(cameraAngle);

  if (a.includes('bird') || a.includes('birds') || a.includes('overhead'))
    return 'camera positioned high above the subject, looking downward';
  if (a.includes('top-down') || a.includes('top down'))
    return 'camera directly overhead, looking straight down';
  if (a.includes('low')) return 'camera positioned below eye level, looking upward';
  if (a.includes('high')) return 'camera positioned above eye level, looking downward';
  if (a.includes('eye')) return 'camera positioned at eye level';
  if (a.includes('dutch')) return 'camera tilted off horizontal axis';
  if (a.includes('over-the-shoulder') || a.includes('ots'))
    return 'camera placed behind one subject, looking past the shoulder';
  if (a.includes('pov')) return 'camera aligned to the subject’s direct point of view';
  if (a.includes('profile')) return 'camera placed to the side of the subject';
  if (a.includes('rear three-quarter') || a.includes('rear 3/4'))
    return 'camera positioned behind and to one side of the subject';

  return cameraAngle;
}

function normalizeAngle(value?: string | null): string {
  const a = lower(value);

  if (!a || a === 'unspecified') return 'eye level';
  if (a.includes('bird') || a.includes('birds') || a.includes('overhead')) return "bird's-eye view";
  if (a.includes('top-down') || a.includes('top down')) return 'top-down view';
  if (a.includes('low')) return 'low angle';
  if (a.includes('high')) return 'high angle';
  if (a.includes('eye')) return 'eye level';
  if (a.includes('dutch')) return 'Dutch angle';
  if (a.includes('over-the-shoulder') || a.includes('ots')) return 'over-the-shoulder';
  if (a.includes('pov')) return 'POV';
  if (a.includes('profile')) return 'profile view';
  if (a.includes('rear three-quarter') || a.includes('rear 3/4')) return 'rear three-quarter view';

  return normalizeText(value, 'eye level');
}

function normalizeShotSize(value?: string | null): string {
  const s = lower(value);

  if (!s || s === 'unspecified') return 'medium shot';
  if (s.includes('extreme wide')) return 'extreme wide shot';
  if (s === 'wide shot' || s.includes('wide')) return 'wide shot';
  if (s.includes('full')) return 'full shot';
  if (s.includes('cowboy')) return 'cowboy shot';
  if (s.includes('medium close')) return 'medium close-up';
  if (s === 'medium shot' || s.includes('medium')) return 'medium shot';
  if (s.includes('extreme close')) return 'extreme close-up';
  if (s === 'close-up' || s.includes('close up') || s.includes('close-up')) return 'close-up';
  if (s.includes('insert')) return 'insert shot';
  if (s.includes('over-the-shoulder') || s.includes('ots')) return 'over-the-shoulder shot';
  if (s.includes('pov')) return 'POV shot';
  if (s.includes('profile')) return 'profile shot';
  if (s.includes('establishing')) return 'establishing shot';

  return normalizeText(value, 'medium shot');
}

function normalizeLens(value?: string | null): string {
  const raw = normalizeText(value, '35mm').replace(/\s+/g, ' ').trim();
  const l = lower(raw);

  if (/\b24mm\b/.test(l)) return '24mm lens feel';
  if (/\b28mm\b/.test(l)) return '28mm lens feel';
  if (/\b35mm\b/.test(l)) return '35mm lens feel';
  if (/\b50mm\b/.test(l)) return '50mm lens feel';
  if (/\b85mm\b/.test(l)) return '85mm lens feel';
  if (/\b135mm\b/.test(l)) return '135mm lens feel';

  if (l.includes('intimate portrait')) return '85mm lens feel';
  if (l.includes('natural')) return '35mm lens feel';
  if (l.includes('wide')) return '24mm lens feel';
  if (l.includes('voyeur')) return '135mm lens feel';

  return `${raw} lens feel`;
}

function angleTokens(text: string): string[] {
  const s = lower(text);
  const hits: string[] = [];

  if (s.includes('bird') || s.includes('birds') || s.includes('overhead')) hits.push("bird's-eye view");
  if (s.includes('top-down') || s.includes('top down')) hits.push('top-down view');
  if (s.includes('low angle')) hits.push('low angle');
  if (s.includes('high angle')) hits.push('high angle');
  if (s.includes('eye level')) hits.push('eye level');
  if (s.includes('dutch angle')) hits.push('Dutch angle');
  if (s.includes('over-the-shoulder')) hits.push('over-the-shoulder');
  if (/\bpov\b/.test(s)) hits.push('POV');
  if (s.includes('profile view')) hits.push('profile view');

  return [...new Set(hits)];
}

function validateAndNormalizeSpec(spec: ShotSpec, mode: Mode): ShotSpec {
  const normalized: ShotSpec = {
    ...spec,
    shotSize: normalizeShotSize(spec.shotSize),
    cameraAngle: normalizeAngle(spec.cameraAngle),
    cameraHeight: normalizeText(spec.cameraHeight, 'eye level'),
    lensFov: normalizeLens(spec.lensFov),
    composition: normalizeText(spec.composition, 'centered composition'),
    orientation: normalizeText(spec.orientation, 'landscape'),
    movement: mode === 'image' ? 'static camera' : normalizeText(spec.movement, 'static camera'),
    lighting: normalizeText(spec.lighting, 'naturalistic lighting'),
    weather: normalizeText(spec.weather, 'none'),
    framing: normalizeText(spec.framing, mapShotPhysicalDescription(spec.shotSize)),
    moodVisuals: [...new Set(spec.moodVisuals.filter(Boolean))],
    continuityDetails: [...new Set(spec.continuityDetails.filter(Boolean))],
    forbiddenElements: [...new Set(spec.forbiddenElements.filter(Boolean))],
    negatives: [...new Set(spec.negatives.filter(Boolean))],
  };

  const angleHitList = angleTokens(
    [
      normalized.cameraAngle,
      normalized.action,
      normalized.environment,
      normalized.lighting,
      normalized.moodVisuals.join(', '),
      normalized.subjectDescription,
    ].join(' ')
  );

  const allowedAngle = normalizeAngle(normalized.cameraAngle);
  const conflictingAngles = angleHitList.filter((x) => x !== allowedAngle);

  if (conflictingAngles.length > 0) {
    normalized.action = stripForbiddenCameraLanguage(normalized.action, conflictingAngles);
    normalized.environment = stripForbiddenCameraLanguage(normalized.environment, conflictingAngles);
    normalized.lighting = stripForbiddenCameraLanguage(normalized.lighting, conflictingAngles);
    normalized.moodVisuals = normalized.moodVisuals.map((v) =>
      stripForbiddenCameraLanguage(v, conflictingAngles)
    );
  }

  const shot = lower(normalized.shotSize);
  const lens = lower(normalized.lensFov);

  if (
    (shot.includes('wide') || shot.includes('establishing') || shot.includes('full')) &&
    lens.includes('85mm')
  ) {
    normalized.lensFov = '35mm lens feel';
  }

  if (
    (shot.includes('wide') || shot.includes('establishing')) &&
    lens.includes('135mm')
  ) {
    normalized.lensFov = '35mm lens feel';
  }

  if (normalized.cameraAngle === "bird's-eye view" || normalized.cameraAngle === 'top-down view') {
    normalized.negatives.push('no low angle');
    normalized.negatives.push('no high angle');
  }

  if (normalized.cameraAngle === 'low angle') {
    normalized.negatives.push("no bird's-eye view");
    normalized.negatives.push('no top-down view');
    normalized.negatives.push('no high angle');
  }

  if (normalized.cameraAngle === 'high angle') {
    normalized.negatives.push("no bird's-eye view");
    normalized.negatives.push('no top-down view');
    normalized.negatives.push('no low angle');
  }

  normalized.negatives.push('no altered camera angle');
  normalized.negatives.push('no incorrect crop');
  normalized.negatives.push('no extra characters');
  normalized.negatives.push('no poster composition');
  normalized.negatives.push('no collage');
  normalized.negatives.push('no split screen');
  normalized.negatives.push('no text');
  normalized.negatives.push('no logo');
  normalized.negatives.push('no watermark');

  if (mode === 'image') {
    normalized.negatives.push('no multi-panel layout');
    normalized.negatives.push('no storyboard layout');
  } else {
    normalized.negatives.push('no shot changes');
    normalized.negatives.push('no montage cuts');
    normalized.negatives.push('maintain single-shot continuity');
  }

  normalized.negatives = [...new Set(normalized.negatives)];

  return normalized;
}

function stripForbiddenCameraLanguage(text: string, conflicts: string[]): string {
  let result = text;

  for (const conflict of conflicts) {
    const escaped = conflict
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/['-]/g, "['-]?");
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '').replace(/\s{2,}/g, ' ').trim();
  }

  return result;
}

function buildPromptFromSpec(spec: ShotSpec, mode: Mode): string {
  const shotBlock = `${spec.shotSize}, ${spec.framing}, ${spec.composition}, ${spec.orientation}`;
  const cameraBlock = `${spec.cameraAngle}, ${mapAnglePhysicalDescription(spec.cameraAngle)}, ${spec.cameraHeight}, ${spec.lensFov}, ${mode === 'image' ? 'static camera' : spec.movement}`;
  const subjectBlock =
    spec.subjectCount && spec.subjectCount > 0
      ? `${spec.subjectCount} visible ${spec.subjectCount === 1 ? 'subject' : 'subjects'}, ${spec.subjectDescription}`
      : spec.subjectDescription;

  const actionBlock = spec.action;
  const envParts = [spec.environment];
  if (spec.weather !== 'none') envParts.push(`weather: ${spec.weather}`);
  if (spec.continuityDetails.length) envParts.push(spec.continuityDetails.join(', '));
  const environmentBlock = envParts.filter(Boolean).join(', ');

  const moodBlock = [spec.lighting, ...spec.moodVisuals].filter(Boolean).join(', ');
  const styleBlock =
    'cinematic film still, photorealistic, richly detailed, high dynamic range, natural film grain, tactile realism';
  const negativeBlock = spec.negatives.join(', ');

  return [
    `--- SHOT & FRAMING --- ${shotBlock}`,
    `--- CAMERA & LENS --- ${cameraBlock}`,
    `--- SUBJECT --- ${subjectBlock}`,
    actionBlock ? `--- SCENE / ACTION --- ${actionBlock}` : '',
    environmentBlock ? `--- ENVIRONMENT --- ${environmentBlock}` : '',
    moodBlock ? `--- MOOD & LIGHTING --- ${moodBlock}` : '',
    `--- STYLE --- ${styleBlock}`,
    negativeBlock ? `--- NEGATIVE CONSTRAINTS --- ${negativeBlock}` : '',
  ]
    .filter(Boolean)
    .join('\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildSpecSkeleton(
  input: string,
  settings: DirectorSettings,
  characters: Character[],
  mode: Mode
): ShotSpec {
  const subjectCount = inferSubjectCount(input, characters);

  return {
    shotSize: normalizeShotSize(settings.shotType),
    framing: mapShotPhysicalDescription(normalizeShotSize(settings.shotType)),
    cameraAngle: normalizeAngle(settings.cameraAngle),
    cameraHeight: 'eye level',
    lensFov: normalizeLens(settings.fieldOfView),
    composition: 'centered composition',
    orientation: 'landscape',
    movement: mode === 'image' ? 'static camera' : normalizeText(settings.cameraMovement, 'static camera'),
    lighting: normalizeText(settings.lighting, 'naturalistic lighting'),
    weather: normalizeText(settings.weather, 'none'),
    subjectCount,
    subjectDescription: describeCharacters(characters),
    action: normalizeText(input, 'subject present in scene'),
    environment: '',
    moodVisuals: [],
    continuityDetails: [],
    forbiddenElements: [],
    negatives: [],
  };
}

function buildSpecExtractionPrompt(
  input: string,
  settings: DirectorSettings,
  characters: Character[],
  mode: Mode
): string {
  const skeleton = buildSpecSkeleton(input, settings, characters, mode);

  return `
You are extracting a strict internal shot specification from a natural-language request.

[USER REQUEST]
${input.trim()}

[CHARACTERS]
${buildCharacterBlock(characters)}

[HARD DIRECTOR CONSTRAINTS]
Shot size: ${skeleton.shotSize}
Camera angle: ${skeleton.cameraAngle}
Camera height: ${skeleton.cameraHeight}
Lens / FOV: ${skeleton.lensFov}
Composition: ${skeleton.composition}
Orientation: ${skeleton.orientation}
Movement: ${skeleton.movement}
Lighting: ${skeleton.lighting}
Weather: ${skeleton.weather}
Mode: ${mode}

[NON-NEGOTIABLE RULES]
- These camera constraints are fixed.
- Do not introduce a different shot size.
- Do not introduce a different camera angle.
- Do not introduce a different camera height.
- Do not introduce a different lens.
- Emotion/mood/style may affect only lighting, color, atmosphere, posture, texture, and environment density.
- Emotion/mood/style must never affect shot size, framing, crop, camera angle, camera height, lens, movement, or subject count.
- Do not add extra people or props unless clearly requested.
- If the request is vague, keep it conservative.

[TASK]
Return one JSON object only with these keys:
{
  "action": string,
  "environment": string,
  "moodVisuals": string[],
  "continuityDetails": string[],
  "forbiddenElements": string[]
}

[OUTPUT RULES]
- JSON only
- English only
- Do not include markdown
- Do not include any camera language except what is already fixed in the constraints
- Do not include conflicting angles or shot terms
`.trim();
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function buildFallbackSpec(
  input: string,
  settings: DirectorSettings,
  characters: Character[],
  mode: Mode
): ShotSpec {
  const base = buildSpecSkeleton(input, settings, characters, mode);

  const lowerInput = lower(input);
  const moodVisuals: string[] = [];

  if (/(fear|terror|afraid|scared|공포|무서|두려)/.test(lowerInput)) {
    moodVisuals.push('defensive body language', 'cold desaturated lighting', 'sharp shadow pockets');
  }
  if (/(sad|grief|melancholy|슬픔|비통|우울)/.test(lowerInput)) {
    moodVisuals.push('drained color', 'stillness', 'lowered posture');
  }
  if (/(peaceful|calm|평화|고요)/.test(lowerInput)) {
    moodVisuals.push('soft ambient light', 'gentle atmosphere');
  }
  if (/(overwhelming|oppressive|압도|위압)/.test(lowerInput)) {
    moodVisuals.push('high-contrast shadows', 'oppressive spatial density', 'limited visible escape space');
  }

  base.action = input.trim();
  base.environment = '';
  base.moodVisuals = moodVisuals;
  base.continuityDetails = [];
  base.forbiddenElements = [];
  base.negatives = [];

  return validateAndNormalizeSpec(base, mode);
}

const SPEC_SYSTEM_PROMPT = `
You are a strict shot-spec extraction engine.
You do not write beautiful prompts.
You extract only non-camera scene information while preserving fixed camera constraints.

Rules:
- Never change shot size.
- Never change framing logic.
- Never change camera angle.
- Never change camera height.
- Never change lens / FOV.
- Never introduce camera words from emotion.
- Never introduce low angle / high angle / bird's-eye / top-down / Dutch angle unless already fixed by constraints.
- Emotion and mood may affect only lighting, color temperature, atmosphere, posture, texture, and environment density.
- Keep outputs minimal, concrete, and generator-friendly.
- Return JSON only.
`.trim();

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GROQ_API_KEY is not set. 배포 환경 변수에 GROQ_API_KEY를 추가하세요.',
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as Body;
    const { input, settings, characters, mode } = body;

    if (!input?.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const specPrompt = buildSpecExtractionPrompt(input, settings, characters, mode);

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: SPEC_SYSTEM_PROMPT,
      prompt: specPrompt,
      temperature: 0.1,
    });

    const extracted = safeJsonParse<{
      action?: string;
      environment?: string;
      moodVisuals?: string[];
      continuityDetails?: string[];
      forbiddenElements?: string[];
    }>(text ?? '');

    let spec: ShotSpec;

    if (extracted) {
      spec = validateAndNormalizeSpec(
        {
          ...buildSpecSkeleton(input, settings, characters, mode),
          action: normalizeText(extracted.action, input.trim()),
          environment: normalizeText(extracted.environment, ''),
          moodVisuals: Array.isArray(extracted.moodVisuals) ? extracted.moodVisuals : [],
          continuityDetails: Array.isArray(extracted.continuityDetails)
            ? extracted.continuityDetails
            : [],
          forbiddenElements: Array.isArray(extracted.forbiddenElements)
            ? extracted.forbiddenElements
            : [],
          negatives: Array.isArray(extracted.forbiddenElements)
            ? extracted.forbiddenElements.map((v) => `no ${v}`)
            : [],
        },
        mode
      );
    } else {
      spec = buildFallbackSpec(input, settings, characters, mode);
    }

    const prompt = buildPromptFromSpec(spec, mode);

    return NextResponse.json({
      prompt,
      spec,
      meta: {
        generator: 'constraint-first shot-spec compiler',
        mode,
      },
    });
  } catch (e) {
    console.error('[generate-prompt]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Generation failed' },
      { status: 500 }
    );
  }
}