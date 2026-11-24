import{T as e,_ as t,c as n,d as r,i,l as a,o,p as s,u as c}from"./viz.ZHEKlosV.js";function l(){let{root:l,step:u,d}=t(`forward`);if(!d)return c(`div`,{ref:l});let f=d.toks.length,p=d.top;return c(`div`,{class:`an`,ref:l,children:[c(`div`,{class:`r`,children:[c(`span`,{class:`k`,children:[`final strip for `,c(a,{t:d.toks[f-1]})]}),c(n,{values:d.final,scale:3,height:40})]}),c(`div`,{class:`r ${r(u,1)}`,children:[c(`span`,{class:`k`}),c(`span`,{class:`msg`,children:[`match it against every token's row in the table from the start, like key against query: `,c(`b`,{children:`50,257 scores`}),`. one more multiply, 768 × 50,257`]})]}),c(`div`,{class:`dist ${r(u,2)}`,children:[c(`div`,{class:`lbl`,children:[`the budget trick again (e to each score, share of the total): the chances for what comes after `,c(o,{t:d.toks[f-1]})]}),c(i,{values:p.map(e=>e.p),labels:p.map(e=>c(a,{t:e.tok})),max:1,width:460,hl:0,color:t=>e(.4+t),fmtV:e=>e>=.01?s(e):`${(e*100).toFixed(1)}%`})]}),c(`style`,{children:`
        .an { display: flex; flex-direction: column; gap: 1em; font-size: .8em; }
        .an .r { display: grid; grid-template-columns: 11em 1fr; gap: 1em; align-items: center; }
        .an .k { text-align: right; font-size: .6em; color: var(--muted); }
        .an .msg { font-size: .7em; color: var(--muted); }
        .an .msg b { color: var(--fg); }
        .an .dist { margin-left: 12em; }
        .an .dist .bars { font-size: .85em; }
        .an .dist .lbl { margin-bottom: .5em; }
      `})]})}export{l as default};