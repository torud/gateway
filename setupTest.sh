#!/bin/bash

MDNS_NAME="kuengsauna"
HOTSPOT_SSID="Sauna-Hotspot"
HOTSPOT_PWD="kuengsaunaHotspotPassword1234"
GITFOLDER="/root/WoT/"
URL_GITHUB="https://github.com/joelthierry/"
REPOSITORY="gateway/"
AUTHSERVER_LOCATION="wot-gateway/auth/"
WOTSERVER_LOCATION="wot-gateway/wot-server/"
YALER_RELAIS_DOMAIN="gsiot-6p05-1srr"

echo -e "setting up NanoPi NEO with following settings:
mDNS-name                       \t$MDNS_NAME
hotspot SSID                    \t$HOTSPOT_SSID
hotspot password                \t$PASSWORD
folder to clone github in       \t$GITFOLDER
github url                      \t$URL_GITHUB
repository folder               \t$REPOSITORY
auth-server folder              \t$AUTHSERVER_LOCATION
wot-server folder               \t$WOTSERVER_LOCATION
Yaler relais domain             \t$YALER_RELAIS_DOMAIN"

# setup network discovery with mDNS
cat <<EOT > '$GITFOLDERshellVariablesTest'
127.0.0.1    localhost.localdomain localhost
127.0.1.1    $GITFOLDER$REPOSITORY$AUTHSERVER_LOCATION
EOT