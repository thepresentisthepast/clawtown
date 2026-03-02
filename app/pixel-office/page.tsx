'use client'

import { useEffect } from 'react'
import Script from 'next/script'

export default function PixelOfficePage() {
  useEffect(() => {
    // Initialize game when window is ready
    if (typeof window !== 'undefined' && (window as any).initGame) {
      (window as any).initGame()
    }
  }, [])

  return (
    <div className="w-full h-screen bg-[#0f0f1a] overflow-hidden">
      {/* 加载 Phaser.js */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js"
        strategy="beforeInteractive"
      />
      
      {/* 加载 layout.js */}
      <Script src="/star-office/layout.js" strategy="beforeInteractive" />
      
      {/* 加载 game.js */}
      <Script 
        src="/star-office/game.js" 
        strategy="afterInteractive" 
        onLoad={() => {
          if (typeof window !== 'undefined' && (window as any).initGame) {
            (window as any).initGame()
          }
        }}
      />
      
      {/* 游戏容器 */}
      <div id="game-container" className="w-full h-full"></div>
      
      {/* 加载遮罩 */}
      <div 
        id="loading-overlay" 
        className="absolute inset-0 bg-[#0f0f1a] flex items-center justify-center z-50"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div className="text-center">
          <div 
            id="loading-progress-container" 
            className="w-64 h-4 bg-gray-700 rounded-full overflow-hidden mb-4"
          >
            <div 
              id="loading-progress-bar" 
              className="h-full bg-yellow-400 transition-all duration-200" 
              style={{ width: '0%' }}
            ></div>
          </div>
          <div 
            id="loading-text" 
            className="text-yellow-400 text-sm"
          >
            正在加载 Star 的像素办公室...
          </div>
        </div>
      </div>
    </div>
  )
}
