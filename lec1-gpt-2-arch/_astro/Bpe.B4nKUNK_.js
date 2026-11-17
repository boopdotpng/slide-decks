import{_ as e,d as t,o as n,u as r}from"./viz.ZHEKlosV.js";import{r as i}from"./preact.module.Bl7PEaKa.js";function a({from:a=0}){let{root:o,step:s,d:c}=e(`embed`),l=Math.max(0,s-a);if(!c)return r(`div`,{ref:o});let u=c.bpe,d=Math.min(l,u.steps.length),f=d===0?null:u.steps[d-1],p=f?f.words:u.start,m=new Set(f?.on.map(([e,t])=>`${e}.${t}`)),h=f&&f.upto!==null&&f.upto<=u.first.length?f.upto:0,g=d>1?(u.steps[d-2].upto??0)+1:1,_=e=>e.reduce((e,t)=>e+t.length,0),v=d===u.steps.length,y=e=>e.toLocaleString();return r(`div`,{class:`bpe ${t(s,a)}`,ref:o,children:[r(`div`,{class:`list`,children:[r(`div`,{class:`lbl`,children:`the list: find the most common pair of neighbors in a pile of text, glue it, repeat`}),u.first.map(([e,t],i)=>r(`div`,{class:`m ${h===i+1?`hit`:``}`,children:[r(`span`,{class:`n`,children:[`#`,i+1]}),r(n,{t:e}),r(`span`,{class:`op`,children:`+`}),r(n,{t}),r(`span`,{class:`op`,children:`→`}),r(n,{t:e+t})]})),r(`div`,{class:`more muted`,children:[`… `,y(u.n),` merges`]})]}),r(`div`,{class:`text`,children:[r(`div`,{class:`pieces`,children:p.map((e,t)=>r(`span`,{class:`w`,children:e.map((e,i)=>r(n,{t:e,class:m.has(`${t}.${i}`)?`on`:``}))}))}),r(`div`,{class:`what`,children:f?h?r(i,{children:[`merge `,r(`b`,{children:[`#`,h]}),`: glued in `,f.n,` `,f.n===1?`place`:`places`]}):r(i,{children:[`merges `,r(`b`,{children:[`#`,y(g)]}),` … `,r(`b`,{children:f.upto?`#${y(f.upto)}`:`#${y(u.n)}`}),`: `,f.n,` more glues`]}):r(i,{children:`side quest: how gpt-2 splits a paragraph, starting from single characters`})}),r(`div`,{class:`cap ${v?``:`muted`}`,children:v?r(i,{children:[`no merge fits any more: `,_(u.start),` characters → `,_(p),` tokens`]}):r(i,{children:`go down the list in order. a merge never crosses a word`})})]}),r(`style`,{children:`
        .bpe { display: flex; flex-direction: column-reverse; gap: 1.4em; font-size: .8em; }
        .bpe .list { display: grid; grid-template-columns: auto auto; gap: .3em 1.6em; justify-content: start; }
        .bpe .list .lbl, .bpe .list .more { grid-column: 1 / -1; }
        .bpe .list .lbl { margin-bottom: .3em; }
        .bpe .m { display: flex; align-items: center; gap: .3em; font-size: .7em; padding: .1em .3em; border-radius: 6px; transition: background .3s; }
        .bpe .m.hit { background: var(--hl); }
        .bpe .m .n { width: 2.2em; color: var(--muted); font: .7em var(--mono); }
        .bpe .op { color: var(--muted); }
        .bpe .more { font-size: .6em; }
        .bpe .text { display: flex; flex-direction: column; gap: .6em; }
        .bpe .pieces { display: flex; flex-wrap: wrap; gap: .45em .7em; font-size: .7em; align-content: flex-start; height: 8.4em; }
        .bpe .w { display: flex; gap: .12em; }
        .bpe .w .chip { padding: .1em .25em; }
        .bpe .what { font-size: .7em; color: var(--muted); }
        .bpe .what b { color: var(--accent); font-family: var(--mono); }
        .bpe .cap { font-size: .6em; min-height: 1.2em; }
      `})]})}export{a as default};