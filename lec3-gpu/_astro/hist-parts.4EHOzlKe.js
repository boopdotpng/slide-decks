import{a as e,t}from"./hooks.module.U3JihANK.js";import{o as n}from"./hooks.CTQS5bFp.js";import{c as r,r as i}from"./image.CiJbjrhy.js";function a({img:a=i,label:o,class:s=``}){let c=t(null);return e(()=>r(c.current,a),[a]),n(`figure`,{class:`hp-photo ${s}`,children:[n(`canvas`,{ref:c}),o&&n(`figcaption`,{children:o}),n(`style`,{children:`
        .hp-photo { margin: 0; }
        .hp-photo canvas { display: block; width: 100%; image-rendering: pixelated; border-radius: 6px; aspect-ratio: 128 / 80; }
        .hp-photo figcaption { font-size: .5em; color: var(--muted); margin-top: .3em; }
      `})]})}function o({bins:e,ghost:t,marks:r=[],ymax:i,height:a=220,hl:o,axis:s=!0,cls:c=`accent`}){let l=1024,u=a,d=i??Math.max(...e,...t??[],1),f=e=>u-(u-34)*Math.min(1,e/d);return n(`svg`,{class:`hc`,viewBox:`0 0 ${l} ${u+(s?34:4)}`,children:[t?.map((e,t)=>e>0&&n(`rect`,{x:t*4,y:f(e),width:3.4,height:u-f(e),class:`ghost`})),e.map((e,t)=>e>0&&n(`rect`,{x:t*4,y:f(e),width:3.4,height:u-f(e),class:`bar ${c} ${o&&t>=o[0]&&t<=o[1]?`lit`:``}`})),n(`line`,{x1:0,y1:u+1,x2:l,y2:u+1,class:`base`}),s&&[0,64,128,192,255].map(e=>n(`text`,{x:e*4+1.7,y:u+26,"text-anchor":e===0?`start`:e===255?`end`:`middle`,class:`ax`,children:e})),r.map(e=>n(`g`,{class:`mk ${e.cls??`hot`}`,children:[n(`line`,{x1:e.v*4+1.7,y1:28,x2:e.v*4+1.7,y2:u}),n(`text`,{x:e.v*4+(e.v>200?-6:8),y:22,"text-anchor":e.v>200?`end`:`start`,children:e.label})]})),n(`style`,{children:`
        .hc { display: block; width: 100%; overflow: visible; }
        .hc .bar { fill: var(--accent); transition: y .5s, height .5s, fill .3s; }
        .hc .bar.bad { fill: var(--bad); } .hc .bar.good { fill: var(--good); } .hc .bar.purple { fill: var(--purple); }
        .hc .bar.lit { fill: var(--hot); }
        .hc .ghost { fill: none; stroke: var(--muted); stroke-width: 1; stroke-dasharray: 2 2; }
        .hc .base { stroke: var(--line-2); stroke-width: 2; }
        .hc .ax { fill: var(--muted); font: 20px var(--mono); }
        .hc .mk line { stroke-width: 2.5; stroke-dasharray: 6 4; }
        .hc .mk text { font: 600 22px var(--sans); }
        .hc .mk.hot line { stroke: var(--hot); } .hc .mk.hot text { fill: var(--hot); }
        .hc .mk.good line { stroke: var(--good); } .hc .mk.good text { fill: var(--good); }
        .hc .mk.bad line { stroke: var(--bad); } .hc .mk.bad text { fill: var(--bad); }
        .hc .mk.accent line { stroke: var(--accent); } .hc .mk.accent text { fill: var(--accent); }
      `})]})}function s(e,t){let n=Array(256).fill(0);for(let r=e;r<Math.min(t,i.length);r++)n[i[r]]++;return n}var c=e=>e.reduce((e,t)=>e+t,0),l=e=>e.toLocaleString(`en-US`),u=4096;export{l as a,s as i,u as n,c as o,a as r,o as t};