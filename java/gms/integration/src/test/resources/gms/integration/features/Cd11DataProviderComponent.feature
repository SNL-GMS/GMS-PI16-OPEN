@integration @component @cd11-data-provider @system @smoke
Feature: Verify that the DataProvider service is up and ready
  This is to validate that the service can be deployed is functional

  Background:
    Given The environment is started with
    | PROCESSING_CONFIG_SERVICE |
    | PROCESSING_CONFIG_LOADER  |
    | CONFIG_BOOTSTRAP_LOADER   |
    | POSTGRES_SERVICE          |
    | OSD_SERVICE               |
    | CONNMAN                   |
    | DATAMAN                   |
    | ETCD                      |
#    | DATAPROVIDERFILE          |
#    | DATAPROVIDERKAFKA         |

  Scenario: Verify that DataProvider service is ready for SoH
    Given The "CONNMAN" service is healthy
    Given The "DATAMAN" service is healthy
    Then The dataprovider is ready to process data from kafka topic "soh.rsdf"


  Scenario: Receive RSDF from new station and create connection
    Given An object of type "RawStationDataFrame" is read from input file "gms/integration/requests/dataacquisition/cd11/dataprovider/soh-rsdf-raw.json"
    And The object is written to topic "soh.rsdf"
    Then dataprovider responds creates a dataman connection to station "PLCA"