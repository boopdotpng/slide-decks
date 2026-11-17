import{r as e}from"./preact.module.Bl7PEaKa.js";import{i as t,t as n}from"./hooks.module.BNbONuGS.js";import{n as r,t as i}from"./jsxRuntime.module.C3VZDa9b.js";import{i as a,n as o,t as s}from"./image.JmJtW1sF.js";var c=22,l=3,u=2,d=2912,f=Array.from(s.slice(d,d+32)),p=5,m=e=>`rgb(${e},${e},${e})`,h=e=>e>100?`rgb(0,0,0)`:`rgb(235,235,235)`,g=[`load my pixel`,`× ${u}`,`cap at 255`,`store`],_=f.map(e=>e*u),v=_.map(e=>Math.min(e,255));_.filter(e=>e>255).length;var y=[{wave:!1,op:-1,vals:[],stored:!1,text:i(e,{children:[`a `,i(`b`,{children:`thread`}),`: its number `,i(`code`,{children:`i`}),`, its pixel, four steps`]})},{wave:!1,op:-1,vals:[],stored:!1,text:i(e,{children:[`32 neighbouring threads share one stream of instructions: a `,i(`b`,{children:`warp`})]})},{wave:!0,op:0,vals:f,stored:!1,text:i(e,{children:[i(`b`,{children:`load`}),`: one instruction, 32 different pixels`]})},{wave:!0,op:2,vals:v,stored:!1,text:i(e,{children:[i(`b`,{children:[`× `,u]}),`, `,i(`b`,{children:`cap`}),`: one instruction each, 32 lanes at once`]})},{wave:!0,op:3,vals:v,stored:!0,text:i(e,{children:[i(`b`,{children:`store`}),`: 32 pixels done. the whole photo is `,o/32,` warps doing exactly this`]})}];function b(){let e=n(null),o=n(null),c=Math.min(y.length-1,r(e)),l=y[c],_=l.stored;t(()=>{let e=Uint8Array.from(s);if(_)for(let t=0;t<32;t++)e[d+t]=v[t];a(o.current,e)},[_]);let b=Array.from(s.slice(2816,2944),(e,t)=>_&&Math.floor(t/32)===3?v[t-96]:e);return i(`div`,{class:`wave`,ref:e,children:[i(`div`,{class:`wv-top`,children:[i(`div`,{class:`wv-photo`,children:[i(`canvas`,{ref:o}),i(`i`,{class:`wv-band`,style:{top:`${22/80*100}%`,height:`${100/80}%`}}),i(`i`,{class:`wv-seg fade ${c>=1?`on`:``}`,style:{top:`${22/80*100}%`,height:`${100/80}%`,left:`75%`,width:`25%`}})]}),i(`div`,{class:`wv-row`,children:[i(`div`,{class:`muted wv-t`,children:[`row `,22,`: `,128,` pixels, one thread each`]}),i(`div`,{class:`wv-strip`,children:b.map((e,t)=>i(`i`,{style:{background:m(e)},class:c>=1&&Math.floor(t/32)===3?`in`:``}))}),i(`div`,{class:`wv-waves fade ${c>=1?`on`:``}`,children:[0,1,2,3].map(e=>i(`span`,{class:e===3?`cur`:``,children:[`warp `,e]}))})]})]}),l.wave?i(`div`,{class:`wv-lanes`,children:[i(`ol`,{class:`wv-ops`,children:g.map((e,t)=>i(`li`,{class:t===l.op?`cur`:t<l.op?`past`:``,children:e}))}),i(`div`,{class:`wv-grid`,children:[i(`span`,{class:`wv-n muted`,children:`lane`}),f.map((e,t)=>i(`span`,{class:`wv-h`,children:t})),i(`span`,{class:`wv-n`,children:`p`}),l.vals.map((e,t)=>i(`span`,{class:`wv-c ${l.stored?``:`new`} ${e!=null&&e>255?`over`:``}`,style:e==null?{}:{background:m(Math.min(e,255)),color:h(Math.min(e,255))},children:e},`${c}-${t}`)),i(`span`,{}),i(`span`,{class:`wv-foot muted`,children:[`lane k is thread `,d,` + k: one register, 32 values, one per lane`]})]})]}):i(`div`,{class:`wv-thread`,children:[i(`div`,{class:`wv-card`,children:[i(`div`,{class:`wv-ct`,children:[`thread `,i(`b`,{children:d+p})]}),i(`div`,{class:`wv-regs`,children:[i(`span`,{children:[i(`span`,{class:`muted`,children:`i`}),` `,d+p]}),i(`span`,{children:[i(`span`,{class:`muted`,children:`p`}),` `,i(`i`,{class:`wv-sw`,style:{background:m(f[p])}}),` `,f[p],` → `,Math.min(f[p]*u,255)]})]})]}),i(`ol`,{class:`wv-ops`,children:g.map(e=>i(`li`,{children:e}))})]}),i(`div`,{class:`caption wv-text`,children:l.text}),i(`style`,{children:`
        .wave .wv-top { display: flex; gap: 1.6em; align-items: center; }
        .wave .wv-photo { position: relative; flex: none; }
        .wave canvas { display: block; width: 256px; height: 160px; image-rendering: pixelated; border-radius: 4px; }
        .wave .wv-band { position: absolute; left: -6px; right: -6px; box-shadow: 0 0 0 1.5px var(--accent); }
        .wave .wv-seg { position: absolute; box-shadow: 0 0 0 2.5px var(--hot); }
        .wave .wv-row { flex: 1; min-width: 0; }
        .wave .wv-t { font-size: .48em; margin-bottom: .3em; }
        .wave .wv-strip { outline: 1px solid var(--line); display: grid; grid-template-columns: repeat(128, 1fr); height: 44px; border-radius: 4px; overflow: hidden; }
        .wave .wv-strip i { transition: background .4s; }
        .wave .wv-strip i.in { box-shadow: inset 0 -4px 0 var(--hot); }
        .wave .wv-waves { display: grid; grid-template-columns: repeat(4, 1fr); font-size: .46em; margin-top: .25em; }
        .wave .wv-waves span { border-left: 2px solid var(--line-2); padding-left: .4em; color: var(--muted); }
        .wave .wv-waves span.cur { color: var(--hot); border-color: var(--hot); }
        .wave .wv-thread { display: flex; gap: 2.4em; align-items: center; margin-top: 1.2em; min-height: 7.2em; }
        .wave .wv-card { background: var(--panel); border: 1px solid var(--accent); border-radius: 12px; padding: .6em 1em; font-size: .62em; }
        .wave .wv-ct { margin-bottom: .4em; }
        .wave .wv-regs { display: flex; flex-direction: column; gap: .3em; font-family: var(--mono); }
        .wave .wv-sw { display: inline-block; width: .9em; height: .9em; border-radius: 2px; vertical-align: -.1em; box-shadow: 0 0 0 1px var(--line-2); }
        .wave .wv-ops { font-size: .56em; margin: 0; padding-left: 1.3em; }
        .wave .wv-ops li { margin: .15em 0; color: var(--fg); transition: color .3s; }
        .wave .wv-lanes .wv-ops li { color: var(--muted); }
        .wave .wv-lanes .wv-ops li.past { color: var(--fg); }
        .wave .wv-lanes .wv-ops li.cur { color: var(--hot); font-weight: 700; }
        .wave .wv-lanes { display: flex; gap: 1.4em; align-items: center; margin-top: 1.2em; min-height: 7.2em; }
        .wave .wv-lanes .wv-ops { flex: none; width: 8.4em; white-space: nowrap; }
        .wave .wv-grid { flex: 1; display: grid; grid-template-columns: 2.4em repeat(32, 1fr); gap: 3px; font-family: var(--mono); align-items: center; }
        .wave .wv-n { font-size: .5em; }
        .wave .wv-h { font-size: .36em; color: var(--muted); text-align: center; }
        .wave .wv-foot { grid-column: 2 / -1; font: .4em var(--sans); margin-top: .3em; }
        .wave .wv-c { font-size: .4em; text-align: center; border-radius: 4px; padding: .5em 0; background: var(--surface); outline: 1px solid var(--line); outline-offset: -1px; }
        .wave .wv-c.over { outline: 2px solid var(--bad); }
        .wave .wv-c.new { animation: wv-pop .5s ease-out; }
        @keyframes wv-pop { from { box-shadow: 0 0 0 2px var(--hot); } to { box-shadow: 0 0 0 2px transparent; } }
        .wave .wv-text { font-size: .78em; min-height: 3.2em; margin-top: 1em; }
      `})]})}export{c as ROW,l as WV,b as default,m as gray,h as ink};