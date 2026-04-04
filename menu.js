'use strict';

// Spawn a few tiny floating bubbles into the background for ambiance
(function spawnAmbientBubbles() {
  const COLORS = [
    'rgba(61,214,245,0.18)', 'rgba(168,139,250,0.18)',
    'rgba(251,191,36,0.14)', 'rgba(249,115,143,0.16)',
  ];

  function makeBubble() {
    const el  = document.createElement('div');
    const size = 20 + Math.random() * 60;
    const left = Math.random() * 100;
    const dur  = 8 + Math.random() * 10;
    const del  = Math.random() * 8;
    const col  = COLORS[Math.floor(Math.random() * COLORS.length)];

    Object.assign(el.style, {
      position:     'fixed',
      bottom:       '-80px',
      left:         `${left}vw`,
      width:        `${size}px`,
      height:       `${size}px`,
      borderRadius: '50%',
      background:   col,
      border:       `1.5px solid ${col.replace(/[\d.]+\)$/, '0.5)')}`,
      pointerEvents:'none',
      zIndex:       '0',
      animation:    `rise ${dur}s ${del}s ease-in infinite`,
    });

    document.body.appendChild(el);
  }

  // Inject keyframes once
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rise {
      0%   { transform: translateY(0)     translateX(0)    scale(1);   opacity: 0;   }
      10%  { opacity: 1; }
      50%  { transform: translateY(-45vh) translateX(15px) scale(1.05); }
      100% { transform: translateY(-105vh) translateX(-10px) scale(0.9); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  for (let i = 0; i < 14; i++) makeBubble();
})();
