package gms.core.performancemonitoring.ssam.control;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import java.util.MissingResourceException;
import org.slf4j.LoggerFactory;

/**
 * Configuration keys for all of the various Kafka topics that we produce/consume.
 */
public enum KafkaTopicConfigurationKeys {

  STATION_SOH_INPUT_TOPIC_KEY("soh_station_input_topic", "soh.station-soh"),
  ACKNOWLEDGED_SOH_STATUS_CHANGE_INPUT_TOPIC_KEY("status_change_input_topic",
      "soh.ack-station-soh"),
  QUIETED_SOH_STATUS_CHANGE_INPUT_TOPIC_KEY("quieted_list_input_topic", "soh.quieted-list"),
  CAPABILITY_SOH_ROLLUP_INPUT_TOPIC_KEY("capability_rollup_input_topic", "soh.capability-rollup"),
  SOH_SYSTEM_MESSAGE_OUTPUT_TOPIC_KEY("system_message_output_topic", "system.system-messages"),
  STATION_SOH_ANALYSIS_VIEW_OUTPUT_TOPIC_KEY("materialized_view_output_topic",
      "soh.ui-materialized-view"),
  STATION_SOH_QUIETED_OUTPUT_TOPIC_KEY("quieted_status_change_output_topic",
      "soh.quieted-status-change"),
  STATION_SOH_STATUS_CHANGE_OUTPUT_TOPIC_KEY("status_change_output_topic",
      "soh.status-change-event");


  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(KafkaTopicConfigurationKeys.class));

  private final String configKeyString;
  private final String defaultValue;

  public String getConfigKeyString() {
    return configKeyString;
  }

  public String getDefaultValue() {
    return defaultValue;
  }

  KafkaTopicConfigurationKeys(
      String configKeyString, String defaultValue
  ) {
    this.configKeyString = configKeyString;
    this.defaultValue = defaultValue;
  }

  /**
   * Get a value from the system config, returning a default value if not defined.
   */
  String getSystemConfigValue(
      SystemConfig systemConfig
  ) {

    String value = this.defaultValue;
    try {
      value = systemConfig.getValue(this.configKeyString);
    } catch (MissingResourceException e) {
      logger.warn("{} is not defined in SystemConfig, using default value: {}",
          this.configKeyString, this.defaultValue);
    }
    return value;
  }
}
