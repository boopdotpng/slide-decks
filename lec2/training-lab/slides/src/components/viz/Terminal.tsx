/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';

/**
 * A terminal with a blinking cursor. Lines that get added (or change) are
 * typed out, so tie `lines` to the slide step to make output "appear":
 *
 *   <Terminal lines={step >= 3 ? ['$ ./hello', 'hello, world'] : ['$ ./hello']} />
 */
export function Terminal({ lines, msPerChar = 25 }: { lines: string[]; msPerChar?: number }) {
  const full = lines.join('\n');
  const [shown, setShown] = useState(full);
  useEffect(() => {
    // keep what's still a prefix, type the rest
    let n = 0;
    while (n < shown.length && n < full.length && shown[n] === full[n]) n++;
    if (n === full.length) { setShown(full); return; }
    setShown(full.slice(0, n));
    const id = setInterval(() => {
      n++;
      setShown(full.slice(0, n));
      if (n >= full.length) clearInterval(id);
    }, msPerChar);
    return () => clearInterval(id);
  }, [full]);
  return (
    <pre class="term" data-hold={full.length * msPerChar + 500}>{shown}<span class="cursor">▍</span></pre>
  );
}
