#!/bin/sh

run_test () {
  npx mocha --exit --bail --require mocha-steps ./integration-tests/work-flows/settlement/$1

  if [ $? = 1 ]; then
    echo 'Test failure. Terminating.'
    exit $?
  fi
}

run_test 1-start-of-single-scenarios/1-start-single-nsc-fulfilled-agreed-eth.spec.js
run_test 1-start-of-single-scenarios/1-start-single-nsc-fulfilled-agreed-t18.spec.js
run_test 1-start-of-single-scenarios/1-start-single-nsc-fulfilled-agreed-t15.spec.js
run_test 1-start-of-single-scenarios/1-start-single-nsc-rejected-eth.spec.js
run_test 1-start-of-single-scenarios/1-start-single-nsc-rejected-t18.spec.js
run_test 1-start-of-single-scenarios/1-start-single-nsc-rejected-t15.spec.js
run_test 1-start-of-single-scenarios/2-start-single-dsc-fullfilled-agreed-eth.spec.js
run_test 1-start-of-single-scenarios/2-start-single-dsc-fullfilled-agreed-t18.spec.js
run_test 1-start-of-single-scenarios/2-start-single-dsc-fullfilled-agreed-t15.spec.js
run_test 1-start-of-single-scenarios/2-start-single-dsc-rejected-eth.spec.js
run_test 1-start-of-single-scenarios/2-start-single-dsc-rejected-t18.spec.js
run_test 1-start-of-single-scenarios/2-start-single-dsc-rejected-t15.spec.js
run_test 2-single-challengeable-scenarios/1-single-nsc-simple-fulfilled-disputed-seized-eth.spec.js
run_test 2-single-challengeable-scenarios/1-single-nsc-simple-fulfilled-disputed-seized-t18.spec.js
run_test 2-single-challengeable-scenarios/1-single-nsc-simple-fulfilled-disputed-seized-t15.spec.js
run_test 2-single-challengeable-scenarios/3-single-dsc-simple-fulfilled-disputed-seized-eth.spec.js
run_test 2-single-challengeable-scenarios/3-single-dsc-simple-fulfilled-disputed-seized-t18.spec.js
run_test 2-single-challengeable-scenarios/3-single-dsc-simple-fulfilled-disputed-seized-t15.spec.js
