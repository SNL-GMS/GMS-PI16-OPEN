package gms.testtools.mockworkflow.util;

import com.fasterxml.jackson.core.type.TypeReference;
import gms.shared.frameworks.osd.coi.datatransferobjects.CoiObjectMapperFactory;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import org.apache.commons.lang3.Validate;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

public class WorkflowLoaderUtility {

  /* Hiding default public constructor */
  private WorkflowLoaderUtility() {
  }

  public static Map<String, List<StageInterval>> loadWorkflowIntervalsFromFile(String fullFilePath) {
    try (final InputStream dataStream = WorkflowLoaderUtility.class.getClassLoader().getResourceAsStream(fullFilePath)) {
      Validate.notNull(dataStream, String.format("File at [%s] does not exist.", fullFilePath));

      return CoiObjectMapperFactory.getJsonObjectMapper().readValue(dataStream, new TypeReference<>() {
      });
    } catch (IOException e) {
      throw new IllegalArgumentException("Unable to load Stage Intervals from Json file", e);
    }
  }

  public static Workflow loadWorkflowFromFile(String fullFilePath) {
    try (final InputStream dataStream = WorkflowLoaderUtility.class.getClassLoader().getResourceAsStream(fullFilePath)) {
      Validate.notNull(dataStream, String.format("File at [%s] does not exist.", fullFilePath));

      return CoiObjectMapperFactory.getJsonObjectMapper().readValue(dataStream, new TypeReference<>() {
      });
    } catch (IOException e) {
      throw new IllegalArgumentException("Unable to load Workflow from Json file", e);
    }
  }
}
