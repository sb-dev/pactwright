#!/bin/sh
# Runs every A2-G probe against the checkout it sits in.
#
#   sh tools/implementation-trial/a2-graph/run-all.sh
#
# Each probe prints one line per observation, prefixed `executed-pass` or
# `executed-fail`, then a count. A probe exits 0 whether or not observations
# failed: a failing observation is a finding, not a broken probe.
set -e
cd "$(dirname "$0")/../../.."
for probe in \
  probe-repository-revision \
  probe-closure \
  probe-backdated-evidence \
  probe-cross-lineage \
  probe-write-path \
  probe-structure \
  probe-identity-properties \
  probe-extension-ownership \
  probe-validation-cost
do
  echo "########## ${probe} ##########"
  npx tsx "tools/implementation-trial/a2-graph/${probe}.ts"
done
