#!/bin/bash

MDNS_NAME="kuengsauna"
HOTSPOT_SSID="Sauna-Hotspot"
HOTSPOT_PWD="kuengsaunaHotspotPassword1234"
URL_GITHUB="https://github.com/joelthierry/"
REPOSITORY="gateway"
YALER_RELAIS_DOMAIN="gsiot-6p05-1srr"

echo "setting up NanoPi NEO with mDNS-name $MDNS_NAME\n
hotspot SSID $HOTSPOT_SSID\n
hotspot password $PASSWORD\n
github url $URL_GITHUB\n
repository folder $REPOSITORY\n
Yaler relais domain $YALER_RELAIS_DOMAIN"

# setup network discovery with mDNS
cat <<EOT > '/root/WoT/shellVariablesTest'
127.0.0.1    localhost.localdomain localhost
127.0.1.1    $URL_GITHUB/$REPOSITORY
EOT