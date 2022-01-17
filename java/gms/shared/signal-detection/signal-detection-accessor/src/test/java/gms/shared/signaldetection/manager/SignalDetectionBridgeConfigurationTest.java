package gms.shared.signaldetection.manager;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.signaldetection.manager.config.SignalDetectionBridgeDefinition;
import gms.shared.signaldetection.manager.config.StageDatabaseAccountPair;
import gms.shared.signaldetection.manager.config.StagePersistenceDefinition;
import gms.shared.signaldetection.manager.config.WaveformTrimDefinition;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.configuration.WorkflowDefinition;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_1_ACCT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_2_ACCT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.STAGE_3_ACCT;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.ORDERED_STAGES;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID2;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.WORKFLOW_DEFINITION_ID3;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.anyList;


@ExtendWith(MockitoExtension.class)
class SignalDetectionBridgeConfigurationTest {

  @Mock
  private ConfigurationConsumerUtility configurationConsumerUtility;

  private static final String MONITORING_ORG_CONFIG = "global.monitoring-org";
  private static final String ACCOUNTS_BY_STAGE_CONFIG = "global.stage-accounts";
  private static final String ORDERED_STAGES_CONFIG = "workflow-manager.workflow-definition";
  private static final String WAVEFORM_LEAD_LAG_CONFIG = "signal-detection.waveform-lead-lag";

  private static final String monitoringOrganization = "CTBTO";

  private static final ImmutableList<StageDatabaseAccountPair> databaseAccountStages =
    ImmutableList.of(StageDatabaseAccountPair.create(WORKFLOW_DEFINITION_ID1, STAGE_1_ACCT),
      StageDatabaseAccountPair.create(WORKFLOW_DEFINITION_ID2, STAGE_2_ACCT),
      StageDatabaseAccountPair.create(WORKFLOW_DEFINITION_ID3, STAGE_3_ACCT));

  private static final ImmutableList<StageDatabaseAccountPair> previousStages =
    ImmutableList.of(StageDatabaseAccountPair.create(WORKFLOW_DEFINITION_ID2, STAGE_1_ACCT),
      StageDatabaseAccountPair.create(WORKFLOW_DEFINITION_ID3, STAGE_2_ACCT));

  private static final WorkflowDefinition workflowDefinition = WorkflowDefinition.from("TEST", List.of(
    WORKFLOW_DEFINITION_ID1.getName(), WORKFLOW_DEFINITION_ID2.getName(), WORKFLOW_DEFINITION_ID3.getName()));

  @Test
  void testCreateValidation() {
    assertThrows(NullPointerException.class, () -> SignalDetectionBridgeConfiguration.create(null));
  }

  @Test
  void testCreate() {
    SignalDetectionBridgeConfiguration configuration =
      assertDoesNotThrow(() -> SignalDetectionBridgeConfiguration.create(configurationConsumerUtility));
    assertNotNull(configuration);
  }

  @Test
  void testGetCurrentSignalDetectionBridgeDefinition() {
    when(configurationConsumerUtility.resolve(
      eq(ORDERED_STAGES_CONFIG), anyList(), eq(WorkflowDefinition.class)))
      .thenReturn(workflowDefinition);

    when(configurationConsumerUtility.resolve(eq(ACCOUNTS_BY_STAGE_CONFIG),
      anyList(),
      eq(StagePersistenceDefinition.class)))
      .thenReturn(StagePersistenceDefinition.create(databaseAccountStages, previousStages));

    when(configurationConsumerUtility.resolve(
      eq(WAVEFORM_LEAD_LAG_CONFIG), anyList(), eq(WaveformTrimDefinition.class)))
      .thenReturn(WaveformTrimDefinition.create(Duration.ofHours(1), Duration.ofHours(2)));

    when(configurationConsumerUtility.resolve(eq(MONITORING_ORG_CONFIG), anyList()))
      .thenReturn(Map.of("monitoringOrganization", monitoringOrganization));

    SignalDetectionBridgeConfiguration configuration =
      SignalDetectionBridgeConfiguration.create(configurationConsumerUtility);

    SignalDetectionBridgeDefinition definition = configuration.getCurrentSignalDetectionBridgeDefinition();
    assertNotNull(definition);

    assertEquals(monitoringOrganization,
      definition.getMonitoringOrganization());
    assertEquals(Duration.ofHours(1),
      definition.getMeasuredWaveformLeadDuration());
    assertEquals(Duration.ofHours(2),
      definition.getMeasuredWaveformLagDuration());
    assertEquals(ORDERED_STAGES, definition.getOrderedStages());
    ImmutableMap<WorkflowDefinitionId, String> databaseAccountsByStage = databaseAccountStages.stream()
      .collect(ImmutableMap.toImmutableMap(StageDatabaseAccountPair::getWorkflowDefinitionId,
        StageDatabaseAccountPair::getDatabaseAccount));
    assertEquals(databaseAccountsByStage, definition.getDatabaseAccountByStage());

    verify(configurationConsumerUtility).resolve(eq(ORDERED_STAGES_CONFIG), anyList(), eq(WorkflowDefinition.class));
    verify(configurationConsumerUtility)
      .resolve(eq(ACCOUNTS_BY_STAGE_CONFIG), anyList(), eq(StagePersistenceDefinition.class));
    verify(configurationConsumerUtility)
      .resolve(eq(WAVEFORM_LEAD_LAG_CONFIG), anyList(), eq(WaveformTrimDefinition.class));
    verify(configurationConsumerUtility).resolve(eq(MONITORING_ORG_CONFIG), anyList());
    verifyNoMoreInteractions(configurationConsumerUtility);
  }
}