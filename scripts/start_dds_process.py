"""Launch a hidden service with direct, inherited file handles for its logs.

PowerShell's redirected-output reader must not be responsible for pumping a
long-lived service's output after that PowerShell process has exited.
"""
import argparse
import os
import subprocess
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stdout', type=Path, required=True)
    parser.add_argument('--stderr', type=Path, required=True)
    parser.add_argument('--cwd', type=Path, required=True)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if not command:
        parser.error('A service command is required')
    for path in (args.stdout, args.stderr):
        path.parent.mkdir(parents=True, exist_ok=True)
    with args.stdout.open('ab', buffering=0) as output, args.stderr.open('ab', buffering=0) as errors:
        process = subprocess.Popen(command, cwd=args.cwd, stdin=subprocess.DEVNULL,
                                   stdout=output, stderr=errors,
                                   creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0,
                                   start_new_session=os.name != 'nt')
    print(process.pid)


if __name__ == '__main__':
    main()
