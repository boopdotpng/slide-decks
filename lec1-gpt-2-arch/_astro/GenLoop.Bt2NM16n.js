import{_ as e,l as t,u as n}from"./viz.ZHEKlosV.js";import{r}from"./preact.module.Bl7PEaKa.js";function i({split:i=!1}){let{root:a,step:o,d:s}=e(`loop`);if(!s)return n(`div`,{ref:a});let c=s.toks,l=s.steps;return n(`div`,{class:`gl ${i?`split`:``}`,ref:a,children:[l.map((e,r)=>{let a=i&&r>0;return n(`div`,{class:`row ${o>=r?`on`:``}`,children:[i?n(`span`,{class:`kind ${a?`muted`:`accent`}`,children:a?`one new token`:`whole prompt`}):n(`span`,{}),n(`span`,{class:`seq`,children:[n(`span`,{class:`old ${a?`cached`:``}`,children:c.slice(0,a?e.n-1:e.n).map((e,a)=>n(`span`,{class:`chip ${!i&&r>0&&a>=l[0].n?`added`:``}`,children:n(t,{t:e})}))}),a&&n(`span`,{class:`chip added`,children:n(t,{t:c[e.n-1]})})]}),n(`span`,{class:`via muted`,children:`→ model →`}),n(`span`,{class:`chip out`,children:n(t,{t:e.next})})]})}),n(`div`,{class:`cap muted fade ${o>=l.length-1?`on`:``}`,children:i?n(r,{children:`same answer. the prompt goes in all at once, then each new token goes in alone and reads the cache`}):n(r,{children:`every step: the whole sequence in, one token out, append it, repeat`})}),n(`style`,{children:`
        .gl { display: grid; grid-template-columns: auto auto auto auto; justify-content: start; gap: .7em .8em; align-items: center; font-size: .75em; }
        .gl .row { display: contents; }
        .gl .row > * { opacity: 0; transition: opacity .35s; }
        .gl .row.on > * { opacity: 1; }
        .gl .kind { text-align: right; font-size: .9em; }
        .gl .seq { display: flex; align-items: center; gap: .25em; }
        .gl .old { display: flex; flex-wrap: nowrap; gap: .25em; padding: .25em; border: 2px dashed transparent; border-radius: 8px; }
        .gl .old.cached { border-color: var(--line-2); }
        .gl .old.cached .chip { opacity: .4; }
        .gl .chip.added { color: var(--accent); }
        .gl .chip.out { color: var(--accent); font-weight: 700; }
        .gl .via { white-space: nowrap; font-size: .9em; }
        .gl .cap { grid-column: 1 / -1; margin-top: .6em; font-size: 1.15em; }
        .gl .out { justify-self: start; }
      `})]})}export{i as default};