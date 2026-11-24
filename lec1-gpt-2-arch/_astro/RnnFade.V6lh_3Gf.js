import{b as e,g as t,u as n}from"./viz.ZHEKlosV.js";import{r}from"./preact.module.Bl7PEaKa.js";import{t as i}from"./hooks.module.U3JihANK.js";import{n as a,t as o}from"./RnnCommon.ClUr7vCC.js";var s=[1,10,20,40];function c(){let c=i(null),l=e(c),u=t(`rnn_fade_line`),d=t(`rnn_fade`);if(!u||!d)return n(`div`,{ref:c});let f=u.ctx.length,p=Math.max(...u.moved),m=e=>e>=.01?`${Math.round(e*100)}%`:`${(e*100).toFixed(2)}%`;return n(`div`,{class:`rf`,ref:c,children:[n(`div`,{class:`grid`,style:{gridTemplateColumns:`repeat(${f}, 1fr) auto`},children:[[...u.ctx].map((e,t)=>{let r=u.moved[f-1-t];return n(`div`,{class:`bar`,children:n(`div`,{class:`fill ${l>=1?`on`:``}`,style:{height:`${r/p*100}%`}})})}),n(`div`,{}),[...u.ctx].map(e=>n(`div`,{class:`c`,children:n(a,{c:e})})),n(`div`,{class:`c q`,children:`?`}),n(`div`,{class:`axis muted`,style:{gridColumn:`1 / ${f+1}`},children:[n(`span`,{children:[`← `,f,` characters back`]}),n(`span`,{children:`1 back →`})]})]}),n(`div`,{class:`caps`,children:[n(`div`,{class:`cap muted`,children:l===0?n(r,{children:[`the guess for `,n(`span`,{class:`q`,children:`?`}),`: swap one earlier character for a random one. does the guess change?`]}):n(r,{children:`bar = how much the guess changes. the start of the line barely counts any more`})}),n(`div`,{class:`avg fade ${l>=2?`on`:``}`,children:[n(`span`,{class:`muted`,children:[`average over `,d.n,` snippets:`]}),s.map(e=>n(`span`,{class:`pt`,children:[n(`b`,{children:m(d.moved[e-1])}),` `,n(`span`,{class:`muted`,children:[e,` back`]})]}))]})]}),n(`style`,{children:`
        ${o}
        .rf { font-size: .8em; }
        .rf .grid { display: grid; column-gap: 1px; align-items: end; }
        .rf .bar { height: 230px; display: flex; align-items: flex-end; }
        .rf .bar .fill { width: 100%; background: var(--accent); border-radius: 2px 2px 0 0; transform-origin: bottom;
          transform: scaleY(0); transition: transform .5s; }
        .rf .bar .fill.on { transform: scaleY(1); }
        .rf .c { text-align: center; font-size: .72em; padding-top: .3em; border-top: 1px solid var(--border); }
        .rf .c.q { padding-left: .4em; border-top: none; }
        .rf .q { color: var(--accent); font-weight: 700; font-family: var(--mono); }
        .rf .axis { display: flex; justify-content: space-between; font-size: .55em; margin-top: .3em; }
        .rf .caps { margin-top: 1em; font-size: .75em; }
        .rf .avg { display: flex; gap: 1.6em; margin-top: .6em; }
        .rf .avg b { color: var(--fg); font-family: var(--mono); }
      `})]})}export{c as default};