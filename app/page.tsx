'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Copy, Check, Sparkles, Image as ImageIcon, Video, Plus, ChevronDown, History, Trash2, X, Heart, ExternalLink, Star, Pencil } from 'lucide-react';
import { GENRES, SHOT_TYPES, CAMERA_ANGLES, LIGHTING_STYLES, WEATHER_STYLES, CAMERA_MOVEMENTS, FIELD_OF_VIEW, LOCATION_STYLES } from '@/lib/types';
import type { Character, DirectorSettings, PrommanOutputMode } from '@/lib/types';
import { getHistory, saveToHistory, toggleFavorite, deleteHistoryItem } from '@/lib/storage';

const TIPS = [
  '캐릭터 이름을 프롬프트에서 직접 사용하세요.',
  'bolder studio에서 만들고 서비스합니다.',
  '조명 설정은 분위기를 크게 좌우합니다.',
  '카메라 앵글 변경만으로도 완전히 다른 느낌의 장면을 만들 수 있어요',
  'AI의 특성상 버드샷의 구현이 약합니다. 생성을 여러번 시도하세요.',
  '화낸다. 보다는 차가운 분위기라는 무드 표현이 더 시네마틱한 결과물을 얻을 수 있습니다.',
  '실시간으로 개선 중입니다. 마음에 들지않는 결과가 나오더라도 넓은 마음으로 다시 시도해주세요.',
  '프롬프트 생성기이다보니 이미지 생성 기능을 직접 제공하지는 않습니다.',
  '볼더 모카 베타 팔로미노 엔에이유 렛츠고',
];

const defaultSettings: DirectorSettings = {
  genre: 'drama',
  shotType: 'extreme-close',
  cameraAngle: 'eye-level',
  lighting: 'day',
  weather: 'clear',
  fieldOfView: '25mm',
  cameraMovement: 'static',
  location: 'indoor',
};

const CHARACTER_SLOT_NAMES = ['성재', '진섭', '범철', '현식'] as const;

// 화각(FOV) 상세 설명 텍스트 (제목/내용 분리)
const FOV_EXPLANATIONS: Record<string, { title: string; body: string }> = {
  '25mm': {
    title: '25mm 광각',
    body: '넓은 시야각으로 공간 전체를 담으며, 원근감을 왜곡시켜 웅장하거나 긴박한 현장감을 줄 때 사용합니다.',
  },
  '35mm': {
    title: '35mm 광각',
    body: '풍경과 인물을 적절히 조화시켜 일상적인 느낌을 주며, 영화 촬영에서 가장 표준적으로 쓰이는 스냅 화각입니다.',
  },
  '50mm': {
    title: '50mm 표준',
    body: '사람의 눈과 가장 유사한 원근감을 가져 왜곡 없이 자연스럽고 안정적인 인물 샷을 연출할 때 최적입니다.',
  },
  '85mm': {
    title: '85mm 망원',
    body: '배경을 부드럽게 뭉개는 아웃포커싱 효과가 탁월하여, 인물의 얼굴에만 시선을 집중시키는 인물 사진에 주로 씁니다.',
  },
  '100mm': {
    title: '100mm 망원',
    body: '멀리 있는 대상을 가까이 당겨 보여주며, 피사체와 배경 사이의 거리를 압축해 밀도 있는 화면을 구성할 때 활용합니다.',
  },
  '300mm': {
    title: '300mm 초망원',
    body: '아주 먼 거리의 피사체를 관찰하듯 촬영하며, 야생 동물이나 스포츠 경기 등 접근이 어려운 대상을 담을 때 필수적입니다.',
  },
};

// 샷 타입 상세 설명 텍스트 (제목/내용 분리)
const SHOT_EXPLANATIONS: Record<string, { title: string; body: string }> = {
  'extreme-close': {
    title: '익스트림 클로즈업 (Extreme Close-up)',
    body: '눈이나 입술 등 특정 부위를 아주 크게 보여주어 강렬한 감정이나 디테일을 강조할 때 사용합니다.',
  },
  close: {
    title: '클로즈업 (Close-up)',
    body: '얼굴 전체를 화면에 가득 담아 인물의 세밀한 표정과 심리 상태를 전달할 때 효과적입니다.',
  },
  'medium-close': {
    title: '미디엄 클로즈업 (Medium Close-up)',
    body: '가슴 윗부분까지 담으며, 인터뷰나 대화 장면에서 인물에게 집중하면서도 답답하지 않게 표현할 때 씁니다.',
  },
  medium: {
    title: '미디엄 샷 (Medium Shot)',
    body: '허리 위쪽을 촬영하며 인물의 움직임과 주변 배경을 적절히 조화시켜 보여줄 때 가장 많이 활용합니다.',
  },
  full: {
    title: '풀 샷 (Full Shot)',
    body: '인물의 머리부터 발끝까지 전체 몸동작을 보여주며, 캐릭터가 처한 상황이나 물리적 위치를 설명할 때 사용합니다.',
  },
  wide: {
    title: '와이드 샷 (Wide Shot)',
    body: '인물보다 배경의 비중을 높여 인물이 속한 환경이나 분위기를 웅장하게 보여줄 때 적합합니다.',
  },
  'extreme-wide': {
    title: '익스트림 와이드 (Extreme Wide)',
    body: '아주 먼 거리에서 풍경 전체를 담아 공간의 규모감을 극대화하거나 인물을 아주 작게 표현해 고립감을 줄 때 씁니다.',
  },
  establishing: {
    title: '에스타블리싱 샷 (Establishing Shot)',
    body: '장면의 시작 부분에서 장소, 시간, 분위기 등 전체적인 맥락을 한눈에 파악하게 만드는 도입부 샷입니다. 인물을 추가할 수 없습니다.',
  },
};

