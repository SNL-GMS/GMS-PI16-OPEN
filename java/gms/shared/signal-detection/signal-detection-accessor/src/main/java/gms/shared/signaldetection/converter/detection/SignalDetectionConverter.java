package gms.shared.signaldetection.converter.detection;

import com.google.common.base.Preconditions;
import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.coi.detection.SignalDetectionHypothesis;
import gms.shared.signaldetection.coi.detection.SignalDetectionId;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.apache.commons.lang3.tuple.Pair;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

public class SignalDetectionConverter implements SignalDetectionConverterInterface {

  private final SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter;
  private final SignalDetectionIdUtility signalDetectionIdUtility;
  private final List<WorkflowDefinitionId> orderedStages;

  private SignalDetectionConverter(SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter, SignalDetectionIdUtility signalDetectionIdUtility, List<WorkflowDefinitionId> orderedStages) {
    this.signalDetectionHypothesisConverter = signalDetectionHypothesisConverter;
    this.signalDetectionIdUtility = signalDetectionIdUtility;
    this.orderedStages = orderedStages;
  }

  /**
   * Create {@link SignalDetectionConverter} instance using {@link SignalDetectionHypothesisConverter}
   * to create the hypotheses needed for a {@link SignalDetection} object
   *
   * @param signalDetectionHypothesisConverter {@link SignalDetectionHypothesisConverter}
   * @return {@link SignalDetectionConverter}
   */
  public static SignalDetectionConverter create(
    SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter,
    SignalDetectionIdUtility signalDetectionIdUtility,
    List<WorkflowDefinitionId> orderedStages) {

    Objects.requireNonNull(signalDetectionHypothesisConverter);
    Objects.requireNonNull(signalDetectionIdUtility);
    Objects.requireNonNull(orderedStages);

    return new SignalDetectionConverter(signalDetectionHypothesisConverter, signalDetectionIdUtility, orderedStages);
  }

  @Override
  public Optional<SignalDetection> convert(Map<WorkflowDefinitionId, ArrivalDao> arrivalsByStage,
    Station station,
    String monitoringOrganization) {

    Objects.requireNonNull(arrivalsByStage);
    Objects.requireNonNull(station);
    Objects.requireNonNull(monitoringOrganization);

    Preconditions.checkState(!arrivalsByStage.isEmpty(),
      "Cannot create signal detection from empty arrivals");
    Preconditions.checkState(arrivalsByStage.values().stream().map(ArrivalDao::getId).distinct().count() == 1,
      "Cannot create signal detection from arrivals with different arids");

    UUID detectionId = arrivalsByStage.values().stream()
      .findFirst()
      .map(ArrivalDao::getId)
      .map(id -> UUID.nameUUIDFromBytes(String.valueOf(id).getBytes(StandardCharsets.UTF_8)))
      .orElseThrow();

    List<SignalDetectionHypothesis> hypotheses = orderedStages.stream()
      .map(stage -> {
        if (arrivalsByStage.containsKey(stage)) {
          return Optional.of(Pair.of(stage, arrivalsByStage.get(stage)));
        } else {
          return Optional.<Pair<WorkflowDefinitionId, ArrivalDao>>empty();
        }
      })
      .filter(Optional::isPresent)
      .map(Optional::get)
      .map(stageArrivalPair -> {
        WorkflowDefinitionId stage = stageArrivalPair.getKey();
        ArrivalDao arrival = stageArrivalPair.getValue();
        var possibleSdh = signalDetectionHypothesisConverter.convertToEntityReference(stage.getName(),
          detectionId,
          arrival);
        possibleSdh.ifPresent(sdh ->
          signalDetectionIdUtility.addAridAndStageIdForSignalDetectionHypothesisUUID(arrival.getId(),
            stage,
            sdh.getId().getId()));

        return possibleSdh;
      })
      .filter(Optional::isPresent)
      .map(Optional::get)
      .collect(Collectors.toList());

    return Optional.ofNullable(SignalDetection.from(SignalDetectionId.from(detectionId),
      Optional.of(SignalDetection.Data.builder()
        .setStation(station)
        .setMonitoringOrganization(monitoringOrganization)
        .setSignalDetectionHypotheses(hypotheses)
        .build())));
  }
}
