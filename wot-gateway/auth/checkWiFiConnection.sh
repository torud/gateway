#!/bin/bash

echo "Hello"
CONNECTIONS=$(nmcli dev)
echo "${CONNECTIONS}"
if [[ "$CONNECTIONS" =~ "unmanaged" ]]; then
    echo "matched"
else
    echo "didn't match"
fi
echo "Bye Bye"