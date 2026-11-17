import{r as e}from"./preact.module.Bl7PEaKa.js";import{t}from"./hooks.module.BNbONuGS.js";import{n,t as r}from"./hooks.5GiSEWoZ.js";import{n as i,t as a}from"./mm.DZjFDrd_.js";var o=4,s=1,c=1,l=4,u=12,d=12,f=16,p=[{t:-1,phase:`none`,text:n(e,{children:`one block works out one 16 × 16 square of C. for that it needs these 16 rows of A and 16 columns of B`})},{t:0,phase:`load`,text:n(e,{children:[n(`b`,{children:`step 1, load`}),`: the 256 threads each copy one number into `,n(`b`,{children:`shared memory`}),`, a small, fast memory inside the block`]})},{t:0,phase:`use`,text:n(e,{children:[n(`b`,{children:`step 2, use`}),`: multiply using only the fast copies. every number copied gets used 16 times`]})},{t:1,phase:`load`,text:n(e,{children:`move one tile over and do it again, adding onto the same answers`})},{t:3,phase:`done`,text:n(e,{children:`after the last tile, the answers are done: the same C as solution 1`})},{t:3,phase:`done`,text:n(e,{children:[`each number now comes from slow main memory `,n(`b`,{children:`once per block`}),`, not 16 times`]})}];function m(){let e=t(null),m=p[Math.min(p.length-1,r(e))],h=e=>Math.floor(e/o),g=e=>m.phase!==`none`&&h(e)===m.t&&m.phase!==`done`?`in`:h(e)<=m.t?`used`:`rest`,_=m.phase===`none`?0:m.phase===`done`?l:m.t+ +(m.phase===`use`),v=m.phase===`load`||m.phase===`use`;return n(`div`,{class:`tiles`,ref:e,children:[n(`div`,{class:`tl-cols`,children:[n(a,{m:u,n:f,k:d,cell:18,names:[`A`,`B`,`C`],a:(e,t)=>h(e)===s?g(t):``,b:(e,t)=>h(t)===c?g(e):``,c:(e,t)=>h(e)===s&&h(t)===c?_===l?`out`:`blk`:``}),n(`div`,{class:`tl-side`,children:[n(`div`,{class:`muted tl-cap`,children:`shared memory (this block only)`}),n(`div`,{class:`tl-sh`,children:[`As`,`Bs`].map(e=>n(`div`,{class:`tl-m`,children:[n(`div`,{class:`tl-g ${v?`in`:``} ${m.phase===`use`?`use`:``}`,children:Array.from({length:16},()=>n(`i`,{}))}),n(`div`,{class:`tl-n`,children:[e,v?` · tile ${m.t}`:``]})]}))}),n(`div`,{class:`tl-prog`,children:[n(`div`,{class:`muted tl-cap`,children:[`the block's sums: `,_,` of `,l,` tiles added`]}),n(`div`,{class:`tl-bar`,children:Array.from({length:l},(e,t)=>n(`i`,{class:t<_?`on`:``}))})]})]})]}),n(`div`,{class:`caption tl-text`,children:m.text}),n(`style`,{children:i+`
        .tiles .tl-cols { display: flex; gap: 3em; align-items: center; justify-content: center; }
        .tiles .mm-g i.rest { background: color-mix(in srgb, var(--accent) 14%, var(--surface)); }
        .tiles .mm-g i.in { background: var(--accent); }
        .tiles .mm-g i.used { background: color-mix(in srgb, var(--accent) 40%, var(--surface)); box-shadow: inset 0 0 0 1px var(--accent); }
        .tiles .mm-g i.blk { background: color-mix(in srgb, var(--hot) 35%, var(--surface)); }
        .tiles .mm-g i.out { background: var(--hot); }
        .tiles .mm-g { gap: 1px; }
        .tiles .tl-side { display: grid; gap: 1.4em; min-width: 9em; }
        .tiles .tl-cap { font-size: .42em; margin-bottom: .5em; }
        .tiles .tl-sh { display: flex; gap: 1em; padding: .6em; border: 2px dashed var(--line-2); border-radius: 8px; }
        .tiles .tl-m { display: flex; flex-direction: column; align-items: center; }
        .tiles .tl-g { display: grid; grid-template-columns: repeat(${o}, 26px); grid-auto-rows: 26px; gap: 2px; }
        .tiles .tl-g i { background: var(--surface); border-radius: 2px; transition: background .3s, box-shadow .3s; }
        .tiles .tl-g.in i { background: var(--accent); }
        .tiles .tl-g.use i { box-shadow: inset 0 0 0 2px var(--fg); }
        .tiles .tl-n { font: .4em var(--mono); color: var(--muted); margin-top: .4em; }
        .tiles .tl-bar { display: grid; grid-template-columns: repeat(${l}, 1fr); gap: 4px; height: 18px; }
        .tiles .tl-bar i { background: var(--surface); border-radius: 3px; transition: background .3s; }
        .tiles .tl-bar i.on { background: var(--hot); }
        .tiles .tl-text { font-size: .8em; min-height: 2.4em; margin-top: 1.2em; text-align: center; }
      `})]})}export{m as default};