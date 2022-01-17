package gms.dataacquisition.stationreceiver.cd11.common;

import static com.google.common.base.Preconditions.checkArgument;

import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ByteToMessageDecoder;
import java.util.List;
import org.slf4j.LoggerFactory;


public class FrameParsingDecoder extends ByteToMessageDecoder {

  private final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(FrameParsingDecoder.class));

  //constants for size of header/body/trailer fields
  private static final int HEADER_SIZE = (Integer.BYTES * 3) + Long.BYTES + 8 + 8;

  @Override
  protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) {

    if (in.readableBytes() < HEADER_SIZE) {
      return;
    }

    try {
      int frameTypeInt = in.getInt(0);
      FrameType.fromInt(frameTypeInt);
      int trailerOffset = in.getInt(Integer.BYTES);
      checkArgument(trailerOffset >= HEADER_SIZE,
          String.format(
              "The offset of the frame trailer (%d) must be at least the size of the header (%d)",
              trailerOffset, HEADER_SIZE));

      if (in.readableBytes() < trailerOffset + 2 * Integer.BYTES) {
        return;
      }
      int trailerAuthSize = in.getInt(trailerOffset + Integer.BYTES);
      checkArgument(trailerAuthSize >= 0,
          "The authentication size of the frame trailer must be greater than 0, was "
              + trailerAuthSize);
      int paddedAuthValSize = FrameUtilities
          .calculatePaddedLength(trailerAuthSize, Integer.BYTES);
      checkArgument(paddedAuthValSize >= 0,
          "The padded trailer authentication value size must be greater than 0, was "
              + paddedAuthValSize);

      int totalSize = trailerOffset + 2 * Integer.BYTES + paddedAuthValSize + Long.BYTES;
      if (in.readableBytes() < totalSize) {
        return;
      }

      byte[] send = new byte[totalSize];
      in.readBytes(send);
      in.discardReadBytes();
      out.add(send);

    } catch (IllegalArgumentException e) {

      byte[] send = new byte[in.readableBytes()];
      in.readBytes(send);
      in.discardReadBytes();
      out.add(send);
    } catch (NegativeArraySizeException e) {
      logger.warn("Encountered negative array size when decoding frame bytes", e.fillInStackTrace());
    }
  }
}