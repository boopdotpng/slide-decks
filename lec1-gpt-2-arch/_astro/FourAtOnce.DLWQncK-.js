import{_ as e,a as t,c as n,d as r,l as i,u as a}from"./viz.ZHEKlosV.js";import{r as o}from"./preact.module.Bl7PEaKa.js";import{t as s}from"./common.-pbhy8Ns.js";var c=110,l=300,u=36;function d(){let{root:d,step:f,d:p}=e(`forward`);if(!p)return a(`div`,{ref:d});let m=p.toks.length-1,h=p.ln1,g=p.lenses.q.out,_=e=>f>=2||f===1&&e===m;return a(`div`,{class:`fa`,ref:d,children:[a(`div`,{class:`eq`,children:[a(`div`,{class:`blk`,children:[a(`div`,{class:`lbl`,children:[`4 strips, as rows · `,a(`b`,{children:`4 × 768`})]}),h.map((e,t)=>a(`div`,{class:`row ${f>=1&&!_(t)?`dim`:``} ${f===1&&t===m?`hl`:``}`,children:[a(`span`,{class:`t`,children:a(i,{t:p.toks[t]})}),a(n,{values:e,height:u,label:p.toks[t]})]}))]}),a(`span`,{class:`op`,children:`·`}),a(`div`,{class:`blk grid`,children:[a(`div`,{class:`lbl`,children:[`the grid · `,a(`b`,{children:`768 × 64`})]}),a(t,{m:p.lenses.q.img,w:c,h:l})]}),a(`span`,{class:`op`,children:`=`}),a(`div`,{class:`blk`,children:[a(`div`,{class:`lbl`,style:{color:s.q.color},children:[s.q.plain,` · `,a(`b`,{children:`4 × 64`})]}),g.map((e,t)=>a(`div`,{class:`row out ${r(f,1)} ${f>=1&&!_(t)?`dim`:``} ${f===1&&t===m?`hl`:``}`,children:a(n,{values:e,height:u,width:c,label:p.toks[t]})}))]})]}),a(`div`,{class:`code ${r(f,3)}`,children:[a(`div`,{class:`c`,children:[a(`div`,{class:`lbl`,children:`one token at a time`}),a(`pre`,{children:`for i in range(4):
    out[i] = x[i] @ W`}),a(`div`,{class:`lbl`,children:`4 turns, one after another`})]}),a(`span`,{class:`eqs`,children:`=`}),a(`div`,{class:`c`,children:[a(`div`,{class:`lbl`,children:`all at once`}),a(`pre`,{children:`out = x @ W`}),a(`div`,{class:`lbl`,children:`(4, 768) @ (768, 64) → (4, 64)`})]}),a(`div`,{class:`c wide`,children:[a(`div`,{class:`lbl`,children:[`the loop is gone. its counter became a dimension at the `,a(`b`,{children:`front`}),` of x`]}),a(`pre`,{children:`x[i]      (768,)       one strip
x         (4, 768)     the loop over tokens, as a dimension
xs        (batch, 4, 768)   a loop over sentences, in front of that`})]})]}),a(`div`,{class:`cap`,children:[a(o,{children:`the four strips lie flat, one per row. one grid for all of them`}),a(o,{children:[`row `,a(i,{t:p.toks[m]}),` in, row `,a(i,{t:p.toks[m]}),` out: exactly the strip from the last slide. the other rows don't touch it`]}),a(o,{children:[`all four rows at once, one multiply. `,a(`b`,{children:`rows never mix`}),`: each token is on its own here. in code: `,a(`code`,{children:`x @ W`}),`, (4, 768) @ (768, 64) → (4, 64)`]}),a(o,{children:[`the rule: a loop whose turns don't depend on each other becomes a dimension in `,a(`b`,{children:`front`}),`, and a gpu runs every turn of it at the same time. tokens here, sentences in a batch, and soon the 12 heads: same trick each time`]})][Math.min(f,3)]}),a(`style`,{children:`
        .fa { display: flex; flex-direction: column; gap: 1em; font-size: .8em; }
        .fa .eq { display: flex; align-items: center; gap: 1.2em; }
        .fa .blk { display: flex; flex-direction: column; gap: 6px; }
        .fa .blk.grid { align-items: center; }
        .fa .lbl { font-size: .5em; color: var(--muted); margin-bottom: .3em; white-space: nowrap; }
        .fa .lbl b { color: var(--fg); }
        .fa .row { display: grid; grid-template-columns: 6em 560px; gap: .6em; align-items: center; padding: 2px; border-radius: 4px;
          border: 2px solid transparent; transition: opacity .35s, border-color .3s; }
        .fa .row.out { grid-template-columns: ${c}px; }
        .fa .row .t { font-size: .75em; text-align: right; }
        .fa .row.dim { opacity: .25; }
        .fa .row.hl { border-color: var(--fg); }
        .fa .op { font-size: 1.6em; color: var(--muted); }
        .fa .code { display: flex; align-items: center; gap: 1.2em; }
        .fa .code .c { display: flex; flex-direction: column; gap: .3em; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: .6em .9em; }
        .fa .code .c.wide { margin-left: 1.2em; }
        .fa .code .c .lbl { margin: 0; }
        .fa .code pre { margin: 0; font: .62em var(--mono); color: var(--fg); line-height: 1.5; }
        .fa .code .eqs { font-size: 1.4em; color: var(--muted); }
        .fa .cap { font-size: .7em; color: var(--muted); min-height: 1.6em; max-width: 60em; }
        .fa .cap b { color: var(--fg); }
        .fa .cap code { font-family: var(--mono); color: var(--fg); }
      `})]})}export{d as default};