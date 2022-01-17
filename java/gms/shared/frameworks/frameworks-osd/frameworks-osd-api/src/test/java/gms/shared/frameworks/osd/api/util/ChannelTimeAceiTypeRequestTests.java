package gms.shared.frameworks.osd.api.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssue.AcquiredChannelEnvironmentIssueType;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ChannelTimeAceiTypeRequestTests {

  @Test
  void testBuildAddingTimes() {
    ChannelTimeAceiTypeRequest.Builder builder = ChannelTimeAceiTypeRequest.builder();

    String channelName = "TEST";
    var request = builder.setType(AcquiredChannelEnvironmentIssueType.VAULT_DOOR_OPENED)
        .addTime(channelName, Instant.EPOCH)
        .addTime(channelName, Instant.EPOCH.plusSeconds(1))
        .build();

    assertEquals(1, request.getChannelNamesToTime().size());
    assertEquals(2, request.getChannelNamesToTime().get(channelName).size());
  }
}