// 장르 상세 설명 텍스트 (제목/내용 분리)
const GENRE_EXPLANATIONS: Record<string, { title: string; body: string }> = {
  drama: {
    title: '드라마',
    body: '일상의 질감을 살리는 자연스러운 색감과 부드러운 대비를 사용하여 관객이 인물의 감정에 차분히 몰입할 수 있도록 잡습니다.',
  },
  action: {
    title: '액션',
    body: '강렬한 대비와 차가운 청색 혹은 거친 질감을 강조하여, 장면의 속도감과 타격감이 시각적으로 더 돋보이게 톤을 잡습니다.',
  },
  thriller: {
    title: '스릴러',
    body: '그림자를 깊게 활용하는 어두운 로우 키(Low-key) 조명과 차갑고 건조한 색조를 통해 긴장감과 미스터리한 분위기를 조성합니다.',
  },
  animation: {
    title: '애니메이션',
    body: '원색의 화려함이나 파스텔톤의 화사함 등 현실보다 과장된 색채 설계를 통해 작품만의 독창적인 세계관과 생동감을 부여합니다.',
  },
  documentary: {
    title: '다큐멘터리',
    body: '인위적인 보정을 최소화하고 현장의 색감을 그대로 살리는 뉴트럴(Neutral) 톤을 유지하여 신뢰감과 사실성을 높입니다.',
  },
  romance: {
    title: '로맨스',
    body: '따뜻한 황금빛 조명이나 분홍빛이 도는 화사한 톤, 그리고 경계가 부드러운 빛 처리를 통해 낭만적이고 몽글몽글한 느낌을 줍니다.',
  },
  product: {
    title: '광고',
    body: '제품이 가장 매력적으로 보이도록 극도로 깨끗하고 선명한 고해상도의 톤을 잡으며, 브랜드 이미지에 맞춘 정교한 컬러 그레이딩을 적용합니다.',
  },
  'music-video': {
    title: '뮤직비디오',
    body: '꿈꾸는 듯한 몽환적인 분위기와 따뜻하고 화사한 파스텔 색조를 중심으로, 인물의 순수함과 풋풋한 에너지를 시각적으로 극대화합니다.',
  },
};

// 카메라 앵글 상세 설명 텍스트 (제목/내용 분리)
const ANGLE_EXPLANATIONS: Record<string, { title: string; body: string }> = {
  'eye-level': {
    title: '아이 레벨 (Eye Level)',
    body: '눈높이에서 촬영하며 가장 자연스럽고 안정적인 느낌을 줄 때 사용합니다.',
  },
  'high-angle': {
    title: '하이 앵글 (High Angle)',
    body: '위에서 아래를 내려다보며 피사체를 작고 연약하거나 고립되어 보이게 할 때 씁니다.',
  },
  'low-angle': {
    title: '로우 앵글 (Low Angle)',
    body: '아래에서 위를 올려다보며 피사체를 권위 있고 웅장하거나 위협적으로 표현할 때 효과적입니다.',
  },
  'birds-eye': {
    title: "버드 아이 뷰 (Bird's Eye View)",
    body: '아주 높은 곳에서 수직으로 내려다보며 전체적인 상황이나 장소의 규모를 한눈에 보여줄 때 활용합니다.',
  },
  'dutch-angle': {
    title: '더치 (Dutch Angle)',
    body: '카메라를 옆으로 기울여 불안함, 혼란, 긴장감 넘치는 심리 상태를 묘사할 때 사용합니다.',
  },
  'worms-eye': {
    title: "웜즈 아이 (Worm's Eye View)",
    body: '지면 밀착 상태에서 아주 낮게 위를 올려다보며 피사체를 압도적으로 거대하거나 위엄 있게 표현할 때 사용합니다.',
  },
  'pov': {
    title: 'POV (Point of View)',
    body: '등장인물의 눈으로 보는 시점을 그대로 재현하여 시청자가 캐릭터의 경험에 직접 몰입하게 할 때 효과적입니다.',
  },
  'over-shoulder': {
    title: '오버 더 숄더 (Over the Shoulder)',
    body: '한 인물의 어깨 너머로 상대방을 비추며 인물 간의 관계나 대화의 흐름을 자연스럽게 보여줄 때 활용합니다.',
  },
};

