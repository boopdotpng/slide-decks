import{r as e}from"./preact.module.Bl7PEaKa.js";import{i as t,t as n}from"./hooks.module.BNbONuGS.js";import{n as r,t as i}from"./jsxRuntime.module.C3VZDa9b.js";import{i as a,n as o,t as s}from"./image.JmJtW1sF.js";import{t as c}from"./Code.P8oGKkO2.js";var l=`__global__ void brighten(unsigned char *img, int n, int a) {
  int i = blockIdx.x * blockDim.x + threadIdx.x;
  if (i < n) img[i] = min(img[i] * a, 255);
}

brighten<<<(n + 255) / 256, 256>>>(img, n, 2);`,u=`__global__ void brighten2d(unsigned char *img, int w, int h, int a) {
  int x = blockIdx.x * blockDim.x + threadIdx.x;   // column
  int y = blockIdx.y * blockDim.y + threadIdx.y;   // row
  if (x < w && y < h) img[y * w + x] = min(img[y * w + x] * a, 255);
}

dim3 block(16, 16), grid((w + 15) / 16, (h + 15) / 16);
brighten2d<<<grid, block>>>(img, w, h, 2);`,d=`__global__ void vector_add(const float *a, const float *b, float *c, int n) {
  int i = ...;       // which element is mine?
  if (...) return;   // am i past the end?
  c[i] = a[i] + b[i];
}`,f=16,p=5,m=1,h=9,g=6,_=89,v=22,y=12,b=5,x=o/256,S={b:5,t:37},C=1e4,w=Math.ceil(C/256),T=[{code:1,hl:[],pic:`strip`,text:i(e,{children:[`the whole kernel: what `,i(`b`,{children:`one`}),` pixel does, in cuda. every thread runs all of it`]})},{code:1,hl:[1],pic:`strip`,strip:`me`,text:i(e,{children:`which pixel is mine: skip whole blocks, then my spot in mine`})},{code:1,hl:[2],pic:`strip`,strip:`odd`,text:i(e,{children:[`our `,o,` pixels are exactly `,x,` blocks, but most sizes aren't: the last block sticks out, so check `,i(`code`,{children:`i < n`})]})},{code:1,hl:[5],pic:`strip`,strip:`launch`,text:i(e,{children:[`the launch: `,i(`code`,{children:`<<<blocks, threads per block>>>`}),`, rounding up, then the arguments`]})},{code:2,hl:[1,2,6],pic:`tiles`,text:i(e,{children:[`the 2d version on the photo: `,128/f,` × `,80/f,` blocks of 16 × 16. block (`,p,`, `,m,`), thread (`,h,`, `,g,`) → column `,_,`, row `,v]})},{code:3,hl:[1,2],pic:`vec`,text:i(e,{children:`your turn: the same two questions, for adding two arrays. one thread per element, check the end`})}];function E(){let p=n(null),m=n(null),h=T[Math.min(T.length-1,r(p))];t(()=>a(m.current,s),[]);let g=(e,t)=>`${e/t*100}%`;return i(`div`,{class:`kernel`,ref:p,children:[i(`div`,{class:`kn-cols`,children:[i(`div`,{class:`kn-code`,children:i(c,{lang:`cpp`,code:h.code===1?l:h.code===2?u:d,hl:h.hl})}),i(`div`,{class:`kn-pic`,children:[i(`div`,{class:`kn-strip fade ${h.pic===`strip`?`on`:``}`,children:[i(`div`,{class:`muted kn-cap`,children:h.strip===`odd`?i(e,{children:[`if n = `,C,`: `,w,` blocks, `,w*256-C,` threads past the end`]}):i(e,{children:[`img[0 … `,o-1,`], one line of bytes: `,x,` blocks of `,256]})}),i(`div`,{class:`kn-blocks`,children:Array.from({length:h.strip===`odd`?w:x},(e,t)=>{let n=h.strip===`odd`&&t===w-1?(C-t*256)/256:1;return i(`i`,{class:`${h.strip===`me`&&t===S.b?`me`:``} ${n<1?`past`:``}`,children:n<1&&i(`b`,{style:{width:`${n*100}%`}})})})}),i(`div`,{class:`kn-sc`,children:[h.strip===`me`&&i(e,{children:[`block `,i(`span`,{class:`c-b`,children:S.b}),`, thread `,i(`span`,{class:`c-t`,children:S.t}),`: `,i(`span`,{class:`c-b`,children:S.b}),` * `,i(`span`,{class:`c-s`,children:256}),` + `,i(`span`,{class:`c-t`,children:S.t}),` = `,i(`span`,{class:`c-r`,children:S.b*256+S.t})]}),h.strip===`odd`&&i(e,{children:`dashed: threads with i ≥ n. they do nothing`}),h.strip===`launch`&&i(e,{children:[`(`,i(`span`,{class:`c-s`,children:10240}),` + 255) / 256 = `,i(`span`,{class:`c-r`,children:x}),` blocks × 256 threads`]})]})]}),i(`div`,{class:`kn-photo fade ${h.pic===`tiles`?`on`:``}`,children:[i(`div`,{class:`kn-img`,children:[i(`canvas`,{ref:m}),Array.from({length:128/f-1},(e,t)=>i(`i`,{class:`kn-v`,style:{left:g((t+1)*f,128)}})),Array.from({length:80/f-1},(e,t)=>i(`i`,{class:`kn-h`,style:{top:g((t+1)*f,80)}})),i(`i`,{class:`kn-blk`,style:{left:g(80,128),top:g(16,80),width:g(f,128),height:g(f,80)}}),i(`i`,{class:`kn-cx`,style:{left:g(89.5,128)}}),i(`i`,{class:`kn-cy`,style:{top:g(22.5,80)}}),i(`i`,{class:`kn-px`,style:{left:g(_,128),top:g(v,80),width:g(1,128),height:g(1,80)}})]}),i(`div`,{class:`muted kn-cap`,children:[128/f,` × `,80/f,` blocks of 16 × 16 threads`]})]}),i(`div`,{class:`kn-vec fade ${h.pic===`vec`?`on`:``}`,children:[[`a`,`b`,`c`].map(e=>i(`div`,{class:`kn-vr`,children:[i(`span`,{class:`kn-vn`,children:e}),Array.from({length:y},(t,n)=>i(`i`,{class:n===b?e===`c`?`out`:`in`:``}))]})),i(`div`,{class:`kn-vr kn-vt`,children:[i(`span`,{class:`kn-vn`}),Array.from({length:y},(e,t)=>i(`span`,{children:t===b?`▲`:``}))]}),i(`div`,{class:`muted kn-mcap`,children:[`thread `,b,`: reads a[`,b,`] and b[`,b,`], writes c[`,b,`]`]})]})]})]}),i(`div`,{class:`caption kn-text`,children:h.text}),i(`style`,{children:`
        .kernel .kn-cols { display: flex; gap: 1.6em; align-items: center; }
        .kernel .kn-code { flex: 1.7; min-width: 0; }
        .kernel .kn-code pre { margin: 0; font-size: .44em; overflow: hidden; }
        .kernel .kn-pic { flex: 1; display: grid; align-items: center; }
        .kernel .kn-photo, .kernel .kn-vec, .kernel .kn-strip { grid-area: 1 / 1; }
        .kernel .kn-img { position: relative; }
        .kernel .kn-photo canvas { display: block; width: 100%; aspect-ratio: 128 / 80; image-rendering: pixelated; border-radius: 4px; }
        .kernel .kn-v, .kernel .kn-h, .kernel .kn-blk, .kernel .kn-px, .kernel .kn-cx, .kernel .kn-cy { position: absolute; pointer-events: none; }
        .kernel .kn-cx { top: 0; bottom: 0; width: 1px; background: color-mix(in srgb, var(--hot) 60%, transparent); }
        .kernel .kn-cy { left: 0; right: 0; height: 1px; background: color-mix(in srgb, var(--hot) 60%, transparent); }
        .kernel .kn-v { top: 0; bottom: 0; width: 1px; background: color-mix(in srgb, var(--accent) 55%, transparent); }
        .kernel .kn-h { left: 0; right: 0; height: 1px; background: color-mix(in srgb, var(--accent) 55%, transparent); }
        .kernel .kn-blk { box-shadow: inset 0 0 0 2px var(--hot); background: color-mix(in srgb, var(--hot) 18%, transparent); }
        .kernel .kn-px { background: var(--hot); outline: 2px solid var(--hot); outline-offset: 2px; }
        .kernel .kn-cap { font-size: .42em; margin-top: .4em; }
        .kernel .kn-vr { display: grid; grid-template-columns: 1.6em repeat(${y}, 1fr); gap: 3px; margin-bottom: 4px; align-items: center; }
        .kernel .kn-vn { font: .5em var(--mono); color: var(--muted); }
        .kernel .kn-vr i { aspect-ratio: 1; border-radius: 3px; background: var(--surface); }
        .kernel .kn-vr i.in { background: var(--accent); } .kernel .kn-vr i.out { background: var(--hot); }
        .kernel .kn-vt span { font-size: .4em; text-align: center; color: var(--hot); }
        .kernel .kn-mcap { font-size: .42em; margin-top: .4em; }
        .kernel .kn-blocks { display: grid; grid-template-columns: repeat(${x}, 1fr); gap: 2px; height: 56px; margin-top: .4em; }
        .kernel .kn-blocks i { position: relative; background: var(--surface); border-radius: 2px; }
        .kernel .kn-blocks i.me { background: var(--accent); }
        .kernel .kn-blocks i.past { background: transparent; outline: 1px dashed var(--muted); outline-offset: -1px; }
        .kernel .kn-blocks i.past b { position: absolute; left: 0; top: 0; bottom: 0; background: var(--surface); }
        .kernel .kn-sc { font: .46em/1.6 var(--mono); margin-top: .8em; min-height: 1.6em; white-space: nowrap; }
        .kernel .c-b { color: var(--accent); } .kernel .c-t { color: var(--teal); }
        .kernel .c-s { color: var(--purple); } .kernel .c-r { color: var(--hot); font-weight: 700; }
        .kernel .kn-text { font-size: .8em; min-height: 2.4em; margin-top: 1em; }
      `})]})}export{E as default};