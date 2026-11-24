import{S as e,_ as t,l as n,u as r}from"./viz.ZHEKlosV.js";function i(){let{root:i,step:a,d:o}=t(`embed`);return o?r(`div`,{class:`tkz`,ref:i,children:[r(`div`,{class:`text ${a>=1?`gone`:``}`,children:[`"`,o.prompt,`"`]}),r(`div`,{class:`chips ${a>=1?`on`:``}`,children:o.toks.map((e,t)=>r(`div`,{class:`col`,style:{transitionDelay:`${t*40}ms`},children:[r(`span`,{class:`chip`,children:r(n,{t:e})}),r(`span`,{class:`id fade ${a>=2?`on`:``}`,style:{transitionDelay:`${t*40}ms`},children:o.ids[t]})]}))}),r(`div`,{class:`fade ${a>=2?`on`:``} foot muted`,children:`every token is a number from a list of 50,257`}),r(`div`,{class:`fade ${a>=3?`on`:``} splits`,children:[r(`div`,{class:`lbl muted`,children:`common words are one token. rarer ones split into pieces`}),o.splits.map(e=>r(`div`,{class:`split`,children:[r(`span`,{class:`w`,children:[`"`,e.word.trim(),`"`]}),r(`span`,{class:`muted`,children:`→`}),e.toks.map((t,i)=>r(`div`,{class:`col on`,children:[r(`span`,{class:`chip`,children:r(n,{t})}),r(`span`,{class:`id`,children:e.ids[i]})]}))]}))]}),r(`style`,{children:`
        .tkz .text { font-size: 1em; transition: opacity .4s, transform .4s; margin-bottom: .6em; }
        .tkz .text.gone { opacity: .25; transform: translateY(-4px); }
        .tkz .chips { display: flex; flex-wrap: wrap; gap: .5em; font-size: 1.1em; }
        .tkz .col { display: flex; flex-direction: column; align-items: center; gap: .2em;
          opacity: 0; transform: translateY(10px); transition: opacity .35s, transform .35s; }
        .tkz .chips.on .col { opacity: 1; transform: none; }
        .tkz .id { font-family: var(--mono); font-size: .7em; color: ${e.hot}; }
        .tkz .foot { margin-top: 1.2em; font-size: .7em; }
        .tkz .splits { margin-top: 1.4em; display: flex; flex-direction: column; gap: .5em; font-size: .8em; }
        .tkz .splits .lbl { font-size: .75em; }
        .tkz .split { display: flex; align-items: flex-start; gap: .5em; }
        .tkz .split .w { width: 7em; text-align: right; padding-top: .15em; }
        .tkz .split .col { opacity: 1; transform: none; }
      `})]}):r(`div`,{ref:i})}export{i as default};