package gms.shared.stationdefinition.converter;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.coi.channel.ChannelDataType;
import gms.shared.stationdefinition.coi.channel.ChannelInstrumentType;
import gms.shared.stationdefinition.coi.channel.ChannelOrientationType;
import gms.shared.stationdefinition.coi.channel.ChannelTypes;
import gms.shared.stationdefinition.coi.channel.ChannelTypesParser;
import gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase;
import com.github.ffpojo.FFPojoHelper;
import com.github.ffpojo.exception.FFPojoException;
import gms.shared.stationdefinition.coi.utils.Units;
import gms.shared.stationdefinition.converter.interfaces.FrequencyAmplitudePhaseConverter;
import gms.shared.stationdefinition.converter.util.FapRecord;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FileFrequencyAmplitudePhaseConverter implements FrequencyAmplitudePhaseConverter {

  private static final Logger logger = LoggerFactory.getLogger(
    FileFrequencyAmplitudePhaseConverter.class);
  private static final String COMMENT_LINE_START = "#";

  private FileFrequencyAmplitudePhaseConverter() {
  }

  /**
   * creates a new {@link FileFrequencyAmplitudePhaseConverter}
   *
   * @return a {@link FileFrequencyAmplitudePhaseConverter}
   */
  public static FileFrequencyAmplitudePhaseConverter create() {
    return new FileFrequencyAmplitudePhaseConverter();
  }

  /**
   * Converts the file at the location of the passed filename string to a
   * {@link gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase} object.
   *
   * @param fileName String holding the filename of the FAP Response file... along with its path
   * @param channelName String holding the two or three digit channel name.
   * @return A FrequencyAmplitudePhase object containing the information passed in through the FAP File
   */
  public FrequencyAmplitudePhase convert(String fileName, String channelName) {


    List<Double> frequencies = new ArrayList<>();

    Optional<ChannelTypes> dt = ChannelTypesParser.parseChannelTypes(channelName);

    Objects.requireNonNull(fileName, "Filename string must not be null.");
    Preconditions.checkState(!fileName.isEmpty(), "FileName string must not be empty.");
    Preconditions.checkState(dt.isPresent(),
      "Invalid ChannelName parsed. Could not determine channel types.");

    List<FapRecord> fapRecordList = readFapFile(fileName);
    Preconditions.checkState(!fapRecordList.isEmpty(), "Could not read FAP record.");

    Units amplitudeUnits = determineUnits(dt.orElse(
      ChannelTypes.builder()
        .setDataType(ChannelDataType.SEISMIC)
        .setOrientationType(ChannelOrientationType.UNKNOWN)
        .setOrientationCode(ChannelOrientationType.UNKNOWN.getCode())
        .setInstrumentType(ChannelInstrumentType.UNKNOWN)
        .build()).getDataType());
    List<Double> amplitudeReponse = new ArrayList<>();
    List<Double> amplitudeReponseStdDev = new ArrayList<>();
    Units phaseUnits = Units.DEGREES;
    List<Double> phaseResponse = new ArrayList<>();
    List<Double> phaseResponseStdDev = new ArrayList<>();

    for (FapRecord fapRecord : fapRecordList) {
      frequencies.add(fapRecord.getFrequency());
      amplitudeReponse.add(fapRecord.getAmplitude());
      amplitudeReponseStdDev.add(fapRecord.getAmplitudeError());
      phaseResponse.add(fapRecord.getPhase());
      phaseResponseStdDev.add(fapRecord.getPhaseError());
    }
    return FrequencyAmplitudePhase.builder()
      .setId(UUID.nameUUIDFromBytes(fileName.getBytes()))
      .setData(FrequencyAmplitudePhase.Data.builder()
        .setFrequencies(toDoubleArray(frequencies))
        .setAmplitudeResponseUnits(amplitudeUnits)
        .setAmplitudeResponse(toDoubleArray(amplitudeReponse))
        .setAmplitudeResponseStdDev(toDoubleArray(amplitudeReponseStdDev))
        .setPhaseResponseUnits(phaseUnits)
        .setPhaseResponse(toDoubleArray(phaseResponse))
        .setPhaseResponseStdDev(toDoubleArray(phaseResponseStdDev))
        .build())
      .build();
  }

  /**
   * Converts the passed filename string to create an entity reference of a
   * {@link gms.shared.stationdefinition.coi.channel.FrequencyAmplitudePhase} object.
   *
   * @param fileName String holding the filename of the FAP Response file... along with its path
   * @return A FrequencyAmplitudePhase object containing the Id
   */
  @Override
  public FrequencyAmplitudePhase convertToEntityReference(String fileName) {
    return FrequencyAmplitudePhase.createEntityReference(UUID.nameUUIDFromBytes(fileName.getBytes()));
  }

  /**
   * Return an array of doubles based on a list of Doubles to make it fit with the FAP definition.
   *
   * @param doubleList The List to be converted into an array of primitives
   * @return the array of primitives
   */
  private static double[] toDoubleArray(List<Double> doubleList) {
    return doubleList.stream().mapToDouble(Double::doubleValue).toArray();
  }

  /**
   * Reads FAP (frequency, amplitude, phase) response file into FAP records.
   *
   * @param fileName Path to response file
   * @return list of FAPRecord objects from the data in the file represented by
   * fileName
   */
  public static List<FapRecord> readFapFile(String fileName) {
    final List<FapRecord> fapValues = new ArrayList<>();
    int responseCount = 0;

    try {
      final FFPojoHelper ffpojo = FFPojoHelper.getInstance();
      final List<String> responseDataLines = Files.readAllLines(Paths.get(fileName));
      int linesAfterComments = 0;
      for (String line : responseDataLines) {
        if (line.startsWith(COMMENT_LINE_START) || line.isEmpty()) {
          continue;
        }

        // Ignore the first line after the comments section. The second line has the number of
        // responses present in the file.
        linesAfterComments++;
        if (linesAfterComments == 2) {
          responseCount = Integer.parseInt(line.trim());
        }

        if (linesAfterComments > 2) {
          // The FapValue delimiter is just a space, so replace all whitespace with " "

          fapValues.add(ffpojo.createFromText(FapRecord.class,
            line.replaceAll("\\s+", " ").trim()));
        }
      }

      if (fapValues.size() != responseCount) {
        logger.warn("Number of FAP objects ({}) does not equal listed count {} in response file ({})",
          fapValues.size(), responseCount, fileName);
      }
    } catch (IOException | FFPojoException e) {
      logger.error("Error reading FAP file {}: {}", fileName, e.getMessage());
    }
    return fapValues;
  }

  /**
   * Given a channel's data type, return the correct units for that data type
   * (e.g. seimsic units are counts/nm).
   *
   * @param channelDataType data type for channel whose units are returned
   * @return units for specified channel
   */
  static Units determineUnits(ChannelDataType channelDataType) {
    Units units;
    switch (channelDataType) {
      case SEISMIC:
        units = Units.COUNTS_PER_NANOMETER;
        break;
      case HYDROACOUSTIC:
      case INFRASOUND:
        units = Units.COUNTS_PER_PASCAL;
        break;
      default:
        units = Units.UNITLESS;
    }
    return units;
  }

}
