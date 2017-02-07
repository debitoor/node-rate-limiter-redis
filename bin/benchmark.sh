#!/bin/sh 
cd "$(dirname "$0")"

output=$(node ../benchmark/index $1 --validate-method)
ret_code=$?
if [ $ret_code != 0 ]; then
    printf "\n"
    printf " usage:\n"
    printf "       benchmark.sh method\n"
    printf "\n"
    printf "${output}\n"
    printf "\n"
    exit $ret_code
fi

printf "low load (1k requests in 2s)\n"
node ../benchmark/index $1 2000 200 &
node ../benchmark/index $1 2000 200 &
node ../benchmark/index $1 2000 200 &
node ../benchmark/index $1 2000 200 &
node ../benchmark/index $1 2000 200 &
wait

printf "normal load (10k requests in 2s)\n"
node ../benchmark/index $1 2000 2000 &
node ../benchmark/index $1 2000 2000 &
node ../benchmark/index $1 2000 2000 &
node ../benchmark/index $1 2000 2000 &
node ../benchmark/index $1 2000 2000 &
wait

printf "high load (20k requests in 2s)\n"
node ../benchmark/index $1 2000 4000 &
node ../benchmark/index $1 2000 4000 &
node ../benchmark/index $1 2000 4000 &
node ../benchmark/index $1 2000 4000 &
node ../benchmark/index $1 2000 4000 &
wait
