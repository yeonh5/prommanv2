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

type ShotType =
  | 'extreme-close'
  | 'close'
  | 'medium-close'
  | 'medium'
  | 'full'
  | 'wide'
  | 'extreme-wide'
  | 'establishing';

type CameraAngle =
  | 'eye-level'
  | 'low-angle'
  | 'high-angle'
  | 'dutch-angle'
  | 'birds-eye'
  | 'worms-eye'
  | 'pov'
  | 'over-shoulder';

type LightingStyle = 'day' | 'dusk' | 'night' | 'dawn';
type WeatherStyle = 'clear' | 'rain' | 'snow' | 'fog' | 'dust' | 'thunder';
type LocationStyle = 'indoor' | 'studio' | 'city' | 'forest' | 'sea' | 'space';
type GenreStyle =
  | 'drama'
  | 'action'
  | 'thriller'
  | 'animation'
  | 'documentary'
  | 'romance'
  | 'product'
  | 'music-video';
type CameraMovement =
  | 'static'
  | 'pedestal'
  | 'pan'
  | 'tilt'
  | 'dolly-in'
  | 'dolly-out'
  | 'arc'
  | 'crane'
  | 'tracking'
  | 'long-take';
type LensStyle = '25mm' | '35mm' | '50mm' | '85mm' | '100mm' | '300mm';

