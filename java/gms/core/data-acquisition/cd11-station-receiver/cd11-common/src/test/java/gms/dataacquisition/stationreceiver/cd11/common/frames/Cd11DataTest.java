package gms.dataacquisition.stationreceiver.cd11.common.frames;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

import gms.dataacquisition.stationreceiver.cd11.common.Cd11PayloadReader;
import gms.dataacquisition.stationreceiver.cd11.common.enums.FrameType;
import java.nio.ByteBuffer;
import org.junit.jupiter.api.Test;


class Cd11DataTest {

  @Test
  void testDataRoundTripBytes() {
    ByteBuffer expectedBytes = Cd11PayloadFixtures.cd11DataBytes();
    Cd11Data actualData = Cd11PayloadReader.tryReadData(expectedBytes);

    // Test header
    Cd11ChannelSubframeHeader actualHeader = actualData.getChanSubframeHeader();
    assertEquals(Cd11PayloadFixtures.TWO_CHANNELS, actualHeader.numOfChannels);
    assertEquals(Cd11PayloadFixtures.FRAME_TIME_LENGTH, actualHeader.frameTimeLength);
    assertEquals(Cd11PayloadFixtures.NOMINAL_TIME, actualHeader.nominalTime);
    assertEquals(Cd11PayloadFixtures.CHANNEL_STRING_COUNT2, actualHeader.channelStringCount);
    assertEquals(Cd11PayloadFixtures.CHANNEL_STRING + Cd11PayloadFixtures.CHANNEL_STRING2, actualHeader.channelString);

    // Test subframes
    assertEquals(2, actualData.getChannelSubframes().size());
    Cd11ChannelSubframe firstActualSubframe = actualData.getChannelSubframes().get(0);
    assertEquals(Cd11PayloadFixtures.CHANNEL_LENGTH, firstActualSubframe.channelLength);
    assertEquals(Cd11PayloadFixtures.AUTHENTICATION_OFFSET, firstActualSubframe.authOffset);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_AUTHENTICATION, firstActualSubframe.authenticationOn);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_TRANSFORMATION, firstActualSubframe.compressionFormat);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_SENSOR_TYPE, firstActualSubframe.sensorType);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_OPTION_FLAG, firstActualSubframe.isCalib);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_SITE_NAME, firstActualSubframe.siteName);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_CHANNEL_NAME, firstActualSubframe.channelName);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_LOCATION, firstActualSubframe.locationName);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_DATA_FORMAT, firstActualSubframe.cd11DataFormat);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_CALIB_FACTOR, firstActualSubframe.calibrationFactor,
        0.00000001);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_CALIB_PER, firstActualSubframe.calibrationPeriod, 0.00000001);
    assertEquals(Cd11PayloadFixtures.TIME_STAMP, firstActualSubframe.timeStamp);
    assertEquals(Cd11PayloadFixtures.SUBFRAME_TIME_LENGTH, firstActualSubframe.subframeTimeLength);
    assertEquals(Cd11PayloadFixtures.SAMPLES, firstActualSubframe.samples);
    assertEquals(Cd11PayloadFixtures.CHANNEL_STATUS_SIZE, firstActualSubframe.channelStatusSize);
    assertArrayEquals(Cd11PayloadFixtures.CHANNEL_STATUS, firstActualSubframe.channelStatusData);
    assertEquals(Cd11PayloadFixtures.DATA_SIZE, firstActualSubframe.dataSize);
    assertArrayEquals(Cd11PayloadFixtures.CHANNEL_DATA, firstActualSubframe.channelData);
    assertEquals(Cd11PayloadFixtures.SUBFRAME_COUNT, firstActualSubframe.subframeCount);
    assertEquals(Cd11PayloadFixtures.AUTH_KEY, firstActualSubframe.authKeyIdentifier);
    assertEquals(Cd11PayloadFixtures.AUTH_SIZE, firstActualSubframe.authSize);
    assertArrayEquals(Cd11PayloadFixtures.AUTH_VALUE, firstActualSubframe.authValue);

    Cd11ChannelSubframe secondActualSubframe = actualData.getChannelSubframes().get(1);
    assertEquals(Cd11PayloadFixtures.CHANNEL_LENGTH, secondActualSubframe.channelLength);
    assertEquals(Cd11PayloadFixtures.AUTHENTICATION_OFFSET, secondActualSubframe.authOffset);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_AUTHENTICATION, secondActualSubframe.authenticationOn);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_TRANSFORMATION, secondActualSubframe.compressionFormat);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_SENSOR_TYPE, secondActualSubframe.sensorType);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_OPTION_FLAG, secondActualSubframe.isCalib);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_SITE_NAME, secondActualSubframe.siteName);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_CHANNEL_NAME, secondActualSubframe.channelName);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_LOCATION2, secondActualSubframe.locationName);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_DATA_FORMAT, secondActualSubframe.cd11DataFormat);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_CALIB_FACTOR, secondActualSubframe.calibrationFactor,
        0.00000001);
    assertEquals(Cd11PayloadFixtures.CHANNEL_DESCRIPTION_CALIB_PER, secondActualSubframe.calibrationPeriod, 0.00000001);
    assertEquals(Cd11PayloadFixtures.TIME_STAMP, secondActualSubframe.timeStamp);
    assertEquals(Cd11PayloadFixtures.SUBFRAME_TIME_LENGTH, secondActualSubframe.subframeTimeLength);
    assertEquals(Cd11PayloadFixtures.SAMPLES, secondActualSubframe.samples);
    assertEquals(Cd11PayloadFixtures.CHANNEL_STATUS_SIZE, secondActualSubframe.channelStatusSize);
    assertArrayEquals(Cd11PayloadFixtures.CHANNEL_STATUS, secondActualSubframe.channelStatusData);
    assertEquals(Cd11PayloadFixtures.DATA_SIZE, secondActualSubframe.dataSize);
    assertArrayEquals(Cd11PayloadFixtures.CHANNEL_DATA, secondActualSubframe.channelData);
    assertEquals(Cd11PayloadFixtures.SUBFRAME_COUNT, secondActualSubframe.subframeCount);
    assertEquals(Cd11PayloadFixtures.AUTH_KEY, secondActualSubframe.authKeyIdentifier);
    assertEquals(Cd11PayloadFixtures.AUTH_SIZE, secondActualSubframe.authSize);
    assertArrayEquals(Cd11PayloadFixtures.AUTH_VALUE, secondActualSubframe.authValue);

    //end of trip byte comparison
    assertArrayEquals(expectedBytes.array(), actualData.toBytes());
  }

  @Test
  void testDataRoundTrip() {

    Cd11Data expectedData = Cd11PayloadFixtures.cd11Data();

    Cd11Data actualData = Cd11PayloadReader.tryReadData(ByteBuffer.wrap(expectedData.toBytes()));
    assertEquals(expectedData, actualData);
  }

  @Test
  void testPayloadRoundTrip() {
    Cd11Data expectedData = Cd11PayloadFixtures.cd11Data();

    Cd11Payload actualPayload = Cd11PayloadReader
        .tryReadPayload(FrameType.DATA, ByteBuffer.wrap(expectedData.toBytes()));
    assertEquals(expectedData, actualPayload);
  }

}
