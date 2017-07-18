#!/bin/bash

echo "Hello"
OUTPUT=$(nmcli dev)
echo "${OUTPUT}"
echo "Bye Bye"