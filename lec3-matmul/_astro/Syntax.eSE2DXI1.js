import{t as e}from"./hooks.module.BNbONuGS.js";import{n as t,t as n}from"./hooks.5GiSEWoZ.js";import{t as r}from"./Code.Cy3pb0ne.js";function i({rows:i,whereHead:a}){let o=e(null),s=Math.min(i.length-1,n(o));return t(`div`,{class:`syntax`,ref:o,children:[t(`div`,{class:`sx-row sx-head muted`,children:[t(`span`,{children:`syntax`}),t(`span`,{children:`what it does`}),t(`span`,{children:a})]}),i.map((e,n)=>t(`div`,{class:`sx-row ${n>s?`off`:``} ${n===s?`now`:``}`,children:[t(`div`,{class:`sx-code`,children:t(r,{lang:`cpp`,code:e.code})}),t(`div`,{class:`sx-what`,children:e.what}),t(`div`,{class:`sx-where`,children:e.where})]})),t(`style`,{children:`
        .syntax { display: grid; gap: 6px; }
        .syntax .sx-row { display: grid; grid-template-columns: 1.15fr 1.25fr 1fr; gap: 1.2em; align-items: center;
          padding: .3em .6em; border-radius: 8px; transition: opacity .3s, background .3s; }
        .syntax .sx-row.off { opacity: 0; }
        .syntax .sx-row.now { background: var(--hl); }
        .syntax .sx-head { font-size: .42em; text-transform: uppercase; letter-spacing: .1em; padding-bottom: 0; }
        .syntax .sx-code pre { margin: 0; font-size: .5em; background: transparent; padding: 0; }
        .syntax .sx-what { font-size: .58em; }
        .syntax .sx-where { font-size: .48em; color: var(--muted); }
      `})]})}export{i as t};