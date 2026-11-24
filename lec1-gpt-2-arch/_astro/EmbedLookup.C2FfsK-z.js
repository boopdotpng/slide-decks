import{b as e,c as t,g as n,l as r,n as i,r as a,t as o,u as s}from"./viz.ZHEKlosV.js";import{t as c}from"./hooks.module.U3JihANK.js";var l=2e3;function u(){let u=c(null),d=c(null),f=c(null),p=e(u),m=n(`embed`),h=i(u,e=>{if(!d.current||!f.current)return null;let t=o(e,d.current);return{x0:t.r+6,top:t.y,h:t.h,rows:[...f.current.querySelectorAll(`.r`)].map(t=>[o(e,t.querySelector(`.t > *`)??t).x-8,o(e,t).cy])}},[m]);if(!m)return s(`div`,{ref:u});let g=e=>e/l*100;return s(`div`,{class:`el`,ref:u,children:[s(`div`,{class:`table`,children:[s(`div`,{class:`lbl`,children:`a table: one row per token`}),s(`div`,{class:`mat`,ref:d,children:m.ids.map((e,t)=>s(`div`,{class:`mark ${p>=1?`on`:``}`,style:{top:`${g(e)}%`,transitionDelay:`${t*50}ms`}}))}),s(`div`,{class:`lbl`,children:[`(the first `,l.toLocaleString(),` of 50,257 rows)`]})]}),s(`div`,{class:`rows fade ${p>=2?`on`:``}`,ref:f,children:m.tok_emb.map((e,n)=>s(`div`,{class:`r ${p>=3&&n!==1?`dim`:``}`,style:{transitionDelay:`${n*50}ms`},children:[s(`span`,{class:`t`,children:s(r,{t:m.toks[n]})}),s(t,{values:e,scale:.25,height:p>=3&&n===1?70:34,label:m.toks[n]})]}))}),s(`div`,{class:`zoom fade ${p>=3?`on`:``}`,children:[s(r,{t:m.toks[1]}),` is now just `,s(`b`,{children:`768 numbers`}),`, learned in training `,s(`span`,{class:`muted`,children:`· red = positive, blue = negative`})]}),h&&h.h>0&&s(`svg`,{class:`arrows`,children:m.ids.map((e,t)=>s(`g`,{class:p>=3&&t!==1?`dim`:``,children:s(a,{from:[h.x0,h.top+g(e)/100*h.h+1.5],to:h.rows[t],on:p>=2,width:1.5,color:`var(--accent)`})}))}),s(`style`,{children:`
        .el { position: relative; display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; gap: .6em 6em; font-size: .8em; }
        .el .table { grid-row: 1 / 3; display: flex; flex-direction: column; align-items: center; gap: .3em; }
        .el .mat { position: relative; width: 120px; height: 52cqh; border-radius: 6px 6px 0 0;
          background: linear-gradient(90deg, var(--surface), var(--raised), var(--surface)); border: 1px solid var(--border); border-bottom: 0;
          mask-image: linear-gradient(to bottom, black 92%, transparent); }
        .el .mark { position: absolute; left: -4px; right: -4px; height: 3px; background: var(--accent);
          opacity: 0; transform: scaleX(.3); transition: opacity .3s, transform .4s; }
        .el .mark.on { opacity: 1; transform: none; }
        .el .rows { display: flex; flex-direction: column; gap: 10px; min-width: 0; justify-content: center; }
        .el .r { display: grid; grid-template-columns: 6em 1fr; align-items: center; gap: .6em; transition: opacity .4s; }
        .el .r.dim { opacity: .2; }
        .el .r .strip { transition: height .4s; }
        .el .r .t { font-size: .9em; text-align: right; }
        .el .foot { margin-top: .5em; font-size: .8em; }
        .el .zoom { font-size: .8em; }
        .el .arrows { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
        .el .arrows g { transition: opacity .4s; }
        .el .arrows g.dim { opacity: .15; }
      `})]})}export{u as default};