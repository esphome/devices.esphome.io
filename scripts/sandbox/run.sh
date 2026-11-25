#!/bin/sh
# Run a command from the esphome-validate image in a throwaway container with
# no network, no environment from the host, and capped CPU, memory, processes
# and time. Extra docker arguments come from SANDBOX_DOCKER_ARGS.
# Usage: run.sh <timeout-seconds> <command> [args...]
limit="$1"
shift
# shellcheck disable=SC2086
exec docker run --rm --network none --cpus 2 --memory 3g --pids-limit 512 \
  --user "$(id -u):$(id -g)" -e HOME=/tmp $SANDBOX_DOCKER_ARGS \
  esphome-validate timeout "$limit" "$@"
