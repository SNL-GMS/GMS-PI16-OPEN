import { UI_URL } from '@gms/common-util';
import { AxiosRequestConfig } from 'axios';

export interface ServiceDefinition {
  readonly mockRequestConfig?: AxiosRequestConfig;
  readonly requestConfig: AxiosRequestConfig;
}

export interface RequestConfig {
  readonly [domain: string]: {
    readonly services: {
      readonly [serviceName: string]: ServiceDefinition;
    };
  };
}

// Default Config
export const defaultConfig: RequestConfig = {
  // Historical SOH Configuration
  historicalSoh: {
    services: {
      historicalByStationIdTimeAndSohMonitorTypes: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/ssam-control/retrieve-decimated-historical-station-soh`,
          headers: {
            // configure to receive msgpack encoded data
            accept: 'application/msgpack',
            'content-type': 'application/json'
          },
          // must specify that the response type is of type array buffer for
          // receiving and decoding msgpack data
          responseType: 'arraybuffer',
          timeout: 600000 // 10 minutes
        }
      }
    }
  }, // Station Definitions
  stationDefinition: {
    // Service endpoints for this component
    services: {
      getStationGroupsByNames: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/station-definition-service/station-definition/station-groups/query/names`,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          },
          proxy: false,
          timeout: 60000
        }
      },
      getStations: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/station-definition-service/station-definition/stations/query/names`,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          },
          proxy: false,
          timeout: 60000
        }
      },
      getStationsEffectiveAtTimes: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/station-definition-service/station-definition/stations/query/change-times`,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          },
          proxy: false,
          timeout: 60000
        }
      }
    }
  },
  // System Messages Configuration
  systemMessage: {
    // Service endpoints for this component
    services: {
      getSystemMessageDefinitions: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/smds-service/retrieve-system-message-definitions`,
          headers: {
            accept: 'text/plain',
            'content-type': 'text/plain'
          },
          proxy: false,
          timeout: 60000,
          data: `"PlaceHolder"`
        }
      }
    }
  },
  // Processing Configuration Service
  processingConfiguration: {
    // Service endpoints for this component
    services: {
      getProcessingConfiguration: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/ui-processing-configuration-service/resolve`,
          responseType: 'json',
          proxy: false,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          },
          timeout: 60000
        }
      }
    }
  },
  // SSAM Control Service for SOH Configuration
  sohConfiguration: {
    // Service endpoints for this component
    services: {
      getSohConfiguration: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/ssam-control/retrieve-station-soh-monitoring-ui-client-parameters`,
          responseType: 'json',
          proxy: false,
          headers: {
            accept: 'application/json',
            'content-type': 'text/plain'
          },
          timeout: 60000,
          data: `"PlaceHolder"`
        }
      }
    }
  },
  // User profile configuration
  userProfile: {
    // Service endpoints for this component
    services: {
      getUserProfile: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/user-manager-service/user-preferences`,
          responseType: 'json',
          proxy: false,
          headers: {
            accept: 'application/json',
            'content-type': 'text/plain'
          },
          timeout: 60000,
          data: `"defaultUser"`
        }
      },
      setUserProfile: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/user-manager-service/user-preferences/store`,
          responseType: 'json',
          proxy: false,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          },
          timeout: 60000
        }
      }
    }
  },
  // Waveform Bridge Service Configuration
  waveformConfiguration: {
    // Service endpoints for this component
    services: {
      getWaveformConfiguration: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/waveform-manager-service/waveform/channel-segment/query/channel-timerange`,
          responseType: 'arraybuffer',
          proxy: false,
          headers: {
            accept: 'application/msgpack',
            'content-type': 'application/json'
          },
          timeout: 180000 // 3 mins until we figure out batching...
        }
      }
    }
  },
  // Workflow Service Configuration
  workflowConfiguration: {
    // Service endpoints for this component
    services: {
      workflow: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/workflow-manager-service/workflow-manager/workflow-definition`,
          responseType: 'json',
          proxy: false,
          headers: {
            accept: 'application/json',
            'content-type': 'text/plain'
          },
          timeout: 180000, // 3 mins until we figure out batching...
          data: `"PlaceHolder"`
        }
      },
      stageIntervalsByIdAndTime: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/workflow-manager-service/workflow-manager/interval/stage/query/ids-timerange`,
          responseType: 'json',
          proxy: false,
          headers: {
            accept: 'application/json',
            'content-type': 'text/plain'
          },
          timeout: 180000 // 3 mins until we figure out batching...
        }
      },
      updateActivityIntervalStatus: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/workflow-manager-service/workflow-manager/interval/activity/update`,
          responseType: 'json',
          proxy: false,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          },
          timeout: 60000
        }
      },
      updateInteractiveAnalysisStageIntervalStatus: {
        requestConfig: {
          method: 'post',
          url: `${UI_URL}/workflow-manager-service/workflow-manager/interval/stage/interactive-analysis/update`,
          responseType: 'json',
          proxy: false,
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          },
          timeout: 60000
        }
      }
    }
  }
};
