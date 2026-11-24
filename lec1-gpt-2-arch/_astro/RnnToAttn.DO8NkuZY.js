import{b as e,m as t,u as n}from"./viz.ZHEKlosV.js";import{r}from"./preact.module.Bl7PEaKa.js";import{t as i}from"./hooks.module.U3JihANK.js";var a=`To be, or not to be`,o=1400,s=60,c=1280/18,l=440,u=e=>s+e*c,d=(e,t)=>{let n=Math.abs(u(e)-u(t))*.3+15;return`M ${u(e)} 406 C ${u(e)} ${406-n}, ${u(t)} ${406-n}, ${u(t)} 406`},f=[n(r,{children:[`rnn: one strip of memory. `,n(`b`,{class:`o`,children:`T`}),` only reaches the end through 18 rewrites of it`]}),n(r,{children:[`instead: keep every character's strip. the newest one `,n(`b`,{children:`looks straight back`}),` and picks what it needs`]}),n(r,{children:`every position does this, all at the same time. nothing is handed along, nothing has to wait`}),n(r,{children:[`that's gpt-2. one strip per token, never overwritten, only `,n(`b`,{children:`added to`})]})];function p(){let r=i(null),s=e(r),c=[...a];return n(`div`,{class:`rta`,ref:r,children:[n(`svg`,{viewBox:`0 0 ${o} 480`,children:[n(`g`,{class:`chain ${s===0?`on`:``}`,children:t(18).map(e=>n(`path`,{d:`M ${u(e)+16} 430 L ${u(e+1)-16} 430`}))}),n(`g`,{class:`all ${s>=2?`on`:``}`,children:t(18).flatMap(e=>t(e).map(t=>n(`path`,{d:d(e,t)})))}),n(`g`,{class:`one ${s>=1?`on`:``}`,children:t(18).map(e=>n(`path`,{d:d(18,e)}))}),c.map((e,t)=>n(`text`,{x:u(t),y:l,class:`c ${e===` `?`sp`:``} ${t===18&&s>=1?`me`:``} ${t===0&&s===0?`first`:``}`,children:e===` `?`·`:e}))]}),n(`div`,{class:`cap`,children:f[Math.min(s,f.length-1)]}),n(`style`,{children:`
        .rta svg { width: 100%; display: block; overflow: visible; }
        .rta .c { font-family: var(--mono); font-size: 44px; fill: var(--fg); text-anchor: middle; transition: fill .3s; }
        .rta .c.sp { fill: var(--muted); }
        .rta .c.me { fill: var(--accent); font-weight: 700; }
        .rta .c.first { fill: var(--hot); font-weight: 700; }
        .rta path { fill: none; stroke-linecap: round; }
        .rta .chain path { stroke: var(--muted); stroke-width: 3; }
        .rta .chain { opacity: 0; transition: opacity .4s; }
        .rta .chain.on { opacity: 1; }
        .rta .one path { stroke: var(--accent); stroke-width: 3; }
        .rta .one { opacity: 0; transition: opacity .4s; }
        .rta .one.on { opacity: 1; }
        .rta .all path { stroke: var(--accent); stroke-width: 1.2; opacity: .18; }
        .rta .all { opacity: 0; transition: opacity .5s; }
        .rta .all.on { opacity: 1; }
        .rta .cap { font-size: .75em; margin-top: 1em; min-height: 2.6em; }
        .rta .cap b { color: var(--accent); }
        .rta .cap b.o { color: var(--hot); }
      `})]})}export{p as default};