package gms.shared.workflow.repository;

import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.workflow.coi.StageInterval;
import gms.shared.workflow.coi.Workflow;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import gms.shared.workflow.dao.IntervalDao;
import gms.shared.workflow.repository.util.IntervalUtility;
import org.apache.commons.lang3.tuple.Pair;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManagerFactory;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toSet;

public class BridgedIntervalRepository implements IntervalRepositoryInterface {

  private static StructuredLoggingWrapper logger = StructuredLoggingWrapper.create(LoggerFactory.getLogger(BridgedIntervalRepository.class));

  private final IntervalDatabaseConnector intervalConnector;
  private final IntervalConverter intervalConverter;

  private BridgedIntervalRepository(IntervalDatabaseConnector intervalConnector, IntervalConverter intervalConverter) {
    this.intervalConnector = intervalConnector;
    this.intervalConverter = intervalConverter;
  }

  public static BridgedIntervalRepository create(EntityManagerFactory entityManagerFactory, Workflow workflow) {
    var intervalConnector = IntervalDatabaseConnector.create(entityManagerFactory);
    var intervalConverter = IntervalConverter.create(workflow);
    return create(intervalConnector, intervalConverter);
  }

  //For testing purposes only
  static BridgedIntervalRepository create(IntervalDatabaseConnector intervalConnector, IntervalConverter intervalConverter) {
    return new BridgedIntervalRepository(intervalConnector, intervalConverter);
  }

  @Override
  public Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(Instant startTime, Instant endTime,
    Collection<WorkflowDefinitionId> stageIds) {
    logger.debug("Received request to find stage intervals start:{} end:{} stageIds:{}", startTime, endTime, stageIds);

    logger.debug("Retrieving name/type pairs for stage ids");
    var nameTypePairs = getNameTypePairs(stageIds);
    logger.debug("Found {} name/type pairs", nameTypePairs);

    logger.debug("Retrieving legacy intervals...");
    var timeSortedIntervalDaos = intervalConnector.findIntervalsByNameAndTimeRange(nameTypePairs, startTime, endTime)
      .stream()
      .sorted(Comparator.comparing(IntervalDao::getTime)
        .thenComparing(IntervalDao::getType)
        .thenComparing(IntervalDao::getName))
      .collect(toList());
    logger.debug("Retrieved {} intervals", timeSortedIntervalDaos.size());

    logger.debug("Converting intervals...");
    Map<String, List<StageInterval>> convertedStageIntervals = intervalConverter.convert(timeSortedIntervalDaos, startTime, endTime);
    logger.debug("Converted legacy intervals to {} COI intervals", convertedStageIntervals.size());
    return convertedStageIntervals;
  }
  
  public Map<String, List<StageInterval>> findStageIntervalsByStageIdAndTime(Instant startTime, Instant endTime,
    Collection<WorkflowDefinitionId> stageIds, Instant modifiedAfter) {
    logger.debug("Received request to find stage intervals start:{} end:{} stageIds:{} modifiedAfter:{}",
      startTime, endTime, stageIds, modifiedAfter);

    logger.debug("Retrieving name/type pairs for stage ids");
    var nameTypePairs = getNameTypePairs(stageIds);
    logger.debug("Found {} name/type pairs", nameTypePairs);

    logger.debug("Retrieving legacy intervals...");
    var timeSortedIntervalDaos = intervalConnector
      .findIntervalsByNameAndTimeRangeAfterModDate(nameTypePairs, startTime, endTime, modifiedAfter)
      .stream()
      .sorted(Comparator.comparing(IntervalDao::getTime)
        .thenComparing(IntervalDao::getType)
        .thenComparing(IntervalDao::getName))
      .collect(toList());
    logger.debug("Retrieved {} intervals", timeSortedIntervalDaos.size());

    logger.debug("Converting intervals...");
    Map<String, List<StageInterval>> convertedStageIntervals = intervalConverter.convert(timeSortedIntervalDaos, startTime, endTime);
    logger.debug("Converted legacy intervals to {} COI intervals", convertedStageIntervals.size());
    return convertedStageIntervals;
  }

  private Set<Pair<String, String>> getNameTypePairs(Collection<WorkflowDefinitionId> stageIds) {
    return stageIds.stream()
      .map(WorkflowDefinitionId::getName)
      .map(IntervalUtility::getLegacyClassAndName)
      .flatMap(Optional::stream)
      .collect(toSet());
  }
}
