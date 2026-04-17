/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect } from 'react';
import Script from 'next/script';

interface MetaPixelProps {
  pixelId: string;
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export default function MetaPixel({ pixelId }: MetaPixelProps) {
  useEffect(() => {
    // Initialize pixel after it loads
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  }, [pixelId]);

  if (!pixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Utility function to track custom events
export const trackMetaEvent = (eventName: string, data?: object) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data);
  }
};

// Utility function to track custom conversions
export const trackMetaCustomEvent = (eventName: string, data?: object) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, data);
  }
};
