import{r as e}from"./preact.module.Bl7PEaKa.js";import{i as t,t as n}from"./hooks.module.BNbONuGS.js";import{n as r,r as i,t as a}from"./jsxRuntime.module.C3VZDa9b.js";import{i as o,n as s,r as c,t as l}from"./image.JmJtW1sF.js";import{t as u}from"./Code.P8oGKkO2.js";var d=2,f=c(l,d),p=24,m=`
for (int i = 0; i < n; i++)
  out[i] = min(img[i] * 2, 255);`,h=`
// i = my number. no loop
out[i] = min(img[i] * 2, 255);`,g=[a(e,{children:`a cpu: one loop, one pixel after another`}),a(e,{children:`no pixel needs another pixel's answer`}),a(e,{children:[`so drop the loop: one `,a(`b`,{children:`thread`}),` per pixel, each told only its number `,a(`code`,{children:`i`}),`. `,s.toLocaleString(),` threads here, 12 million for a phone photo`]}),a(e,{children:[`the whole model: write what `,a(`b`,{children:`one`}),` pixel does, ask for a thread per pixel`]})];function _(){let c=n(null),_=n(null),v=n(null),y=Math.min(g.length-1,r(c)),b=i(c,30),x=y>=2,S=x?s:Math.min(s,b*p%(s+960));t(()=>o(_.current,l),[]),t(()=>{let e=x?f:Uint8Array.from(l,(e,t)=>t<S?f[t]:e);o(v.current,e)},[S,x]);let C=Math.min(S,s-1),w=C%128/128*100,T=Math.floor(C/128)/80*100;return a(`div`,{class:`job`,ref:c,children:[a(`div`,{class:`job-top`,children:[a(`figure`,{children:[a(`canvas`,{ref:_}),a(`figcaption`,{class:`muted`,children:[`the photo · `,128,` × `,80,` = `,s.toLocaleString(),` pixels`]})]}),a(`div`,{class:`job-mid`,children:[a(`div`,{class:`muted job-t`,children:x?`gpu: what one pixel does, once per thread`:`cpu: a loop`}),a(u,{lang:`c`,code:x?h:m}),a(`div`,{class:`job-who`,children:x?a(e,{children:[a(`b`,{children:s.toLocaleString()}),` threads, at once`]}):a(e,{children:[`one core · i = `,a(`b`,{children:C.toLocaleString()})]})})]}),a(`figure`,{children:[a(`div`,{class:`job-frame`,children:[a(`canvas`,{ref:v}),!x&&S<10240&&a(`i`,{class:`job-mark`,style:{left:`${w}%`,top:`${T}%`}})]}),a(`figcaption`,{class:`muted`,children:[`× `,d,`, capped at 255 (white)`]})]})]}),a(`div`,{class:`caption job-text`,children:g[y]}),a(`style`,{children:`
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