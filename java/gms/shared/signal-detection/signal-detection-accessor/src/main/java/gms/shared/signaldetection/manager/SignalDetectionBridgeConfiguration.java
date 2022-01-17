package gms.shared.signaldetection.manager;

import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.signaldetection.manager.config.SignalDetectionBridgeDefinition;
import gms.shared.signaldetection.manager.config.StagePersistenceDefinition;
import gms.shared.signaldetection.manager.config.WaveformTrimDefinition;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.configuration.WorkflowDefinition;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class SignalDetectionBridgeConfiguration {

  private static final String MONITORING_ORG_CONFIG = "global.monitoring-org";
  private static final String ACCOUNTS_BY_STAGE_CONFIG = "global.stage-accounts";
  private static final String ORDERED_STAGES_CONFIG = "workflow-manager.workflow-definition";
  private static final String WAVEFORM_LEAD_LAG_CONFIG = "signal-detection.waveform-lead-lag";

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  private SignalDetectionBridgeConfiguration(ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;

  }

  public static SignalDetectionBridgeConfiguration create(
    ConfigurationConsumerUtility configurationConsumerUtility) {
    Objects.requireNonNull(configurationConsumerUtility);

    return new SignalDetectionBridgeConfiguration(configurationConsumerUtility);
  }

  public SignalDetectionBridgeDefinition getCurrentSignalDetectionBridgeDefinition() {
    var workflowDefinition = configurationConsumerUtility.resolve(
      ORDERED_STAGES_CONFIG,
      List.of(), WorkflowDefinition.class);
    var orderedAccountByStage = workflowDefinition.getStageNames().stream()
      .map(WorkflowDefinitionId::from).collect(Collectors.toList());

    var stagePersistenceDefinition = configurationConsumerUtility.resolve(
      ACCOUNTS_BY_STAGE_CONFIG,
      List.of(), StagePersistenceDefinition.class);

    var waveformTrimDefinition = configurationConsumerUtility.resolve(
      WAVEFORM_LEAD_LAG_CONFIG,
      List.of(), WaveformTrimDefinition.class);

    var monitoringOrganization = (String) configurationConsumerUtility.resolve(
      MONITORING_ORG_CONFIG, List.of()).get("monitoringOrganization");

    return SignalDetectionBridgeDefinition.builder()
      .setDatabaseAccountByStage(stagePersistenceDefinition.getDatabaseAccountsByStageMap())
      .setMonitoringOrganization(monitoringOrganization)
      .setOrderedStages(orderedAccountByStage)
      .setMeasuredWaveformLeadDuration(waveformTrimDefinition.getMeasuredWaveformLeadDuration())
      .setMeasuredWaveformLagDuration(waveformTrimDefinition.getMeasuredWaveformLagDuration())
      .build();
  }
}
