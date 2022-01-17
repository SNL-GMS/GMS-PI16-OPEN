package gms.core.dataacquisition.reactor.util;

import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLIPPED_4_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_2_4;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_4_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_4_6_F;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.AARDVARK_CLOCKLOCK_5_6;
import static gms.core.dataacquisition.TestFixture.AcquiredChannelEnvironmentalIssuesSets.BADGER_CLOCKLOCK_4_6;
import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;
import java.time.Duration;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AceiMergeCheckerTests {

  @Mock
  ConfigurationConsumerUtility mockConfig;

  AceiMergeChecker aceiMergeChecker;

  @BeforeEach
  void setUp() {
    aceiMergeChecker = AceiMergeChecker.create(mockConfig);
  }

  @ParameterizedTest
  @MethodSource("testMergeableSource")
  void testMergeable(AcquiredChannelEnvironmentIssueBoolean acei1,
      AcquiredChannelEnvironmentIssueBoolean acei2,
      boolean expectToleranceCheck, Duration mergeTolerance,
      boolean expectMergeable) {

    if (expectToleranceCheck) {
      Mockito.when(mockConfig.resolve(Mockito.anyString(), Mockito.anyList()))
          .thenReturn(Map.of("merge-tolerance", mergeTolerance.toString()));
    }

    assertEquals(expectMergeable, aceiMergeChecker.canMerge(acei1, acei2));
  }

  private static Stream<Arguments> testMergeableSource() {
    return Stream.of(
        Arguments.arguments(
            AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6, true, Duration.ofMillis(500), true),
        Arguments.arguments(
            AARDVARK_CLOCKLOCK_4_6, AARDVARK_CLOCKLOCK_2_4, true, Duration.ofMillis(500), true),
        Arguments.arguments(
            AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_5_6, true, Duration.ofMillis(500), false),
        Arguments.arguments(
            AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_5_6, true, Duration.ofMillis(1025), true),
        Arguments.arguments(
            AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLIPPED_4_6, false, Duration.ZERO, false),
        Arguments.arguments(
            AARDVARK_CLOCKLOCK_2_4, BADGER_CLOCKLOCK_4_6, false, Duration.ZERO, false),
        Arguments.arguments(
            AARDVARK_CLOCKLOCK_2_4, AARDVARK_CLOCKLOCK_4_6_F, false, Duration.ZERO, false)
    );
  }
}