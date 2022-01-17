package gms.dataacquisition.stationreceiver.cd11.common.frames;

import static com.google.common.base.Preconditions.checkArgument;
import static com.google.common.base.Preconditions.checkState;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonPOJOBuilder;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.auto.value.AutoValue;
import gms.dataacquisition.stationreceiver.cd11.common.Cd11Validator;
import gms.dataacquisition.stationreceiver.cd11.common.FrameUtilities;
import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;


/**
 * Represents the header fields of Cd-1.1 frames (Connection request/response).
 */
@AutoValue
@JsonSerialize(as = Cd11Header.class)
@JsonDeserialize(builder = AutoValue_Cd11Header.Builder.class)
public abstract class Cd11Header {

  /**
   * The byte array length of a CD1.1 frame header.
   */
  public static final int FRAME_LENGTH = (Integer.BYTES * 3) + Long.BYTES + 8 + 8;

  /**
   * Numeric identifier of this frame's type
   */
  public abstract FrameType getFrameType();

  /**
   * Byte offset from first byte of the frame to the beginning of the trailer
   */
  public abstract int getTrailerOffset();

  /**
   * 8-byte ASCII (Defined in CD11 spec) assigned identifier of the creator of the frame.
   */
  public abstract String getFrameCreator();

  /**
   * 8-byte ASCII (Defined in CD11 spec) assigned identifier of the destination of the frame
   */
  public abstract String getFrameDestination();

  /**
   * Sequence number assigned by the frame creator
   */
  public abstract long getSequenceNumber();

  /**
   * Series number assigned by the frame creator
   */
  public abstract int getSeries();

  /**
   * Read in and parse a {@link Cd11Header} from a given {@link ByteBuffer}
   *
   * @param input Input containing a serialized {@link Cd11Header} that follows the CD1.1 spec
   * @return a {@link Cd11Header} populated from the raw bytes
   */
  public static Cd11Header read(ByteBuffer input) {
    input.rewind();
    FrameType inFrameType = FrameType.fromInt(input.getInt());
    int inTrailerOffset = input.getInt();
    // Defined in CD11 spec as 8 bytes, so we read in and strip null padding
    String inFrameCreator = FrameUtilities.readBytesAsString(input, 8).replace("\0", "");
    // Defined in CD11 spec as 8 bytes, so we read in and strip null padding
    String inFrameDestination = FrameUtilities.readBytesAsString(input, 8).replace("\0", "");
    long inSequenceNumber = input.getLong();
    int inSeries = input.getInt();

    return Cd11Header.builder()
        .setFrameType(inFrameType)
        .setTrailerOffset(inTrailerOffset)
        .setFrameCreator(inFrameCreator)
        .setFrameDestination(inFrameDestination)
        .setSequenceNumber(inSequenceNumber)
        .setSeries(inSeries)
        .build();
  }

  /**
   * Default factory method
   *
   * @param frameType numeric identifier of this frame type
   * @param trailerOffset byte offset from first byte of the frame to the beginning of the trailer
   * @param frameCreator 8-byte ASCII assigned identifier of the creator of the frame
   * @param frameDestination 8-byte ASCII identifier of the destination of the frame
   * @param sequenceNumber sequence number assigned by the frame creator
   * @param series series number assigned by the frame creator
   */
  public static Cd11Header create(FrameType frameType, int trailerOffset, String frameCreator,
      String frameDestination, long sequenceNumber, int series) {
    return Cd11Header.builder()
        .setFrameType(frameType)
        .setTrailerOffset(trailerOffset)
        .setFrameCreator(frameCreator)
        .setFrameDestination(frameDestination)
        .setSequenceNumber(sequenceNumber)
        .setSeries(series)
        .build();
  }

  public abstract Cd11Header.Builder toBuilder();

  public static Cd11Header.Builder builder() {
    return new AutoValue_Cd11Header.Builder();
  }

  @AutoValue.Builder
  @JsonPOJOBuilder(withPrefix = "set")
  public abstract static class Builder {

    /**
     * @param frameType Numeric identifier of this frame's type
     */
    public abstract Builder setFrameType(FrameType frameType);

    /**
     * @param trailerOffset Byte offset from first byte of the frame to the beginning of the
     * trailer
     */
    public abstract Builder setTrailerOffset(int trailerOffset);

    /**
     * @param frameCreator 8-byte ASCII (Defined in CD11 spec) assigned identifier of the creator of
     * the frame
     */
    public abstract Builder setFrameCreator(String frameCreator);

    /**
     * @param frameDestination 8-byte ASCII (Defined in CD11 spec) assigned identifier of the
     * destination of the frame
     */
    public abstract Builder setFrameDestination(String frameDestination);

    /**
     * @param sequenceNumber Sequence number assigned by the frame creator
     */
    public abstract Builder setSequenceNumber(
        long sequenceNumber); // NOTE: Not all CD 1.1 frame types need a valid sequence number!

    /**
     * @param series Series number assigned by the frame creator
     */
    public abstract Builder setSeries(int series);

    abstract Cd11Header autoBuild();

    public Cd11Header build() {
      Cd11Header frameHeader = autoBuild();

      checkState(frameHeader.getTrailerOffset() > 0, "trailerOffset must be positive");
      checkArgument((frameHeader.getTrailerOffset() - FRAME_LENGTH) >= 0,
          "The offset of the frame trailer must be at least the size of the header");
      Cd11Validator.validFrameCreator(frameHeader.getFrameCreator());
      Cd11Validator.validFrameDestination(frameHeader.getFrameDestination());

      return frameHeader;
    }
  }

  public byte[] toBytes() {
    ByteBuffer output = ByteBuffer.allocate(FRAME_LENGTH);
    output.putInt(this.getFrameType().getValue());
    output.putInt(this.getTrailerOffset());
    output.put(
        FrameUtilities.padToLength(this.getFrameCreator(), 8).getBytes(StandardCharsets.US_ASCII));
    output.put(FrameUtilities.padToLength(this.getFrameDestination(), 8)
        .getBytes(StandardCharsets.US_ASCII));
    output.putLong(this.getSequenceNumber());
    output.putInt(this.getSeries());
    return output.array();
  }
}
