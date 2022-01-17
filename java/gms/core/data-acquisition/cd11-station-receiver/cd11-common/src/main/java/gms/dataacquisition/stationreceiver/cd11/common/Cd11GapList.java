package gms.dataacquisition.stationreceiver.cd11.common;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import gms.dataacquisition.stationreceiver.cd11.common.frames.Cd11Acknack;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;


/**
 * Simplified gap-list for use by CD 1.1 components.
 */
public class Cd11GapList {

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper.create(LoggerFactory.getLogger(Cd11GapList.class));
  private GapList gapList;

  public Cd11GapList() {
    this(new GapList(0, -1));
  }

  @JsonCreator
  public Cd11GapList(
      @JsonProperty GapList gapList) {
    this.gapList = gapList;
  }

  public GapList getGapList() {
    return gapList;
  }

  /**
   * Checks if the frame range in the Acknack frame completely shifted below our current low/high
   * which would indicate a reset. Low/High of the frame become the new range and any old gaps are
   * dropped.
   *
   * @param acknackFrame CD 1.1 Acknack frame
   */
  public void checkForReset(Cd11Acknack acknackFrame) {
    // Ignore invalid input.
    if (Long.compareUnsigned(acknackFrame.getLowestSeqNum(), acknackFrame.getHighestSeqNum()) > 0) {
      logger.error(
        "Acknack frame contains a lowestSeqNum ({}) that is larger than the highestSeqNum ({})",
        acknackFrame.getLowestSeqNum(), acknackFrame.getHighestSeqNum());

      return;
    }

    // Check for a reset.
    if (Long.compareUnsigned(acknackFrame.getHighestSeqNum(), this.gapList.getMin()) < 0) {
      resetGapsList();
    }
  }

  public void resetGapsList() {
    logger.info("Gap list reset");
    this.gapList = new GapList(0, -1);
  }

  public void processSequenceNumber(long value) {
    // Add the new value.
    try {
      logger.debug("Adding sequence number {} to gap list", value);
      this.gapList.addValue(value);
    } catch (Exception e) {
      logger.warn("Ignoring invalid sequence number: {}, Stack: {}", value,
        ExceptionUtils.getStackTrace(e));
    }
  }

  /**
   * Returns the highest sequence number.
   *
   * @return highest sequence number
   */
  public long getHighestSequenceNumber() {
    return this.gapList.getMax();
  }

  /**
   * Returns the lowest sequence number.
   *
   * @return lowest sequence number
   */
  public long getLowestSequenceNumber() {
    return this.gapList.getMin();
  }

  /**
   * Returns an array of gap ranges, as required to produce a CD 1.1 Acknack frame. Note: this
   * doesn't necessary truly reflect what's in the gap list, just what to report back to the
   * provider. For example, this method filters out gaps in the GapList which filters out gaps
   * touching or exceeding the max sequence number to match CD-1.1 protocol
   *
   * @return array of gap ranges
   */
  public long[] getGaps() {
    ArrayList<ImmutablePair<Long, Long>> gaps = this.gapList.getGaps(false, true);

    // Filter out gaps that go beyond the the max of the range. This scenario happens when we set our max
    // from an Acknack but didn't receive that max sequence number. Because protocol specifies the gap end
    // is the highest received frame number we can't create a valid gap
    for (int i = gaps.size() - 1; i >= 0; i--) {
      long gapStart = gaps.get(i).getLeft();
      long gapEnd = gaps.get(i).getRight();

      //First check: if gapEnd goes beyond max (touches the upper boundary)
      //Second check: makes sure initial value for gaps is empty, not from [0,-1]
      //Third Check: remove any gaps below or touch our min (ie the one from 0 - min)
      //Fourth check: remove the gap from 0, -1 (everything)
      //Either case remove that gap because it touches the upper boundary
      if ((Long.compareUnsigned(gapEnd, this.gapList.getMax()) > 0)
          || GapList.isMaxUnsignedValue(gapEnd)
          || Long.compareUnsigned(gapEnd, this.gapList.getMin()) <= 0
          || (gapStart == 0 && gapEnd == -1)) {
        gaps.remove(i);
      }
    }

    // Convert to long array.
    long[] cd11Gaps = new long[gaps.size() * 2];
    int i = 0;
    for (ImmutablePair<Long, Long> gap : gaps) {
      cd11Gaps[i] = gap.getLeft();
      cd11Gaps[i + 1] = gap.getRight();
      i += 2;
    }

    return cd11Gaps;
  }

  /**
   * Removes gaps that have not changed in the specified duration.
   *
   * @param expirationPeriod Duration of time since wall clock to expire gaps for
   */
  public void removeExpiredGaps(Duration expirationPeriod) {
    this.gapList.removeGapsModifiedBefore(Instant.now().minus(expirationPeriod));
  }
}
