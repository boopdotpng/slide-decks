import{c as e,m as t,s as n,u as r}from"./viz.BfyPauLx.js";import{t as i}from"./hooks.module.BNbONuGS.js";import{n as a,t as o}from"./roles.Ca55homO.js";import{n as s,t as c}from"./tinyEmbed.DVRlBMqq.js";var l=`a2f5c9d3f`,u=[...l].map(e=>s.indexOf(e)),d=2,f=e=>t(e,.5);function p(){let t=i(null),p=a(t),m=new Set(u),h=p>=3,g=e=>l[e]===l[d];return o(`div`,{class:`te`,ref:t,children:[o(`div`,{class:`table`,children:[o(`div`,{class:`lbl`,children:[`token embedding `,o(e,{dims:[36,32],names:[`vocab`,`dim`]})]}),o(n,{data:c,color:(e,t)=>p>=1&&!m.has(t)?`color-mix(in srgb, ${f(e)} 15%, transparent)`:f(e),cell:13,gap:1,rowLabels:[...s].map((e,t)=>o(`span`,{class:`rl-t ${p>=1&&m.has(t)?`in`:``} ${h&&e===l[d]?`z`:``}`,children:e})),tipFn:(e,t,n)=>`emb[${s[e]}][${t}] = <b>${n?.toFixed(3)}</b>`}),o(`div`,{class:`lbl hint fade ${p>=1?`on`:``}`,children:[o(`code`,{children:l}),` uses these `,m.size,` rows`]})]}),o(`div`,{class:`out fade ${p>=2?`on`:``}`,children:[o(`div`,{class:`lbl`,children:[`our input, one row per position `,o(e,{dims:[9,32],names:[`pos`,`dim`]})]}),o(`div`,{class:`rows`,children:r(9).map(e=>o(`div`,{class:`r ${h&&!g(e)?`dim`:``}`,children:[o(`span`,{class:`p`,children:e}),o(`span`,{class:`t ${/\d/.test(l[e])?`dg`:``}`,children:l[e]}),o(n,{data:[c[u[e]]],color:f,cell:h&&g(e)?24:19,gap:1,tipFn:(t,n,r)=>`tok_emb[${l[e]}][${n}] = <b>${r?.toFixed(3)}</b>`})]}))}),o(`div`,{class:`zoom ${h?``:`gone`}`,children:[o(`div`,{children:[o(`span`,{class:`k`,children:`f`}),` = [`,c[u[d]].map(e=>e.toFixed(2)).join(`, `),`]`]}),o(`div`,{class:`muted`,children:`32 numbers · same token → same row`})]})]}),o(`style`,{children:`
        .te { display: flex; gap: 2.4em; align-items: flex-start; font-size: .8em; }
        .te .zoom.gone { display: none; }
        .te .lbl { font-size: .7em; color: var(--muted); margin-bottom: .5em; display: flex; gap: .8em; align-items: baseline; }
        .te .table .rl { font-size: .55em; padding-right: .4em; }
        .te .rl-t { font-family: var(--mono); transition: color .3s; }
        .te .table .hc { transition: background .4s; }
        .te .hint { margin-top: .6em; }
        .te .rl-t.in { color: var(--fg); font-weight: 700; }
        .te .rl-t.z { color: var(--focus); }
        .te .out { display: flex; flex-direction: column; gap: .4em; }
        .te .rows { display: flex; flex-direction: column; gap: 5px; }
        .te .r { display: flex; align-items: center; gap: .6em; transition: opacity .4s; }
        .te .r.dim { opacity: .2; }
        .te .r .p { font-family: var(--mono); font-size: .55em; color: var(--muted); width: 1em; text-align: right; }
        .te .r .t { font-family: var(--mono); width: 1em; text-align: center; }
        .te .r .t.dg { color: var(--digit); }
        .te .r .hc { transition: width .4s, height .4s; }
        .te .zoom { margin-top: .8em; font-size: .65em; display: flex; flex-direction: column; gap: .5em; max-width: 52em; }
        .te .zoom > div:first-child { font-family: var(--mono); font-size: .9em; line-height: 1.5; }
        .te .zoom .k { color: var(--focus); }
        .te .zoom b { color: var(--fg); font-family: var(--mono); }
      `})]})}export{p as default};