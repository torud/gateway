#!/bin/bash

MDNS_NAME="kuengsauna"
HOTSPOT_SSID="Sauna-Hotspot"
HOTSPOT_PWD="kuengsaunaHotspotPassword1234"
GITFOLDER="/root/WoT/"
USERNAME_GITHUB="joelthierry"
EMAIL_GITHUB="thierry.durot@ntb.ch"
URL_GITHUB="https://github.com/joelthierry/"
REPOSITORY="gateway/"
AUTHSERVER_LOCATION=$GITFOLDER$REPOSITORY"wot-gateway/auth/"
WOTSERVER_LOCATION=$GITFOLDER$REPOSITORY"wot-gateway/wot-server/"
YALER_RELAIS_DOMAIN="gsiot-6p05-1srr"

echo "setting up NanoPi NEO with following settings:
mDNS-name                       $MDNS_NAME
hotspot SSID                    $HOTSPOT_SSID
hotspot password                $HOTSPOT_PWD
folder to clone github in       $GITFOLDER
github username                 $USERNAME_GITHUB
github email                    $EMAIL_GITHUB
github url                      $URL_GITHUB
repository folder               $REPOSITORY
auth-server folder              $AUTHSERVER_LOCATION
wot-server folder               $WOTSERVER_LOCATION
Yaler relais domain             $YALER_RELAIS_DOMAIN"


CHECKWIFICONNECTION=$AUTHSERVER_LOCATION"checkWiFiConnection.sh"
cat <<EOT > $GITFOLDER'shellVariablesTest'
[Unit]
Description=checkWiFiConnection caller

[Service]

ExecStart=/bin/bash $CHECKWIFICONNECTION

Restart=always
# give up restarting if there are 10 restarts within 60 seconds
StartLimitInterval=60
StartLimitBurst=10
RestartSec=10

StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=changeToHotspotIfNeeded


[Install]
WantedBy=multi-user.target
EOT