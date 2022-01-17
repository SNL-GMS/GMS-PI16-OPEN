package gms.shared.signaldetection.manager;

import com.google.common.collect.ImmutableList;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.signaldetection.api.SignalDetectionAccessorInterface;
import gms.shared.signaldetection.api.response.SignalDetectionsWithChannelSegments;
import gms.shared.signaldetection.manager.config.StageDatabaseAccountPair;
import gms.shared.signaldetection.manager.config.StagePersistenceDefinition;
import gms.shared.signaldetection.manager.config.WaveformTrimDefinition;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.configuration.WorkflowDefinition;
import org.apache.commons.lang3.tuple.Pair;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.DETECTIONS_WITH_CHANNEL_SEGMENTS;
import static gms.shared.signaldetection.testfixtures.SignalDetectionTestFixtures.REQUEST;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SignalDetectionManagerTest {

  @Mock
  private SignalDetectionAccessorInterface signalDetectionAccessor;

  private SignalDetectionManager signalDetectionManager;

  @BeforeEach
  void setup() {
    signalDetectionManager = new SignalDetectionManager(signalDetectionAccessor);
  }

  @Test
  void testCreateValidation() {
    assertThrows(NullPointerException.class, () -> SignalDetectionManager.create(null));
  }

  @Test
  void testFindDetectionsWithSegmentsByStationAndTimeValidation() {
    NullPointerException exception = assertThrows(NullPointerException.class,
      () -> signalDetectionManager.findDetectionsWithSegmentsByStationsAndTime(null));
    assertEquals("Request cannot be null", exception.getMessage());
  }

  @Test
  void testFindDetectionsWithSegmentsByStationAndTime() {
    when(signalDetectionAccessor.findWithSegmentsByStationsAndTime(REQUEST.getStations(),
      REQUEST.getStartTime(),
      REQUEST.getEndTime(),
      REQUEST.getStageId(),
      REQUEST.getExcludedSignalDetections()))
      .thenReturn(DETECTIONS_WITH_CHANNEL_SEGMENTS);

    SignalDetectionsWithChannelSegments actual =
      signalDetectionManager.findDetectionsWithSegmentsByStationsAndTime(REQUEST);
    assertEquals(DETECTIONS_WITH_CHANNEL_SEGMENTS, actual);

    verify(signalDetectionAccessor).findWithSegmentsByStationsAndTime(REQUEST.getStations(),
      REQUEST.getStartTime(),
      REQUEST.getEndTime(),
      REQUEST.getStageId(),
      REQUEST.getExcludedSignalDetections());
  }
}