#!/bin/bash

docker compose down

docker volume rm ragrug_mqtt_config
docker volume rm ragrug_mqtt_data
docker volume rm ragrug_grafana_config
docker volume rm ragrug_grafana_data
docker volume rm ragrug_node-red
docker volume rm ragrug_couchdb_data
docker volume rm ragrug_couchdb_etc
docker volume rm ragrug_influxdb
docker volume rm ragrug_http