type ShotSpec = {
  shotType: ShotType;
  cameraAngle: CameraAngle;
  lighting: LightingStyle;
  weather: WeatherStyle;
  location: LocationStyle;
  genre: GenreStyle;
  movement: CameraMovement;
  lens: LensStyle;
  composition: string;
  orientation: string;
  cameraHeight: string;
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

const SHOT_TYPES: readonly ShotType[] = [
  'extreme-close',
  'close',
  'medium-close',
  'medium',
  'full',
  'wide',
  'extreme-wide',
  'establishing',
];

const CAMERA_ANGLES: readonly CameraAngle[] = [
  'eye-level',
  'low-angle',
  'high-angle',
  'dutch-angle',
  'birds-eye',
  'worms-eye',
  'pov',
  'over-shoulder',
];

const LIGHTING_STYLES: readonly LightingStyle[] = ['day', 'dusk', 'night', 'dawn'];
const WEATHER_STYLES: readonly WeatherStyle[] = ['clear', 'rain', 'snow', 'fog', 'dust', 'thunder'];
const LOCATION_STYLES: readonly LocationStyle[] = ['indoor', 'studio', 'city', 'forest', 'sea', 'space'];
const GENRES: readonly GenreStyle[] = [
  'drama',
  'action',
  'thriller',
  'animation',
  'documentary',
  'romance',
  'product',
  'music-video',
];
const CAMERA_MOVEMENTS: readonly CameraMovement[] = [
  'static',
  'pedestal',
  'pan',
  'tilt',
  'dolly-in',
  'dolly-out',
  'arc',
  'crane',
  'tracking',
  'long-take',
];
const FIELD_OF_VIEW: readonly LensStyle[] = ['25mm', '35mm', '50mm', '85mm', '100mm', '300mm'];

const SHOT_LABELS: Record<ShotType, string> = {
  'extreme-close': 'extreme close-up',
  close: 'close-up',
  'medium-close': 'medium close-up',
  medium: 'medium shot',
  full: 'full shot',
  wide: 'wide shot',
  'extreme-wide': 'extreme wide shot',
  establishing: 'establishing shot',
};

const SHOT_PHYSICAL: Record<ShotType, string> = {
  'extreme-close': 'extremely tight framing on a small detail',
  close: 'face fills most of the frame',
  'medium-close': 'framed from the chest upward',
  medium: 'framed from around the waist upward',
  full: 'full body visible within frame',
  wide: 'subject appears small within the environment',
  'extreme-wide': 'subject appears very small within the full environment',
  establishing: 'environment-first framing establishing the location',
};

const ANGLE_LABELS: Record<CameraAngle, string> = {
  'eye-level': 'eye level',
  'low-angle': 'low angle',
  'high-angle': 'high angle',
  'dutch-angle': 'Dutch angle',
  'birds-eye': "bird's-eye view",
  'worms-eye': "worm's-eye view",
  pov: 'POV',
  'over-shoulder': 'over-the-shoulder',
};

const ANGLE_PHYSICAL: Record<CameraAngle, string> = {
  'eye-level': 'camera positioned at eye level',
  'low-angle': 'camera positioned below eye level, looking upward',
  'high-angle': 'camera positioned above eye level, looking downward',
  'dutch-angle': 'camera tilted off horizontal axis',
  'birds-eye': 'camera positioned high above the subject, looking downward from overhead',
  'worms-eye': 'camera positioned very low beneath the subject, looking upward',
  pov: 'camera aligned to the subject’s direct point of view',
  'over-shoulder': 'camera placed behind one subject, looking past the shoulder',
};

const LIGHTING_LABELS: Record<LightingStyle, string> = {
  day: 'daylight',
  dusk: 'dusk light',
  night: 'night lighting',
  dawn: 'dawn light',
};

const WEATHER_LABELS: Record<WeatherStyle, string> = {
  clear: 'clear weather',
  rain: 'rain',
  snow: 'snow',
  fog: 'fog',
  dust: 'dusty air',
  thunder: 'thunderstorm conditions',
};

const LOCATION_LABELS: Record<LocationStyle, string> = {
  indoor: 'indoor',
  studio: 'studio interior',
  city: 'city',
  forest: 'forest',
  sea: 'sea',
  space: 'space',
};

const GENRE_LABELS: Record<GenreStyle, string> = {
  drama: 'drama',
  action: 'action',
  thriller: 'thriller',
  animation: 'animation',
  documentary: 'documentary',
  romance: 'romance',
  product: 'product advertisement',
  'music-video': 'music video',
};

const MOVEMENT_LABELS: Record<CameraMovement, string> = {
  static: 'static camera',
  pedestal: 'pedestal movement',
  pan: 'pan movement',
  tilt: 'tilt movement',
  'dolly-in': 'dolly-in movement',
  'dolly-out': 'dolly-out movement',
  arc: 'arc movement',
  crane: 'crane movement',
  tracking: 'tracking movement',
  'long-take': 'long-take camera movement',
};

const LENS_LABELS: Record<LensStyle, string> = {
  '25mm': '25mm lens feel',
  '35mm': '35mm lens feel',
  '50mm': '50mm lens feel',
  '85mm': '85mm lens feel',
  '100mm': '100mm lens feel',
  '300mm': '300mm lens feel',
};

const CAMERA_WORD_PATTERNS = [
  /\bextreme close[- ]up\b/gi,
  /\bclose[- ]up\b/gi,
  /\bmedium close[- ]up\b/gi,
  /\bmedium shot\b/gi,
  /\bfull shot\b/gi,
  /\bwide shot\b/gi,
  /\bextreme wide\b/gi,
  /\bestablishing shot\b/gi,
  /\beye level\b/gi,
  /\blow angle\b/gi,
  /\bhigh angle\b/gi,
  /\bdutch angle\b/gi,
  /\bbird'?s[- ]eye\b/gi,
  /\bworm'?s[- ]eye\b/gi,
  /\bover[- ]the[- ]shoulder\b/gi,
  /\bpov\b/gi,
  /\b25mm\b/gi,
  /\b35mm\b/gi,
  /\b50mm\b/gi,
  /\b85mm\b/gi,
  /\b100mm\b/gi,
  /\b300mm\b/gi,
  /\bstatic camera\b/gi,
  /\bpedestal\b/gi,
  /\bpan\b/gi,
  /\btilt\b/gi,
  /\bdolly[- ]in\b/gi,
  /\bdolly[- ]out\b/gi,
  /\barc\b/gi,
  /\bcrane\b/gi,
  /\btracking\b/gi,
  /\blong[- ]take\b/gi,
  /\blens\b/gi,
  /\bcamera\b/gi,
  /\bframing\b/gi,
  /\bcrop\b/gi,
  /\bshot\b/gi,
];

const LOCATION_SYNONYM_BLOCKLIST: Record<LocationStyle, string[]> = {
  indoor: ['studio', 'city', 'forest', 'sea', 'space'],
  studio: ['indoor room', 'city', 'forest', 'sea', 'space'],
  city: ['forest', 'sea', 'space', 'studio', 'indoor room'],
  forest: ['city', 'sea', 'space', 'studio', 'indoor room', 'desert'],
  sea: ['forest', 'city', 'space', 'studio', 'indoor room', 'desert'],
  space: ['forest', 'city', 'sea', 'studio', 'indoor room', 'desert'],
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

function clampList(values: string[], max: number): string[] {
  return uniqueClean(values).slice(0, max);
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

  if (/\b(crowd|crowds)\b/.test(s) || /군중/.test(s)) return null;
  if (/\b(four|넷|4명)\b/.test(s)) return 4;
  if (/\b(three|셋|3명)\b/.test(s)) return 3;
  if (/\b(two|both|둘|2명)\b/.test(s)) return 2;
  if (/\b(one|single|alone|solitary|lone|혼자|단독|1명)\b/.test(s)) return 1;

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

function normalizeShotType(value?: string | null): ShotType {
  const s = lower(value);

  if (s.includes('extreme-close') || s.includes('extreme close')) return 'extreme-close';
  if (s === 'close' || s.includes('close')) return 'close';
  if (s.includes('medium-close') || s.includes('medium close')) return 'medium-close';
  if (s === 'medium' || s.includes('medium')) return 'medium';
  if (s.includes('full')) return 'full';
  if (s === 'wide' || s.includes('wide')) return 'wide';
  if (s.includes('extreme-wide') || s.includes('extreme wide')) return 'extreme-wide';
  if (s.includes('establishing')) return 'establishing';

  return 'medium';
}

function normalizeAngle(value?: string | null): CameraAngle {
  const s = lower(value);

  if (
    s.includes('worms-eye') ||
    s.includes("worm's-eye") ||
    s.includes('worms eye') ||
    s.includes('worms eye') ||
    s.includes('웜즈 아이')
  ) {
    return 'worms-eye';
  }

  if (
    s.includes('birds-eye') ||
    s.includes("bird's-eye") ||
    s.includes('birds eye') ||
    s.includes('버즈 아이')
  ) {
    return 'birds-eye';
  }

  if (s.includes('eye-level') || s.includes('eye level') || s.includes('아이 레벨')) {
    return 'eye-level';
  }

  if (s.includes('low-angle') || s.includes('low angle') || s.includes('로우 앵글')) {
    return 'low-angle';
  }

  if (s.includes('high-angle') || s.includes('high angle') || s.includes('하이 앵글')) {
    return 'high-angle';
  }

  if (s.includes('dutch-angle') || s.includes('dutch angle') || s.includes('더치 앵글')) {
    return 'dutch-angle';
  }

  if (s === 'pov' || /\bpov\b/.test(s)) {
    return 'pov';
  }

  if (
    s.includes('over-shoulder') ||
    s.includes('over shoulder') ||
    s.includes('오버 더 숄더')
  ) {
    return 'over-shoulder';
  }

  return 'eye-level';
}

function normalizeLighting(value?: string | null): LightingStyle {
  const s = lower(value);
  if (s.includes('day') || s.includes('낮')) return 'day';
  if (s.includes('dusk') || s.includes('노을')) return 'dusk';
  if (s.includes('night') || s.includes('밤')) return 'night';
  if (s.includes('dawn') || s.includes('새벽')) return 'dawn';
  return 'day';
}

function normalizeWeather(value?: string | null): WeatherStyle {
  const s = lower(value);
  if (s.includes('clear') || s.includes('맑')) return 'clear';
  if (s.includes('rain') || s.includes('비')) return 'rain';
  if (s.includes('snow') || s.includes('눈')) return 'snow';
  if (s.includes('fog') || s.includes('안개')) return 'fog';
  if (s.includes('dust') || s.includes('황사')) return 'dust';
  if (s.includes('thunder') || s.includes('번개') || s.includes('천둥')) return 'thunder';
  return 'clear';
}

function normalizeLocation(value?: string | null): LocationStyle {
  const s = lower(value);
  if (s.includes('indoor') || s.includes('실내')) return 'indoor';
  if (s.includes('studio') || s.includes('스튜디오')) return 'studio';
  if (s.includes('city') || s.includes('도시')) return 'city';
  if (s.includes('forest') || s.includes('숲')) return 'forest';
  if (s.includes('sea') || s.includes('바다')) return 'sea';
  if (s.includes('space') || s.includes('우주')) return 'space';
  return 'indoor';
}

function normalizeGenre(value?: string | null): GenreStyle {
  const s = lower(value);
  if (s.includes('drama') || s.includes('드라마')) return 'drama';
  if (s.includes('action') || s.includes('액션')) return 'action';
  if (s.includes('thriller') || s.includes('스릴러')) return 'thriller';
  if (s.includes('animation') || s.includes('애니메이션')) return 'animation';
  if (s.includes('documentary') || s.includes('다큐')) return 'documentary';
  if (s.includes('romance') || s.includes('로맨스')) return 'romance';
  if (s.includes('product') || s.includes('광고')) return 'product';
  if (s.includes('music-video') || s.includes('music video') || s.includes('뮤직비디오')) return 'music-video';
  return 'drama';
}

function normalizeMovement(value?: string | null): CameraMovement {
  const s = lower(value);
  if (s.includes('static') || s.includes('홀드')) return 'static';
  if (s.includes('pedestal') || s.includes('페데스탈')) return 'pedestal';
  if (s === 'pan' || s.includes('팬')) return 'pan';
  if (s === 'tilt' || s.includes('틸트')) return 'tilt';
  if (s.includes('dolly-in') || s.includes('dolly in') || s.includes('달리 인')) return 'dolly-in';
  if (s.includes('dolly-out') || s.includes('dolly out') || s.includes('달리 아웃')) return 'dolly-out';
  if (s === 'arc' || s.includes('아크')) return 'arc';
  if (s === 'crane' || s.includes('크레인')) return 'crane';
  if (s === 'tracking' || s.includes('트래킹')) return 'tracking';
  if (s.includes('long-take') || s.includes('long take') || s.includes('롱테이크')) return 'long-take';
  return 'static';
}

function normalizeLens(value?: string | null): LensStyle {
  const s = lower(value);
  if (s.includes('25mm')) return '25mm';
  if (s.includes('35mm')) return '35mm';
  if (s.includes('50mm')) return '50mm';
  if (s.includes('85mm')) return '85mm';
  if (s.includes('100mm')) return '100mm';
  if (s.includes('300mm')) return '300mm';
  return '35mm';
}

function stripCameraWords(text: string): string {
  let result = text;
  for (const pattern of CAMERA_WORD_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,+/g, ',')
    .trim()
    .replace(/^,|,$/g, '');
}

function stripOtherLocationWords(text: string, fixedLocation: LocationStyle): string {
  let result = text;
  const blocked = LOCATION_SYNONYM_BLOCKLIST[fixedLocation] || [];
  for (const word of blocked) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  }
  return result
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
    .replace(/^,|,$/g, '');
}

function sanitizeDetail(text: string, fixedLocation: LocationStyle): string {
  const stripped = stripOtherLocationWords(stripCameraWords(text), fixedLocation);
  return stripped.length > 0 ? stripped : '';
}

function sanitizeList(list: string[], fixedLocation: LocationStyle, max: number): string[] {
  return clampList(
    list
      .map((v) => sanitizeDetail(v, fixedLocation))
      .filter(Boolean),
    max
  );
}

function buildSpecSkeleton(
  input: string,
  settings: Body['settings'],
  characters: Character[],
  mode: Mode
): ShotSpec {
  return {
    shotType: normalizeShotType(settings.shotType),
    cameraAngle: normalizeAngle(settings.cameraAngle),
    lighting: normalizeLighting(settings.lighting),
    weather: normalizeWeather(settings.weather),
    location: normalizeLocation(settings.location),
    genre: normalizeGenre(settings.genre),
    movement: normalizeMovement(settings.cameraMovement),
    lens: normalizeLens(settings.fieldOfView),
    composition: normalizeText(settings.composition, 'centered composition'),
    orientation: normalizeText(settings.orientation, 'landscape'),
    cameraHeight: normalizeText(settings.cameraHeight, 'eye level'),
    subjectCount: inferSubjectCount(input, characters),
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
  const base = buildSpecSkeleton(input, settings, characters, mode);

  return `
You are a strict micro-detail extraction engine.

[USER REQUEST]
${input.trim()}

[CHARACTERS]
${buildCharacterBlock(characters)}

[FIXED ENUM CONSTRAINTS]
Shot type: ${base.shotType}
Camera angle: ${base.cameraAngle}
Lighting/time: ${base.lighting}
Weather: ${base.weather}
Location: ${base.location}
Genre: ${base.genre}
Camera movement: ${base.movement}
Lens: ${base.lens}
Subject count: ${base.subjectCount === null ? 'crowd' : base.subjectCount}
Mode: ${mode}

[STRICT RULES]
- Do not invent any new shot type.
- Do not invent any new camera angle.
- Do not invent any new lens.
- Do not invent any new movement.
- Do not replace the selected location.
- Do not change subject count.
- 1 to 4 subjects are not a crowd.
- Crowd is valid only if the user explicitly says crowd / crowds / 군중.
- Return only short non-camera scene details.
- No shot words.
- No angle words.
- No lens words.
- No movement words.
- No new place identity words.

[TASK]
Return one JSON object only:
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
- No markdown
- action must be one short sentence
- environmentDetails max 4
- moodVisuals max 4
- continuityDetails max 4
- forbiddenElements max 6
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

function applyConflictRules(spec: ShotSpec): ShotSpec {
  const out = { ...spec };

  const shot = out.shotType;
  const angle = out.cameraAngle;
  const lens = out.lens;

  if (shot === 'extreme-close' && (lens === '100mm' || lens === '300mm')) {
    out.lens = '85mm';
  }

  if ((shot === 'wide' || shot === 'extreme-wide' || shot === 'establishing') && lens === '300mm') {
    out.lens = '35mm';
  }

  if ((shot === 'extreme-wide' || shot === 'establishing') && lens === '100mm') {
    out.lens = '35mm';
  }

  if (shot === 'close' && lens === '300mm') {
    out.lens = '85mm';
  }

  if (shot === 'extreme-close' && (angle === 'birds-eye' || angle === 'worms-eye')) {
    out.cameraAngle = 'eye-level';
  }

  if (shot === 'establishing' && angle === 'pov') {
    out.cameraAngle = 'eye-level';
  }

  if (angle === 'birds-eye' && shot === 'extreme-close') {
    out.shotType = 'close';
  }

  if (angle === 'worms-eye' && shot === 'establishing') {
    out.shotType = 'wide';
  }

  if (angle === 'pov' && shot === 'establishing') {
    out.shotType = 'wide';
  }

  return out;
}

function buildNegatives(spec: ShotSpec, mode: Mode): string[] {
  const negatives: string[] = [
    'no altered shot type',
    'no altered camera angle',
    'no altered lens',
    'no altered location',
    'no incorrect crop',
    'no extra characters',
    'no poster composition',
    'no collage',
    'no split screen',
    'no text',
    'no logo',
    'no watermark',
  ];

  if (spec.location) {
    negatives.push(`no different location from ${LOCATION_LABELS[spec.location]}`);
  }

  if (spec.cameraAngle === 'birds-eye') {
    negatives.push('no low angle', 'no high angle', 'no eye-level angle', 'no upward-looking view');
  }

  if (spec.cameraAngle === 'worms-eye') {
    negatives.push('no bird’s-eye view', 'no high angle', 'no eye-level angle', 'no downward-looking view');
  }

  if (spec.cameraAngle === 'low-angle') {
    negatives.push("no bird's-eye view", "no worm's-eye view", 'no high angle');
  }

  if (spec.cameraAngle === 'high-angle') {
    negatives.push("no bird's-eye view", "no worm's-eye view", 'no low angle');
  }

  if (spec.cameraAngle === 'pov' || spec.shotType === 'wide') {
    if (spec.cameraAngle === 'pov') {
      negatives.push('no external third-person viewpoint');
      negatives.push('no third-person full-body view of the POV subject');
    }
  }

  if (spec.cameraAngle === 'over-shoulder') {
    negatives.push('no missing foreground shoulder');
  }

  if (mode === 'image') {
    negatives.push('no multi-panel layout', 'no storyboard layout');
  } else {
    negatives.push('no shot changes', 'no montage cuts', 'maintain single-shot continuity');
  }

  return uniqueClean([...negatives, ...spec.forbiddenElements.map((v) => `no ${v}`)]);
}

function validateAndNormalizeSpec(spec: ShotSpec, mode: Mode): ShotSpec {
  const fixedLocation = spec.location;

  const cleaned: ShotSpec = {
    ...spec,
    shotType: normalizeShotType(spec.shotType),
    cameraAngle: normalizeAngle(spec.cameraAngle),
    lighting: normalizeLighting(spec.lighting),
    weather: normalizeWeather(spec.weather),
    location: normalizeLocation(spec.location),
    genre: normalizeGenre(spec.genre),
    movement: normalizeMovement(spec.movement),
    lens: normalizeLens(spec.lens),
    composition: normalizeText(spec.composition, 'centered composition'),
    orientation: normalizeText(spec.orientation, 'landscape'),
    cameraHeight: normalizeText(spec.cameraHeight, 'eye level'),
    subjectDescription: normalizeText(spec.subjectDescription, 'one visible subject'),
    action: sanitizeDetail(normalizeText(spec.action, 'subject present in scene'), fixedLocation),
    environmentDetails: sanitizeList(spec.environmentDetails, fixedLocation, 4),
    moodVisuals: sanitizeList(spec.moodVisuals, fixedLocation, 4),
    continuityDetails: sanitizeList(spec.continuityDetails, fixedLocation, 4),
    forbiddenElements: clampList(uniqueClean(spec.forbiddenElements), 6),
    negatives: [],
  };

  const afterConflicts = applyConflictRules(cleaned);
  afterConflicts.negatives = buildNegatives(afterConflicts, mode);

  return afterConflicts;
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
    moodVisuals.push('defensive body language', 'cold atmosphere', 'sharp shadow pockets');
  }
  if (/(sad|grief|melancholy|슬픔|비통|우울)/.test(s)) {
    moodVisuals.push('stillness', 'drained color', 'lowered posture');
  }
  if (/(peaceful|calm|평화|고요)/.test(s)) {
    moodVisuals.push('soft ambient atmosphere', 'gentle visual tone');
  }
  if (/(overwhelming|oppressive|압도|위압)/.test(s)) {
    moodVisuals.push('oppressive spatial density', 'limited visible escape space');
  }

  return validateAndNormalizeSpec(
    {
      ...base,
      action: normalizeText(input, 'subject present in scene'),
      moodVisuals,
    },
    mode
  );
}

function buildPromptFromSpec(spec: ShotSpec, mode: Mode): string {
  const shotBlock = [
    SHOT_LABELS[spec.shotType],
    SHOT_PHYSICAL[spec.shotType],
    spec.composition,
    spec.orientation,
  ]
    .filter(Boolean)
    .join(', ');

  const cameraBlock = [
    ANGLE_LABELS[spec.cameraAngle],
    ANGLE_PHYSICAL[spec.cameraAngle],
    spec.cameraHeight,
    LENS_LABELS[spec.lens],
    mode === 'image' ? 'static camera' : MOVEMENT_LABELS[spec.movement],
  ]
    .filter(Boolean)
    .join(', ');

  const subjectBlock =
    spec.subjectCount !== null
      ? `${spec.subjectCount} visible ${spec.subjectCount === 1 ? 'subject' : 'subjects'}, ${spec.subjectDescription}`
      : spec.subjectDescription;

  const environmentBlock = [
    `location: ${LOCATION_LABELS[spec.location]}`,
    ...spec.environmentDetails,
    WEATHER_LABELS[spec.weather],
    ...spec.continuityDetails,
  ]
    .filter(Boolean)
    .join(', ');

  const moodBlock = [LIGHTING_LABELS[spec.lighting], ...spec.moodVisuals].filter(Boolean).join(', ');

  const styleBlock = [
    GENRE_LABELS[spec.genre],
    'cinematic film still',
    'photorealistic',
    'richly detailed',
    'high dynamic range',
    'natural film grain',
    'tactile realism',
  ].join(', ');

  return [
    `- SHOT & FRAMING - ${shotBlock}`,
    `- CAMERA & LENS - ${cameraBlock}`,
    `- SUBJECT - ${subjectBlock}`,
    `- SCENE / ACTION - ${spec.action}`,
    `- ENVIRONMENT - ${environmentBlock}`,
    `- MOOD & LIGHTING - ${moodBlock}`,
    `- STYLE - ${styleBlock}`,
    `- NEGATIVE CONSTRAINTS - ${spec.negatives.join(', ')}`,
  ].join('\n');
}

const SPEC_SYSTEM_PROMPT = `
You are a strict micro-detail extraction engine.

You are not a cinematographer.
You are not a stylist.
You are not a creative re-interpreter.

You must obey:
- never invent a new shot type
- never invent a new camera angle
- never invent a new lens
- never invent a new movement
- never replace the selected location
- never change subject count
- never call 1 to 4 subjects a crowd
- crowd is valid only when explicitly requested as crowd / crowds / 군중
- return only short action details, short environment micro-details, short mood visuals, short continuity details, and forbidden elements
- no camera words
- no shot words
- no lens words
- no movement words
- no new place identity

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
      temperature: 0,
    });

    const extracted = safeJsonParse<ExtractionResult>(text ?? '');

    let spec: ShotSpec;

    if (extracted) {
      spec = validateAndNormalizeSpec(
        {
          ...buildSpecSkeleton(input, settings, characters, mode),
          action: normalizeText(extracted.action, input.trim()),
          environmentDetails: Array.isArray(extracted.environmentDetails) ? extracted.environmentDetails : [],
          moodVisuals: Array.isArray(extracted.moodVisuals) ? extracted.moodVisuals : [],
          continuityDetails: Array.isArray(extracted.continuityDetails) ? extracted.continuityDetails : [],
          forbiddenElements: Array.isArray(extracted.forbiddenElements) ? extracted.forbiddenElements : [],
          negatives: [],
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
        enum_locked: true,
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