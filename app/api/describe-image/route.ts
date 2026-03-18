import { NextRequest, NextResponse } from 'next/server';

const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

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
type LensStyle = '25mm' | '35mm' | '50mm' | '85mm' | '100mm' | '300mm';
type ColorTone = 'warm' | 'cool' | 'neutral';

type BodyPose =
  | 'standing'
  | 'sitting'
  | 'crouching'
  | 'kneeling'
  | 'lying'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'leaning'
  | 'reaching'
  | 'unknown';

type TorsoDirection =
  | 'front-facing'
  | 'slightly-turned-left'
  | 'slightly-turned-right'
  | 'side-facing-left'
  | 'side-facing-right'
  | 'back-facing'
  | 'unknown';

type HeadDirection =
  | 'facing-forward'
  | 'turned-left'
  | 'turned-right'
  | 'looking-down'
  | 'looking-up'
  | 'tilted-left'
  | 'tilted-right'
  | 'unknown';

type GazeDirection =
  | 'looking-at-camera'
  | 'looking-left'
  | 'looking-right'
  | 'looking-down'
  | 'looking-up'
  | 'eyes-closed'
  | 'unknown';

type ArmPose =
  | 'down'
  | 'bent'
  | 'raised'
  | 'raised-upward'
  | 'extended-forward'
  | 'extended-sideways'
  | 'hand-on-hip'
  | 'hand-near-face'
  | 'crossed'
  | 'holding-object'
  | 'unknown';

type HandState =
  | 'open-hand'
  | 'fist'
  | 'pointing'
  | 'relaxed'
  | 'holding'
  | 'unknown';

type LegPose =
  | 'standing-straight'
  | 'one-leg-forward'
  | 'legs-bent'
  | 'kneeling'
  | 'cross-legged'
  | 'walking-stride'
  | 'running-stride'
  | 'unknown';

type HairLength =
  | 'bald'
  | 'very-short'
  | 'short'
  | 'bob-length'
  | 'neck-length'
  | 'shoulder-length'
  | 'chest-length'
  | 'long'
  | 'very-long'
  | 'unknown';

type HairStyle =
  | 'loose'
  | 'straight'
  | 'wavy'
  | 'curly'
  | 'ponytail'
  | 'low-ponytail'
  | 'pigtails'
  | 'bun'
  | 'double-bun'
  | 'braid'
  | 'double-braid'
  | 'half-up'
  | 'unknown';

type BangStyle =
  | 'no-bangs'
  | 'straight-bangs'
  | 'side-bangs'
  | 'see-through-bangs'
  | 'unknown';

type Expression =
  | 'neutral'
  | 'serious'
  | 'tense'
  | 'fearful'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'smiling'
  | 'crying'
  | 'unknown';

type SubjectPlacement =
  | 'center'
  | 'left'
  | 'right'
  | 'slightly-left'
  | 'slightly-right'
  | 'unknown';

type SubjectScale =
  | 'face-dominant'
  | 'head-and-shoulders'
  | 'chest-up'
  | 'waist-up'
  | 'full-body'
  | 'small-in-frame'
  | 'very-small-in-frame'
  | 'unknown';

type AnalysisResult = {
  shotType: ShotType;
  cameraAngle: CameraAngle;
  lighting: LightingStyle;
  weather: WeatherStyle;
  location: LocationStyle;
  genre: GenreStyle;
  lens: LensStyle;
  colorTone: ColorTone;

  subjectCount: number | null;
  subjectDescription: string;

  bodyPose: BodyPose;
  torsoDirection: TorsoDirection;
  headDirection: HeadDirection;
  gazeDirection: GazeDirection;

  leftArmPose: ArmPose;
  rightArmPose: ArmPose;
  leftHandState: HandState;
  rightHandState: HandState;
  legPose: LegPose;

  hairLength: HairLength;
  hairStyle: HairStyle;
  bangStyle: BangStyle;
  expression: Expression;

  subjectPlacement: SubjectPlacement;
  subjectScale: SubjectScale;

  action: string;
  environmentDetails: string[];
  moodVisuals: string[];
  negatives: string[];

  korean: string;
  english: string;
};

type RawAnalysisResult = Partial<{
  shotType: string;
  cameraAngle: string;
  lighting: string;
  weather: string;
  location: string;
  genre: string;
  lens: string;
  colorTone: string;

  subjectCount: number | null;
  subjectDescription: string;

  bodyPose: string;
  torsoDirection: string;
  headDirection: string;
  gazeDirection: string;

  leftArmPose: string;
  rightArmPose: string;
  leftHandState: string;
  rightHandState: string;
  legPose: string;

  hairLength: string;
  hairStyle: string;
  bangStyle: string;
  expression: string;

  subjectPlacement: string;
  subjectScale: string;

  action: string;
  environmentDetails: string[];
  moodVisuals: string[];
  negatives: string[];
}>;

const SHOT_LABELS: Record<ShotType, string> = {
  'extreme-close': '익스트림 클로즈업',
  close: '클로즈업',
  'medium-close': '미디엄 클로즈업',
  medium: '미디엄 샷',
  full: '풀 샷',
  wide: '와이드 샷',
  'extreme-wide': '익스트림 와이드',
  establishing: '에스타블리싱 샷',
};

const SHOT_ENGLISH: Record<ShotType, string> = {
  'extreme-close': 'extreme close-up',
  close: 'close-up',
  'medium-close': 'medium close-up',
  medium: 'medium shot',
  full: 'full shot',
  wide: 'wide shot',
  'extreme-wide': 'extreme wide shot',
  establishing: 'establishing shot',
};

