#!/bin/sh
# tiny shakespeare: ~1 MB, 40k lines of plays. karpathy's char-rnn dataset
cd "$(dirname "$0")" && mkdir -p data
curl -sL -o data/input.txt https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt
wc -c data/input.txt
