import{r as e}from"./preact.module.Bl7PEaKa.js";import{a as t,t as n}from"./hooks.module.U3JihANK.js";import{a as r,o as i,r as a}from"./hooks.CTQS5bFp.js";import{t as o}from"./Code.DX1tbTM2.js";import{a as s,c,r as l,s as u}from"./image.CiJbjrhy.js";var d=2,f=u(l,d),p=24,m=`
for (int i = 0; i < n; i++)
  out[i] = min(img[i] * 2, 255);`,h=`
// i = my number. no loop
out[i] = min(img[i] * 2, 255);`,g=[i(e,{children:`the job: an underexposed photo, every pixel × 2. a cpu core does it with a loop: pixel 0, then 1, then 2 …`}),i(e,{children:`but no pixel needs another pixel's answer. pixel 500 doesn't care whether pixel 499 is done. nothing forces an order`}),i(e,{children:[`so drop the loop. one `,i(`b`,{children:`thread`}),` per pixel, all doing the same few steps, each told only its number `,i(`code`,{children:`i`}),`: `,s.toLocaleString(),` threads for this photo, 12 million for one from a phone`]}),i(e,{children:[`that's the whole programming model: write what `,i(`b`,{children:`one`}),` pixel does, ask for one thread per pixel. the rest of part 1 is how one chip runs that many`]})];function _(){let u=n(null),_=n(null),v=n(null),y=Math.min(g.length-1,a(u)),b=r(u,30),x=y>=2,S=x?s:Math.min(s,b*p%(s+960));t(()=>c(_.current,l),[]),t(()=>{let e=x?f:Uint8Array.from(l,(e,t)=>t<S?f[t]:e);c(v.current,e)},[S,x]);let C=Math.min(S,s-1),w=C%128/128*100,T=Math.floor(C/128)/80*100;return i(`div`,{class:`job`,ref:u,children:[i(`div`,{class:`job-top`,children:[i(`figure`,{children:[i(`canvas`,{ref:_}),i(`figcaption`,{class:`muted`,children:[`the photo · `,128,` × `,80,` = `,s.toLocaleString(),` pixels`]})]}),i(`div`,{class:`job-mid`,children:[i(`div`,{class:`muted job-t`,children:x?`gpu: what one pixel does, once per thread`:`cpu: a loop`}),i(o,{lang:`c`,code:x?h:m}),i(`div`,{class:`job-who`,children:x?i(e,{children:[i(`b`,{children:s.toLocaleString()}),` threads, at once`]}):i(e,{children:[`one core · i = `,i(`b`,{children:C.toLocaleString()})]})})]}),i(`figure`,{children:[i(`div`,{class:`job-frame`,children:[i(`canvas`,{ref:v}),!x&&S<10240&&i(`i`,{class:`job-mark`,style:{left:`${w}%`,top:`${T}%`}})]}),i(`figcaption`,{class:`muted`,children:[`× `,d,`, capped at 255 (white)`]})]})]}),i(`div`,{class:`caption job-text`,children:g[y]}),i(`style`,{children:`
        .job .job-top { display: flex; gap: 1.4em; align-items: center; justify-content: center; }
        .job figure { margin: 0; flex: none; }
        .job canvas { display: block; width: 448px; height: 280px; image-rendering: pixelated; border-radius: 6px; }
        .job figcaption { font-size: .48em; margin-top: .4em; }
        .job .job-frame { position: relative; }
        .job .job-mark { position: absolute; width: 2.34375%; height: 3.75%; transform: translate(-33%, -33%);
          box-shadow: 0 0 0 2px var(--hot); border-radius: 2px; }
        .job .job-mid { flex: none; width: 15em; font-size: .9em; }
        .job .job-mid pre { margin: 0; font-size: .58em; }
        .job .job-t { font-size: .5em; margin-bottom: .3em; }
        .job .job-who { font: .52em var(--mono); margin-top: .6em; color: var(--muted); }
        .job .job-who b { color: var(--hot); }
        .job .job-text { font-size: .8em; min-height: 3.2em; margin-top: 1.1em; }
      `})]})}export{_ as default};