const SHOT_PHYSICAL_KR: Record<ShotType, string> = {
  'extreme-close': '아주 작은 디테일만 보일 정도로 극도로 밀착된 구도',
  close: '얼굴이 프레임 대부분을 차지하는 구도',
  'medium-close': '가슴 위까지 보이는 구도',
  medium: '허리 위까지 보이는 구도',
  full: '전신이 모두 보이는 구도',
  wide: '인물이 배경 속에서 작게 보이는 구도',
  'extreme-wide': '인물이 전체 공간 안에서 매우 작게 보이는 구도',
  establishing: '장소 전체를 먼저 보여주는 구도',
};

const SHOT_PHYSICAL_EN: Record<ShotType, string> = {
  'extreme-close': 'extremely tight framing on a very small detail',
  close: 'face fills most of the frame',
  'medium-close': 'framed from the chest upward',
  medium: 'framed from around the waist upward',
  full: 'full body visible within frame',
  wide: 'subject appears small within the environment',
  'extreme-wide': 'subject appears very small within the full environment',
  establishing: 'environment-first framing establishing the location',
};

const ANGLE_LABELS: Record<CameraAngle, string> = {
  'eye-level': '아이 레벨',
  'low-angle': '로우 앵글',
  'high-angle': '하이 앵글',
  'dutch-angle': '더치 앵글',
  'birds-eye': '버즈 아이',
  'worms-eye': '웜즈 아이',
  pov: 'POV',
  'over-shoulder': '오버 더 숄더',
};

const ANGLE_ENGLISH: Record<CameraAngle, string> = {
  'eye-level': 'eye level',
  'low-angle': 'low angle',
  'high-angle': 'high angle',
  'dutch-angle': 'Dutch angle',
  'birds-eye': "bird's-eye view",
  'worms-eye': "worm's-eye view",
  pov: 'POV',
  'over-shoulder': 'over-the-shoulder',
};

const ANGLE_PHYSICAL_KR: Record<CameraAngle, string> = {
  'eye-level': '카메라가 눈높이에 위치함',
  'low-angle': '카메라가 눈높이 아래에서 위를 올려다봄',
  'high-angle': '카메라가 눈높이 위에서 아래를 내려다봄',
  'dutch-angle': '카메라가 수평에서 기울어져 있음',
  'birds-eye': '카메라가 피사체 위 높은 곳에서 아래를 내려다봄',
  'worms-eye': '카메라가 매우 낮은 위치에서 위를 올려다봄',
  pov: '카메라가 인물의 시점과 일치함',
  'over-shoulder': '카메라가 한 인물의 어깨 너머에서 바라봄',
};

const ANGLE_PHYSICAL_EN: Record<CameraAngle, string> = {
  'eye-level': 'camera positioned at eye level',
  'low-angle': 'camera positioned below eye level, looking upward',
  'high-angle': 'camera positioned above eye level, looking downward',
  'dutch-angle': 'camera tilted off horizontal axis',
  'birds-eye': 'camera positioned high above the subject, looking downward from overhead',
  'worms-eye': 'camera positioned very low beneath the subject, looking upward',
  pov: 'camera aligned to the subject’s direct point of view',
  'over-shoulder': 'camera placed behind one subject, looking past the shoulder',
};

const ANGLE_HEIGHT_KR: Record<CameraAngle, string> = {
  'eye-level': '아이 레벨 높이',
  'low-angle': '낮은 카메라 높이',
  'high-angle': '높은 카메라 높이',
  'dutch-angle': '아이 레벨 높이',
  'birds-eye': '오버헤드 높이',
  'worms-eye': '지면 가까운 높이',
  pov: '인물 시점 높이',
  'over-shoulder': '어깨 높이',
};

const ANGLE_HEIGHT_EN: Record<CameraAngle, string> = {
  'eye-level': 'eye-level height',
  'low-angle': 'low camera height',
  'high-angle': 'high camera height',
  'dutch-angle': 'eye-level height',
  'birds-eye': 'overhead height',
  'worms-eye': 'ground-level height',
  pov: 'subject-eye height',
  'over-shoulder': 'shoulder height',
};

const LIGHTING_LABELS: Record<LightingStyle, string> = {
  day: '낮',
  dusk: '노을',
  night: '밤',
  dawn: '새벽',
};

const LIGHTING_ENGLISH: Record<LightingStyle, string> = {
  day: 'daylight',
  dusk: 'dusk light',
  night: 'night lighting',
  dawn: 'dawn light',
};

const WEATHER_LABELS: Record<WeatherStyle, string> = {
  clear: '맑음',
  rain: '비',
  snow: '눈',
  fog: '안개',
  dust: '황사',
  thunder: '천둥/번개',
};

const WEATHER_ENGLISH: Record<WeatherStyle, string> = {
  clear: 'clear weather',
  rain: 'rain',
  snow: 'snow',
  fog: 'fog',
  dust: 'dust',
  thunder: 'thunderstorm',
};

const LOCATION_LABELS: Record<LocationStyle, string> = {
  indoor: '실내',
  studio: '실내(스튜디오)',
  city: '도시',
  forest: '숲',
  sea: '바다',
  space: '우주',
};

const LOCATION_ENGLISH: Record<LocationStyle, string> = {
  indoor: 'indoor',
  studio: 'studio interior',
  city: 'city',
  forest: 'forest',
  sea: 'sea',
  space: 'space',
};

const GENRE_LABELS: Record<GenreStyle, string> = {
  drama: '드라마',
  action: '액션',
  thriller: '스릴러',
  animation: '애니메이션',
  documentary: '다큐멘터리',
  romance: '로맨스',
  product: '광고',
  'music-video': '뮤직비디오',
};

const GENRE_ENGLISH: Record<GenreStyle, string> = {
  drama: 'drama tone',
  action: 'action tone',
  thriller: 'thriller tone',
  animation: 'animation tone',
  documentary: 'documentary tone',
  romance: 'romance tone',
  product: 'product advertising tone',
  'music-video': 'music video tone',
};

