import { NextRequest, NextResponse } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import type { DirectorSettings, Character } from '@/lib/types';

type Mode = 'image' | 'video';

type Body = {
  input: string;
  settings: DirectorSettings & {
    cameraHeight?: string;
    composition?: string;
    orientation?: string;
    location?: string;
  };
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
  location: string;
  subjectCount: number | null;
  subjectDescription: string;
  action: string;
  environmentDetails: string[];
  moodVisuals: string[];
  continuityDetails: string[];
  forbiddenElements: string[];
  negatives: string[];
};

type ExtractionResult = {
  action?: string;
  environmentDetails?: string[];
  moodVisuals?: string[];
  continuityDetails?: string[];
  forbiddenElements?: string[];
};

function normalizeText(value?: string | null, fallback = ''): string {
  const v = (value ?? '').trim();
  return v.length ? v : fallback;
}

function lower(value?: string | null): string {
  return normalizeText(value).toLowerCase();
}

function uniqueClean(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
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
  if (characters.length > 0) {
    if (characters.length <= 4) return characters.length;
    return null;
  }

  const s = lower(input);

  if (/\b(one|single|alone|solitary|lone|혼자|단독|1명)\b/.test(s)) return 1;
  if (/\b(two|both|둘|2명)\b/.test(s)) return 2;
  if (/\b(three|셋|3명)\b/.test(s)) return 3;
  if (/\b(four|넷|4명)\b/.test(s)) return 4;

  if (/\b(crowd|crowds)\b/.test(s) || /군중/.test(s)) return null;

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

  return `${characters.length} visible subjects: ${characters
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
  if (s.includes('establishing')) return 'establishing shot';

  return normalizeText(value, 'medium shot');
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

  return normalizeText(value, 'eye level');
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

function mapShotPhysicalDescription(shotType: string): string {
  const s = lower(shotType);

  if (s.includes('extreme wide')) return 'subject appears very small within the full environment';
  if (s === 'wide shot' || s.includes('wide')) return 'subject appears small within the environment';
  if (s.includes('full')) return 'full body visible within frame';
  if (s.includes('cowboy')) return 'framed from mid-thigh upward';
  if (s.includes('medium close')) return 'framed from the chest upward';
  if (s === 'medium shot' || s.includes('medium')) return 'framed from around the waist upward';
  if (s.includes('extreme close')) return 'extremely tight framing on a small detail';
  if (s === 'close-up' || s.includes('close up') || s.includes('close-up'))
    return 'face fills most of the frame';
  if (s.includes('insert')) return 'tight insert framing on the object or detail';
  if (s.includes('over-the-shoulder') || s.includes('ots'))
    return 'rear shoulder edge visible in the foreground';
  if (s.includes('pov')) return 'first-person viewpoint framing';
  if (s.includes('establishing')) return 'environment-first framing establishing the location';

  return shotType;
}

function mapAnglePhysicalDescription(cameraAngle: string): string {
  const a = lower(cameraAngle);

  if (a.includes('bird') || a.includes('birds') || a.includes('overhead'))
    return 'camera positioned high above the subject, looking downward from overhead';
  if (a.includes('top-down') || a.includes('top down'))
    return 'camera directly overhead, looking straight down';
  if (a.includes('low')) return 'camera positioned below eye level, looking upward';
  if (a.includes('high')) return 'camera positioned above eye level, looking downward';
  if (a.includes('eye')) return 'camera positioned at eye level';
  if (a.includes('dutch')) return 'camera tilted off horizontal axis';
  if (a.includes('over-the-shoulder') || a.includes('ots'))
    return 'camera placed behind one subject, looking past the shoulder';
  if (a.includes('pov')) return 'camera aligned to the subject’s direct point of view';

  return cameraAngle;
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

  return [...new Set(hits)];
}

function stripConflictingCameraTerms(text: string, conflicts: string[]): string {
  let result = text;

  for (const conflict of conflicts) {
    const escaped = conflict
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/['-]/g, "['-]?");
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  }

  return result.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').trim();
}

function buildSpecSkeleton(
  input: string,
  settings: Body['settings'],
  characters: Character[],
  mode: Mode
): ShotSpec {
  const subjectCount = inferSubjectCount(input, characters);

  return {
    shotSize: normalizeShotSize(settings.shotType),
    framing: mapShotPhysicalDescription(normalizeShotSize(settings.shotType)),
    cameraAngle: normalizeAngle(settings.cameraAngle),
    cameraHeight: normalizeText(settings.cameraHeight, 'eye level'),
    lensFov: normalizeLens(settings.fieldOfView),
    composition: normalizeText(settings.composition, 'centered composition'),
    orientation: normalizeText(settings.orientation, 'landscape'),
    movement: mode === 'image' ? 'static camera' : normalizeText(settings.cameraMovement, 'static camera'),
    lighting: normalizeText(settings.lighting, 'naturalistic lighting'),
    weather: normalizeText(settings.weather, 'none'),
    location: normalizeText(settings.location, ''),
    subjectCount,
    subjectDescription: describeCharacters(characters),
    action: normalizeText(input, 'subject present in scene'),
    environmentDetails: [],
    moodVisuals: [],
    continuityDetails: [],
    forbiddenElements: [],
    negatives: [],
  };
}

function buildSpecExtractionPrompt(
  input: string,
  settings: Body['settings'],
  characters: Character[],
  mode: Mode
): string {
  const skeleton = buildSpecSkeleton(input, settings, characters, mode);

  return `
You are extracting only scene-supporting details for a prompt translator.

[USER REQUEST]
${input.trim()}

[CHARACTERS]
${buildCharacterBlock(characters)}

[FIXED DIRECTOR CONSTRAINTS]
Shot size: ${skeleton.shotSize}
Camera angle: ${skeleton.cameraAngle}
Camera height: ${skeleton.cameraHeight}
Lens / FOV: ${skeleton.lensFov}
Composition: ${skeleton.composition}
Orientation: ${skeleton.orientation}
Movement: ${skeleton.movement}
Lighting: ${skeleton.lighting}
Weather: ${skeleton.weather}
Location: ${skeleton.location || 'unspecified'}
Mode: ${mode}

[CORE RULES]
- Preserve all user-provided constraints unless they are logically or physically incompatible.
- Do not remove or weaken a constraint only because it is unusual or aesthetically awkward.
- Only resolve truly impossible contradictions.
- Do not invent any shot type or camera angle that is not already present in the fixed constraints.
- Emotion and mood may affect only lighting, color, atmosphere, posture, texture, and environment density.
- Emotion and mood must never change shot size, framing, crop, camera angle, camera height, lens, movement, location identity, or subject count.
- The selected location is fixed and must never be replaced by another place.
- You are not allowed to output new camera language.
- 1 to 4 subjects are not a crowd.
- Crowd is only valid if the user explicitly says crowd / crowds / 군중.

[TASK]
Return one JSON object only with these keys:
{
  "action": string,
  "environmentDetails": string[],
  "moodVisuals": string[],
  "continuityDetails": string[],
  "forbiddenElements": string[]
}

[OUTPUT RULES]
- JSON only
- English only
- Keep details concrete and minimal
- No markdown
- No camera terms not already fixed above
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

function validateAndNormalizeSpec(spec: ShotSpec, mode: Mode): ShotSpec {
  const normalized: ShotSpec = {
    ...spec,
    shotSize: normalizeShotSize(spec.shotSize),
    framing: normalizeText(spec.framing, mapShotPhysicalDescription(spec.shotSize)),
    cameraAngle: normalizeAngle(spec.cameraAngle),
    cameraHeight: normalizeText(spec.cameraHeight, 'eye level'),
    lensFov: normalizeLens(spec.lensFov),
    composition: normalizeText(spec.composition, 'centered composition'),
    orientation: normalizeText(spec.orientation, 'landscape'),
    movement: mode === 'image' ? 'static camera' : normalizeText(spec.movement, 'static camera'),
    lighting: normalizeText(spec.lighting, 'naturalistic lighting'),
    weather: normalizeText(spec.weather, 'none'),
    location: normalizeText(spec.location, ''),
    subjectDescription: normalizeText(spec.subjectDescription, 'one visible subject'),
    action: normalizeText(spec.action, 'subject present in scene'),
    environmentDetails: uniqueClean(spec.environmentDetails),
    moodVisuals: uniqueClean(spec.moodVisuals),
    continuityDetails: uniqueClean(spec.continuityDetails),
    forbiddenElements: uniqueClean(spec.forbiddenElements),
    negatives: uniqueClean(spec.negatives),
  };

  const allowedAngle = normalizeAngle(normalized.cameraAngle);
  const angleHitList = angleTokens(
    [
      normalized.action,
      normalized.environmentDetails.join(', '),
      normalized.moodVisuals.join(', '),
      normalized.continuityDetails.join(', '),
      normalized.lighting,
    ].join(' ')
  );

  const conflictingAngles = angleHitList.filter((x) => x !== allowedAngle);

  if (conflictingAngles.length > 0) {
    normalized.action = stripConflictingCameraTerms(normalized.action, conflictingAngles);
    normalized.environmentDetails = normalized.environmentDetails.map((v) =>
      stripConflictingCameraTerms(v, conflictingAngles)
    );
    normalized.moodVisuals = normalized.moodVisuals.map((v) =>
      stripConflictingCameraTerms(v, conflictingAngles)
    );
    normalized.continuityDetails = normalized.continuityDetails.map((v) =>
      stripConflictingCameraTerms(v, conflictingAngles)
    );
  }

  const shot = lower(normalized.shotSize);
  const lens = lower(normalized.lensFov);
  const angle = lower(normalized.cameraAngle);

  const isPovShot = shot.includes('pov');
  const isOtsShot = shot.includes('over-the-shoulder');
  const isClose = shot.includes('close-up');
  const isExtremeWide = shot.includes('extreme wide');
  const isWide = shot === 'wide shot' || shot.includes('wide shot');

  if (isPovShot && normalized.subjectCount === 1 && normalized.subjectDescription !== 'one visible subject') {
    normalized.negatives.push('no third-person full-body view of the POV subject');
  }

  if (isOtsShot) {
    normalized.negatives.push('no missing foreground shoulder');
  }

  if ((isWide || isExtremeWide) && lens.includes('85mm')) {
    normalized.lensFov = '35mm lens feel';
  }

  if ((isWide || isExtremeWide) && lens.includes('135mm')) {
    normalized.lensFov = '35mm lens feel';
  }

  if (isExtremeWide && isClose) {
    normalized.shotSize = 'wide shot';
    normalized.framing = mapShotPhysicalDescription(normalized.shotSize);
  }

  if (angle === "bird's-eye view") {
    normalized.negatives.push('no low angle');
    normalized.negatives.push('no eye-level angle');
    normalized.negatives.push('no upward-looking view');
  }

  if (angle === 'top-down view') {
    normalized.negatives.push("no bird's-eye reinterpretation from an oblique angle");
    normalized.negatives.push('no low angle');
    normalized.negatives.push('no eye-level angle');
  }

  if (angle === 'low angle') {
    normalized.negatives.push("no bird's-eye view");
    normalized.negatives.push('no top-down view');
    normalized.negatives.push('no high angle');
  }

  if (angle === 'high angle') {
    normalized.negatives.push("no bird's-eye view");
    normalized.negatives.push('no top-down view');
    normalized.negatives.push('no low angle');
  }

  if (angle === 'POV') {
    normalized.negatives.push('no external third-person viewpoint');
  }

  if (normalized.location) {
    normalized.negatives.push(`no different location from ${normalized.location}`);
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

  normalized.environmentDetails = uniqueClean(normalized.environmentDetails);
  normalized.moodVisuals = uniqueClean(normalized.moodVisuals);
  normalized.continuityDetails = uniqueClean(normalized.continuityDetails);
  normalized.negatives = uniqueClean(normalized.negatives);

  return normalized;
}

function buildFallbackSpec(
  input: string,
  settings: Body['settings'],
  characters: Character[],
  mode: Mode
): ShotSpec {
  const base = buildSpecSkeleton(input, settings, characters, mode);
  const s = lower(input);

  const moodVisuals: string[] = [];

  if (/(fear|terror|afraid|scared|공포|무서|두려)/.test(s)) {
    moodVisuals.push('defensive body language', 'cold desaturated atmosphere', 'sharp shadow pockets');
  }
  if (/(sad|grief|melancholy|슬픔|비통|우울)/.test(s)) {
    moodVisuals.push('stillness', 'drained color', 'lowered posture');
  }
  if (/(peaceful|calm|평화|고요)/.test(s)) {
    moodVisuals.push('soft ambient light', 'gentle atmosphere');
  }
  if (/(overwhelming|oppressive|압도|위압)/.test(s)) {
    moodVisuals.push('high-contrast shadows', 'oppressive spatial density', 'limited visible escape space');
  }

  base.action = normalizeText(input, 'subject present in scene');
  base.moodVisuals = moodVisuals;
  base.environmentDetails = [];
  base.continuityDetails = [];
  base.forbiddenElements = [];
  base.negatives = [];

  return validateAndNormalizeSpec(base, mode);
}

function buildPromptFromSpec(spec: ShotSpec, mode: Mode): string {
  const shotBlock = [spec.shotSize, spec.framing, spec.composition, spec.orientation]
    .filter(Boolean)
    .join(', ');

  const cameraBlock = [
    spec.cameraAngle,
    mapAnglePhysicalDescription(spec.cameraAngle),
    spec.cameraHeight,
    spec.lensFov,
    mode === 'image' ? 'static camera' : spec.movement,
  ]
    .filter(Boolean)
    .join(', ');

  const subjectBlock =
    spec.subjectCount !== null
      ? `${spec.subjectCount} visible ${spec.subjectCount === 1 ? 'subject' : 'subjects'}, ${spec.subjectDescription}`
      : spec.subjectDescription;

  const environmentBlock = [
    spec.location ? `location: ${spec.location}` : '',
    ...spec.environmentDetails,
    spec.weather !== 'none' ? `weather: ${spec.weather}` : '',
    ...spec.continuityDetails,
  ]
    .filter(Boolean)
    .join(', ');

  const moodBlock = [spec.lighting, ...spec.moodVisuals].filter(Boolean).join(', ');

  const styleBlock =
    'cinematic film still, photorealistic, richly detailed, high dynamic range, natural film grain, tactile realism';

  const negativeBlock = spec.negatives.join(', ');

  return [
    `- SHOT & FRAMING - ${shotBlock}`,
    `- CAMERA & LENS - ${cameraBlock}`,
    `- SUBJECT - ${subjectBlock}`,
    spec.action ? `- SCENE / ACTION - ${spec.action}` : '',
    environmentBlock ? `- ENVIRONMENT - ${environmentBlock}` : '',
    moodBlock ? `- MOOD & LIGHTING - ${moodBlock}` : '',
    `- STYLE - ${styleBlock}`,
    negativeBlock ? `- NEGATIVE CONSTRAINTS - ${negativeBlock}` : '',
  ]
    .filter(Boolean)
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

const SPEC_SYSTEM_PROMPT = `
You are a strict scene-detail extraction engine for a cinematic prompt translator.

Your job:
- Preserve user intent.
- Preserve existing constraints.
- Remove only truly impossible contradictions.
- Never invent new shot types or camera angles.
- Never replace the selected location.
- Never let mood rewrite camera language.
- 1 to 4 subjects are not a crowd.
- Crowd is valid only when the user explicitly says crowd / crowds / 군중.

You are not a stylist.
You are not a cinematography teacher.
You are not allowed to "improve" the user's taste.
You extract only the minimum scene details needed to support the fixed shot specification.

Return JSON only.
`.trim();

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not set. 배포 환경 변수를 확인하세요.' },
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

    const extracted = safeJsonParse<ExtractionResult>(text ?? '');

    let spec: ShotSpec;

    if (extracted) {
      spec = validateAndNormalizeSpec(
        {
          ...buildSpecSkeleton(input, settings, characters, mode),
          action: normalizeText(extracted.action, input.trim()),
          environmentDetails: Array.isArray(extracted.environmentDetails)
            ? extracted.environmentDetails
            : [],
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
        generator: 'constraint-first prompt translator',
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