// 카메라 무빙 상세 설명 텍스트 (제목/내용 분리)
const MOVEMENT_EXPLANATIONS: Record<string, { title: string; body: string }> = {
  static: {
    title: '홀드 (Hold)',
    body: '폭풍 전야의 정적이나 인물의 깊은 고뇌를 담아낼 때 적합하며, 관객이 화면 속 디테일과 감정에 온전히 침잠하게 만듭니다.',
  },
  pedestal: {
    title: '페데스탈 (Pedestal)',
    body: '인물의 전신을 아래에서 위로 훑으며 외양을 강조하거나, 앉아 있던 인물이 일어나는 높이 변화를 정직하게 따라가며 심리적 위상을 표현합니다.',
  },
  pan: {
    title: '팬 (Pan)',
    body: '고개를 돌려 주변을 살피는 시선을 대변하며, 인물 간의 대화 주도권을 옮기거나 넓은 공간의 전체적인 전경을 훑어줄 때 효과적입니다.',
  },
  tilt: {
    title: '틸트 (Tilt)',
    body: '거대한 대상을 올려다보며 압도당하는 느낌을 주거나, 높은 곳에서 아래를 내려다보며 고립감이나 비참함을 강조하고 싶을 때 사용합니다.',
  },
  'dolly-in': {
    title: '달리 인 (Dolly In)',
    body: '인물이 중요한 결심을 하거나 충격적인 진실을 깨닫는 순간, 인물의 심리 속으로 강제로 비집고 들어가는 듯한 강력한 몰입감을 부여합니다.',
  },
  'dolly-out': {
    title: '달리 아웃 (Dolly Out)',
    body: '사건이 끝난 뒤의 허탈함과 고독감을 보여주거나, 인물을 둘러싼 거대한 주변 상황을 서서히 드러내며 반전의 묘미를 줄 때 좋습니다.',
  },
  arc: {
    title: '아크 (Arc)',
    body: '대치 중인 두 인물 사이의 팽팽한 긴장감을 입체적으로 그리거나, 로맨틱한 순간에 두 사람만의 세상을 몽환적으로 감싸 안는 느낌을 줍니다.',
  },
  crane: {
    title: '크레인 (Crane)',
    body: '카메라를 수직/대각선으로 크게 들어 올리거나 내리며, 장면의 스케일을 웅장하게 보여주거나 사건의 결말을 부감으로 조망하며 여운을 남길 때 사용합니다.',
  },
  tracking: {
    title: '트래킹 (Tracking)',
    body: '피사체의 옆이나 뒤를 나란히 따라가며 촬영하여, 캐릭터와 함께 현장을 걷는 듯한 생동감과 관찰자 시점의 역동성을 동시에 부여합니다.',
  },
  'long-take': {
    title: '롱테이크 (Long Take)',
    body: '컷 없이 긴 호흡으로 장면을 유지하여 인물의 감정선을 깨뜨리지 않고 밀도 있게 전달하며, 실제 시간이 흐르는 듯한 극도의 사실감을 연출합니다.',
  },
};

