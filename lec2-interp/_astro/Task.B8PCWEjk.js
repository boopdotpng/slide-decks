import{r as e}from"./preact.module.Bl7PEaKa.js";import{t}from"./hooks.module.BNbONuGS.js";import{n,t as r}from"./roles.Ca55homO.js";var i=e=>r(`b`,{class:`q`,children:e}),a=e=>r(`b`,{class:`v`,children:e}),o={8:`q`,9:`q`,2:`q`,4:`q`,3:`v`,5:`v`},s=[[8,2,`q`],[9,4,`q`],[3,9,`v`],[5,9,`v`]],c=t=>[{marks:o,arcs:s,say:r(e,{children:[`look up `,i(`f`),` → `,a(`5`),` and `,i(`c`),` → `,a(`9`),`, bring both to the end`]})},{marks:o,arcs:s,say:t}],l={digit:{input:`qwdk7mzpa`,answer:`7`,phases:[{marks:{4:`v`},arcs:[],say:r(e,{children:[`spot the digit: `,a(`7`)]})},{marks:{4:`v`},arcs:[[4,8,`v`]],say:r(e,{children:[`only the last position answers, so the `,a(`7`),` has to get there`]})}]},lookup:{input:`a2f5c9d3f`,answer:`5`,phases:[{marks:{8:`q`},arcs:[],say:r(e,{children:[`query: `,i(`f`)]})},{marks:{8:`q`,2:`q`},arcs:[[8,2,`q`]],say:r(e,{children:[`find the key `,i(`f`)]})},{marks:{8:`q`,2:`q`,3:`v`},arcs:[[8,2,`q`],[3,8,`v`]],say:r(e,{children:[`copy the digit after it: `,a(`5`)]})}]},sum:{input:`a2f5c9d3fc`,answer:`4`,phases:c(r(e,{children:[`add: `,a(`5`),` + `,a(`9`),` = 14 → `,a(`4`)]}))},diff:{input:`a2f5c9d3fc`,answer:`6`,phases:c(r(e,{children:[`subtract: `,a(`5`),` − `,a(`9`),` = −4, and −4 mod 10 = `,a(`6`)]}))}},u=92,d=80,f=88,p=80,m=e=>e*u+d/2,h=([e,t,n])=>{let r=10+Math.abs(e-t)*8;if(n===`q`)return`M ${m(e)} 76 C ${m(e)} ${76-r}, ${m(t)} ${76-r}, ${m(t)} 76`;let i=Math.min(r,62)*1.3;return`M ${m(e)} 172 C ${m(e)} ${172+i}, ${m(t)} ${172+i}, ${m(t)} 172`},g=([e,t,n])=>`${e}-${t}-${n}`;function _({task:e}){let i=t(null),a=n(i),o=l[e],s=o.input.length,c=a>0?o.phases[Math.min(a,o.phases.length)-1]:{marks:{},arcs:[],say:``},m=a>=o.phases.length,_=[...new Map(o.phases.flatMap(e=>e.arcs).map(e=>[g(e),e])).values()],v=new Set(c.arcs.map(g));return r(`div`,{class:`task`,ref:i,children:[r(`div`,{class:`line`,children:[r(`div`,{class:`seq`,style:{width:`${s*u}px`},children:[r(`svg`,{width:s*u,height:238,children:[r(`defs`,{children:[`q`,`v`].map(t=>r(`marker`,{id:`task-${e}-${t}`,viewBox:`0 0 10 10`,refX:`8`,refY:`5`,markerWidth:`5`,markerHeight:`5`,orient:`auto-start-reverse`,children:r(`path`,{d:`M 0 0 L 10 5 L 0 10 z`,class:`head ${t}`})}))}),_.map(t=>r(`path`,{d:h(t),pathLength:1,class:`arc ${t[2]} ${v.has(g(t))?`on`:``}`,"marker-end":`url(#task-${e}-${t[2]})`}))]}),r(`div`,{class:`toks`,children:[...o.input].map((e,t)=>r(`span`,{class:`c ${/\d/.test(e)?`dg`:``} ${c.marks[t]??``}`,children:e}))})]}),r(`span`,{class:`to`,children:`→`}),r(`span`,{class:`c out ${m?`on`:``}`,children:m?o.answer:`?`})]}),r(`ol`,{class:`work`,children:o.phases.map((e,t)=>r(`li`,{class:`fade ${a>t?`on`:``} ${a===t+1?`now`:``}`,children:e.say}))}),r(`style`,{children:`
        .task { display: flex; flex-direction: column; gap: 1em; margin-top: .2em; }
        .task .line { display: flex; align-items: flex-start; gap: .6em; }
        .task .line > .to, .task .line > .out { margin-top: ${p}px; }
        .task .line > .to { line-height: ${f}px; }
        .task .seq { position: relative; height: 238px; }
        .task .seq svg { position: absolute; inset: 0; overflow: visible; }
        .task .toks { position: absolute; top: ${p}px; display: flex; gap: 12px; }
        .task .c { position: relative; width: ${d}px; height: ${f}px; display: grid; place-items: center; border-radius: 9px;
          font-family: var(--mono); font-size: 1.4em; background: var(--panel); border: 1px solid var(--border);
          transition: background .3s, border-color .3s, color .3s; }
        .task .c.dg { color: var(--digit); }
        .task .c.q { border-color: var(--attn); background: color-mix(in srgb, var(--attn) 18%, transparent); color: var(--attn); }
        .task .c.v { border-color: var(--digit); background: color-mix(in srgb, var(--digit) 16%, transparent); color: var(--digit); }
        .task .to { color: var(--muted); font-size: 1.4em; margin: 0 .2em; }
        .task .c.out { color: var(--muted); border-style: dashed; }
        .task .c.out.on { color: var(--answer); border: 2px solid var(--answer); background: color-mix(in srgb, var(--answer) 16%, transparent); }
        .task .work { margin: 0; padding-left: 1.2em; display: flex; flex-direction: column; gap: .35em; font-size: .8em; }
        .task .work li { transition: opacity .35s; }
        .task .work li.on:not(.now) { opacity: .55; }
        .task b.q { color: var(--attn); font-family: var(--mono); }
        .task b.v { color: var(--digit); font-family: var(--mono); }
        .task .arc { fill: none; stroke-width: 3; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; transition: stroke-dashoffset .6s ease, opacity .2s; }
        .task .arc.on { stroke-dashoffset: 0; opacity: 1; }
        .task .arc.q { stroke: var(--attn); } .task .arc.v { stroke: var(--digit); }
        .task .head.q { fill: var(--attn); } .task .head.v { fill: var(--digit); }
      `})]})}export{_ as default};