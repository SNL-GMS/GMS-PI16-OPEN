package gms.dataacquisition.stationreceiver.cd11.common;

import static io.netty.buffer.Unpooled.directBuffer;

import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import io.netty.buffer.ByteBuf;
import io.netty.buffer.EmptyByteBuf;
import io.netty.buffer.PooledByteBufAllocator;
import io.netty.channel.ChannelHandlerContext;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class FrameParsingDecoderTest {

  private static final int HEADER_SIZE = 36;

  @Test
  void testFrameParsingDecorder(){

    FrameParsingDecoder frameParsingDecoder = new FrameParsingDecoder();

    var channelHandlerContext = Mockito.mock(ChannelHandlerContext.class);
    List<Object> objectList = new ArrayList<>();
    ByteBuf emptyByteBuf = new EmptyByteBuf(new PooledByteBufAllocator(true));


    // should be zero because readableBytes is less than Header size
    frameParsingDecoder.decode(channelHandlerContext,emptyByteBuf,objectList);
    Assertions.assertEquals(0, emptyByteBuf.array().length);


    // set the frame type as in invalid option
    ByteBuf directBuffer  = directBuffer(256);
    // simulate incorrect FrameType
    directBuffer.writeInt(-1);
    for(int i =0; i< HEADER_SIZE; i++){
          directBuffer.writeInt(i);
    }
    int expectedSize = directBuffer.readableBytes();
    frameParsingDecoder.decode(channelHandlerContext,directBuffer,objectList);
    Assertions.assertEquals(expectedSize,((byte[]) objectList.get(0)).length);


    // set the frame type with a valid option
    ByteBuf directBuffer2  = directBuffer(256);
    objectList = new ArrayList<>();
    directBuffer2.writeInt(FrameType.ALERT.getValue());
    for(int i =0; i< HEADER_SIZE; i++){
      if (i == 0){
        //fake larger trailerOffset
        directBuffer2.writeInt(HEADER_SIZE * 2);
      }
      directBuffer2.writeInt(i);
    }

    frameParsingDecoder.decode(channelHandlerContext,directBuffer2,objectList);
    Assertions.assertEquals(108,((byte[]) objectList.get(0)).length);

  }

}
