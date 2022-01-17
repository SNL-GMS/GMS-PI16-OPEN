package gms.shared.signaldetection.database.connector;

import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.database.connector.factory.SignalDetectionDatabaseConnectorFactory;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.stationdefinition.database.connector.WftagDatabaseConnector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.persistence.EntityManagerFactory;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Stream;

import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.ARRIVAL_1;
import static gms.shared.signaldetection.testfixtures.SignalDetectionDaoTestFixtures.WFTAG_1;
import static gms.shared.stationdefinition.testfixtures.CSSDaoTestFixtures.WFDISC_TEST_DAO_1;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SignalDetectionDatabaseConnectorTest {

  public static final Instant START_TIME = Instant.EPOCH;
  public static final Instant END_TIME = Instant.EPOCH.plusSeconds(5);
  public static final Duration LEAD_DELTA = Duration.ofSeconds(5);
  public static final Duration LAG_DELTA = Duration.ofSeconds(1);
  public static final List<String> STATION_NAMES = List.of("test");
  @Mock
  EntityManagerFactory entityManagerFactory;

  @Mock
  private ArrivalDatabaseConnector arrivalDatabaseConnector;

  @Mock
  private WfdiscDatabaseConnector wfdiscDatabaseConnector;

  @Mock
  private WftagDatabaseConnector wftagDatabaseConnector;

  private SignalDetectionDatabaseConnector signalDetectionDatabaseConnector;

  @BeforeEach
  void setup() {
    signalDetectionDatabaseConnector = SignalDetectionDatabaseConnector.create(arrivalDatabaseConnector,
      wfdiscDatabaseConnector,
      wftagDatabaseConnector);
  }
  @Test
  void initializationErrors() {
    final NullPointerException error = assertThrows(NullPointerException.class,
      () -> SignalDetectionDatabaseConnector.create(null));
    assertEquals("Cannot create ArrivalDatabaseConnector with null EntityManagerFactory", error.getMessage());
  }

  @Test
  void initialize_requiresEntityManagerFactory() {
    SignalDetectionDatabaseConnector connector = assertDoesNotThrow(() ->
      SignalDetectionDatabaseConnector.create(entityManagerFactory));
    assertNotNull(connector);
  }

  @ParameterizedTest
  @MethodSource("supplierSource")
  <T> void multipleGetsReturnSameObject(
    Function<SignalDetectionDatabaseConnectorFactory, T> supplier) {
    final SignalDetectionDatabaseConnectorFactory factory = SignalDetectionDatabaseConnectorFactory
      .create(entityManagerFactory);
    final T result = supplier.apply(factory);
    assertNotNull(result);
    assertEquals(supplier.apply(factory), result);
  }

  private static Stream<Arguments> supplierSource() {
    return Stream.of(
      Arguments.of((Function<SignalDetectionDatabaseConnectorFactory, String>) f -> "test"),
      Arguments
        .of((Function<SignalDetectionDatabaseConnectorFactory, ArrivalDatabaseConnector>)
          SignalDetectionDatabaseConnectorFactory::getArrivalDatabaseConnectorInstance)
    );
  }

  @Test
  void testFindArrivals() {
    when(arrivalDatabaseConnector.findArrivals(STATION_NAMES,
      List.of(),
      START_TIME,
      END_TIME,
      LEAD_DELTA,
      LAG_DELTA))
      .thenReturn(List.of(ARRIVAL_1));

    List<ArrivalDao> actual = signalDetectionDatabaseConnector.findArrivals(STATION_NAMES,
      List.of(),
      START_TIME,
      END_TIME,
      LEAD_DELTA,
      LAG_DELTA);

    assertEquals(List.of(ARRIVAL_1), actual);

    verify(arrivalDatabaseConnector).findArrivals(STATION_NAMES,
      List.of(),
      START_TIME,
      END_TIME,
      LEAD_DELTA,
      LAG_DELTA);
    verifyNoMoreInteractions(arrivalDatabaseConnector, wfdiscDatabaseConnector, wftagDatabaseConnector);
  }

  @Test
  void testFindArrivalsArids() {
    when(arrivalDatabaseConnector.findArrivalsByArids(List.of(1L)))
      .thenReturn(List.of(ARRIVAL_1));

    List<ArrivalDao> actual = signalDetectionDatabaseConnector.findArrivals(List.of(1L));
    assertEquals(List.of(ARRIVAL_1), actual);

    verify(arrivalDatabaseConnector).findArrivalsByArids(List.of(1L));
    verifyNoMoreInteractions(arrivalDatabaseConnector, wfdiscDatabaseConnector, wftagDatabaseConnector);
  }

  @Test
  void testFindWfdiscs() {
    when(wfdiscDatabaseConnector.findWfdiscsByWfids(List.of(1L)))
      .thenReturn(List.of(WFDISC_TEST_DAO_1));

    List<WfdiscDao> actual = signalDetectionDatabaseConnector.findWfdiscs(List.of(1L));
    assertEquals(List.of(WFDISC_TEST_DAO_1), actual);

    verify(wfdiscDatabaseConnector).findWfdiscsByWfids(List.of(1L));
    verifyNoMoreInteractions(arrivalDatabaseConnector, wfdiscDatabaseConnector, wftagDatabaseConnector);
  }

  @Test
  void testFindWftags() {
    when(wftagDatabaseConnector.findWftagsByTagIds(List.of(1L)))
      .thenReturn(List.of(WFTAG_1));

    List<WfTagDao> actual = signalDetectionDatabaseConnector.findWftags(List.of(1L));
    assertEquals(List.of(WFTAG_1), actual);

    verify(wftagDatabaseConnector).findWftagsByTagIds(List.of(1L));
    verifyNoMoreInteractions(arrivalDatabaseConnector, wfdiscDatabaseConnector, wftagDatabaseConnector);
  }
}