const LENS_LABELS: Record<LensStyle, string> = {
  '25mm': '25mm 광각',
  '35mm': '35mm 광각',
  '50mm': '50mm 표준',
  '85mm': '85mm 망원',
  '100mm': '100mm 망원',
  '300mm': '300mm 초망원',
};

const LENS_ENGLISH: Record<LensStyle, string> = {
  '25mm': '25mm lens feel',
  '35mm': '35mm lens feel',
  '50mm': '50mm lens feel',
  '85mm': '85mm lens feel',
  '100mm': '100mm lens feel',
  '300mm': '300mm lens feel',
};

const COLOR_TONE_LABELS: Record<ColorTone, string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '뉴트럴 톤',
};

const COLOR_TONE_ENGLISH: Record<ColorTone, string> = {
  warm: 'warm-toned palette',
  cool: 'cool-toned palette',
  neutral: 'neutral-toned palette',
};

const HAIR_LENGTH_KR: Record<HairLength, string> = {
  bald: '민머리',
  'very-short': '매우 짧은 머리',
  short: '짧은 머리',
  'bob-length': '단발 길이 머리',
  'neck-length': '목선 정도 머리',
  'shoulder-length': '어깨까지 오는 머리',
  'chest-length': '가슴까지 오는 머리',
  long: '긴 머리',
  'very-long': '매우 긴 머리',
  unknown: '',
};

const HAIR_STYLE_KR: Record<HairStyle, string> = {
  loose: '자연스럽게 푼 머리',
  straight: '생머리',
  wavy: '웨이브 머리',
  curly: '곱슬머리',
  ponytail: '포니테일',
  'low-ponytail': '로우 포니테일',
  pigtails: '양갈래 머리',
  bun: '번 헤어',
  'double-bun': '양쪽 번 헤어',
  braid: '땋은 머리',
  'double-braid': '양갈래 땋은 머리',
  'half-up': '반묶음 머리',
  unknown: '',
};

const BANG_STYLE_KR: Record<BangStyle, string> = {
  'no-bangs': '앞머리 없음',
  'straight-bangs': '일자 앞머리',
  'side-bangs': '옆으로 넘긴 앞머리',
  'see-through-bangs': '시스루 뱅',
  unknown: '',
};

const EXPRESSION_KR: Record<Expression, string> = {
  neutral: '무표정',
  serious: '진지한 표정',
  tense: '긴장된 표정',
  fearful: '겁에 질린 표정',
  sad: '슬픈 표정',
  angry: '화난 표정',
  surprised: '놀란 표정',
  smiling: '미소 짓는 표정',
  crying: '우는 표정',
  unknown: '',
};

const HAIR_LENGTH_EN: Record<HairLength, string> = {
  bald: 'bald',
  'very-short': 'very short hair',
  short: 'short hair',
  'bob-length': 'bob-length hair',
  'neck-length': 'neck-length hair',
  'shoulder-length': 'shoulder-length hair',
  'chest-length': 'chest-length hair',
  long: 'long hair',
  'very-long': 'very long hair',
  unknown: '',
};

const HAIR_STYLE_EN: Record<HairStyle, string> = {
  loose: 'loose hair',
  straight: 'straight hair',
  wavy: 'wavy hair',
  curly: 'curly hair',
  ponytail: 'hair tied in a ponytail',
  'low-ponytail': 'hair tied in a low ponytail',
  pigtails: 'hair tied into pigtails',
  bun: 'hair tied in a bun',
  'double-bun': 'hair tied into double buns',
  braid: 'braided hair',
  'double-braid': 'double braids',
  'half-up': 'half-up hairstyle',
  unknown: '',
};

const BANG_STYLE_EN: Record<BangStyle, string> = {
  'no-bangs': 'no bangs',
  'straight-bangs': 'straight bangs',
  'side-bangs': 'side bangs',
  'see-through-bangs': 'see-through bangs',
  unknown: '',
};

const EXPRESSION_EN: Record<Expression, string> = {
  neutral: 'neutral expression',
  serious: 'serious expression',
  tense: 'tense expression',
  fearful: 'fearful expression',
  sad: 'sad expression',
  angry: 'angry expression',
  surprised: 'surprised expression',
  smiling: 'smiling expression',
  crying: 'crying expression',
  unknown: '',
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
  /\blens\b/gi,
  /\bcamera\b/gi,
  /\bframing\b/gi,
  /\bcrop\b/gi,
  /\bshot\b/gi,
];

