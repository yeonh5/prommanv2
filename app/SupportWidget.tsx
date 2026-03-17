'use client';

import Script from 'next/script';

export function SupportWidget() {
  return (
    <>
      <Script
        src="https://storage.ko-fi.com/cdn/widget/Widget_2.js"
        strategy="afterInteractive"
      />
      <Script id="kofi-init" strategy="afterInteractive">
        {`
          if (typeof kofiwidget2 !== 'undefined') {
            kofiwidget2.init('후원하기', '3B82F6', 'Q5Q51W3GLT');
            kofiwidget2.draw();
          }
        `}
      </Script>
    </>
  );
}

