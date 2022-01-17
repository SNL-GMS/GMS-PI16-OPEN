# Maintenance

Here you will find instructions for common maintenance tasks you may need to perform on the system. Each task below assumes that you are connected
to the docker swarm cluster via UCP on a terminal.

## Exec'ing into a Container

In case you need to "login" ("exec") to the container, for example to browse files within it, follow these steps:

1. Run `docker ps | grep <service name>` (e.g. `docker ps | grep osd-signaldetection`)
2. Grab the container ID
3. Run `docker exec -it <container ID> bash`
4. You are now inside the container
5. When finished, type `exit`

## Viewing Services and Logs

1. Run `docker service ls` to view all the services across every stack
2. Run `docker service ls | grep <service name>` to view an individual service
3. To view service logs for a service, run `docker service logs <service name>` (use the -f option to follow the logs)

## Viewing Docker System Stats

In the case where you need to troubleshoot system-wide problems and gather system information about the docker cluster:

1. Run `docker system info`  
   This will show information about the entire docker system like CPU and memory, including node information as well
2. Run `docker system df`  
   This will show information about the disk space that's used and available in the cluster

## Restarting Services

1. Run `docker service scale <service name>=0`
2. Once the service is completely down, to bring it back up run `docker service scale <service name>=1`

## Pruning the Docker System

It's common for objects like images, containers and volumes in the docker system to become outdated and stale after a series of
containers restarts, multiple deployments, etc. To clear the docker system of these unused objects, follow the following steps:

**Note:** As of now, UCP does not support cluster-wide prune operations, so you must log into the node which you want to prune

1. Log in (ssh) to the node of your choice
2. Run `docker system prune`
3. Type 'y' and hit enter
3. If you would like to clean unused volumes as well, run `docker system prune --volumes`

## Kafkacat

1. docker ps | grep <deployment> | grep bastion
2. Grab <containerID>
3. docker exec -it <containerID> bash
4. Tap into the soh.extract kafka topic: `kafkacat -b kafka1 -t soh.extract -C`
5. `kafkacat -b kafka1 -t soh.rsdf -C > SOH.RSDF_100`
6. Use python tool on file created above: `record_rsdf.py SOH.RSDF_100`
7. These are the stations processed through in kafka for the last 60 seconds: `kafkacat -C -b kafka1 -t soh.extract -e -o s@$(awk "BEGIN {print ($(date +%s)-60)1000}") |\ sed -r 's/."channelName":"([A-Z0-9]).[A-Z0-9].[A-Z0-9]*".*/\1/' | sort -u`

## Debugging Common GMS Issues

### Postgres Troubleshooting
To docker exec into the postgres container:

```
psql_id=$( docker ps | grep <DEPLOYMENT_NAME>_postgresql-gms | cut -d' ' -f1 )
docker exec -it $psql_id psql gms gms_read_only
set search_path to gms_soh;
```

To determine the # of connections:

```
select * from pg_stat_activity where datname = 'gms';
```

Postgres Query to kill idle connections (assumes you have already docker exec'd into the container, see above)

```
select pg_terminate_backend(pg_stat_activity.pid) from pg_stat_activity where pg_stat_activity.datman = 'gms' and pid <> pg_backend_pid();
```

| Symptom | Possible Cause | Verification | Resolution |
| ------- | -------------- | ------------ | ---------- |
| 500 Internal Server Errors from OSD Services | | | |
| | Out of Storage Space | Check for near 100% disk utilization for the Node running Postgres and/or Cassandra | Wiping Databases |
| | Out of PSQL Connections | `docker exec` into the postgres container, connect to the db: `psql xmp_metadata xmp`, and run: `SELECT sum(numbackends) FROM pg_stat_database;` The limit is 100. | Clear the idle connections:  `select pg_terminate_backend(pg_stat_activity.pid) from pg_stat_activity where pg_stat_activity.datname = 'xmp_metadata' and pid <> pg_backend_pid();` |
| No Live Data in Nifi | | | |
| | Low-side Data Acquisition could be down | Check the data-diode services are running and that `nifi-data-acq.$SUBDOMAIN.$BASE_DOMAIN` is populated and running. | Double-check that the deployment procedures listed in [deploy](../deploy) were followed. Check storage usage. |
| | IP Addresses are wrong for CD1.1 | Double-check that the IP Addresses for dataman and conman in data-acq are set to the values of their pinned swarm nodes. | Update docker-compose-data-acq.yml accordingly and review the [deploy section.](../deploy) |
| | CD1.1 Data Provider not configured to forward to your service | Verify with the data provider that your conman IP has been added | Request the admin add it if not already added |
| | Kafka Stack and Data Diode Stack not co-located on the same Node | The Kafka and Data Diode Stack need to all be located on the same node to share the dataframe volume. Verify they are all running on the same Node and only have one volume | Apply labels to the services and node as necessary to limit them to the same node. |
| | Dataframes are not moving due to permissions issues or something else | `docker exec` into frame-management and check that there are frames moving from `/shared-volume/rsynced-files` to `/shared-volume/dataframes`. If you don't see any files or there are files backing up, then it's likely a service isn't running or doesn't have access to those files. | Check that permissions allow `rw` to anyone and that all services are healthy |
| Services Failing to Start | | | |
| | Out of Storage Space | Check for near 100% disk utilization for the Node running Postgres and/or Cassandra | Wiping Databases |
| | Missing Node Placement Constraints | Check the services for | Ensure that you've followed the instructions in [deploy](../deploy) for Applying Node Labels Placement Constraints |
| Flow Files Backing up in Nifi | | | |
| | Not Enough Threads Added | Check that the Number of Maximum Timer Driven Threads and Event Driven threads in Nifi (Menu -> Controller Settings -> General) are at least 100 and 5 respectively | Configure as necessary |
