#!/bin/bash

echo "Hello"
CONNECTIONS=$(nmcli dev)
# echo "${CONNECTIONS}"
if [[ "$CONNECTIONS" =~ "disconnected" ]]; then
    echo "disconnected, running changeWiFiDongleToHotspot.sh"
    sh ./changeWiFiDongleToHotspot.sh
elif [[ "$CONNECTIONS" =~ "connected" ]]; then
    echo "connected"
else    
    echo "error, neither connected nor disconnected!"
fi
echo "Bye Bye"