const LOCATION_BLOCKLIST: Record<LocationStyle, string[]> = {
  indoor: ['forest', 'sea', 'space', 'city', 'desert', 'mountain', 'beach'],
  studio: ['forest', 'sea', 'space', 'city', 'desert', 'mountain', 'beach'],
  city: ['forest', 'sea', 'space', 'desert', 'mountain', 'beach', 'studio'],
  forest: ['city', 'sea', 'space', 'desert', 'beach', 'studio'],
  sea: ['city', 'forest', 'space', 'desert', 'studio'],
  space: ['city', 'forest', 'sea', 'desert', 'beach', 'studio'],
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

function normalizeShotType(value?: string | null): ShotType {
  const s = lower(value);
  if (s.includes('extreme-close') || s.includes('extreme close') || s.includes('익스트림 클로즈')) return 'extreme-close';
  if (s === 'close' || s.includes('close') || s.includes('클로즈업')) return 'close';
  if (s.includes('medium-close') || s.includes('medium close') || s.includes('미디엄 클로즈')) return 'medium-close';
  if (s === 'medium' || s.includes('medium') || s.includes('미디엄 샷')) return 'medium';
  if (s.includes('full') || s.includes('풀 샷')) return 'full';
  if (s === 'wide' || s.includes('wide') || s.includes('와이드 샷')) return 'wide';
  if (s.includes('extreme-wide') || s.includes('extreme wide') || s.includes('익스트림 와이드')) return 'extreme-wide';
  if (s.includes('establishing') || s.includes('에스타블리싱')) return 'establishing';
  return 'medium';
}

function normalizeAngle(value?: string | null): CameraAngle {
  const s = lower(value);
  if (s.includes('worms-eye') || s.includes("worm's-eye") || s.includes('worms eye') || s.includes('웜즈 아이')) return 'worms-eye';
  if (s.includes('birds-eye') || s.includes("bird's-eye") || s.includes('birds eye') || s.includes('버즈 아이')) return 'birds-eye';
  if (s.includes('eye-level') || s.includes('eye level') || s.includes('아이 레벨')) return 'eye-level';
  if (s.includes('low-angle') || s.includes('low angle') || s.includes('로우 앵글')) return 'low-angle';
  if (s.includes('high-angle') || s.includes('high angle') || s.includes('하이 앵글')) return 'high-angle';
  if (s.includes('dutch-angle') || s.includes('dutch angle') || s.includes('더치 앵글')) return 'dutch-angle';
  if (s === 'pov' || /\bpov\b/.test(s)) return 'pov';
  if (s.includes('over-shoulder') || s.includes('over shoulder') || s.includes('오버 더 숄더')) return 'over-shoulder';
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
  if (s.includes('studio') || s.includes('스튜디오')) return 'studio';
  if (s.includes('indoor') || s.includes('실내')) return 'indoor';
  if (s.includes('city') || s.includes('도시')) return 'city';
  if (s.includes('forest') || s.includes('숲')) return 'forest';
  if (s.includes('sea') || s.includes('바다') || s.includes('ocean')) return 'sea';
  if (s.includes('space') || s.includes('우주') || s.includes('cosmic') || s.includes('mars') || s.includes('planet')) return 'space';
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

function normalizeColorTone(value?: string | null): ColorTone {
  const s = lower(value);
  if (s.includes('warm') || s.includes('웜')) return 'warm';
  if (s.includes('cool') || s.includes('쿨')) return 'cool';
  if (s.includes('neutral') || s.includes('중립') || s.includes('뉴트럴')) return 'neutral';
  return 'neutral';
}

function normalizeBodyPose(value?: string | null): BodyPose {
  const s = lower(value);
  if (s.includes('standing')) return 'standing';
  if (s.includes('sitting')) return 'sitting';
  if (s.includes('crouching')) return 'crouching';
  if (s.includes('kneeling')) return 'kneeling';
  if (s.includes('lying')) return 'lying';
  if (s.includes('walking')) return 'walking';
  if (s.includes('running')) return 'running';
  if (s.includes('jumping')) return 'jumping';
  if (s.includes('leaning')) return 'leaning';
  if (s.includes('reaching')) return 'reaching';
  return 'unknown';
}

function normalizeTorsoDirection(value?: string | null): TorsoDirection {
  const s = lower(value);
  if (s.includes('slightly-turned-left')) return 'slightly-turned-left';
  if (s.includes('slightly-turned-right')) return 'slightly-turned-right';
  if (s.includes('side-facing-left')) return 'side-facing-left';
  if (s.includes('side-facing-right')) return 'side-facing-right';
  if (s.includes('back-facing')) return 'back-facing';
  if (s.includes('front-facing')) return 'front-facing';
  return 'unknown';
}

function normalizeHeadDirection(value?: string | null): HeadDirection {
  const s = lower(value);
  if (s.includes('turned-left')) return 'turned-left';
  if (s.includes('turned-right')) return 'turned-right';
  if (s.includes('looking-down')) return 'looking-down';
  if (s.includes('looking-up')) return 'looking-up';
  if (s.includes('tilted-left')) return 'tilted-left';
  if (s.includes('tilted-right')) return 'tilted-right';
  if (s.includes('facing-forward')) return 'facing-forward';
  return 'unknown';
}

function normalizeGazeDirection(value?: string | null): GazeDirection {
  const s = lower(value);
  if (s.includes('looking-at-camera')) return 'looking-at-camera';
  if (s.includes('looking-left')) return 'looking-left';
  if (s.includes('looking-right')) return 'looking-right';
  if (s.includes('looking-down')) return 'looking-down';
  if (s.includes('looking-up')) return 'looking-up';
  if (s.includes('eyes-closed')) return 'eyes-closed';
  return 'unknown';
}

function normalizeArmPose(value?: string | null): ArmPose {
  const s = lower(value);
  if (s.includes('raised-upward')) return 'raised-upward';
  if (s.includes('extended-forward')) return 'extended-forward';
  if (s.includes('extended-sideways')) return 'extended-sideways';
  if (s.includes('hand-on-hip')) return 'hand-on-hip';
  if (s.includes('hand-near-face')) return 'hand-near-face';
  if (s.includes('holding-object')) return 'holding-object';
  if (s.includes('crossed')) return 'crossed';
  if (s.includes('raised')) return 'raised';
  if (s.includes('bent')) return 'bent';
  if (s.includes('down')) return 'down';
  return 'unknown';
}

function normalizeHandState(value?: string | null): HandState {
  const s = lower(value);
  if (s.includes('open-hand')) return 'open-hand';
  if (s.includes('fist')) return 'fist';
  if (s.includes('pointing')) return 'pointing';
  if (s.includes('holding')) return 'holding';
  if (s.includes('relaxed')) return 'relaxed';
  return 'unknown';
}

function normalizeLegPose(value?: string | null): LegPose {
  const s = lower(value);
  if (s.includes('standing-straight')) return 'standing-straight';
  if (s.includes('one-leg-forward')) return 'one-leg-forward';
  if (s.includes('legs-bent')) return 'legs-bent';
  if (s.includes('kneeling')) return 'kneeling';
  if (s.includes('cross-legged')) return 'cross-legged';
  if (s.includes('walking-stride')) return 'walking-stride';
  if (s.includes('running-stride')) return 'running-stride';
  return 'unknown';
}

function normalizeHairLength(value?: string | null): HairLength {
  const s = lower(value);
  if (s.includes('bald')) return 'bald';
  if (s.includes('very-short')) return 'very-short';
  if (s.includes('short')) return 'short';
  if (s.includes('bob-length')) return 'bob-length';
  if (s.includes('neck-length')) return 'neck-length';
  if (s.includes('shoulder-length')) return 'shoulder-length';
  if (s.includes('chest-length')) return 'chest-length';
  if (s.includes('very-long')) return 'very-long';
  if (s.includes('long')) return 'long';
  return 'unknown';
}

function normalizeHairStyle(value?: string | null): HairStyle {
  const s = lower(value);
  if (s.includes('double-braid')) return 'double-braid';
  if (s.includes('double-bun')) return 'double-bun';
  if (s.includes('low-ponytail')) return 'low-ponytail';
  if (s.includes('ponytail')) return 'ponytail';
  if (s.includes('pigtails')) return 'pigtails';
  if (s.includes('bun')) return 'bun';
  if (s.includes('braid')) return 'braid';
  if (s.includes('half-up')) return 'half-up';
  if (s.includes('wavy')) return 'wavy';
  if (s.includes('curly')) return 'curly';
  if (s.includes('straight')) return 'straight';
  if (s.includes('loose')) return 'loose';
  return 'unknown';
}

function normalizeBangStyle(value?: string | null): BangStyle {
  const s = lower(value);
  if (s.includes('straight-bangs')) return 'straight-bangs';
  if (s.includes('side-bangs')) return 'side-bangs';
  if (s.includes('see-through-bangs')) return 'see-through-bangs';
  if (s.includes('no-bangs')) return 'no-bangs';
  return 'unknown';
}

function normalizeExpression(value?: string | null): Expression {
  const s = lower(value);
  if (s.includes('neutral')) return 'neutral';
  if (s.includes('serious')) return 'serious';
  if (s.includes('tense')) return 'tense';
  if (s.includes('fearful')) return 'fearful';
  if (s.includes('sad')) return 'sad';
  if (s.includes('angry')) return 'angry';
  if (s.includes('surprised')) return 'surprised';
  if (s.includes('smiling')) return 'smiling';
  if (s.includes('crying')) return 'crying';
  return 'unknown';
}

function normalizeSubjectPlacement(value?: string | null): SubjectPlacement {
  const s = lower(value);
  if (s.includes('slightly-left')) return 'slightly-left';
  if (s.includes('slightly-right')) return 'slightly-right';
  if (s === 'left') return 'left';
  if (s === 'right') return 'right';
  if (s.includes('center')) return 'center';
  return 'unknown';
}

function normalizeSubjectScale(value?: string | null): SubjectScale {
  const s = lower(value);
  if (s.includes('face-dominant')) return 'face-dominant';
  if (s.includes('head-and-shoulders')) return 'head-and-shoulders';
  if (s.includes('chest-up')) return 'chest-up';
  if (s.includes('waist-up')) return 'waist-up';
  if (s.includes('full-body')) return 'full-body';
  if (s.includes('very-small-in-frame')) return 'very-small-in-frame';
  if (s.includes('small-in-frame')) return 'small-in-frame';
  return 'unknown';
}

function stripCameraWords(text: string): string {
  let result = text;
  for (const pattern of CAMERA_WORD_PATTERNS) {
    result = result.replace(pattern, '');
  }
  return result.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').replace(/,+/g, ',').trim().replace(/^,|,$/g, '');
}

function stripOtherLocationWords(text: string, fixedLocation: LocationStyle): string {
  let result = text;
  const blocked = LOCATION_BLOCKLIST[fixedLocation] || [];
  for (const word of blocked) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  }
  return result.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').trim().replace(/^,|,$/g, '');
}

function sanitizeDetail(text: string, fixedLocation: LocationStyle): string {
  const stripped = stripOtherLocationWords(stripCameraWords(text), fixedLocation);
  return stripped.length ? stripped : '';
}

function sanitizeList(values: string[], fixedLocation: LocationStyle, max: number): string[] {
  return clampList(values.map((v) => sanitizeDetail(v, fixedLocation)).filter(Boolean), max);
}

function applyConflictRules(result: AnalysisResult): AnalysisResult {
  const out = { ...result };

  if ((out.shotType === 'wide' || out.shotType === 'extreme-wide' || out.shotType === 'establishing') && out.lens === '300mm') {
    out.lens = '35mm';
  }

  if ((out.shotType === 'extreme-wide' || out.shotType === 'establishing') && out.lens === '100mm') {
    out.lens = '35mm';
  }

  if (out.shotType === 'close' && out.lens === '300mm') {
    out.lens = '85mm';
  }

  if (out.shotType === 'extreme-close' && out.lens === '300mm') {
    out.lens = '85mm';
  }

  if (out.shotType === 'extreme-close' && (out.cameraAngle === 'birds-eye' || out.cameraAngle === 'worms-eye')) {
    out.cameraAngle = 'eye-level';
  }

  if (out.shotType === 'establishing' && out.cameraAngle === 'pov') {
    out.cameraAngle = 'eye-level';
  }

  if (out.cameraAngle === 'birds-eye' && out.shotType === 'extreme-close') {
    out.shotType = 'close';
  }

  if (out.cameraAngle === 'worms-eye' && out.shotType === 'establishing') {
    out.shotType = 'wide';
  }

  return out;
}

function buildNegativeBlock(result: AnalysisResult, lang: 'kr' | 'en'): string {
  if (lang === 'kr') {
    return uniqueClean([
      '샷 타입 변경 금지',
      '카메라 앵글 변경 금지',
      '렌즈 변경 금지',
      '장소 변경 금지',
      '잘못된 크롭 금지',
      '불필요한 인물 추가 금지',
      '포스터식 구도 금지',
      '콜라주 금지',
      '분할 화면 금지',
      '텍스트 금지',
      '로고 금지',
      '워터마크 금지',
      ...result.negatives,
    ]).join(', ');
  }

  return uniqueClean([
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
    'no dramatic reinterpretation',
    ...result.negatives,
  ]).join(', ');
}

function buildSubjectKR(result: AnalysisResult): string {
  const countLabel =
    result.subjectCount === null
      ? '군중'
      : `${result.subjectCount}명의 인물`;

  return uniqueClean([
    countLabel,
    result.subjectDescription,
    HAIR_LENGTH_KR[result.hairLength],
    HAIR_STYLE_KR[result.hairStyle],
    BANG_STYLE_KR[result.bangStyle],
    EXPRESSION_KR[result.expression],
  ]).join(', ');
}

function buildSubjectEN(result: AnalysisResult): string {
  const countLabel =
    result.subjectCount === null
      ? 'crowd'
      : `${result.subjectCount} visible ${result.subjectCount === 1 ? 'subject' : 'subjects'}`;

  return uniqueClean([
    countLabel,
    result.subjectDescription,
    HAIR_LENGTH_EN[result.hairLength],
    HAIR_STYLE_EN[result.hairStyle],
    BANG_STYLE_EN[result.bangStyle],
    EXPRESSION_EN[result.expression],
  ]).join(', ');
}

function buildPoseActionKR(result: AnalysisResult): string {
  const parts: string[] = [];

  if (result.bodyPose === 'standing') parts.push('서 있음');
  if (result.bodyPose === 'sitting') parts.push('앉아 있음');
  if (result.bodyPose === 'crouching') parts.push('웅크리고 있음');
  if (result.bodyPose === 'kneeling') parts.push('무릎을 꿇고 있음');
  if (result.bodyPose === 'lying') parts.push('누워 있음');
  if (result.bodyPose === 'walking') parts.push('걷고 있음');
  if (result.bodyPose === 'running') parts.push('달리고 있음');
  if (result.bodyPose === 'jumping') parts.push('점프 중임');
  if (result.bodyPose === 'leaning') parts.push('몸을 기대고 있음');
  if (result.bodyPose === 'reaching') parts.push('손을 뻗고 있음');

  if (result.leftArmPose === 'raised-upward') parts.push('왼팔을 위로 들고 있음');
  if (result.leftArmPose === 'extended-forward') parts.push('왼팔을 앞으로 뻗고 있음');
  if (result.leftArmPose === 'extended-sideways') parts.push('왼팔을 옆으로 뻗고 있음');
  if (result.rightArmPose === 'raised-upward') parts.push('오른팔을 위로 들고 있음');
  if (result.rightArmPose === 'extended-forward') parts.push('오른팔을 앞으로 뻗고 있음');
  if (result.rightArmPose === 'extended-sideways') parts.push('오른팔을 옆으로 뻗고 있음');

  if (result.headDirection === 'looking-down') parts.push('고개를 아래로 숙이고 있음');
  if (result.headDirection === 'looking-up') parts.push('고개를 위로 들고 있음');
  if (result.headDirection === 'turned-left') parts.push('고개를 왼쪽으로 돌림');
  if (result.headDirection === 'turned-right') parts.push('고개를 오른쪽으로 돌림');

  if (result.gazeDirection === 'looking-left') parts.push('시선이 왼쪽을 향함');
  if (result.gazeDirection === 'looking-right') parts.push('시선이 오른쪽을 향함');
  if (result.gazeDirection === 'looking-down') parts.push('시선이 아래를 향함');
  if (result.gazeDirection === 'looking-up') parts.push('시선이 위를 향함');
  if (result.gazeDirection === 'looking-at-camera') parts.push('정면을 바라봄');

  if (result.action) parts.push(result.action);

  return uniqueClean(parts).join(', ');
}

function buildPoseActionEN(result: AnalysisResult): string {
  const parts: string[] = [];

  if (result.bodyPose === 'standing') parts.push('standing');
  if (result.bodyPose === 'sitting') parts.push('sitting');
  if (result.bodyPose === 'crouching') parts.push('crouching');
  if (result.bodyPose === 'kneeling') parts.push('kneeling');
  if (result.bodyPose === 'lying') parts.push('lying down');
  if (result.bodyPose === 'walking') parts.push('walking');
  if (result.bodyPose === 'running') parts.push('running');
  if (result.bodyPose === 'jumping') parts.push('jumping');
  if (result.bodyPose === 'leaning') parts.push('leaning');
  if (result.bodyPose === 'reaching') parts.push('reaching');

  if (result.leftArmPose === 'raised-upward') parts.push('left arm raised upward');
  if (result.leftArmPose === 'extended-forward') parts.push('left arm extended forward');
  if (result.leftArmPose === 'extended-sideways') parts.push('left arm extended sideways');
  if (result.rightArmPose === 'raised-upward') parts.push('right arm raised upward');
  if (result.rightArmPose === 'extended-forward') parts.push('right arm extended forward');
  if (result.rightArmPose === 'extended-sideways') parts.push('right arm extended sideways');

  if (result.headDirection === 'looking-down') parts.push('head lowered');
  if (result.headDirection === 'looking-up') parts.push('head tilted upward');
  if (result.headDirection === 'turned-left') parts.push('head turned left');
  if (result.headDirection === 'turned-right') parts.push('head turned right');

  if (result.gazeDirection === 'looking-left') parts.push('looking left');
  if (result.gazeDirection === 'looking-right') parts.push('looking right');
  if (result.gazeDirection === 'looking-down') parts.push('looking down');
  if (result.gazeDirection === 'looking-up') parts.push('looking up');
  if (result.gazeDirection === 'looking-at-camera') parts.push('looking at camera');

  if (result.action) parts.push(result.action);

  return uniqueClean(parts).join(', ');
}

function buildKoreanBlockPrompt(result: AnalysisResult): string {
  const shotBlock = [
    SHOT_LABELS[result.shotType],
    SHOT_PHYSICAL_KR[result.shotType],
    result.subjectPlacement === 'center' ? '중앙 구도' : '',
    result.subjectPlacement === 'left' ? '왼쪽 배치' : '',
    result.subjectPlacement === 'right' ? '오른쪽 배치' : '',
    result.subjectPlacement === 'slightly-left' ? '약간 왼쪽 배치' : '',
    result.subjectPlacement === 'slightly-right' ? '약간 오른쪽 배치' : '',
    '가로 프레임',
  ].filter(Boolean).join(', ');

  const cameraBlock = [
    ANGLE_LABELS[result.cameraAngle],
    ANGLE_PHYSICAL_KR[result.cameraAngle],
    ANGLE_HEIGHT_KR[result.cameraAngle],
    LENS_LABELS[result.lens],
    '고정 카메라',
  ].join(', ');

  const subjectBlock = buildSubjectKR(result);
  const actionBlock = buildPoseActionKR(result) || '인물이 장면 안에 있음';

  const environmentBlock = [
    `장소: ${LOCATION_LABELS[result.location]}`,
    ...result.environmentDetails,
    WEATHER_LABELS[result.weather],
  ].filter(Boolean).join(', ');

  const moodBlock = [
    LIGHTING_LABELS[result.lighting],
    COLOR_TONE_LABELS[result.colorTone],
    ...result.moodVisuals,
  ].filter(Boolean).join(', ');

  const styleBlock = [
    `${GENRE_LABELS[result.genre]} 분위기`,
    '시네마틱 필름 스틸',
    '사실적 디테일',
    '자연스러운 질감',
  ].join(', ');

  return [
    `- SHOT & FRAMING - ${shotBlock}`,
    `- CAMERA & LENS - ${cameraBlock}`,
    `- SUBJECT - ${subjectBlock}`,
    `- SCENE / ACTION - ${actionBlock}`,
    `- ENVIRONMENT - ${environmentBlock}`,
    `- MOOD & LIGHTING - ${moodBlock}`,
    `- STYLE - ${styleBlock}`,
  ].join('\n');
}

function buildEnglishBlockPrompt(result: AnalysisResult): string {
  const shotBlock = [
    SHOT_ENGLISH[result.shotType],
    SHOT_PHYSICAL_EN[result.shotType],
    result.subjectPlacement === 'center' ? 'centered composition' : '',
    result.subjectPlacement === 'left' ? 'subject placed on the left' : '',
    result.subjectPlacement === 'right' ? 'subject placed on the right' : '',
    result.subjectPlacement === 'slightly-left' ? 'subject placed slightly left of center' : '',
    result.subjectPlacement === 'slightly-right' ? 'subject placed slightly right of center' : '',
    'landscape frame',
  ].filter(Boolean).join(', ');

  const cameraBlock = [
    ANGLE_ENGLISH[result.cameraAngle],
    ANGLE_PHYSICAL_EN[result.cameraAngle],
    ANGLE_HEIGHT_EN[result.cameraAngle],
    LENS_ENGLISH[result.lens],
    'static camera',
  ].join(', ');

  const subjectBlock = buildSubjectEN(result);
  const actionBlock = buildPoseActionEN(result) || 'subject present in the scene';

  const environmentBlock = [
    `location: ${LOCATION_ENGLISH[result.location]}`,
    ...result.environmentDetails,
    WEATHER_ENGLISH[result.weather],
  ].filter(Boolean).join(', ');

  const moodBlock = [
    LIGHTING_ENGLISH[result.lighting],
    COLOR_TONE_ENGLISH[result.colorTone],
    ...result.moodVisuals,
  ].filter(Boolean).join(', ');

  const styleBlock = [
    GENRE_ENGLISH[result.genre],
    'photorealistic',
    'natural detail',
    'subtle film grain',
  ].join(', ');

  return [
    `- SHOT & FRAMING - ${shotBlock}`,
    `- CAMERA & LENS - ${cameraBlock}`,
    `- SUBJECT - ${subjectBlock}`,
    `- SCENE / ACTION - ${actionBlock}`,
    `- ENVIRONMENT - ${environmentBlock}`,
    `- MOOD & LIGHTING - ${moodBlock}`,
    `- STYLE - ${styleBlock}`,
  ].join('\n');
}

function validateAndNormalize(raw: RawAnalysisResult): AnalysisResult {
  const location = normalizeLocation(raw.location);

  const normalized: AnalysisResult = {
    shotType: normalizeShotType(raw.shotType),
    cameraAngle: normalizeAngle(raw.cameraAngle),
    lighting: normalizeLighting(raw.lighting),
    weather: normalizeWeather(raw.weather),
    location,
    genre: normalizeGenre(raw.genre),
    lens: normalizeLens(raw.lens),
    colorTone: normalizeColorTone(raw.colorTone),

    subjectCount: typeof raw.subjectCount === 'number' ? raw.subjectCount : 1,
    subjectDescription: sanitizeDetail(normalizeText(raw.subjectDescription, 'subject'), location),

    bodyPose: normalizeBodyPose(raw.bodyPose),
    torsoDirection: normalizeTorsoDirection(raw.torsoDirection),
    headDirection: normalizeHeadDirection(raw.headDirection),
    gazeDirection: normalizeGazeDirection(raw.gazeDirection),

    leftArmPose: normalizeArmPose(raw.leftArmPose),
    rightArmPose: normalizeArmPose(raw.rightArmPose),
    leftHandState: normalizeHandState(raw.leftHandState),
    rightHandState: normalizeHandState(raw.rightHandState),
    legPose: normalizeLegPose(raw.legPose),

    hairLength: normalizeHairLength(raw.hairLength),
    hairStyle: normalizeHairStyle(raw.hairStyle),
    bangStyle: normalizeBangStyle(raw.bangStyle),
    expression: normalizeExpression(raw.expression),

    subjectPlacement: normalizeSubjectPlacement(raw.subjectPlacement),
    subjectScale: normalizeSubjectScale(raw.subjectScale),

    action: sanitizeDetail(normalizeText(raw.action, ''), location),
    environmentDetails: sanitizeList(Array.isArray(raw.environmentDetails) ? raw.environmentDetails : [], location, 4),
    moodVisuals: sanitizeList(Array.isArray(raw.moodVisuals) ? raw.moodVisuals : [], location, 4),
    negatives: clampList(uniqueClean(Array.isArray(raw.negatives) ? raw.negatives : []), 6),

    korean: '',
    english: '',
  };

  const adjusted = applyConflictRules(normalized);
  adjusted.korean = buildKoreanBlockPrompt(adjusted);
  adjusted.english = buildEnglishBlockPrompt(adjusted);

  return adjusted;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  let file: File;
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    if (!image || !(image instanceof File)) {
      return NextResponse.json({ error: 'Missing or invalid image file' }, { status: 400 });
    }
    file = image;
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const MAX_SIZE = 3 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '3MB 이하의 이미지만 업로드할 수 있습니다.' }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const prompt = [
    'Analyze this image for regeneration.',
    'You must classify it only using the exact enum values below.',
    'Do not include camera movement.',
    'Do not invent values outside the enums.',
    '',
    'shotType: extreme-close | close | medium-close | medium | full | wide | extreme-wide | establishing',
    'cameraAngle: eye-level | low-angle | high-angle | dutch-angle | birds-eye | worms-eye | pov | over-shoulder',
    'lighting: day | dusk | night | dawn',
    'weather: clear | rain | snow | fog | dust | thunder',
    'location: indoor | studio | city | forest | sea | space',
    'genre: drama | action | thriller | animation | documentary | romance | product | music-video',
    'lens: 25mm | 35mm | 50mm | 85mm | 100mm | 300mm',
    'colorTone: warm | cool | neutral',
    '',
    'subjectCount: numeric if visible, otherwise 1',
    'subjectDescription: short English subject description',
    'bodyPose: standing | sitting | crouching | kneeling | lying | walking | running | jumping | leaning | reaching | unknown',
    'torsoDirection: front-facing | slightly-turned-left | slightly-turned-right | side-facing-left | side-facing-right | back-facing | unknown',
    'headDirection: facing-forward | turned-left | turned-right | looking-down | looking-up | tilted-left | tilted-right | unknown',
    'gazeDirection: looking-at-camera | looking-left | looking-right | looking-down | looking-up | eyes-closed | unknown',
    'leftArmPose: down | bent | raised | raised-upward | extended-forward | extended-sideways | hand-on-hip | hand-near-face | crossed | holding-object | unknown',
    'rightArmPose: down | bent | raised | raised-upward | extended-forward | extended-sideways | hand-on-hip | hand-near-face | crossed | holding-object | unknown',
    'leftHandState: open-hand | fist | pointing | relaxed | holding | unknown',
    'rightHandState: open-hand | fist | pointing | relaxed | holding | unknown',
    'legPose: standing-straight | one-leg-forward | legs-bent | kneeling | cross-legged | walking-stride | running-stride | unknown',
    'hairLength: bald | very-short | short | bob-length | neck-length | shoulder-length | chest-length | long | very-long | unknown',
    'hairStyle: loose | straight | wavy | curly | ponytail | low-ponytail | pigtails | bun | double-bun | braid | double-braid | half-up | unknown',
    'bangStyle: no-bangs | straight-bangs | side-bangs | see-through-bangs | unknown',
    'expression: neutral | serious | tense | fearful | sad | angry | surprised | smiling | crying | unknown',
    'subjectPlacement: center | left | right | slightly-left | slightly-right | unknown',
    'subjectScale: face-dominant | head-and-shoulders | chest-up | waist-up | full-body | small-in-frame | very-small-in-frame | unknown',
    '',
    'Return only one JSON object with these keys:',
    '{',
    '"shotType": "enum only",',
    '"cameraAngle": "enum only",',
    '"lighting": "enum only",',
    '"weather": "enum only",',
    '"location": "enum only",',
    '"genre": "enum only",',
    '"lens": "enum only",',
    '"colorTone": "enum only",',
    '"subjectCount": 1,',
    '"subjectDescription": "short English subject description",',
    '"bodyPose": "enum only",',
    '"torsoDirection": "enum only",',
    '"headDirection": "enum only",',
    '"gazeDirection": "enum only",',
    '"leftArmPose": "enum only",',
    '"rightArmPose": "enum only",',
    '"leftHandState": "enum only",',
    '"rightHandState": "enum only",',
    '"legPose": "enum only",',
    '"hairLength": "enum only",',
    '"hairStyle": "enum only",',
    '"bangStyle": "enum only",',
    '"expression": "enum only",',
    '"subjectPlacement": "enum only",',
    '"subjectScale": "enum only",',
    '"action": "one short English sentence",',
    '"environmentDetails": ["up to 4 short English items"],',
    '"moodVisuals": ["up to 4 short English items"]',
    '}',
    'No markdown. No explanation. JSON only.',
  ].join(' ');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 900,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: err || `Groq API error: ${res.status}` },
        { status: res.status >= 500 ? 502 : 400 },
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content?.trim() || '{}';

    let parsed: RawAnalysisResult = {};
    try {
      parsed = JSON.parse(raw) as RawAnalysisResult;
    } catch {
      parsed = {};
    }

    const result = validateAndNormalize(parsed);
    return NextResponse.json(result);
  } catch (e) {
    console.error('describe-image:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Image description failed' },
      { status: 500 },
    );
  }
}