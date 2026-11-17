import{_ as e,l as t,p as n,u as r}from"./viz.ZHEKlosV.js";import{r as i}from"./preact.module.Bl7PEaKa.js";function a(){let{root:a,step:o,d:s}=e(`forward`);if(!s)return r(`div`,{ref:a});let c=Math.min(12,3*(o+1)),l=s.lens;return r(`div`,{class:`sk`,ref:a,children:[l.map((e,a)=>{let o=a>0&&e[0].tok!==l[a-1][0].tok;return r(`div`,{class:`r ${a<c?`on`:``} ${o?`chg`:``}`,children:[r(`span`,{class:`b muted`,children:[`after block `,a]}),r(`span`,{class:`g`,children:r(t,{t:e[0].tok})}),r(`span`,{class:`bar`,children:r(`span`,{style:{width:`${e[0].p*100}%`}})}),r(`span`,{class:`p`,children:n(e[0].p)}),r(`span`,{class:`rest muted`,children:e.slice(1,3).map(e=>r(i,{children:[r(t,{t:e.tok}),` `,n(e.p),` `]}))})]})}),r(`div`,{class:`cap`,children:`each line: pretend that block was the last one and read the strip out the way the next slide does. the answer firms up as the blocks go by`}),r(`style`,{children:`
        .sk .cap { grid-column: 1 / -1; margin-top: 1em; font-size: .95em; color: var(--muted); }
        .sk { display: grid; grid-template-columns: auto 7em 18em 3.5em auto; gap: .25em 1em; align-items: center; font-size: .7em; }
        .sk .r { display: contents; }
        .sk .r > * { opacity: 0; transition: opacity .35s; }
        .sk .r.on > * { opacity: 1; }
        .sk .b { font-size: .75em; text-align: right; }
        .sk .r.chg .g { color: var(--accent); font-weight: 700; }
        .sk .bar { height: .9em; background: var(--surface); border-radius: 4px; overflow: hidden; }
        .sk .bar span { display: block; height: 100%; background: var(--accent); }
        .sk .p { font: .8em var(--mono); }
        .sk .rest { font-size: .7em; }
      `})]})}export{a as default};