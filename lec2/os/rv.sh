#!/bin/sh
# Usage: ./rv.sh run examples/01_hello.s   (see: ./rv.sh --help)
PYTHONPATH="$(dirname "$0")${PYTHONPATH:+:$PYTHONPATH}" exec python3.15 -m rv "$@"
