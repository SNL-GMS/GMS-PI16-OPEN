package gms.core.dataacquisition.reactor;

import gms.shared.frameworks.osd.coi.channel.soh.AcquiredChannelEnvironmentIssueBoolean;

/**
 * Simple class to help build the key of a stored AECI
 */
public class AceiKeyBuilder {

  private AceiKeyBuilder() {

  }

  /**
   * Returns the key of the AECI to be stored in the merge processor.
   *
   * @param acquiredChannelEnvironmentIssue the AECI to get the key of
   * @return the AECI key (channelName + ACEI Type)
   */
  public static String buildKey(
      AcquiredChannelEnvironmentIssueBoolean acquiredChannelEnvironmentIssue) {
    return acquiredChannelEnvironmentIssue.getChannelName() + acquiredChannelEnvironmentIssue
        .getType().toString();
  }
}
