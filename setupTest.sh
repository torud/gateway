#!/bin/bash

MDNS_NAME="kuengsauna"
HOTSPOT_SSID="Sauna-Hotspot"
HOTSPOT_PWD="kuengsaunaHotspotPassword1234"
YALER_RELAIS_DOMAIN="gsiot-6p05-1srr"

echo "setting up NanoPi NEO with mDNS-name $MDNS_NAME, hotspot SSID $HOTSPOT_SSID, hotspot password $PASSWORD and Yaler relais domain $YALER_RELAIS_DOMAIN"

# setup network discovery with mDNS
cat <<EOT > '/root/WoT/shellVariablesTest'
127.0.0.1    localhost.localdomain localhost
127.0.1.1    $MDNS_NAME
EOT