package gms.shared.workflow.configuration;

import gms.shared.frameworks.configuration.Selector;
import gms.shared.frameworks.configuration.repository.client.ConfigurationConsumerUtility;
import gms.shared.workflow.coi.Stage;
import gms.shared.workflow.coi.Workflow;

import java.util.List;

import static java.util.stream.Collectors.toList;

public class WorkflowConfiguration {

  static final String WORKFLOW_DEFINITION_CONFIG = "workflow-manager.workflow-definition";
  static final String STAGE_DEFINITION_CONFIG = "workflow-manager.stage-definition";
  static final String NAME_SELECTOR = "name";

  private final ConfigurationConsumerUtility configurationConsumerUtility;

  private WorkflowConfiguration(ConfigurationConsumerUtility configurationConsumerUtility) {
    this.configurationConsumerUtility = configurationConsumerUtility;
  }

  public static WorkflowConfiguration create(ConfigurationConsumerUtility configurationConsumerUtility) {
    return new WorkflowConfiguration(configurationConsumerUtility);
  }

  public Workflow resolveWorkflowDefinition() {
    var workflowDefinition = configurationConsumerUtility.resolve(WORKFLOW_DEFINITION_CONFIG, List.of(), WorkflowDefinition.class);
    List<Stage> stages = workflowDefinition.getStageNames().stream()
      .map(stageName -> configurationConsumerUtility.resolve(STAGE_DEFINITION_CONFIG, List.of(Selector.from(NAME_SELECTOR, stageName)), Stage.class))
      .collect(toList());

    return Workflow.from(workflowDefinition.getName(), stages);
  }
}
