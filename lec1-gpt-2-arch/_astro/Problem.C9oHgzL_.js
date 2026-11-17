import{_ as e,c as t,d as n,i as r,l as i,p as a,u as o}from"./viz.ZHEKlosV.js";import{r as s}from"./preact.module.Bl7PEaKa.js";function c(){let{root:c,step:l,d:u}=e(`forward`);if(!u)return o(`div`,{ref:c});let d=u.toks.length,f=u.alone;return o(`div`,{class:`pb`,ref:c,children:[o(`div`,{class:`cols`,children:[u.toks.map((e,n)=>o(`div`,{class:`c ${n===d-1?`me`:``} ${l>=2&&(n===1||n===2)?`src`:``}`,children:[o(`div`,{class:`t`,children:o(i,{t:e})}),o(t,{values:u.embed[n],vertical:!0,height:300,width:44,scale:.25})]})),o(`div`,{class:`guess ${n(l,1)}`,children:[o(`div`,{class:`lbl`,children:[`the whole model, given only `,o(i,{t:u.toks[d-1]})]}),o(r,{values:f.map(e=>e.p),labels:f.map(e=>o(i,{t:e.tok})),fmtV:a,width:160})]})]}),o(`div`,{class:`cap`,children:[o(s,{children:`four strips, one per token. so far each one knows only its own word and place: nothing has read anything`}),o(s,{children:[`run the model on `,o(i,{t:u.toks[d-1]}),` by itself and it says `,o(i,{t:f[0].tok}),`, at `,a(f[0].p),`: a lone `,o(i,{t:u.toks[d-1]}),` is a generic word with no idea what comes next`]}),o(s,{children:[`the answer is in `,o(`b`,{children:`other`}),` strips. how does `,o(i,{t:u.toks[d-1]}),` read them?`]})][Math.min(l,2)]}),o(`style`,{children:`
        .pb { font-size: .8em; }
        .pb .cols { display: flex; gap: 1.2em; align-items: flex-end; }
        .pb .cols > * { flex: none; }
        .pb .c { display: flex; flex-direction: column; align-items: center; gap: .4em; padding: .4em; border-radius: 8px;
          border: 2px solid transparent; transition: border-color .3s; }
        .pb .c .t { font-size: .9em; }
        .pb .c.me { border-color: var(--accent); }
        .pb .c.src { border-color: var(--good); border-style: dashed; }
        .pb .guess { margin-left: 1.5em; align-self: center; }
        .pb .guess .bars { font-size: .9em; }
        .pb .guess .lbl { margin-bottom: .5em; }
        .pb .cap { margin-top: 1em; font-size: .75em; color: var(--muted); max-width: 60em; }
        .pb .cap b { color: var(--fg); }
      `})]})}export{c as default};