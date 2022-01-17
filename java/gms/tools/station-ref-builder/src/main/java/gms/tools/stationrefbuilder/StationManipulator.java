package gms.tools.stationrefbuilder;

import com.fasterxml.jackson.databind.ObjectMapper;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.utilities.validation.PathValidation;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Scanner;
import java.util.StringTokenizer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The class that builds and updates the affiliation.dat in all folders, builds the Excel
 * Spreadsheet and the station related JSON Files.
 */
public class StationManipulator {

  private static final Logger logger = LoggerFactory.getLogger(StationManipulator.class);

  private AffiliationManager affiliationManager;

  private ArrayList<Station> stations = new ArrayList<>();

  private StationReferenceBuilderConfiguration stationReferenceBuilderConfiguration;

  private static final String RESPONSE = "responses";

  private ConfigurationFileManager configurationFileManager;

  private static final String INSTRUMENT =  "/instrument.dat";



  /**
   * Start the processing of the Station Meta Data.
   *
   * @param meta The meta file directory to scan.
   * @param conf The location of the configuration file
   */
  public void init(URL meta, URL conf, URL groupConf) throws IOException {

    File pathToScan = new File(meta.getFile());

    ObjectMapper objectMapper = CoiObjectMapperFactory.getJsonObjectMapper();

    stationReferenceBuilderConfiguration = objectMapper.readValue(conf,
        StationReferenceBuilderConfiguration.class);

    StationGroupBuilderConfiguration groupConfig =
        objectMapper.readValue(groupConf, StationGroupBuilderConfiguration.class);

    configurationFileManager = new ConfigurationFileManager(meta,
        stationReferenceBuilderConfiguration, groupConfig);

    //write the new network.dat file, based on station config... to be on safe side, write it every time.
    configurationFileManager.writeNetworkDatFile();

    affiliationManager = new AffiliationManager(meta, stationReferenceBuilderConfiguration,
        configurationFileManager, groupConfig);

    //here is where the real work happens
    try {
      readThroughFiles(pathToScan);

      //Need to sort the stationGroup Lists
      configurationFileManager.getAllGroups().forEach((s, l) -> Collections.sort(l));

      //this makes the whole order jumbled...
      //so, sort b4 calling! Create Comparator...
      Comparator<Station> statComp = Comparator.comparing(Station::getStationName);
      Collections.sort(stations, statComp);

      if (stationReferenceBuilderConfiguration.getWriteCsv()) {
        try (FileWriter detailed = new FileWriter(
            stationReferenceBuilderConfiguration.getDetailedStationGroupListFilename());
            FileWriter stationGroupList = new FileWriter(
                stationReferenceBuilderConfiguration.getStationGroupListFilename())) {
          CSVManager csvman = new CSVManager();
          csvman.logDetailsHead(detailed);
          csvman.writeStationGroupList(stationGroupList, configurationFileManager.getAllGroups());

          for (Iterator<Station> iterator = stations.iterator(); iterator.hasNext(); ) {
            csvman.logDetails(detailed, iterator.next());
          }
          detailed.flush();
        }
      }

      //write the JSON for the station configuration... based on template.
      if (stationReferenceBuilderConfiguration.getWriteJson()) {
        JSONManager jman = new JSONManager(stationReferenceBuilderConfiguration);
        jman.writeJSON(stations);
        jman.writeChannelRefJSON(stations);
      }

      if (stationReferenceBuilderConfiguration.getSpecialReplacements() != null) {
        for (Iterator<Replacement> iterator =
            stationReferenceBuilderConfiguration.getSpecialReplacements().iterator(); iterator.hasNext(); ) {

          boolean result = configurationFileManager.checkForSpecialReplacements(iterator.next());
          logger.info("Making special replacements yielded a result");

        }
      }

    } catch (IOException ie) {
      logger.error("IO Exception occurred.");
    }
  }


