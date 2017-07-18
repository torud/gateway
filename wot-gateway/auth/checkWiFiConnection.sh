#!/bin/bash

echo "Hello"
CONNECTIONS=$(nmcli dev)
# echo "${CONNECTIONS}"
if [[ "$CONNECTIONS" =~ "disconnected" ]]; then
    echo "disconnected, running changeWiFiDongleToHotspot.sh"
    sh ./changeWiFiDongleToHotspot.sh
else
    echo "connected"
fi
echo "Bye Bye"