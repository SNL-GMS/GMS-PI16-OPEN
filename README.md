![GMS Logo](doc/images/gms-logo.png)

# GMS Common

This repository contains the common code for the **Geophysical Monitoring System (GMS)**.

Source code is organized by language:
* Java code has been incorporated in the [java](java) subdirectory.
* Python code has been incorporated in the [python](python) subdirectory.
* Typescript code has been incorporated in the [typescript](typescript) subdirectory.

## Installation Instructions

Instructions for building, installing, and verifying the system can be [**found here**](doc/).

## GMS State-of-Health (SOH) Monitoring

The GMS Station State-of-Health (SOH) Monitoring provides a suite of
displays showing near real-time information about the state-of-health
of individual stations and station groups in use on the System.  These
displays provide support monitoring, detecting, and troubleshooting
problems with station data availability and quality.

Each station is given a status color (green = good SOH, yellow =
marginal SOH, red = bad SOH) based on whether the data from that
station meets configured thresholds over a configured period of time
for characteristics such as data latency, amount of missing data, and
environmental issues. SOH issues on individual channels roll up to
provide an overall SOH status color for that station. Overview
displays provide high-level monitoring and notification of issues
while more detailed displays allow the user to drill-down into more
in-depth information for troubleshooting.

### GMS SOH Persistent Services

| **Service Name** | **Description** |
|---|:---|
| da-connman                                  | Connection Manager for accepting connections for incoming CD1.1 data |
| da-dataman                                  | Data Manager for reading CD1.1 data |
| capability-soh-rollup-kafka-consumer        | Captures SOH Rollup data and stores it to the OSD |
| cd11-rsdf-processor                         | Decodes incoming CD1.1 Raw Station Data Frames (RSDF) |
| config-loader                               | Service for orchestrating configuration loading |
| frameworks-configuration-service            | Serves processing configuration |
| frameworks-osd-service                      | Object Storage and Distribution (OSD) service |
| frameworks-osd-rsdf-kafka-consumer          | Captures RSDF data and stores it to the OSD |
| frameworks-osd-station-soh-kafka-consumer   | Captures computed SOH statistics and stores them to the OSD |
| frameworks-osd-systemmessage-kafka-consumer | Captures system messages and stores them to the OSD |
| frameworks-osd-ttl-worker                   | Periodically deletes the oldest data from the OSD |
| interative-analysis-api-gateway             | Backend services for the GMS user interface |
| interative-analysis-ui                      | Serves the GMS user interface |
| acei-merge-processor                        | Merges and consolidates acquired channel environmental issues (ACEI) data |
| soh-control                                 | Computes State of Health (SOH) statistics from incoming RSDF metadata |
| ssam-control                                | Manages Station State of Health acknowlegement and quieting |
| smds-service                                | System Message Definition Service (SMDS) |
| soh-quieted-list-kafka-consumer             | Captures quieted issue lists and stores them to the OSD |
| soh-status-change-kafka-consumer            | Captures status changes and stores them to the OSD |
| ui-processing-configuration-service         | Serves processing configuration for the UI |

### GMS SOH Transient Services

| **Service Name** | **Description** |
|---|:---|
| cd11-injector              | Test service for injecting CD1.1 data into the system |

### GMS SOH Third-Party Services

| **Service Name** | **Description** |
|---|:---|
| bastion                 | Contains command-line support tools for system maintainence |
| etcd                    | Service for system configuration values |
| javadoc                 | Serves generated javadoc documentation |
| kafka[1-3]              | Distributed streaming queues used for interprocess communication |
| postgresql-gms          | The database used for storing OSD objects |
| postgresql-exporter     | Collects database metrics |
| prometheus              | Collects system monitoring metrics for prometheus |
| swagger-gms             | Servers OpenAPI interface definitions for service interfaces in GMS |
| zookeeperd              | Zookeeper key-value service used by kafka |

## GMS Interactive Analysis (IAN) 

The GMS Interactive Analysis (IAN) will create a bi-directional data
bridge between the legacy system and GMS to load data and processing results
and to provide the functionality needed to support the typical analyst
workflow.

### GMS IAN Persistent Services

| **Service Name** | **Description** |
|---|:---|
| reactive-interaction-gateway                |   |
| reactive-interaction-gateway                |   |
| config-loader                               | Service for orchestrating configuration loading |
| frameworks-configuration-service            | Serves processing configuration |
| frameworks-osd-service                      | Object Storage and Distribution (OSD) service |
| interative-analysis-ui                      | Serves the GMS user interface |
| smds-service                                | System Message Definition Service (SMDS) |
| ui-processing-configuration-service         | Serves processing configuration for the UI |
| user-manager-service                        |   |
| mock-data-server                            |   |
| cache-service                               |   |

### GMS IAN Third-Party Services

| **Service Name** | **Description** |
|---|:---|
| bastion                 | Contains command-line support tools for system maintainence |
| etcd                    | Service for system configuration values |
| javadoc                 | Serves generated javadoc documentation |
| kafka                   | Distributed streaming queues used for interprocess communication |
| postgresql-gms          | The database used for storing OSD objects |
| postgresql-exporter     | Collects database metrics |
| prometheus              | Collects system monitoring metrics for prometheus |
| swagger-gms             | Servers OpenAPI interface definitions for service interfaces in GMS |
| zookeeper               | Zookeeper key-value service used by kafka |