  /**
   * Recursively reads through all directories and subsequent files. If it is a directory, go into
   * the directory and go through the files. Note: station name = node name.
   */
  private void readThroughFiles(File node) throws IOException {
    if (node.isDirectory() && !node.getName().contains(RESPONSE)) {
      Station currentStat = readDirectories(node);
      configurationFileManager.setCurrentStat(currentStat);
      List<String> listFile = Arrays.asList(node.list());
      Collections.sort(listFile, Collections.reverseOrder());
      File tmpFile = new File(node, listFile.get(0));
      if (!tmpFile.isDirectory() && !listFile.contains("instrument.dat") && !tmpFile.getName().equals("network.dat")) {
        createInstrumentDat(node);
      }
      for (Object filename : listFile) {
        readThroughFiles(new File(node, filename.toString()));
      }
    } else {
      try {
        //it's a file, so let's look at it! But only if it's the right name...
        //need affiliation.dat to write into and site.dat or sitechan.dat to read.
        // All others we do not care about, except to clean up formatting...
        //and to create an empty instrument.dat, if required.
        if (stationReferenceBuilderConfiguration.getCheckForWhitespace() && !node.getName().contains(RESPONSE)) {
          //check for whitespace violations in the provided Meta Data...
          configurationFileManager.checkForWhiteSpace(node);
        }
        //Need to also skip network.dat, which sits at the root level of metadata...
        switch (node.getName()) {
          case "site.dat":
            configurationFileManager.loadLocation(node);
            break;
          case "sitechan.dat":
            loadSiteChan(node);
            break;
          case "affiliation.dat":
            affiliationManager.handleAffiliation(node);
            break;
          case "instrument.dat":
            configurationFileManager.checkForDuplicates(node);
            break;
          default:
        }
      } catch (FileNotFoundException ex) {
        logger.error("readThroughFiles: FileNotFound Exception occurred.");
      }
    }
  }


  /**
   * If there is no instrument.dat file in the passed directory, creates an empty one...
   *
   * @param node - the directory to create the instrument.dat file in.
   */
  private void createInstrumentDat(File node) {
    try {

      String finalPath = configurationFileManager.getScanDir() + node.getName() +  INSTRUMENT;

      File tmp = null;

      if (PathValidation.validateDirectoryPath(finalPath, configurationFileManager.getScanDir().getPath()))
      {

        tmp = new File(finalPath);
      }
      else {
        logger.error("couldn't validate path in createInstrumentDat(File node)");
        return;
      }

      boolean isCreated = tmp.createNewFile();
      if (!isCreated) {
        logger.error("Could not create information.dat");
      } else {
        logger.info("There was no instrument.dat found, so created an empty one.");
      }
    } catch (IOException ex) {
      logger.error("Could not create empty file for instrument.dat.");
    }
  }

  /**
   * Reads the folder name to get and assign the station name
   */
  private Station readDirectories(File node) {
    Station myStat = null;
    if (!(node.getName().contains("meta") ||
        node.getName().contains("Metadata") ||
        node.getName().contains(RESPONSE))) {
      String stationName = node.getName();
      myStat = new Station(stationName);
      //need to set this from the list...
      for (Protocols tmp : Protocols.values()) {
        ArrayList<String> tmpList = (ArrayList<String>) stationReferenceBuilderConfiguration.getStationsByProtocol().get(tmp);
        if (tmpList.contains(stationName)) {
          myStat.setFormat(tmp.name());
          break;
        }
      }
      for (Priorities tmp: Priorities.values()) {
        ArrayList<String> tmpList = (ArrayList<String>) stationReferenceBuilderConfiguration.getStationsByPriority().get(tmp);
        if (tmpList.contains(stationName)) {
          myStat.setPriority(tmp.name());
          break;
        }
      }
    }
    return myStat;
  }

  /**
   * Loads the sitechan.dat file and determines number of "live" channels.
   */
  private void loadSiteChan(File node) {
    try (Scanner scanner = new Scanner(node)) {
      int matchLiveChan = 0;
      ArrayList<Channel> chans = new ArrayList<>();
      while (scanner.hasNextLine()) {
        String matchLine = scanner.nextLine();
        StringTokenizer st1 = new StringTokenizer(matchLine, " ");
        ArrayList<String> lineWords = new ArrayList<>();

        while (st1.hasMoreElements()) {
          lineWords.add(st1.nextToken());
        }
        //If column 5 == 2286324, count it!
        if (lineWords.get(4).equals(ConfigurationFileManager.HIGHDATE)) {
          matchLiveChan++;
          Channel chan = Channel.builder().setChannelName(
              configurationFileManager.getCurrentStat().getStationName() + "." +
              lineWords.get(0) + "." + lineWords.get(1)).build();
          chans.add(chan);
        }
      }
      configurationFileManager.getCurrentStat().setChanNum(matchLiveChan);
      configurationFileManager.getCurrentStat().setChannels(chans);
      stations.add(configurationFileManager.getCurrentStat());
    } catch (FileNotFoundException fex) {
      logger.error("File not found in loadSiteChan.");
    }
  }
}
