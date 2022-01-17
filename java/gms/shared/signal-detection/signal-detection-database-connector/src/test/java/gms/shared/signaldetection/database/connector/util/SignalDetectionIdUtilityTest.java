package gms.shared.signaldetection.database.connector.util;

import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.apache.ignite.IgniteCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class SignalDetectionIdUtilityTest {

  @Mock
  IgniteCache<Long, UUID> aridSignalDetectionMap;
  @Mock
  IgniteCache<UUID, Long> signalDetectionAridMap;
  @Mock
  IgniteCache<SignalDetectionHypothesisArrivalIdComponents, UUID> arrivalIdComponentsSignalDetectionHypothesisIdMap;
  @Mock
  IgniteCache<UUID, SignalDetectionHypothesisArrivalIdComponents> signalDetectionHypothesisIdArrivalIdComponentsMap;

  private static SignalDetectionIdUtility signalDetectionIdUtility;

  @BeforeEach
  void setup() {
    signalDetectionIdUtility = SignalDetectionIdUtility.create(aridSignalDetectionMap, signalDetectionAridMap,
      arrivalIdComponentsSignalDetectionHypothesisIdMap, signalDetectionHypothesisIdArrivalIdComponentsMap);
  }

  @Test
  void getSignalDetectionId() {

    long arid1 = 45L;
    long arid2 = 932L;

    given(aridSignalDetectionMap.get(arid1)).willReturn(null);
    assertNull(signalDetectionIdUtility.getSignalDetectionForArid(arid1));
    assertNotNull(signalDetectionIdUtility.getOrCreateSignalDetectionIdfromArid(arid1));

    UUID uuid = UUID.randomUUID();
    given(aridSignalDetectionMap.get(arid2)).willReturn(uuid);
    assertEquals(uuid, signalDetectionIdUtility.getSignalDetectionForArid(arid2));
  }

  @ParameterizedTest
  @MethodSource("addAridAndStageIdForSignalDetectionHypothesisUUIDArguments")
  void testCreateValidation(Class<? extends Exception> exception, long arid, WorkflowDefinitionId stageId, UUID uuid) {
    assertThrows(exception, () -> signalDetectionIdUtility.addAridAndStageIdForSignalDetectionHypothesisUUID(arid, stageId, uuid));
  }

  static Stream<Arguments> addAridAndStageIdForSignalDetectionHypothesisUUIDArguments() {
    final UUID uuid = UUID.randomUUID();

    return Stream.of(
      arguments(NullPointerException.class, 1L, null, uuid),
      arguments(NullPointerException.class, 1L, WorkflowDefinitionId.from("test"), null)
    );
  }

}
