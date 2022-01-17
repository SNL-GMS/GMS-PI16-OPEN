package gms.tools.stationrefbuilder;

import java.io.File;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The main class for the Station MetaData Auto-Manipulator. Expecting no inputs arguments this
 * program assumes:
 * 1. The directory where the meta data is kept will be "meta/"
 * 2. The file where the configuration is kept will be called "configuration.json"
 * 3. The file where the station group rules are kept will be called "stationgrouprules.json"
 *
 */
public class StationMetaDataManipulator {

  private static final Logger logger = LoggerFactory.getLogger(StationMetaDataManipulator.class);

  public static void main(String[] args) {
    String scanDirname = "meta/";
    String generalConfFilename = "configuration.json";
    String groupConfFilename = "stationgrouprules.json";

    File scanFile = new File(scanDirname);
    File confFile = new File(generalConfFilename);
    File groupConfFile = new File(groupConfFilename);

    if (!scanFile.exists()) {
      logger.error("Could not find the \"meta\\\" directory, cannot continue");
      return;
    }
    if (!confFile.exists()) {
      logger.error("Could not find the configuration.json file, cannot continue");
      return;
    }
    if (!groupConfFile.exists()) {
      logger.error("Could not find the stationgrouprules.json file, cannot continue");
      return;
    }

    StationManipulator stations = new StationManipulator();
    try {
      stations.init(scanFile.toURI().toURL(), confFile.toURI().toURL(), groupConfFile.toURI().toURL());
    } catch (IOException e) {
      logger.error("Error Processing", e);
    }
  }
}
