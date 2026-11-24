import{_ as e,d as t,l as n,u as r}from"./viz.ZHEKlosV.js";import{r as i}from"./preact.module.Bl7PEaKa.js";import{n as a}from"./common.-pbhy8Ns.js";var o=12,s=12,c=24,l=4,u=[{name:`small`,width:768,heads:12,blocks:12},{name:`medium`,width:1024,heads:16,blocks:24},{name:`large`,width:1280,heads:20,blocks:36},{name:`xl`,width:1600,heads:25,blocks:48}];function d(){let{root:d,step:f,d:p}=e(`forward`);if(!p)return r(`div`,{ref:d});let[m,h]=p.focus,[g,_]=p.prev_head,v=e=>f!==0||e===m;return r(`div`,{class:`bd`,ref:d,children:[r(`div`,{class:`grid144`,children:[r(`div`,{class:`axis top`,children:[`12 heads, side by side: `,r(`b`,{children:`at the same time`})]}),r(`div`,{class:`axis left ${t(f,1)}`,children:[`12 blocks, top to bottom: `,r(`b`,{children:`one after another`})]}),r(`div`,{class:`cells`,children:Array.from({length:o},(e,t)=>r(`div`,{class:`r ${v(t)?`on`:``}`,children:[r(`span`,{class:`bn`,children:[`block `,t]}),Array.from({length:s},(e,n)=>r(`div`,{class:`c ${t===m&&n===h?`ours`:``} ${t===g&&n===_?`prev`:``}`,style:{background:a(n,h),width:c,height:c}}))]}))}),r(`div`,{class:`legend`,children:[r(`span`,{children:[r(`i`,{class:`sw ours`}),` block `,m,`, head `,h,`: the one we followed`]}),r(`span`,{class:t(f,1),children:[r(`i`,{class:`sw prev`}),` block `,g,`, head `,_,`: reads the word just before`]})]})]}),r(`div`,{class:`side`,children:[r(`div`,{class:`pt ${t(f,0)}`,children:[r(`div`,{class:`h`,children:[`heads: `,r(`b`,{children:`breadth`})]}),r(`p`,{children:`one block asks 12 questions of the sentence at once. each head has its own three grids, so its own question. they share the token's 768 numbers: 12 heads × 64. twice the heads at the same width means 32 numbers each, not more room`}),r(`p`,{class:`loop`,children:`the inner loop. more heads run side by side: no extra time`})]}),r(`div`,{class:`pt ${t(f,1)}`,children:[r(`div`,{class:`h`,children:[`blocks: `,r(`b`,{children:`depth`})]}),r(`p`,{children:[`rounds, in order. after block 0, `,r(n,{t:p.toks[3]}),`'s strip already holds what it pulled from `,r(n,{t:p.toks[2]}),`. block 1's questions can ask about `,r(`b`,{children:`that`}),`. "Harry Potter … Harry →" needs two rounds: one head marks every token with the word before it, a later head finds the earlier Harry by that mark and copies what followed. no single round can do it, however many heads`]}),r(`p`,{class:`loop`,children:`the outer loop. every block is one more step, after the last`})]}),r(`div`,{class:`pt ${t(f,2)}`,children:[r(`table`,{children:[r(`thead`,{children:r(`tr`,{children:[r(`th`,{children:`gpt-2`}),r(`th`,{children:`strip width`}),r(`th`,{children:`heads`}),r(`th`,{children:`blocks`})]})}),r(`tbody`,{children:u.map(e=>r(`tr`,{class:e.name===`small`?`us`:``,children:[r(`td`,{children:e.name}),r(`td`,{children:e.width}),r(`td`,{children:[e.heads,` × 64`]}),r(`td`,{children:e.blocks})]}))})]}),r(`p`,{children:`every head stays 64 wide; the head count just follows the width. the real decision is how many rounds`})]})]}),r(`div`,{class:`cap`,children:[r(i,{children:[`a head is one question. heads decide how many questions a token asks `,r(`b`,{children:`at once`})]}),r(i,{children:[`blocks decide how many `,r(`b`,{children:`rounds`}),` of questions there are. later rounds can build on earlier answers`]}),r(i,{children:`heads: how many questions at once. blocks: how many rounds, each able to use the last. the loop picture again: heads inside, blocks outside`})][Math.min(f,2)]}),r(`style`,{children:`
        .bd { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; gap: 1em 3em; font-size: .8em; align-items: start; }
        .bd .grid144 { display: flex; flex-direction: column; gap: .5em; }
        .bd .axis { font-size: .5em; color: var(--muted); }
        .bd .axis b { color: var(--fg); }
        .bd .axis.top { margin-left: 5.2em; }
        .bd .cells { display: flex; flex-direction: column; gap: ${l}px; }
        .bd .r { display: flex; gap: ${l}px; align-items: center; opacity: .18; transition: opacity .4s; }
        .bd .r.on { opacity: 1; }
        .bd .r .bn { font-size: .45em; color: var(--muted); width: 5em; text-align: right; margin-right: .4em; }
        .bd .c { border-radius: 4px; opacity: .8; }
        .bd .c.ours { outline: 3px solid var(--fg); outline-offset: 1px; opacity: 1; }
        .bd .c.prev { outline: 3px dashed var(--fg); outline-offset: 1px; opacity: 1; }
        .bd .legend { display: flex; flex-direction: column; gap: .3em; font-size: .5em; color: var(--muted); margin-left: 5.2em; }
        .bd .legend .sw { display: inline-block; width: .9em; height: .9em; border-radius: 3px; background: var(--accent); vertical-align: -.1em; margin-right: .4em; }
        .bd .legend .sw.ours { outline: 2px solid var(--fg); }
        .bd .legend .sw.prev { outline: 2px dashed var(--fg); }
        .bd .side { display: flex; flex-direction: column; gap: 1em; max-width: 44em; }
        .bd .pt { display: flex; flex-direction: column; gap: .25em; }
        .bd .pt .h { font-size: .8em; margin-bottom: .2em; }
        .bd .pt .h b { color: var(--accent); }
        .bd .pt p { margin: 0; font-size: .58em; color: var(--muted); line-height: 1.4; }
        .bd .pt p b { color: var(--fg); }
        .bd .pt p.loop { margin-top: .3em; color: var(--fg); font-family: var(--mono); font-size: .52em; }
        .bd table { border-collapse: collapse; font-size: .55em; margin-bottom: .4em; }
        .bd th, .bd td { padding: .15em 1em .15em 0; text-align: left; font-weight: normal; }
        .bd th { color: var(--muted); border-bottom: 1px solid var(--border); }
        .bd td { font-family: var(--mono); color: var(--fg); }
        .bd tr.us td { color: var(--accent); }
        .bd .cap { grid-column: 1 / -1; font-size: .7em; color: var(--muted); min-height: 1.6em; }
        .bd .cap b { color: var(--fg); }
      `})]})}export{d as default};