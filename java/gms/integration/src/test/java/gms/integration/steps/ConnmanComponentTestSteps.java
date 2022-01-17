package gms.integration.steps;

import gms.shared.frameworks.test.utils.services.GmsServiceType;
import io.cucumber.java.PendingException;
import io.cucumber.java.en.Then;
import java.net.UnknownHostException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testcontainers.junit.jupiter.Testcontainers;


@Testcontainers
public class ConnmanComponentTestSteps {

  private static final Logger logger = LoggerFactory.getLogger(ConnmanComponentTestSteps.class);

  private final int PORTMIN=0;
  private final int PORTMAX=65535;
  private final int MAXSOCKETWAITTIME=2000;
  private final int SERVICE_PORT=8041;
  private final int LOCAL_PORT=65001;

  private Environment environment;

  public ConnmanComponentTestSteps(Environment environment) {
    this.environment = environment;

    String serviceHost = this.environment.deploymentCtxt().getServiceHost(GmsServiceType.CONNMAN);
    logger.info("Service host: {}", serviceHost);
    logger.info("Service port: {}", SERVICE_PORT);
    logger.info("\n");
  }

  @Then("connman responds to connection request correctly for station {string}")
  public void connmanWorks(String stationName) throws UnknownHostException {

    throw new PendingException("Not yet implemented for reactive");
  }
}
