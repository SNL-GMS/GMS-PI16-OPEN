package gms.shared.stationdefinition.converter.interfaces;

import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;

public interface FrequencyAmplitudePhaseConverter {

  /**
   * Converts the file at the location of the passed filename string to a
   * {@link FrequencyAmplitudePhase} object.
   *
   * @param filename String holding the filename of the FAP Response file...
   * @param channelName String holding the two or three letter channel name.
   * @return A FrequencyAmplitudePhase object containing the information passed in through the FAP File
   */
  FrequencyAmplitudePhase convert(String filename, String channelName);

  FrequencyAmplitudePhase convertToEntityReference(String fileName);

}
