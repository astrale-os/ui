#!/usr/bin/env bash
# UI uses browser automation; it does not require the published Astrale CLI.
export AGENT_SETUP_BROWSER="${AGENT_SETUP_BROWSER:-1}"
export AGENT_SETUP_ASTRALE_CLI="${AGENT_SETUP_ASTRALE_CLI:-0}"
