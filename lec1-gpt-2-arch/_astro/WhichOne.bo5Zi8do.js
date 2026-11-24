import{_ as e,c as t,d as n,o as r,p as i,u as a}from"./viz.ZHEKlosV.js";import{r as o}from"./preact.module.Bl7PEaKa.js";function s({toks:e,probs:t}){return a(`div`,{class:`ord`,children:e.map((n,o)=>a(`div`,{class:`col`,children:[a(`div`,{class:`bar`,children:a(`div`,{style:{height:`${t[o]*100}%`}})}),a(`span`,{class:`p`,children:i(t[o])}),a(r,{t:n,class:o===e.length-1?`on`:``})]}))})}function c(){let{root:i,step:c,d:l}=e(`embed`);if(!l)return a(`div`,{ref:i});let u=l.order,d=l.same,f=d.word,p=c>=3,m=p?f.map((e,t)=>e+d.pos_i[t]):f,h=p?f.map((e,t)=>e+d.pos_j[t]):f;return a(`div`,{class:`wo`,ref:i,children:[a(`div`,{class:`top`,children:[a(`div`,{children:[a(`div`,{class:`lbl`,children:[`no position: how much `,a(r,{t:l.toks[3]}),` reads each word (block 0, head `,u.head,`)`]}),a(s,{toks:l.toks,probs:u.probs})]}),a(`div`,{class:n(c,1),children:[a(`div`,{class:`lbl`,children:`scrambled`}),a(s,{toks:u.perm.map(e=>l.toks[e]),probs:u.probs_perm})]})]}),a(`div`,{class:`same ${n(c,2)}`,children:[a(`div`,{class:`sent`,children:d.toks.map((e,t)=>a(r,{t:e,class:t===d.i||t===d.j?`on`:``}))}),a(`div`,{class:`r`,children:[a(`span`,{class:`k`,children:[a(r,{t:` the`}),` #`,d.i+1]}),a(t,{values:m,scale:.25,height:30})]}),a(`div`,{class:`r`,children:[a(`span`,{class:`k`,children:[a(r,{t:` the`}),` #`,d.j+1]}),a(t,{values:h,scale:.25,height:30})]})]}),a(`div`,{class:`cap`,children:[a(o,{children:[a(r,{t:l.toks[3]}),` reads mostly `,a(r,{t:l.toks[2]})]}),a(o,{children:`same words, any order: the exact same budget. without position, order is invisible`}),a(o,{children:`the same word twice: the two strips are identical. nothing can tell them apart`}),a(o,{children:`add each token's position row, right after the lookup: now every token is different`})][Math.min(c,3)]}),a(`style`,{children:`
        .wo { display: flex; flex-direction: column; gap: 1.2em; font-size: .8em; }
        .wo .top { display: flex; gap: 4em; }
        .wo .lbl { margin-bottom: .5em; min-height: 1.8em; display: flex; align-items: center; gap: .3em; }
        .wo .ord { display: flex; gap: .6em; align-items: flex-end; }
        .wo .col { display: flex; flex-direction: column; align-items: center; gap: .2em; }
        .wo .bar { width: 46px; height: 110px; background: var(--surface); border-radius: 4px; display: flex; align-items: flex-end; overflow: hidden; }
        .wo .bar div { width: 100%; background: var(--accent); transition: height .5s; }
        .wo .p { font: .55em var(--mono); color: var(--muted); }
        .wo .col .chip { font-size: .75em; }
        .wo .same { display: flex; flex-direction: column; gap: .5em; }
        .wo .sent { display: flex; gap: .3em; font-size: .75em; margin-bottom: .3em; }
        .wo .r { display: grid; grid-template-columns: 7em 1fr; gap: .8em; align-items: center; }
        .wo .k { font-size: .65em; color: var(--muted); text-align: right; }
        .wo .cap { font-size: .7em; color: var(--muted); min-height: 1.6em; }
      `})]})}export{c as default};