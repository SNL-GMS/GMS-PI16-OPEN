package gms.integration.steps;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;


@Testcontainers
public class DataProviderTestSteps {

  private static final Logger logger = LoggerFactory.getLogger(DataProviderTestSteps.class);
  private Environment environment;
  private String resourceFileLocation;

  public DataProviderTestSteps(Environment environment) {
    this.environment = environment;
  }

  @Then("The dataprovider is ready to process data from kafka topic {string}")
  public void theDataproviderIsReadyToProcessDataFromKafkaTopic(String topic) {
    List<String> offsets =  environment.deploymentCtxt().getTopicOffset(topic);
  }

  @Given("An object of type {string} is read from input file {string}")
  public void anObjectOfTypeIsReadFromInputFile(String objType, String inputPath) {
    resourceFileLocation = Thread.currentThread().getContextClassLoader().getResource(inputPath).toString();
  }

  @And("The object is written to topic {string}")
  public void theObjectIsWrittenToTopic(String topic) {
    environment.deploymentCtxt().sendKafkaMessages(topic, resourceFileLocation);
  }

  @Then("dataprovider responds creates a dataman connection to station {string}")
  public void dataproviderRespondsCreatesADatamanConnectionToStation(String arg0) {
    logger.info("success");
  }
}
