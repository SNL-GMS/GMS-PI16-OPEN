package gms.core.ui.processing.configuration.manager;

import gms.shared.frameworks.osd.coi.util.TestUtilities;
import java.io.IOException;
import org.junit.jupiter.api.Test;

public class ConfigQueryTests {
  @Test
  void testSerialization() throws IOException {
    TestUtilities.testSerialization(TestFixture.query, ConfigQuery.class);
  }
}
