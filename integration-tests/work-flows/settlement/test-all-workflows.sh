#!/bin/sh

run_test () {
  npx mocha --exit --bail --require mocha-steps $1

  if [ $? = 1 ]; then
    echo 'Test failure. Terminating.'
    exit $?
  fi
}

cd $(dirname $0)
tests=$(mktemp)
find . -type f -name \*.spec.js > $tests

for test in $(sort -t / $tests); do
  run_test $test
done
