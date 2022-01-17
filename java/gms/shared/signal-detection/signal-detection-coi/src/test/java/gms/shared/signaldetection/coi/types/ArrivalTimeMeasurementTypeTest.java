package gms.shared.signaldetection.coi.types;

import gms.shared.signaldetection.coi.values.ArrivalTimeMeasurementValue;
import gms.shared.utilities.test.TestUtilities;
import org.junit.jupiter.api.Test;

import java.io.IOException;

class ArrivalTimeMeasurementTypeTest {

  @Test
  void testSerialization() throws IOException {
    ArrivalTimeMeasurementType type = ArrivalTimeMeasurementType.from(ArrivalTimeMeasurementValue.class.getName());
    TestUtilities.testSerialization(type, ArrivalTimeMeasurementType.class);
  }

}