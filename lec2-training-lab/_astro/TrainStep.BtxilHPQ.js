import{r as e}from"./preact.module.Bl7PEaKa.js";import{f as t,n,o as r,u as i}from"./roles.C1apZS_N.js";import{n as a}from"./util.CAVuuUkp.js";var o=`with Context(TRAINING=1):
    optimizer.zero_grad()
    logits = model(tokens)
    loss = logits.sparse_categorical_crossentropy(
        targets
    )
    loss.backward()
    optimizer.step()`,s=[[],[0,1],[2],[3,4,5],[6],[7]],c=[`predict`,`measure error`,`calculate gradients`,`update`];function l({v:e,vocab:n,target:r,w:i=560,h:a=150,signed:o=!1}){let s=Math.max(...e.map(Math.abs)),c=i/e.length,l=o?a/2:a,u=(o?a/2:a)/s;return t(`svg`,{class:`bars`,viewBox:`0 0 ${i} ${a+24}`,children:[t(`line`,{x1:`0`,x2:i,y1:l,y2:l,class:`ax`}),e.map((e,i)=>{let o=Math.abs(e)*u;return t(`g`,{children:[t(`rect`,{class:`${i===r?`tg`:/\d/.test(n[i])?`dg`:`lt`}`,x:i*c+1,y:e>=0?l-o:l,width:c-2,height:Math.max(1,o)}),/\d/.test(n[i])&&t(`text`,{class:i===r?`tg`:``,x:i*c+c/2,y:a+20,children:n[i]})]})})]})}function u(){let{root:u,step:d,d:f}=r(`step`),p=d>=2?d-2:-1,m=f?f.vocab.indexOf(f.target):0,h=f?[t(e,{children:[t(`div`,{class:`vh`,children:`one update, every line once`}),t(`p`,{children:`an illustrative update: the lab doesn't ship a training harness, you build the loop around this. the calls are checked against tinygrad 0.14.0: this deck's worked example (slide 4) makes these same calls`})]}),t(e,{children:[t(`div`,{class:`vh`,children:`preparation`}),t(`p`,{children:[t(`code`,{children:`Context(TRAINING=1)`}),`: training mode. tinygrad's optimizer refuses to `,t(`code`,{children:`step()`}),` outside it`]}),t(`p`,{children:[t(`code`,{children:`zero_grad()`}),`: forget the last update's gradients (each parameter's `,t(`code`,{children:`.grad`}),` is cleared), so this update's don't add onto them`]})]}),t(e,{children:[t(`div`,{class:`vh`,children:[`predict: `,t(`code`,{children:`logits`}),`, shape (16, 36)`]}),t(l,{v:f.logits,vocab:f.vocab,target:m,signed:!0}),t(`p`,{class:`mut`,children:[`one row: a2f5c9d3fc, fresh weights. the model returns only the `,t(`b`,{children:`final position's`}),` scores`]})]}),t(e,{children:[t(`div`,{class:`vh`,children:`measure error: one number`}),t(`div`,{class:`big`,children:t(n,{tex:`L = -\\log p(\\text{4}) = -\\log ${f.probs[m].toFixed(4)} = ${f.loss.toFixed(2)}`})}),t(`p`,{class:`mut`,children:[`over a batch: the mean of these, shape `,t(`code`,{children:`()`}),`. it takes the raw scores: the log-softmax happens inside, so no `,t(`code`,{children:`softmax`}),` goes before it`]})]}),t(e,{children:[t(`div`,{class:`vh`,children:[`calculate gradients: `,t(n,{tex:`\\partial L / \\partial s = p - \\text{onehot}(4)`})]}),t(l,{v:f.dlogits,vocab:f.vocab,target:m,signed:!0,h:130}),t(`p`,{class:`mut`,children:[`then on back through the graph into every parameter's `,t(`code`,{children:`.grad`}),`. nothing has changed yet. embedding rows the input never used: gradient 0 (`,f.emb_rows_grad.filter(e=>!e).length,` of 36)`]})]}),t(e,{children:[t(`div`,{class:`vh`,children:`update: the parameters change`}),t(`div`,{class:`upd`,children:a(4).map(e=>t(`div`,{children:[t(`code`,{children:f.update.U_target_before[e].toFixed(4)}),` → `,t(`code`,{class:`u`,children:f.update.U_target_after[e].toFixed(4)})]}))}),t(`p`,{class:`mut`,children:[`U's row for "4", first four numbers. same example after this step: loss `,f.loss.toFixed(2),` → `,t(`b`,{children:f.update.loss_after.toFixed(2)})]})]})]:[];return t(`div`,{class:`tr8`,ref:u,children:[t(`div`,{class:`tin`,children:[t(`div`,{class:`lc`,children:[t(`div`,{class:`card bar-a code`,children:[t(`div`,{class:`kick`,children:`python · tinygrad 0.14.0`}),t(i,{lang:`py`,code:o,hl:s[d]})]}),t(`div`,{class:`card wf`,children:[t(`span`,{class:`kick`,children:`workflow summary`}),t(`div`,{class:`tabs`,children:c.map((e,n)=>t(`div`,{class:`tab ${p===n?`on`:``} ${p>n?`done`:``} t${n}`,children:[t(`div`,{class:`n`,children:[`step `,n+1]}),t(`div`,{class:`t`,children:e})]}))})]})]}),t(`div`,{class:`rc`,children:[t(`div`,{class:`card pic s${d}`,children:h[d]}),t(`div`,{class:`card bar-a km`,children:[t(`h3`,{children:`key methods`}),t(`div`,{class:d===4?`on`:``,children:[t(`code`,{children:`backward()`}),` calculates gradients`]}),t(`div`,{class:d===5?`on`:``,children:[t(`code`,{children:`step()`}),` changes parameters`]})]}),t(`div`,{class:`card bar-l km`,children:[t(`h3`,{children:`grading and loss`}),t(`div`,{class:d===2?`on`:``,children:`only the final position is graded`}),t(`div`,{class:d===3?`on`:``,children:`cross-entropy takes scores directly`})]})]})]}),t(`style`,{children:`
        .tr8 { flex: 1; min-height: 0; }
        .tr8 .tin { display: grid; grid-template-columns: 1fr 640px; gap: .8em; height: 100%; font-size: .62em; }
        .tr8 .lc, .tr8 .rc { display: flex; flex-direction: column; gap: .6em; min-height: 0; min-width: 0; }
        .tr8 .code { flex: 1; display: flex; flex-direction: column; gap: .3em; }
        .tr8 .code pre { font-size: 1.05em; margin: 0; background: none; }
                .tr8 .tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5em; margin-top: .4em; }
        .tr8 .tab { border-radius: 8px; padding: .35em .6em; transition: all .3s; opacity: .6; }
        .tr8 .tab .n { font-size: .7em; color: var(--muted); }
        .tr8 .tab .t { font-weight: 700; color: var(--accent); font-size: .9em; }
        .tr8 .tab.done { opacity: .85; }
        .tr8 .tab.on { opacity: 1; background: color-mix(in srgb, var(--accent) 14%, transparent); }
        .tr8 .tab.t1.on { background: color-mix(in srgb, var(--loss) 14%, transparent); } .tr8 .tab.t1 .t { color: var(--loss); }
        .tr8 .tab.t2.on { background: color-mix(in srgb, var(--grad) 14%, transparent); } .tr8 .tab.t2 .t { color: var(--grad); }
        .tr8 .tab.t3.on { background: color-mix(in srgb, var(--update) 14%, transparent); } .tr8 .tab.t3 .t { color: var(--update); }
        .tr8 .pic { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: .3em; }
        .tr8 .pic p { font-size: .9em; margin: .2em 0; }
        .tr8 .pic .mut { color: var(--muted); }
        .tr8 .pic .mut b { color: var(--fg); }
        .tr8 .vh { font-weight: 700; color: var(--fg); }
        .tr8 .pic.s3 .vh { color: var(--loss); } .tr8 .pic.s4 .vh { color: var(--grad); } .tr8 .pic.s5 .vh { color: var(--update); }
        .tr8 .big { font-size: 1.15em; padding: .3em 0; }
        .tr8 .bars { width: 100%; }
        .tr8 .bars .ax { stroke: var(--line-2); }
        .tr8 .bars rect.lt { fill: var(--faint); } .tr8 .bars rect.dg { fill: var(--digit); } .tr8 .bars rect.tg { fill: var(--target); }
        .tr8 .bars text { font-family: var(--mono); font-size: 13px; fill: var(--muted); text-anchor: middle; } .tr8 .bars text.tg { fill: var(--target); font-weight: 700; }
        .tr8 .upd { display: grid; grid-template-columns: 1fr 1fr; gap: .2em 1em; font-size: .95em; }
        .tr8 .upd .u { color: var(--update); font-weight: 700; }
        .tr8 .km { font-size: .9em; }
        .tr8 .km > div { color: var(--muted); transition: color .3s; }
        .tr8 .km > div.on { color: var(--fg); font-weight: 600; }
        .tr8 .km h3 { color: var(--accent); } .tr8 .bar-l h3 { color: var(--loss); }
      `})]})}export{u as default};