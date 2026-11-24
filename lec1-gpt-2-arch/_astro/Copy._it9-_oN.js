import{_ as e,c as t,d as n,h as r,o as i,p as a,u as o}from"./viz.ZHEKlosV.js";import{r as s}from"./preact.module.Bl7PEaKa.js";import{t as c}from"./common.-pbhy8Ns.js";function l(){let{root:l,step:u,d}=e(`forward`);if(!d)return o(`div`,{ref:l});let f=d.toks.length-1,p=d.lenses.v.out,m=d.probs[f],h=2*r(p.flat()),g=d.head_out[f];return o(`div`,{class:`cp`,ref:l,children:[o(`div`,{class:`hdr`,children:[o(`span`,{}),o(`span`,{class:`muted`,children:`budget`}),o(`span`,{class:`muted`,style:{color:c.v.color},children:c.v.plain})]}),d.toks.map((e,n)=>o(`div`,{class:`row`,children:[o(i,{t:e}),o(`span`,{class:`p`,children:a(m[n])}),o(t,{values:u>=1?p[n].map(e=>e*m[n]):p[n],scale:h,height:30})]})),o(`div`,{class:`row sum ${n(u,2)}`,children:[o(`span`,{class:`k`,children:`all added up`}),o(`span`,{}),o(t,{values:g,scale:h,height:44})]}),o(`div`,{class:`cap`,children:[o(s,{children:`every token's third strip: what it hands over if it's picked`}),o(s,{children:`turn each one down to its share of the budget`}),o(s,{children:[`add them up. it's mostly `,o(i,{t:d.toks[2]}),`'s strip: that's what this head brings back to `,o(i,{t:d.toks[f]})]})][Math.min(u,2)]}),o(`style`,{children:`
        .cp { display: flex; flex-direction: column; gap: .6em; font-size: .8em; }
        .cp .hdr, .cp .row { display: grid; grid-template-columns: 7em 4em 1fr; gap: 1em; align-items: center; }
        .cp .hdr > * { font-size: .55em; }
        .cp .row .chip { justify-self: end; font-size: .8em; }
        .cp .p { font: .65em var(--mono); color: var(--accent); }
        .cp .row canvas { transition: none; }
        .cp .sum { margin-top: .8em; padding-top: .8em; border-top: 1px solid var(--border); }
        .cp .sum .k { text-align: right; font-size: .6em; color: var(--muted); }
        .cp .cap { margin-top: .8em; font-size: .7em; color: var(--muted); min-height: 1.6em; }
      `})]})}export{l as default};