#!/bin/sh

run_test () {
  npx mocha --exit --bail --require mocha-steps ./integration-tests/work-flows/settlement/$1
}

run_test 1-start-of-single-scenarios/1-start-single-nsc-fulfilled-agreed.spec.js
run_test 1-start-of-single-scenarios/1-start-single-nsc-rejected.spec.js
run_test 1-start-of-single-scenarios/2-start-single-dsc-fullfilled-agreed.spec.js
run_test 1-start-of-single-scenarios/2-start-single-dsc-rejected.spec.js
run_test 2-single-challengeable-scenarios/1-single-nsc-simple-fulfilled-disputed-seized.spec.js
run_test 2-single-challengeable-scenarios/3-single-dsc-simple-fulfilled-disputed-seized.spec.js
