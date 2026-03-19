import './globals.css'
import type { Metadata } from 'next'
import { ReactNode } from 'react'
import HealthOverlay from '../components/HealthOverlay'
import HydrationFlag from '../components/HydrationFlag'

export const metadata: Metadata = {
  title: 'AI Roleplay Simulator',
  description: 'Practice spoken English with AI characters'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
        <HealthOverlay />
        <HydrationFlag />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                function showBanner(text, bg, fg){
                  var d=document.createElement('div');
                  d.style.position='fixed';
                  d.style.top='0';
                  d.style.left='0';
                  d.style.right='0';
                  d.style.zIndex='9999';
                  d.style.padding='8px 12px';
                  d.style.textAlign='center';
                  d.style.background=bg;
                  d.style.color=fg;
                  d.style.fontSize='14px';
                  d.textContent=text;
                  document.body.appendChild(d);
                }
                function check(){
                  if(!window.__APP_HYDRATED__){
                    showBanner('前端脚本未加载，请按 Ctrl+F5 强刷或禁用前端插件后重试', '#7f1d1d', '#fee2e2');
                  }
                }
                setTimeout(check, 2000);
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}
