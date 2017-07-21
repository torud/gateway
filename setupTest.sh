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

# setup network discovery with mDNS
cat <<EOT > $GITFOLDER'shellVariablesTest'
[Unit]
Description=Node.js Web of Things Server

[Service]

ExecStartPre=/bin/sh -c 'exec /bin/echo "[`date`] WoT-Server Starting" > /var/log/wotserverLog.log'
ExecStopPost=/bin/sh -c 'exec /bin/echo "[`date`] WoT-Server Stopped" >> /var/log/wotserverLog.log'


ExecStart=/bin/sh -c 'exec /usr/local/bin/node $WOTSERVER_LOCATIONwot.js >> /var/log/wotserverLog.log'
#WorkingDirectory=$WOTSERVER_LOCATION   # Required on some systems
Restart=always
# give up restarting if there are 10 restarts within 90 seconds
StartLimitInterval=90
StartLimitBurst=10
#RestartSec=10                                  # Restart service after 10 seconds if node service crashes

StandardOutput=syslog                           # Output to syslog of systemd (view with journalctl)
StandardError=syslog                            # Output to syslog of systemd (view with journalctl)
SyslogIdentifier=WoT-Server
#User=<alternate user>
#Group=<alternate group>

# the port on which the server runs has to be mentioned here
Environment=NODE_ENV=production PORT=8484

[Install]
WantedBy=multi-user.target
EOT