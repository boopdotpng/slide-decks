# rnn: next character, one at a time

a vanilla rnn on tiny shakespeare, in tinygrad. the warm-up before gpt-2: same job (guess what comes next),
but it reads one character at a time and keeps everything it knows in one 512-number vector `h`.

```sh
PY=../../../ml/.venv/bin/python
./download.sh                     # data/input.txt (1.1 MB, karpathy's char-rnn dataset)
$PY train.py                      # ~100 s on an m-series mac (40 s of it compiling). loss 4.2 -> 1.4, writes rnn.safetensors
$PY sample.py "ROMEO:"            # ~3 s. -n 400 for more, --temp 0.5 for safer, 1.2 for wilder, --seed for a different play
$PY export.py                     # real numbers for the rnn slides -> ../gpt-2-arch/slides/public/data/rnn_*.json
```

- `train.py`: the data (chars → ids), the model (`step` is the whole rnn: `h = tanh(Wxh[x] + h @ Whh + b)`, guess = `h @ Why`),
  and the training loop (random 64-character snippets, h starts at zero each time). read top to bottom
- `sample.py`: feed the prompt in one character at a time, then sample a character, feed it back, repeat
- `export.py`: runs the same math in numpy for the slides, including the "how far back does it remember" experiment

after 4000 steps (`python sample.py "ROMEO:"`):

```
ROMEO:
Are but the child.

KING HENRY VI:
A good from his happiness your party orishous in a poor,
Which he too as anting
From my so propert to comes actice,
And so time and at the sighter are alas?
```

real speaker names, line breaks, verse-shaped lines, mostly real words. no meaning past a few words: that's the next slides.
