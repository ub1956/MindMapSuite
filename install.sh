#!/bin/sh
#
# Install script for the MindWeb Suite.
# (c) Sebastian Muszytowski
if [ -z "$1" ]
then
  echo "Usage: \"sh install.sh /destination/directory\""
else
  echo "\n\nInstall MindWeb to ${1}"
  cp -R . ${1}
  echo "Successfully installed MindWeb!"
  echo "Please point your webbrowser to the install.php script!\n"
  echo "#######################################################\n# Apache VHOST Configuration (in case you use apache) #\n#######################################################\n"
  cat apache_vhost_config
fi

