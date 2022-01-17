package gms.tools.stationrefbuilder;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.frameworks.configuration.ConfigurationOption;
import gms.shared.frameworks.configuration.constraints.DefaultConstraint;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class handles the creation and manipulation of the required JSON files, cd11.json and
 * default.json that list all stations and attributes.
 */
public class JSONManager {

  private static final Logger logger = LoggerFactory.getLogger(JSONManager.class);

  private static final String PH1 = "PLACEHOLDER1";
  private static final String PH2 = "PLACEHOLDER2";

  private StationReferenceBuilderConfiguration stationReferenceBuilderConfiguration;

  public JSONManager(StationReferenceBuilderConfiguration conf) {
    stationReferenceBuilderConfiguration = conf;
  }

  /**
   * Write the JSON file for the station information... Each station entry replaces two
   * placeholders, the first for the station name and the second for the port offset, which starts
   * at 0 and is incremented for each entry.
   */
  protected void writeJSON(ArrayList<Station> stations) {
    try (FileWriter fw = new FileWriter(
        stationReferenceBuilderConfiguration.getDefaultJsonFilename())) {
      int counter = 0;
      List<StationSummary> stationSummaries = new ArrayList<>();
      ObjectMapper objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();

      for (Station station : stations) {
        // We may be able to update Station and use it directly instead of
        // StationSummary
        stationSummaries.add(StationSummary.builder()
            .setStationName(station.getStationName())
            .setAcquired(true)
            .setFrameProcessingDisabled(false)
            .setPortOffset(counter)
            .build());
        counter++;
      }

      ConfigurationOption configurationOption = ConfigurationOption
          .from("station-acquisition-config", List.of(DefaultConstraint.from()), Map
              .of("stations", stationSummaries));

      fw.write(
          objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(configurationOption));
      fw.flush();
    } catch (IOException e) {
      logger.error("Could not generate JSON File: {}.",
          stationReferenceBuilderConfiguration.getDefaultJsonFilename());
    }
  }

  /**
   * Write the Channel Reference Data JSON File. Each entry replaces one "Placeholder" tag.
   * Currently, the JSON file echoes key:value as the same, so the same placeholder replaces both.
   * The exception are the stations that need site id, like 00, those have a second placeholder.
   */
  protected void writeChannelRefJSON(ArrayList<Station> stations) {
    //write the JSON file for the station offset... make this a JsonNode, once in gms-common...
    try (FileWriter fw = new FileWriter(
        stationReferenceBuilderConfiguration.getCd11JsonFilename())) {

      String jsonString1 = "{\n"
          + "    \"name\": \"cd-1.1\",\n"
          + "    \"constraints\": [\n"
          + "        {\n"
          + "            \"constraintType\": \"STRING\",\n"
          + "            \"criterion\": \"protocol\",\n"
          + "            \"operator\": {\n"
          + "                \"type\": \"EQ\",\n"
          + "                \"negated\": false\n"
          + "            },\n"
          + "            \"value\": [\n"
          + "                \"CD11\"\n"
          + "            ]\n"
          + "        }\n"
          + "    ],\n"
          + "    \"parameters\": {\n"
          + "        \"channelIdsByPacketName\": {\n";
      String jsonString2 = "            \"" + PH1 + "\": \"" + PH1 + "\"";
      String jsonString4 = "            \"" + PH2 + "\": \"" + PH1 + "\"";
      String jsonString3 = "\n        }\n"
          + "    }\n"
          + "}";
      fw.write(jsonString1);
      for (Iterator<Station> iterator = stations.iterator(); iterator.hasNext(); ) {
        Station temp = iterator.next();
        if (stationReferenceBuilderConfiguration.getReplaceZeroes()
            && (temp.getFormat().equals("MiniSEED") || temp.getFormat().equals(""))) {
          fw.write(replaceJSONString(jsonString4, temp, true));
        } else {
          fw.write(replaceJSONString(jsonString2, temp, false));
        }
        if (iterator.hasNext()) {
          fw.write(",\n");
        }
        fw.flush();
      }
      fw.write(jsonString3);
      fw.flush();
    } catch (IOException e) {
      logger.error("Could not generate JSON File: {}.", stationReferenceBuilderConfiguration.getCd11JsonFilename());
    }
  }

  /**
   * Replace placeholder in the JSON String with information passed in - station name
   *
   * @param js   - the JSON String
   * @param stat - The Station
   * @return the corrected JSON String
   */
  private String replaceJSONString(String js, Station stat, boolean replace) {
    StringBuilder bld = new StringBuilder();
    for (Iterator<Channel> iterator = stat.getChannels().iterator(); iterator.hasNext(); ) {
      String temp = iterator.next().getChannelName();
      String built = js.replace(PH1, temp);
      if (replace) {
        String temp2 = temp.replace("00.", ".");
        built = built.replace(PH2, temp2);
      }
      bld.append(built);
      if (iterator.hasNext()) {
        bld.append(",\n");
      }
    }
    return bld.toString();
  }

}
