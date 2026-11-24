import{t as e}from"./hooks.module.U3JihANK.js";import{o as t,r as n}from"./hooks.CTQS5bFp.js";var r=[{name:`tiny microcontroller`,sub:`one instruction at a time · ~100 MHz · no cache`},{name:`tenstorrent "baby" core`,sub:`small, in order · 5 per tensix tile · 120 tiles on blackhole`},{name:`big desktop-class core`,sub:`out of order · ~4 GHz · hundreds of instructions in flight`}],i=[`32 registers, 64 bits each`,`these instructions, and what each one does`,`how each instruction is written as 4 bytes`,`how loads and stores see memory`],a=[`how fast`,`how many instructions it works on at once`,`caches, or how big`];function o(){let o=e(null),s=n(o);return t(`div`,{class:`isa-layers`,ref:o,children:[t(`div`,{class:`il-left`,children:[t(`div`,{class:`il-prog`,children:[t(`span`,{children:`your program`}),t(`code`,{class:`fade ${s>=1?`on`:``}`,children:`b3 83 c3 01 …`})]}),t(`div`,{class:`il-band`,children:[t(`b`,{children:`the isa`}),` `,t(`span`,{class:`muted`,children:`(rv64im)`}),t(`span`,{class:`muted il-band-sub`,children:`a contract between software and hardware`})]}),t(`div`,{class:`il-chips`,children:r.map(e=>t(`div`,{class:`il-chip ${s>=1?`run`:``}`,children:[t(`div`,{children:e.name}),t(`div`,{class:`muted il-sub`,children:e.sub}),t(`div`,{class:`il-ok fade ${s>=1?`on`:``}`,children:`same bytes, same answer ✓`})]}))}),t(`p`,{class:`muted il-other fade ${s>=1?`on`:``}`,children:`x86 and arm are other contracts. same idea, different instructions`})]}),t(`div`,{class:`il-right`,children:[t(`div`,{class:`fade ${s>=2?`on`:``}`,children:[t(`h3`,{children:`promises`}),t(`ul`,{children:i.map(e=>t(`li`,{children:e}))})]}),t(`div`,{class:`fade ${s>=3?`on`:``}`,children:[t(`h3`,{children:`doesn't say`}),t(`ul`,{class:`not`,children:a.map(e=>t(`li`,{children:e}))}),t(`p`,{class:`muted il-later`,children:`that's up to the chip. we'll open one up at the end`})]})]}),t(`style`,{children:`
        .isa-layers { display: flex; gap: 2.5em; font-size: .72em; align-items: flex-start; }
        .isa-layers .il-left { flex: 1.5; display: flex; flex-direction: column; gap: .7em; }
        .isa-layers .il-right { flex: 1; display: flex; flex-direction: column; gap: 1em; }
        .isa-layers .il-prog { background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
          padding: .7em 1em; display: flex; justify-content: space-between; align-items: center; }
        .isa-layers .il-band { border: 2px solid var(--accent); border-radius: 10px; padding: .6em 1em;
          background: color-mix(in srgb, var(--accent) 8%, transparent); }
        .isa-layers .il-band-sub { display: block; font-size: .8em; }
        .isa-layers .il-chips { display: flex; gap: .7em; }
        .isa-layers .il-chip { flex: 1; background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
          padding: .7em .8em; transition: border-color .4s; }
        .isa-layers .il-chip.run { border-color: var(--fill-green); }
        .isa-layers .il-sub { font-size: .75em; margin-top: .3em; }
        .isa-layers .il-ok { color: var(--good); font-size: .75em; margin-top: .5em; }
        .isa-layers .il-other { font-size: .8em; margin: 0; }
        .isa-layers h3 { font-size: 1em; margin: 0 0 .2em; }
        .isa-layers ul { margin: 0; font-size: .9em; }
        .isa-layers ul.not li::marker { content: '✗  '; color: var(--bad); }
        .isa-layers .il-later { font-size: .8em; margin: .4em 0 0; }
      `})]})}export{o as default};