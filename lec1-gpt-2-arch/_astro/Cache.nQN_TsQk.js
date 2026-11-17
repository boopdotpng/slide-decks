import{_ as e,c as t,d as n,l as r,u as i}from"./viz.ZHEKlosV.js";import{r as a}from"./preact.module.Bl7PEaKa.js";import{t as o}from"./common.-pbhy8Ns.js";function s(){let{root:s,step:c,d:l}=e(`loop`);if(!l)return i(`div`,{ref:s});let u=c>=1?5:4,d=(e,a,s)=>i(`div`,{class:`col`,children:[i(`div`,{class:`hd`,style:{color:o[e].color},children:[o[e].name,` strips `,i(`span`,{class:`muted`,children:[`· block `,l.focus[0],`, head `,l.focus[1]]})]}),i(`div`,{class:`saved ${c>=2?`on`:``}`,children:[Array.from({length:4},(e,o)=>i(`div`,{class:`row`,children:[i(`span`,{class:`t`,children:i(r,{t:l.toks[o]})}),i(t,{values:c>=1?s[o]:a[o],scale:2.5,height:22}),i(`span`,{class:`ok ${n(c,1)}`,children:c>=2?`saved`:`same`})]})),i(`div`,{class:`tag ${n(c,2)}`,children:`the cache`})]}),i(`div`,{class:`row new ${u>4?`on`:``}`,children:[i(`span`,{class:`t`,children:i(r,{t:l.toks[4]})}),i(t,{values:s[4],scale:2.5,height:22}),i(`span`,{class:`ok nw`,children:`new`})]})]});return i(`div`,{class:`kc`,ref:s,children:[i(`div`,{class:`cols`,children:[d(`k`,l.K1,l.K2),d(`v`,l.V1,l.V2)]}),i(`div`,{class:`cap`,children:[i(a,{children:`the first run: every token gets its key and value strips`}),i(a,{children:[`run it again with `,i(r,{t:l.toks[4]}),` on the end: the old strips come out `,i(`b`,{children:`exactly`}),` the same`]}),i(a,{children:`so keep them. each new token only works out its own strips, then looks back at the saved ones. queries aren't kept: only the newest token is looking`})][Math.min(c,2)]}),i(`style`,{children:`
        .kc { font-size: .8em; }
        .kc .cols { display: flex; gap: 3em; }
        .kc .col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .kc .hd { font-size: .62em; margin-bottom: .3em; }
        .kc .saved { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 6px; border: 2px dashed transparent;
          border-radius: 8px; transition: border-color .4s; }
        .kc .saved.on { border-color: var(--faint); }
        .kc .tag { position: absolute; right: 8px; bottom: -1.4em; font-size: .5em; color: var(--muted); }
        .kc .row { display: grid; grid-template-columns: 6em 1fr 3.5em; gap: .6em; align-items: center; }
        .kc .row.new { margin: 0 8px; opacity: 0; transform: translateX(4%); transition: opacity .5s, transform .6s cubic-bezier(.4, 0, .2, 1); }
        .kc .row.new.on { opacity: 1; transform: none; margin-top: 1.2em; }
        .kc .t { font-size: .7em; text-align: right; }
        .kc .ok { font-size: .5em; color: var(--good); }
        .kc .ok.nw { color: var(--accent); }
        .kc .cap { margin-top: 1.4em; font-size: .7em; color: var(--muted); min-height: 1.6em; }
        .kc .cap b { color: var(--fg); }
      `})]})}export{s as default};