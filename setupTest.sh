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

echo "setting up NanoPi NEO with following settings:
mDNS-name                       $MDNS_NAME
hotspot SSID                    $HOTSPOT_SSID
hotspot password                $HOTSPOT_PWD
folder to clone github in       $GITFOLDER
github url                      $URL_GITHUB
repository folder               $REPOSITORY
auth-server folder              $AUTHSERVER_LOCATION
wot-server folder               $WOTSERVER_LOCATION
Yaler relais domain             $YALER_RELAIS_DOMAIN"

# setup network discovery with mDNS
cat <<EOT > $GITFOLDER'shellVariablesTest'
127.0.0.1    localhost.localdomain localhost
127.0.1.1    $GITFOLDER$REPOSITORY$AUTHSERVER_LOCATION
EOT