export default function Home() {
  const [mode, setMode] = useState<PrommanOutputMode>('image');
  const [inputText, setInputText] = useState('');
  const [videoDetailText, setVideoDetailText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [characters, setCharacters] = useState<(Character | null)[]>([null, null, null, null]);
  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [settings, setSettings] = useState<DirectorSettings>(defaultSettings);
  const [fovOpen, setFovOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [shotOpen, setShotOpen] = useState(false);
  const [angleOpen, setAngleOpen] = useState(false);
  const [lightOpen, setLightOpen] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const selectedGenre = GENRES.find(g => g.id === settings.genre);
  const selectedShot = SHOT_TYPES.find(s => s.id === settings.shotType);
  const selectedAngle = CAMERA_ANGLES.find(a => a.id === settings.cameraAngle);
  const selectedLight = LIGHTING_STYLES.find(l => l.id === settings.lighting);
  const selectedWeather = WEATHER_STYLES.find(w => w.id === settings.weather);
  const selectedLocation = LOCATION_STYLES.find(l => l.id === settings.location);
  const selectedFOV = FIELD_OF_VIEW.find(f => f.id === settings.fieldOfView);
  const selectedMovement = CAMERA_MOVEMENTS.find(m => m.id === settings.cameraMovement);

  const [pillState, setPillState] = useState<'image' | 'video' | 'stretch'>('image');

  const closeAllDirectorPopovers = () => {
    setFovOpen(false);
    setGenreOpen(false);
    setShotOpen(false);
    setAngleOpen(false);
    setLightOpen(false);
    setWeatherOpen(false);
    setLocationOpen(false);
    setMoveOpen(false);
  };

  useEffect(() => {
    setHistory(getHistory());
    const interval = setInterval(() => setTipIndex(p => (p + 1) % TIPS.length), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    const combinedInput =
      mode === 'video'
        ? [inputText, videoDetailText].filter(Boolean).join('\n')
        : inputText;
    if (!combinedInput.trim()) return;
    const activeCharacters = characters.filter(
      (c): c is Character => Boolean(c),
    );
    setIsGenerating(true);
    setOutputText('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: combinedInput, settings, characters: activeCharacters, mode }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type');
      const data = contentType?.includes('application/json') ? await res.json() : { error: `${res.status} ${res.statusText}` };
      if (!res.ok) {
        setOutputText(`Error: ${data.error || res.statusText}\n\n(도메인 배포 시 GROQ_API_KEY 환경 변수 설정 후 재배포했는지 확인하세요.)`);
        return;
      }
      const prompt = data.prompt ?? '';
      setOutputText(prompt);
      saveToHistory({
        id: Date.now().toString(),
        inputKorean: combinedInput,
        outputEnglish: prompt,
        mode,
        settings,
        characters: activeCharacters,
        isFavorite: false,
        timestamp: Date.now(),
      });
      setHistory(getHistory());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      const isAbort = msg.includes('abort');
      setOutputText(isAbort ? 'Error: 요청 시간 초과(60초). 다시 시도해 보세요.' : `Error: ${msg}\n\n(콘솔 F12 → Network 탭에서 /api/generate-prompt 응답을 확인해 보세요.)`);
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addCharacter = () => {
    const slotIndex = characters.findIndex(c => !c);
    if (slotIndex === -1) return;
    const name = CHARACTER_SLOT_NAMES[slotIndex] ?? 'Character';
    const newChar: Character = {
      id: Date.now().toString(),
      name,
      gender: '',
      age: '',
      appearance: '',
      clothing: '',
    };
    const next = [...characters];
    next[slotIndex] = newChar;
    setCharacters(next);
  };

  const ensureCharacterAtIndex = (index: number) => {
    if (index > 3) return;
    if (characters[index]) return;
    const name = CHARACTER_SLOT_NAMES[index] ?? 'Character';
    const next = [...characters];
    next[index] = {
      id: Date.now().toString() + '-' + index.toString(),
      name,
      gender: '',
      age: '',
      appearance: '',
      clothing: '',
    };
    setCharacters(next);
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prev =>
      prev.map(c => (c && c.id === id ? { ...c, ...updates } : c)),
    );
  };

  const removeCharacter = (id: string) => {
    setCharacters(prev => prev.map(c => (c && c.id === id ? null : c)));
  };

  const updateSetting = (key: keyof DirectorSettings, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const switchMode = (target: PrommanOutputMode) => {
    setMode(target);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <Image src="/logo.gif" alt="Promman" width={280} height={100} className="h-20 w-[280px] object-contain object-left" priority />
        <a
          href="https://ko-fi.com/Q5Q51W3GLT"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Heart className="h-4 w-4" />
          Ko-fi로 후원하기
        </a>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-96 overflow-y-auto border-r border-border p-4">
          {/* Mode Toggle */}
          <div className="mb-4 flex rounded-full border border-border bg-card p-1">
            <button
              onClick={() => switchMode('image')}
              className={cn(
                'flex-1 rounded-full py-2 text-sm font-medium',
                mode === 'image' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              <ImageIcon className="mr-1 inline h-4 w-4" />
              Image
            </button>
            <button
              onClick={() => switchMode('video')}
              className={cn(
                'flex-1 rounded-full py-2 text-sm font-medium',
                mode === 'video' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              <Video className="mr-1 inline h-4 w-4" />
              Video
            </button>
          </div>

          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Director Controls</h3>

          {/* Director Controls - 2 columns, 3 rows (2x3) */}
          <div className="grid grid-cols-2 gap-2">
            {/* FOV */}
            <Popover
              open={fovOpen}
              onOpenChange={open => {
                if (open) {
                  closeAllDirectorPopovers();
                }
                setFovOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <button className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg bg-card p-2 ring-[1px] ring-border hover:ring-primary">
                  <div className="relative w-full aspect-video rounded overflow-hidden bg-muted min-h-[5.5rem]">
                    <img
                      src={selectedFOV?.thumbnail || '/thumbnails/lens-50mm.webp'}
                      alt={selectedFOV?.labelKo || 'FOV'}
                      width={16}
                      height={9}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {selectedFOV?.labelKo || '화각'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-3 translate-y-[-220px]" side="right">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {FIELD_OF_VIEW.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSetting('fieldOfView', item.id);
                        setFovOpen(false);
                      }}
                      className={cn(
                        'relative aspect-video overflow-hidden rounded',
                        settings.fieldOfView === item.id ? 'border-2 border-primary' : 'border border-border',
                      )}
                    >
                      <img
                        src={item.thumbnail || '/thumbnails/lens-50mm.webp'}
                        alt={item.labelKo}
                        width={16}
                        height={9}
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-1 right-1 text-[11px] font-medium">
                        {item.labelKo}
                      </span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Genre */}
            <Popover
              open={genreOpen}
              onOpenChange={open => {
                if (open) {
                  closeAllDirectorPopovers();
                }
                setGenreOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <button className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg bg-card p-2 ring-[1px] ring-border hover:ring-primary">
                  <div className="relative w-full aspect-video rounded overflow-hidden bg-muted min-h-[5.5rem]">
                    <img
                      src={selectedGenre?.thumbnail || '/thumbnails/genre-cinematic.jpg'}
                      alt={selectedGenre?.label || 'Genre'}
                      width={16}
                      height={9}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {selectedGenre?.labelKo || 'Genre'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-3" side="right">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {GENRES.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSetting('genre', item.id);
                        setGenreOpen(false);
                      }}
                      className={cn('relative aspect-video overflow-hidden rounded', settings.genre === item.id ? 'border-2 border-primary' : 'border border-border')}
                    >
                      <img
                        src={item.thumbnail || '/thumbnails/genre-cinematic.jpg'}
                        alt={item.labelKo}
                        width={16}
                        height={9}
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-1 right-1 text-[11px] font-medium">{item.labelKo}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Shot */}
            <Popover
              open={shotOpen}
              onOpenChange={open => {
                if (open) {
                  closeAllDirectorPopovers();
                }
                setShotOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <button className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg bg-card p-2 ring-[1px] ring-border hover:ring-primary">
                  <div className="relative w-full aspect-video rounded overflow-hidden bg-muted min-h-[5.5rem]">
                    <img
                      src={selectedShot?.thumbnail || '/thumbnails/shot-wide-shot.webp'}
                      alt={selectedShot?.labelKo || 'Shot'}
                      width={16}
                      height={9}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {selectedShot?.labelKo || 'Shot'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-3" side="right">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {SHOT_TYPES.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSetting('shotType', item.id);
                        setShotOpen(false);
                      }}
                      className={cn('relative aspect-video overflow-hidden rounded', settings.shotType === item.id ? 'border-2 border-primary' : 'border border-border')}
                    >
                      <img
                      src={item.thumbnail || '/thumbnails/shot-wide-shot.webp'}
                        alt={item.labelKo}
                        width={16}
                        height={9}
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-1 right-1 text-[11px] font-medium">{item.labelKo}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Angle */}
            <Popover
              open={angleOpen}
              onOpenChange={open => {
                if (open) {
                  closeAllDirectorPopovers();
                }
                setAngleOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <button className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg bg-card p-2 ring-[1px] ring-border hover:ring-primary">
                  <div className="relative w-full aspect-video rounded overflow-hidden bg-muted min-h-[5.5rem]">
                    <img
                      src={selectedAngle?.thumbnail || '/thumbnails/angle-low-angle.webp'}
                      alt={selectedAngle?.label || 'Angle'}
                      width={16}
                      height={9}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {selectedAngle?.labelKo || 'Angle'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-3" side="right">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {CAMERA_ANGLES.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSetting('cameraAngle', item.id);
                        setAngleOpen(false);
                      }}
                      className={cn('relative aspect-video overflow-hidden rounded', settings.cameraAngle === item.id ? 'border-2 border-primary' : 'border border-border')}
                    >
                      <img
                      src={item.thumbnail || '/thumbnails/angle-low-angle.webp'}
                        alt={item.labelKo}
                        width={16}
                        height={9}
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-1 right-1 text-[11px] font-medium">{item.labelKo}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Light (Time of Day) */}
            <Popover
              open={lightOpen}
              onOpenChange={open => {
                if (open) {
                  closeAllDirectorPopovers();
                }
                setLightOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <button className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg bg-card p-2 ring-[1px] ring-border hover:ring-primary">
                  <div className="relative w-full aspect-video rounded overflow-hidden bg-muted min-h-[5.5rem]">
                    <img
                      src={selectedLight?.thumbnail || '/thumbnails/time-day.webp'}
                      alt={selectedLight?.labelKo || '시간대'}
                      width={16}
                      height={9}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {selectedLight?.labelKo || '시간대'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-3" side="right">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {LIGHTING_STYLES.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSetting('lighting', item.id);
                        setLightOpen(false);
                      }}
                      className={cn('relative aspect-video overflow-hidden rounded', settings.lighting === item.id ? 'border-2 border-primary' : 'border border-border')}
                    >
                      <img
                      src={item.thumbnail || '/thumbnails/time-day.webp'}
                        alt={item.labelKo}
                        width={16}
                        height={9}
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-1 right-1 text-[11px] font-medium">{item.labelKo}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Weather */}
            <Popover
              open={weatherOpen}
              onOpenChange={open => {
                if (open) {
                  closeAllDirectorPopovers();
                }
                setWeatherOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <button className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg bg-card p-2 ring-[1px] ring-border hover:ring-primary">
                  <div className="relative w-full aspect-video rounded overflow-hidden bg-muted min-h-[5.5rem]">
                    <img
src={selectedWeather?.thumbnail || '/thumbnails/weather-clear.webp'}
                        alt={selectedWeather?.labelKo || '날씨'}
                        width={16}
                        height={9}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {selectedWeather?.labelKo || '날씨'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-3" side="right">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {WEATHER_STYLES.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSetting('weather', item.id);
                        setWeatherOpen(false);
                      }}
                      className={cn(
                        'relative aspect-video overflow-hidden rounded',
                        settings.weather === item.id ? 'border-2 border-primary' : 'border border-border'
                      )}
                    >
                      <img
                        src={item.thumbnail || '/thumbnails/weather-clear.webp'}
                        alt={item.labelKo}
                        width={16}
                        height={9}
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-1 right-1 text-[11px] font-medium">{item.labelKo}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Location */}
            <Popover
              open={locationOpen}
              onOpenChange={open => {
                if (open) {
                  closeAllDirectorPopovers();
                }
                setLocationOpen(open);
              }}
            >
              <PopoverTrigger asChild>
                <button className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg bg-card p-2 ring-[1px] ring-border hover:ring-primary">
                  <div className="relative w-full aspect-video rounded overflow-hidden bg-muted min-h-[5.5rem]">
                    <img
                      src={selectedLocation?.thumbnail || '/thumbnails/location-indoor.webp'}
                      alt={selectedLocation?.labelKo || '장소'}
                      width={16}
                      height={9}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {selectedLocation?.labelKo || '장소'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-3" side="right">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {LOCATION_STYLES.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        updateSetting('location', item.id);
                        setLocationOpen(false);
                      }}
                      className={cn(
                        'relative aspect-video overflow-hidden rounded',
                        settings.location === item.id ? 'border-2 border-primary' : 'border border-border'
                      )}
                    >
                      <img
                        src={item.thumbnail || '/thumbnails/location-indoor.webp'}
                        alt={item.labelKo}
                        width={16}
                        height={9}
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <span className="absolute bottom-1 right-1 text-[11px] font-medium">{item.labelKo}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Camera Movement - Video only */}
            {mode === 'video' && (
              <Popover
                open={moveOpen}
                onOpenChange={open => {
                  if (open) {
                    closeAllDirectorPopovers();
                  }
                  setMoveOpen(open);
                }}
              >
                <PopoverTrigger asChild>
                  <button className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg bg-card p-2 ring-[1px] ring-border hover:ring-primary">
                    <div className="relative w-full aspect-video rounded overflow-hidden bg-muted min-h-[5.5rem]">
                      <img
                        src={selectedMovement?.thumbnail || '/thumbnails/move-static.webp'}
                        alt={selectedMovement?.labelKo || 'Move'}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-medium">
                      {selectedMovement?.labelKo || '무빙'}
                    </span>
                  </button>
                </PopoverTrigger>
                
                {/* 다른 팝오버(2열/w-96)와 썸네일 크기를 맞추기 위해 너비를 w-[768px]로 설정 (2배 크기) */}
                <PopoverContent className="w-[768px] p-3 bg-card border-border shadow-2xl" side="right">
                  <div className="grid grid-cols-4 gap-2 text-[11px]">
                    {CAMERA_MOVEMENTS.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          updateSetting('cameraMovement', item.id);
                          setMoveOpen(false);
                        }}
                        className={cn(
                          'group relative aspect-video overflow-hidden rounded-md transition-all',
                          settings.cameraMovement === item.id 
                            ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' 
                            : 'border border-border hover:border-primary/50'
                        )}
                      >
                        <img
                          src={item.thumbnail || '/thumbnails/move-static.webp'}
                          alt={item.labelKo}
                          className={cn(
                            "absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105",
                            settings.cameraMovement === item.id ? "opacity-100" : "opacity-60"
                          )}
                        />
                        {/* 텍스트 시인성을 위한 하단 그라데이션 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                        <span className="absolute bottom-1.5 right-2 font-medium text-white text-[10px]">
                          {item.labelKo}
                        </span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative flex flex-1 flex-col p-4">
          <div className="mb-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-xs text-primary">{'💡'} {TIPS[tipIndex]}</p>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-4 overflow-hidden items-start">
            {/* Left: Characters + Input */}
            <div className="flex flex-col overflow-hidden">
              {/* Characters */}
              <div className="mb-3 rounded-lg border border-border bg-card p-3 shrink-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Characters</span>
                </div>

                {/* Character thumbnails row */}
                <div className="mb-1 flex items-center gap-2">
                  {settings.shotType === 'establishing'
                    ? // 에스타블리싱 샷일 때: A 포함 전부 + 버튼 모양, 클릭해도 추가되지 않음
                      ['a', 'b', 'c', 'd'].map(slot => (
                        <button
                          key={slot}
                          tabIndex={-1}
                          className="relative h-14 w-14 overflow-hidden bg-transparent focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
                        >
                          <img
                            src="/thumbnails/char-plus.webp"
                            alt="Add character disabled"
                            width={1}
                            height={1}
                            className="absolute inset-0 h-full w-full object-cover opacity-60"
                          />
                        </button>
                      ))
                    : ['a', 'b', 'c', 'd'].map((slot, index) => {
                        const char = characters[index];

                        // Slot filled with character
                        if (char) {
                          // 모든 슬롯(A~D): 클릭 시 해당 슬롯 토글(삭제)
                          return (
                            <button
                              key={char.id}
                              tabIndex={-1}
                              className="relative h-14 w-14 overflow-hidden bg-transparent focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
                              onClick={() => removeCharacter(char.id)}
                            >
                              <img
                                src={`/thumbnails/char-${slot}.webp`}
                                alt={char.name}
                                width={1}
                                height={1}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            </button>
                          );
                        }

                        // Empty slot shows plus image, 클릭 시 해당 슬롯까지 채우기
                        return (
                          <button
                            key={slot}
                            tabIndex={-1}
                            onClick={() => ensureCharacterAtIndex(index)}
                            className="relative h-14 w-14 overflow-hidden bg-transparent focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
                          >
                            <img
                              src="/thumbnails/char-plus.webp"
                              alt="Add character"
                              width={1}
                              height={1}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </button>
                        );
                      })}
                </div>
                {/* Character names with popover editor - aligned with slots A/B/C/D */}
                <div className="flex items-center gap-2">
                  {settings.shotType === 'establishing'
                    ? // 에스타블리싱 샷에서는 이름도 모두 비활성 자리만 유지
                      ['a', 'b', 'c', 'd'].map(slot => (
                        <div key={slot} className="h-5 w-14 text-xs text-center text-muted-foreground" />
                      ))
                    : ['a', 'b', 'c', 'd'].map((slot, index) => {
                        const char = characters[index];
                        if (!char) {
                          // 빈 슬롯은 이름 없이 자리만 유지 (썸네일 크기에 맞춰 폭 조정)
                          return <div key={slot} className="h-5 w-14 text-xs text-center text-muted-foreground" />;
                        }
                        return (
                          <Popover key={char.id}>
                            <PopoverTrigger asChild>
                              <button className="flex h-5 w-14 items-center justify-center gap-1 truncate text-xs text-center text-muted-foreground hover:text-foreground">
                                <span className="truncate max-w-full">{char.name || `Character ${slot.toUpperCase()}`}</span>
                                <Pencil className="h-3 w-3 shrink-0 text-muted-foreground -translate-y-px" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3 space-y-2">
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <Input
                                  value={char.name}
                                  onChange={e => updateCharacter(char.id, { name: e.target.value })}
                                  onBlur={e => {
                                    const value = e.target.value.trim();
                                    if (!value) {
                                      const fallback = CHARACTER_SLOT_NAMES[index] ?? `Character ${slot.toUpperCase()}`;
                                      updateCharacter(char.id, { name: fallback });
                                    }
                                  }}
                                  placeholder="Name"
                                  className="h-7 text-xs col-span-3"
                                />
                                <select
                                  value={char.gender}
                                  onChange={e => updateCharacter(char.id, { gender: e.target.value })}
                                  className="h-7 rounded-md border-2 border-border bg-input px-2 text-xs focus:outline-none focus:border-primary"
                                >
                                  <option value="">성별</option>
                                  <option value="male">남</option>
                                  <option value="female">여</option>
                                </select>
                                <Input
                                  type="number"
                                  value={char.age}
                                  onChange={e => updateCharacter(char.id, { age: e.target.value })}
                                  placeholder="Age"
                                  className="h-7 w-full text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  min="0"
                                  max="120"
                                />
                                <span className="self-center text-[10px] text-muted-foreground">세</span>
                                <Input
                                  value={char.clothing}
                                  onChange={e => updateCharacter(char.id, { clothing: e.target.value })}
                                  placeholder="Clothing"
                                  className="h-7 text-xs col-span-3"
                                />
                                <Input
                                  value={char.appearance}
                                  onChange={e => updateCharacter(char.id, { appearance: e.target.value })}
                                  placeholder="Appearance"
                                  className="h-7 text-xs col-span-3"
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                </div>
              </div>

              {/* Input */}
              {mode === 'image' ? (
                <Textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="언제 / 누가 / 무엇을 하는지 적어주세요⚡"
                  className="h-32 resize-none"
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <Textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="언제 / 누가 / 무엇을 하는지 적어주세요⚡"
                    className="h-24 resize-none"
                  />
                  <Textarea
                    value={videoDetailText}
                    onChange={e => setVideoDetailText(e.target.value)}
                    placeholder="이어지는 장면의 설명을 적어주세요⚡"
                    className="h-24 resize-none"
                  />
                </div>
              )}
              <Button onClick={handleGenerate} disabled={!(mode === 'video' ? (inputText.trim() || videoDetailText.trim()) : inputText.trim()) || isGenerating} className="mt-2 self-start gap-2 tracking-[0.02em]">
                <Sparkles className="h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
              {/* 실시간 설정 설명 박스 */}
              <div className="mt-3 w-full rounded-md border border-border bg-card/60 p-3 text-sm text-muted-foreground">
                <div className="mb-2 font-semibold text-foreground text-base">
                  <span className="mr-1 text-base">🎬</span>
                  <span>어떤 장면이 필요한가요?</span>
                </div>
                {selectedFOV && FOV_EXPLANATIONS[selectedFOV.id] && (
                  <p className="mb-1 text-[13px]">
                    <span className="font-semibold text-foreground">
                      {FOV_EXPLANATIONS[selectedFOV.id].title.trim()}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {FOV_EXPLANATIONS[selectedFOV.id].body.trim()}
                    </span>
                  </p>
                )}
                {selectedGenre && GENRE_EXPLANATIONS[selectedGenre.id] && (
                  <p className="mb-1 text-[13px]">
                    <span className="font-semibold text-foreground">
                      {GENRE_EXPLANATIONS[selectedGenre.id].title.trim()}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {GENRE_EXPLANATIONS[selectedGenre.id].body.trim()}
                    </span>
                  </p>
                )}
                {selectedShot && SHOT_EXPLANATIONS[selectedShot.id] && (
                  <p className="mb-1 text-[13px]">
                    <span className="font-semibold text-foreground">
                      {SHOT_EXPLANATIONS[selectedShot.id].title.trim()}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {SHOT_EXPLANATIONS[selectedShot.id].body.trim()}
                    </span>
                  </p>
                )}
                {selectedAngle && ANGLE_EXPLANATIONS[selectedAngle.id] && (
                  <p className="mb-1 text-[13px]">
                    <span className="font-semibold text-foreground">
                      {ANGLE_EXPLANATIONS[selectedAngle.id].title.trim()}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {ANGLE_EXPLANATIONS[selectedAngle.id].body.trim()}
                    </span>
                  </p>
                )}
                {mode === 'video' && selectedMovement && MOVEMENT_EXPLANATIONS[selectedMovement.id] && (
                  <p className="mb-1 text-[13px]">
                    <span className="font-semibold text-foreground">
                      {MOVEMENT_EXPLANATIONS[selectedMovement.id].title.trim()}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {MOVEMENT_EXPLANATIONS[selectedMovement.id].body.trim()}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Right: Output - align top with Characters */}
            <div className="relative flex flex-col overflow-hidden min-h-full">
              <div className="flex-1 flex flex-col min-h-[480px] overflow-hidden rounded-md border border-border bg-card">
                <div className="flex-1 overflow-auto p-3 min-h-0">
                  {outputText ? (
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                      {outputText}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Generated prompt will appear here...
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1 shrink-0 p-2 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!outputText} className="h-6 gap-1 px-2 text-xs">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="h-6 gap-1 px-2 text-xs">
                    <History className="h-3 w-3" />{history.length}
                  </Button>
                </div>
              </div>

              {/* History Overlay */}
              {showHistory && (
                <div
                  className="absolute inset-0 z-10 flex items-stretch justify-stretch bg-black/20"
                  onClick={() => setShowHistory(false)}
                >
                  <div
                    className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl animate-in slide-in-from-right duration-300"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">History</span>
                        {history.some(h => h.isFavorite) && (
                          <Star className="h-4 w-4 text-primary fill-current" />
                        )}
                      </div>
                      <button onClick={() => setShowHistory(false)} className="rounded-md p-1 hover:bg-secondary">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {history.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center">
                          <History className="h-10 w-10 text-muted-foreground/30" />
                          <p className="mt-3 text-sm text-muted-foreground">No history yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {history.map(item => (
                            <div
                              key={item.id}
                              className="group cursor-pointer p-4 hover:bg-secondary/30"
                              onClick={() => {
                                setOutputText(item.outputEnglish);
                                setShowHistory(false);
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="line-clamp-1 text-xs text-muted-foreground flex-1">
                                  {item.inputKorean}
                                </p>
                                {item.isFavorite && (
                                  <Star className="h-3 w-3 text-primary fill-current shrink-0" />
                                )}
                              </div>
                              <p className="mt-1 line-clamp-2 font-mono text-sm">{item.outputEnglish}</p>
                              <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100">
                                <button
                                  className={cn('p-1 rounded', item.isFavorite && 'text-primary')}
                                  onClick={e => {
                                    e.stopPropagation();
                                    const updated = toggleFavorite(item.id).sort(
                                      (a, b) => Number(b.isFavorite) - Number(a.isFavorite)
                                    );
                                    setHistory(updated);
                                  }}
                                >
                                  <Star className={cn('h-4 w-4', item.isFavorite && 'fill-current')} />
                                </button>
                                <button
                                  className="p-1 rounded text-muted-foreground hover:text-destructive"
                                  onClick={e => {
                                    e.stopPropagation();
                                    const updated = deleteHistoryItem(item.id);
                                    setHistory(updated);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - 통합 하단 */}
      <footer className="shrink-0 border-t border-border bg-card px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="hover:text-foreground">
                개인정보처리방침
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] max-w-xl max-h-[80vh] overflow-hidden flex flex-col p-0" side="bottom">
              <div className="p-4 border-b border-border shrink-0">
                <h2 className="text-sm font-semibold">개인정보처리방침</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">최종 업데이트: 2026-03-16</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 text-[11px] space-y-3">
                <p>Promman(이하 &quot;본 서비스&quot;)은 「개인정보 보호법」 등 관련 법령과 Google AdSense 정책을 준수하며, 이용자의 개인정보를 최소한으로 수집·이용합니다.</p>
                <section>
                  <h3 className="font-semibold text-foreground">1. 개인정보의 처리 목적</h3>
                  <p className="mt-1">서비스 제공 및 품질 향상, 광고 제공(Google AdSense) 등 명시된 목적 이외의 용도로는 이용하지 않습니다.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">2. 수집하는 개인정보 항목</h3>
                  <p className="mt-1">회원가입 절차를 운영하지 않으며, IP 주소·접속 로그·브라우저 정보·쿠키 등이 자동 수집·처리될 수 있습니다.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">3. 제3자 제공 및 처리 위탁</h3>
                  <p className="mt-1">원칙적으로 제3자에게 판매하거나 임의 제공하지 않습니다. Google AdSense를 통해 Google이 쿠키·광고 ID·방문 기록 등을 수집·이용할 수 있습니다.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">4. Google AdSense 관련</h3>
                  <p className="mt-1">맞춤 광고 제공을 위해 쿠키를 사용합니다. Google 광고 설정 페이지에서 맞춤 광고 노출을 관리하거나 거부할 수 있습니다.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">5. 쿠키 사용 및 거부 방법</h3>
                  <p className="mt-1">브라우저 설정에서 쿠키 저장 거부·삭제 가능합니다. (Chrome, Safari, Edge 등 각 설정 메뉴 참고)</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">6. 이용자의 권리</h3>
                  <p className="mt-1">열람·정정·삭제·처리 정지 등을 요청할 수 있으며, 직접 수집하는 식별 정보는 없습니다.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">7. 개인정보 보호책임자 및 문의처</h3>
                  <p className="mt-1">개인정보 보호책임자: yeonho ju · juuuje1@gmail.com</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground">8. 개인정보처리방침의 변경</h3>
                  <p className="mt-1">법령·정책 변경 시 수정될 수 있으며, 중요한 변경 시 서비스 내 공지로 안내합니다. 최신 버전은 본 페이지에서 확인할 수 있습니다.</p>
                </section>
              </div>
              <div className="p-3 border-t border-border shrink-0 flex justify-end">
                <a href="https://www.promman.com/privacy.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs inline-flex items-center gap-1">
                  전문 보기 <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </PopoverContent>
          </Popover>
          <span>Copyright © 2026 Promman</span>
        </div>
      </footer>
    </div>
  );
}
