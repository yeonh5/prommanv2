import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'Promman - AI 시네마토그래피 프롬프트 엔진',
  description: '한국어 아이디어를 영어 AI 영상/이미지 프롬프트로 변환하는 도구',
};

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} bg-background text-foreground font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

