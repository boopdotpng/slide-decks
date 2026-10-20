"""rv: run RISC-V (RV64IM) assembly.

    rv run prog.s     assemble and run; every `ebreak` prints all 32 registers
"""

import argparse
import sys

from .machine import Fault, Machine
from .program import BuildError, assemble


def main():
    parser = argparse.ArgumentParser(prog="rv", description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run", help="assemble and run a .s file")
    run.add_argument("file")
    run.add_argument("--max-steps", type=int, default=10_000_000,
                     help="stop after this many instructions (default: 10 million)")
    args = parser.parse_args()

    try:
        program = assemble(args.file)
    except (BuildError, FileNotFoundError) as e:
        print(f"rv: {e}", file=sys.stderr)
        sys.exit(1)

    m = Machine(program)
    try:
        sys.exit(m.run(args.max_steps))
    except Fault as e:
        m.dump_registers(f"crash at {m.where(m.pc)}")
        print(f"\nerror: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
