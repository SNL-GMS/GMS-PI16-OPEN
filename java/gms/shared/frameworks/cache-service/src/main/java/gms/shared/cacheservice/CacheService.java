package gms.shared.cacheservice;


import gms.shared.frameworks.cache.utils.IgniteConnectionManager;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import java.util.ArrayList;
import org.apache.ignite.visor.commands.VisorConsole;
import org.slf4j.LoggerFactory;

public class CacheService {
  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
      .create(LoggerFactory.getLogger(IgniteConnectionManager.class));
  public static void main(String[] args) {
    // retVal exists solely to support unit testing
    boolean runVisor = CacheService.parseArgs(args);

    if(runVisor){
      VisorConsole.main(args);
    }else{
      SystemConfig config = SystemConfig.create("cache-service");
      IgniteConnectionManager.create(config, new ArrayList<>());
      Runtime.getRuntime().addShutdownHook(new Thread(() -> {
        logger.info("ignite closing");
        IgniteConnectionManager.close();
      }));
    }
  }
  protected static boolean parseArgs(String[] args){
    boolean runVisor = false;
    if((args.length > 0) && args[0].equals("visor")){
      runVisor = true;
    }
    return runVisor;
  }

}

