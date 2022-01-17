package gms.shared.signaldetection.converter.measurementvalues;

import gms.shared.signaldetection.coi.types.PhaseType;
import gms.shared.signaldetection.coi.values.PhaseTypeMeasurementValue;
import gms.shared.signaldetection.converter.measurementvalue.specs.MeasurementValueSpec;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class PhaseTypeMeasurementValueConverter implements
  MeasurementValueConverter<PhaseTypeMeasurementValue> {

  private static final StructuredLoggingWrapper logger =
    StructuredLoggingWrapper.create(LoggerFactory.getLogger(PhaseTypeMeasurementValueConverter.class));

  private PhaseTypeMeasurementValueConverter() {
  }

  public static PhaseTypeMeasurementValueConverter create() {
    return new PhaseTypeMeasurementValueConverter();
  }

  @Override
  public Optional<PhaseTypeMeasurementValue> convert(MeasurementValueSpec<PhaseTypeMeasurementValue> spec) {
    var arrivalDao = spec.getArrivalDao();
    try {
      return Optional.of(PhaseTypeMeasurementValue.fromFeatureMeasurement(PhaseType.valueOf(arrivalDao.getPhase()),
        Optional.empty(), arrivalDao.getArrivalKey().getTime()));
    } catch (IllegalArgumentException ex) {
      logger.info("Cannot map phase type {}", arrivalDao.getPhase());
      return Optional.of(PhaseTypeMeasurementValue.fromFeatureMeasurement(PhaseType.UNKNOWN,
        Optional.empty(), arrivalDao.getArrivalKey().getTime()));
    }
  }
}
