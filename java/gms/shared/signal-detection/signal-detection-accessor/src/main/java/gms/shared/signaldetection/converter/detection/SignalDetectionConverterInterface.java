package gms.shared.signaldetection.converter.detection;

import gms.shared.signaldetection.coi.detection.SignalDetection;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.coi.station.Station;
import gms.shared.workflow.coi.WorkflowDefinitionId;

import java.util.Map;
import java.util.Optional;

public interface SignalDetectionConverterInterface {

  /**
   * Convert method definition for converting legacy DB to COI objects for SignalDetection.
   *
   * @param arrivalsByStage the {@link Map} of {@link ArrivalDao}s containing the data for the {@link SignalDetection},
   * keyed by the {@link WorkflowDefinitionId} used to retrieve the arrivals
   * @param station the {@link Station} on which the {@link SignalDetection} was measured
   * @return a SignalDetection object
   */
  Optional<SignalDetection> convert(Map<WorkflowDefinitionId, ArrivalDao> arrivalsByStage,
    Station station,
    String monitoringOrganization);
}
