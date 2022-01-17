package gms.shared.frameworks.osd.coi.dataacquisitionstatus;

import gms.shared.frameworks.osd.coi.util.TestUtilities;
import gms.shared.frameworks.osd.coi.soh.AcquiredStationSohExtract;
import org.junit.jupiter.api.Test;

public class AcquiredStationSohExtractTest {

  @Test
  public void testSerialization() throws Exception {
    TestUtilities.testSerialization(DataAcquisitionStatusTestFixtures.acquiredStationSohExtract,
        AcquiredStationSohExtract.class);
  }
}
