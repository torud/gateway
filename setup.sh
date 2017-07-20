#!/bin/bash

# Network discovery with mDNS
sudo apt-get update
sudo apt-get install avahi-daemon
sudo nano /etc/hosts
sudo nano /etc/hostname
sudo /etc/init.d/hostname.sh

# setup wifi dongle as hotspot
sudo apt-get install unzip
sudo apt-get install hostapd
sudo apt-get install udhcpd
cd /tmp
sudo wget https://jankarres.de/wp-content/uploads/2015/06/hostapd_8188CUS.zip
sudo unzip hostapd_8188CUS.zip
sudo rm hostapd_8188CUS.zip
sudo mv /usr/sbin/hostapd /usr/sbin/hostapd_original
sudo mv hostapd /usr/sbin/hostapd
sudo chmod +x /usr/sbin/hostapd
cat <<EOT > '/etc/udhcpd.conf'
# Sample udhcpd configuration file (/etc/udhcpd.conf)

# The start and end of the IP lease block

start           192.168.2.2     #default: 192.168.0.20
end             192.168.2.100   #default: 192.168.0.254


# The interface that udhcpd will use

interface       wlan0           #default: eth0


# The maximim number of leases (includes addressesd reserved
# by OFFER's, DECLINE's, and ARP conficts

#max_leases     254             #default: 254


# If remaining is true (default), udhcpd will store the time
# remaining for each lease in the udhcpd leases file. This is
# for embedded systems that cannot keep time between reboots.
# If you set remaining to no, the absolute time that the lease
# expires at will be stored in the dhcpd.leases file.

remaining       yes             #default: yes


# The time period at which udhcpd will write out a dhcpd.leases
# file. If this is 0, udhcpd will never automatically write a
# lease file. (specified in seconds)

#auto_time      7200            #default: 7200 (2 hours)


# The amount of time that an IP will be reserved (leased) for if a
# DHCP decline message is received (seconds).

#decline_time   3600            #default: 3600 (1 hour)


# The amount of time that an IP will be reserved (leased) for if an
# ARP conflct occurs. (seconds

#conflict_time  3600            #default: 3600 (1 hour)


# How long an offered address is reserved (leased) in seconds

#offer_time     60              #default: 60 (1 minute)

# If a lease to be given is below this value, the full lease time is
# instead used (seconds).

#min_lease      60              #defult: 60

# The location of the leases file

#lease_file     /var/lib/misc/udhcpd.leases     #defualt: /var/lib/misc/udhcpd.leases

# The location of the pid file
#pidfile        /var/run/udhcpd.pid     #default: /var/run/udhcpd.pid

# Everytime udhcpd writes a leases file, the below script will be called.
# Useful for writing the lease file to flash every few hours.

#notify_file                            #default: (no script)

#notify_file    dumpleases      # <--- useful for debugging

# The following are bootp specific options, setable by udhcpd.

#siaddr         192.168.0.22            #default: 0.0.0.0

#sname          zorak                   #default: (none)

#boot_file      /var/nfs_root           #default: (none)

# The remainer of options are DHCP options and can be specifed with the
# keyword 'opt' or 'option'. If an option can take multiple items, such
# as the dns option, they can be listed on the same line, or multiple
# lines. The only option with a default is 'lease'.

#Examles
#opt    dns     192.168.10.2 192.168.10.10
opt     dns     8.8.8.8 4.2.2.2 # The DNS servers client devices will use
option  subnet  255.255.255.0
#opt    router  192.168.10.2
opt     router  192.168.2.1     # Adresse von Pi
opt     wins    192.168.10.10
option  dns     129.219.13.81   # appened to above DNS servers for a total of 3
option  domain  local
option  lease   864000          # 10 day DHCP lease time in seconds


# Currently supported options, for more info, see options.c
#opt subnet
#opt timezone
#opt router
#opt timesrv
#opt namesrv
#opt dns
#opt logsrv
#opt cookiesrv
#opt lprsrv
#opt bootsize
#opt domain
#opt swapsrv
#opt rootpath
#opt ipttl
#opt mtu

#opt ipttl
#opt mtu
#opt broadcast
#opt wins
#opt lease
#opt ntpsrv
#opt tftp
#opt bootfile
#opt wpad

# Static leases map
#static_lease 00:60:08:11:CE:4E 192.168.0.54
#static_lease 00:60:08:11:CE:3E 192.168.0.44
EOT

cat <<EOT > '/etc/default/udhcpd'
# Comment the following line to enable
# DHCPD_ENABLED="no"

# Options to pass to busybox' udhcpd.
#
# -S    Log to syslog
# -f    run in foreground

DHCPD_OPTS="-S"
EOT

sudo ifconfig wlan0 192.168.2.1

cat <<EOT > '/etc/network/interfaces'
# interfaces(5) file used by ifup(8) and ifdown(8)
# Include files from /etc/network/interfaces.d:
source-directory /etc/network/interfaces.d

allow-hotplug eth0
        iface eth0 inet dhcp

#allow-hotplug wlan0
#iface wlan0 inet dhcp
#        wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf

allow-hotplug wlan0
iface wlan0 inet static
        address 192.168.2.1
        netmask 255.255.255.0
EOT

cat <<EOT > '/etc/hostapd/hostapd.conf'
interface=wlan0
#driver=rtl871xdrv
ssid=wot_WiFi                   # change if desired
hw_mode=g
channel=13                      # change if desired
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=wotgateway1      # change if desired
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOT

cat <<EOT > '/etc/default/hostapd'
# Defaults for hostapd initscript
#
# See /usr/share/doc/hostapd/README.Debian for information about alternative
# methods of managing hostapd.
#
# Uncomment and set DAEMON_CONF to the absolute path of a hostapd configuration
# file and hostapd will be started during system boot. An example configuration
# file can be found at /usr/share/doc/hostapd/examples/hostapd.conf.gz
#
DAEMON_CONF="/etc/hostapd/hostapd.conf"

# Additional daemon options to be appended to hostapd command:-
#       -d   show more debug messages (-dd for even more)
#       -K   include key data in debug messages
#       -t   include timestamps in some debug messages
#
# Note that -B (daemon mode) and -P (pidfile) options are automatically
# configured by the init.d script and must not be added to DAEMON_OPTS.
EOT

sudo update-rc.d hostapd enable
sudo update-rc.d udhcpd enable
sudo service hostapd start
sudo service udhcpd start

# Installations for client mode
sudo apt-get -y -q install network-manager

# Node.js
cd /root
wget https://nodejs.org/dist/v4.4.2/node-v4.4.2-linux-armv7l.tar.gz
tar -xvf node-v4.4.2-linux-armv7l.tar.gz
cd node-v4.4.2-linux-armv7l
sudo cp -R * /usr/local/
sudo cp -R * /usr/local/

# install GitHub and clone repository
cd /root
mkdir WoT
cd WoT/
sudo apt-get install git
git config --global user.name "joelthierry"
git config --global user.email "thierry.durot@ntb.ch"
git clone https://github.com/joelthierry/gateway --recursive
cd gateway/

# make shell-scripts executable
cd /root/WoT/gateway/wot-gateway/auth/
chmod +x changeWiFiDongleToHotspot.sh
chmod +x changeWiFiDongleToClient.sh
chmod +x checkWiFiConnection.sh

# copy systemd-Files from repository into systemd-folder
cp  WoT/gateway/wot-gateway/wotserver.service /etc/systemd/system
$ cp  WoT/gateway/wot-gateway/authserver.service /etc/systemd/system
