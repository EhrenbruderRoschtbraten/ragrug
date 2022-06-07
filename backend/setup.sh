#!/bin/bash

# create config volumes
docker volume create ragrug_mqtt_config
docker volume create ragrug_grafana_config
docker volume create ragrug_node-red
docker volume create ragurg_http

# start a dummy container which mounts necessary config volumes and copy the configs into the dummy container
docker container create \
    -v ragrug_mqtt_config:/mqtt_config \
    -v ragurg_grafana_config:/grafana_config \
    -v ragrug_node-red:/node-red \
    -v ragrug_http:/http-server \
    --name copyContainer \
    ubuntu:22.04

# copy setup and config files as well as HttpUI
docker cp ./grafana/conf/grafana.ini copyContainer:/grafana_config/grafana.ini
docker cp ./mqtt-server/mosquitto.conf copyContainer:/mqtt_config/mosquitto.conf
docker cp ./node-red/settings.js copyContainer:/node-red/settings.js
docker cp ./node-red/flows/rr_last.json copyContainer:/node-red/flows.json
docker cp ./../HtmlUI/. copyContainer:/http-server

# remove dummy container
docker stop copyContainer
docker rm copyContainer

# start docker compose
docker compose up -d --build

# Sleep for setup Set up couchdb
sleep 15
curl -u admin:123456 -X PUT http://localhost:5984/world

