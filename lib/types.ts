// Promman core types & preset data

export type PrommanOutputMode = 'image' | 'video';

export interface Character {
  id: string;
  name: string;
  gender: string;
  age: string;
  appearance: string;
  clothing: string;
}

export interface ShotType {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface CameraAngle {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface LightingStyle {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface WeatherStyle {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface Genre {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface CameraMovement {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface DirectorSettings {
  genre: string;
  shotType: string;
  cameraAngle: string;
  lighting: string;
  weather?: string;
  fieldOfView?: string;
  cameraMovement?: string;
  handheldIntensity?: number;
  aspectRatio?: string;
  location?: string;
}

export interface PromptHistoryItem {
  id: string;
  timestamp: number;
  inputKorean: string;
  outputEnglish: string;
  mode: PrommanOutputMode;
  settings: DirectorSettings;
  isFavorite: boolean;
  characters: Character[];
}

export interface PromptState {
  mode: PrommanOutputMode;
  inputText: string;
  outputText: string;
  characters: Character[];
  settings: DirectorSettings;
  isGenerating: boolean;
}

// --- Preset data ---

export const SHOT_TYPES: ShotType[] = [
  {
    id: 'extreme-close',
    label: 'Extreme Close-up',
    labelKo: '익스트림 클로즈업',
    description: 'Detail of eyes, lips, or specific feature',
    icon: 'ECU',
    thumbnail: '/thumbnails/shot-extreme-close-up.webp',
  },
  {
    id: 'close',
    label: 'Close-up',
    labelKo: '클로즈업',
    description: 'Face fills the frame',
    icon: 'CU',
    thumbnail: '/thumbnails/shot-close-up.webp',
  },
  {
    id: 'medium-close',
    label: 'Medium Close-up',
    labelKo: '미디엄 클로즈업',
    description: 'Chest and above',
    icon: 'MCU',
    thumbnail: '/thumbnails/shot-medium-close-up.webp',
  },
  {
    id: 'medium',
    label: 'Medium Shot',
    labelKo: '미디엄 샷',
    description: 'Waist up framing',
    icon: 'MS',
    thumbnail: '/thumbnails/shot-medium-shot.webp',
  },
  {
    id: 'full',
    label: 'Full Shot',
    labelKo: '풀 샷',
    description: 'Subject from head to toe',
    icon: 'FS',
    thumbnail: '/thumbnails/shot-medium-wide-shot.webp',
  },
  {
    id: 'wide',
    label: 'Wide Shot',
    labelKo: '와이드 샷',
    description: 'Full body with environment context',
    icon: 'WS',
    thumbnail: '/thumbnails/shot-wide-shot.webp',
  },
  {
    id: 'extreme-wide',
    label: 'Extreme Wide Shot',
    labelKo: '익스트림 와이드',
    description: 'Shows vast landscapes or environments',
    icon: 'EWS',
    thumbnail: '/thumbnails/shot-extreme-wide-shot.webp',
  },
  {
    id: 'establishing',
    label: 'Establishing Shot',
    labelKo: '에스타블리싱 샷',
    description: 'Introductory shot to establish location and context',
    icon: 'EST',
    thumbnail: '/thumbnails/shot-establishing-shot.webp',
  },
];

export const CAMERA_ANGLES: CameraAngle[] = [
  {
    id: 'eye-level',
    label: 'Eye Level',
    labelKo: '아이 레벨',
    description: 'Natural, neutral perspective',
    icon: 'EYE',
    thumbnail: '/thumbnails/angle-eye-level.webp',
  },
  {
    id: 'low-angle',
    label: 'Low Angle',
    labelKo: '로우 앵글',
    description: 'Looking up, subject appears powerful',
    icon: 'LOW',
    thumbnail: '/thumbnails/angle-low-angle.webp',
  },
  {
    id: 'high-angle',
    label: 'High Angle',
    labelKo: '하이 앵글',
    description: 'Looking down, subject appears vulnerable',
    icon: 'HI',
    thumbnail: '/thumbnails/angle-high-angle.webp',
  },
  {
    id: 'dutch-angle',
    label: 'Dutch Angle',
    labelKo: '더치 앵글',
    description: 'Tilted frame, creates tension',
    icon: 'DTH',
    thumbnail: '/thumbnails/angle-dutch-angle.webp',
  },
  {
    id: 'birds-eye',
    label: "Bird's Eye",
    labelKo: '버즈 아이',
    description: 'Directly overhead view',
    icon: 'BRD',
    thumbnail: '/thumbnails/angle-birds-eye-view.webp',
  },
  {
    id: 'worms-eye',
    label: "Worm's Eye",
    labelKo: '웜즈 아이',
    description: 'From ground looking straight up',
    icon: 'WRM',
    thumbnail: '/thumbnails/angle-worms-eye-view.webp',
  },
  {
    id: 'pov',
    label: 'POV',
    labelKo: 'POV',
    description: 'First person perspective',
    icon: 'POV',
    thumbnail: '/thumbnails/angle-point-of-view.webp',
  },
  {
    id: 'over-shoulder',
    label: 'Over-the-Shoulder',
    labelKo: '오버 더 숄더',
    description: 'From behind one subject toward another',
    icon: 'OTS',
    thumbnail: '/thumbnails/angle-over-the-shoulder.webp',
  },
];

export const LIGHTING_STYLES: LightingStyle[] = [
  {
    id: 'day',
    label: 'Day',
    labelKo: '낮',
    description: 'Clear daytime natural light',
    icon: 'DAY',
    thumbnail: '/thumbnails/time-day.webp',
  },
  {
    id: 'dusk',
    label: 'Dusk / Sunset',
    labelKo: '노을',
    description: 'Warm sunset and evening sky',
    icon: 'DSK',
    thumbnail: '/thumbnails/time-dusk.webp',
  },
  {
    id: 'night',
    label: 'Night',
    labelKo: '밤',
    description: 'City lights and deep night sky',
    icon: 'NGT',
    thumbnail: '/thumbnails/time-night.webp',
  },
  {
    id: 'dawn',
    label: 'Dawn',
    labelKo: '새벽',
    description: 'Cool early-morning light before sunrise',
    icon: 'DWN',
    thumbnail: '/thumbnails/time-dawn.webp',
  },
];

export const WEATHER_STYLES: WeatherStyle[] = [
  {
    id: 'clear',
    label: 'Clear',
    labelKo: '맑음',
    description: 'Bright, clear weather with blue skies',
    icon: 'CLR',
    thumbnail: '/thumbnails/weather-clear.webp',
  },
  {
    id: 'rain',
    label: 'Rain',
    labelKo: '비',
    description: 'Rainy atmosphere with wet streets',
    icon: 'RAN',
    thumbnail: '/thumbnails/weather-rain.webp',
  },
  {
    id: 'snow',
    label: 'Snow',
    labelKo: '눈',
    description: 'Snowy scenery with white roads and roofs',
    icon: 'SNW',
    thumbnail: '/thumbnails/weather-snow.webp',
  },
  {
    id: 'fog',
    label: 'Fog',
    labelKo: '안개',
    description: 'Heavy fog with low visibility, soft diffusion and haze',
    icon: 'FOG',
    thumbnail: '/thumbnails/weather-fog.webp',
  },
  {
    id: 'dust',
    label: 'Yellow Dust',
    labelKo: '황사',
    description: 'Yellow dust haze, muted contrast, warm dusty atmosphere',
    icon: 'DST',
    thumbnail: '/thumbnails/weather-dust.webp',
  },
  {
    id: 'thunder',
    label: 'Thunderstorm',
    labelKo: '천둥/번개',
    description: 'Thunderstorm with lightning, dramatic clouds and intense atmosphere',
    icon: 'THD',
    thumbnail: '/thumbnails/weather-thunder.webp',
  },
];

export const LOCATION_STYLES: LocationStyle[] = [
  {
    id: 'indoor',
    label: 'Indoor',
    labelKo: '실내',
    description: 'Generic indoor location, walls and furniture visible',
    icon: 'IND',
    thumbnail: '/thumbnails/location-indoor.webp',
  },
  {
    id: 'studio',
    label: 'Studio',
    labelKo: '실내(스튜디오)',
    description: 'Controlled studio set with lighting and backdrops',
    icon: 'STD',
    thumbnail: '/thumbnails/location-studio.webp',
  },
  {
    id: 'city',
    label: 'City',
    labelKo: '도시',
    description: 'City streets, buildings and urban lights',
    icon: 'CTY',
    thumbnail: '/thumbnails/location-city.webp',
  },
  {
    id: 'forest',
    label: 'Forest',
    labelKo: '숲',
    description: 'Dense forest with trees and foliage',
    icon: 'FOR',
    thumbnail: '/thumbnails/location-forest.webp',
  },
  {
    id: 'sea',
    label: 'Sea',
    labelKo: '바다',
    description: 'Sea or ocean, shoreline and waves',
    icon: 'SEA',
    thumbnail: '/thumbnails/location-sea.webp',
  },
  {
    id: 'space',
    label: 'Space',
    labelKo: '우주',
    description: 'Outer space with stars, planets or nebulae',
    icon: 'SPC',
    thumbnail: '/thumbnails/location-space.webp',
  },
];

export const GENRES: Genre[] = [
  {
    id: 'drama',
    label: 'Drama',
    labelKo: '드라마',
    description: 'Emotional, character-driven',
    icon: 'DRA',
    thumbnail: '/thumbnails/genre-drama.webp',
  },
  {
    id: 'action',
    label: 'Action',
    labelKo: '액션',
    description: 'Dynamic, high energy',
    icon: 'ACT',
    thumbnail: '/thumbnails/genre-action.webp',
  },
  {
    id: 'thriller',
    label: 'Thriller',
    labelKo: '스릴러',
    description: 'Suspenseful, tense atmosphere',
    icon: 'THR',
    thumbnail: '/thumbnails/genre-thriller.webp',
  },
  {
    id: 'animation',
    label: 'Animation',
    labelKo: '애니메이션',
    description: 'Animated style visuals',
    icon: 'ANI',
    thumbnail: '/thumbnails/genre-animation.webp',
  },
  {
    id: 'documentary',
    label: 'Documentary',
    labelKo: '다큐멘터리',
    description: 'Realistic, observational',
    icon: 'DOC',
    thumbnail: '/thumbnails/genre-documentary.webp',
  },
  {
    id: 'romance',
    label: 'Romance',
    labelKo: '로맨스',
    description: 'Soft, warm, intimate',
    icon: 'ROM',
    thumbnail: '/thumbnails/genre-romance.webp',
  },
  {
    id: 'product',
    label: 'Advertising',
    labelKo: '광고',
    description: 'Clean, focused product visuals',
    icon: 'ADV',
    thumbnail: '/thumbnails/genre-product.webp',
  },
  {
    id: 'music-video',
    label: 'Music Video',
    labelKo: '뮤직비디오',
    description: 'Stylized, rhythmic visuals synced to music',
    icon: 'MV',
    thumbnail: '/thumbnails/genre-music-video.webp',
  },
];

export const CAMERA_MOVEMENTS: CameraMovement[] = [
  {
    id: 'static',
    label: 'Static / Hold',
    labelKo: '홀드',
    description: 'Locked-off camera, no movement',
    icon: 'STC',
    thumbnail: '/thumbnails/move-static.gif',
  },
  {
    id: 'pedestal',
    label: 'Pedestal',
    labelKo: '페데스탈',
    description: 'Camera moves straight up or down',
    icon: 'PED',
    thumbnail: '/thumbnails/move-pedestal.gif',
  },
  {
    id: 'pan',
    label: 'Pan',
    labelKo: '팬',
    description: 'Horizontal rotation from a fixed point',
    icon: 'PAN',
    thumbnail: '/thumbnails/move-pan.gif',
  },
  {
    id: 'tilt',
    label: 'Tilt',
    labelKo: '틸트',
    description: 'Vertical rotation from a fixed point',
    icon: 'TLT',
    thumbnail: '/thumbnails/move-tilt.gif',
  },
  {
    id: 'dolly-in',
    label: 'Dolly In',
    labelKo: '달리 인',
    description: 'Camera moves closer to subject',
    icon: 'DI',
    thumbnail: '/thumbnails/move-dolly-in.gif',
  },
  {
    id: 'dolly-out',
    label: 'Dolly Out',
    labelKo: '달리 아웃',
    description: 'Camera moves away from subject',
    icon: 'DO',
    thumbnail: '/thumbnails/move-dolly-out.gif',
  },
  {
    id: 'arc',
    label: 'Arc / Orbit',
    labelKo: '아크',
    description: 'Curved move around the subject',
    icon: 'ARC',
    thumbnail: '/thumbnails/move-arc.gif',
  },
  {
    id: 'crane',
    label: 'Crane',
    labelKo: '크레인',
    description: 'Camera moves vertically and horizontally on a crane arm, dramatic rising or descending shots',
    icon: 'CRN',
    thumbnail: '/thumbnails/move-crane.gif',
  },
  {
    id: 'tracking',
    label: 'Tracking',
    labelKo: '트래킹',
    description: 'Camera moves alongside or behind the subject, following their movement through space',
    icon: 'TRK',
    thumbnail: '/thumbnails/move-tracking.gif',
  },
  {
    id: 'long-take',
    label: 'Long Take',
    labelKo: '롱테이크',
    description: 'Extended continuous shot without cutting, fluid camera movement through the scene',
    icon: 'LNG',
    thumbnail: '/thumbnails/move-long-take.gif',
  },
];

export const FIELD_OF_VIEW = [
  {
    id: '25mm',
    label: '25mm',
    labelKo: '25mm 광각',
    description: 'Very wide angle lens, expansive view',
    icon: '25',
    thumbnail: '/thumbnails/lens-25mm.webp',
  },
  {
    id: '35mm',
    label: '35mm',
    labelKo: '35mm 광각',
    description: 'Classic wide lens, cinematic street look',
    icon: '35',
    thumbnail: '/thumbnails/lens-35mm.webp',
  },
  {
    id: '50mm',
    label: '50mm',
    labelKo: '50mm 표준',
    description: 'Natural perspective, human-eye feel',
    icon: '50',
    thumbnail: '/thumbnails/lens-50mm.webp',
  },
  {
    id: '85mm',
    label: '85mm',
    labelKo: '85mm 망원',
    description: 'Portrait telephoto, strong background blur',
    icon: '85',
    thumbnail: '/thumbnails/lens-85mm.webp',
  },
  {
    id: '100mm',
    label: '100mm',
    labelKo: '100mm 망원',
    description: 'Tight telephoto, compressed background',
    icon: '100',
    thumbnail: '/thumbnails/lens-100mm.webp',
  },
  {
    id: '300mm',
    label: '300mm',
    labelKo: '300mm 초망원',
    description: 'Super telephoto, extremely compressed background',
    icon: '300',
    thumbnail: '/thumbnails/lens-300mm.webp',
  },
];

// Promman Types

export type OutputMode = 'image' | 'video';

export interface Character {
  id: string;
  name: string;
  gender: string;
  age: string;
  appearance: string;
  clothing: string;
}

export interface ShotType {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface CameraAngle {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface LightingStyle {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface WeatherStyle {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface LocationStyle {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface Genre {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface CameraMovement {
  id: string;
  label: string;
  labelKo: string;
  description: string;
  icon: string;
  thumbnail?: string;
}

export interface DirectorSettings {
  genre: string;
  shotType: string;
  cameraAngle: string;
  lighting: string;
  weather?: string;
  fieldOfView?: string;
  cameraMovement?: string;
  handheldIntensity?: number;
  aspectRatio?: string;
}

export interface PromptHistoryItem {
  id: string;
  timestamp: number;
  inputKorean: string;
  outputEnglish: string;
  mode: OutputMode;
  settings: DirectorSettings;
  isFavorite: boolean;
  characters: Character[];
}

export interface PromptState {
  mode: OutputMode;
  inputText: string;
  outputText: string;
  characters: Character[];
  settings: DirectorSettings;
  isGenerating: boolean;
}

// Preset Data - Icons are emoji representations for visual thumbnails

