#!/bin/bash

POCKETNC_STATUS=$(systemctl status PocketNC | grep Active: | awk '{FS=":";print $2}')
ROCKHOPPER_STATUS=$(systemctl status Rockhopper | grep Active: | awk '{FS=":";print $2}')

echo "{ \"pocketnc\": \"${POCKETNC_STATUS}\", \"rockhopper\": \"${ROCKHOPPER_STATUS}\" }" 
