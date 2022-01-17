package gms.dataacquisition.data.preloader;

import static gms.dataacquisition.data.preloader.GenerationType.ACQUIRED_CHANNEL_ENV_ISSUE_ANALOG;
import static gms.dataacquisition.data.preloader.GenerationType.ACQUIRED_CHANNEL_ENV_ISSUE_BOOLEAN;
import static gms.dataacquisition.data.preloader.GenerationType.CAPABILITY_SOH_ROLLUP;
import static gms.dataacquisition.data.preloader.GenerationType.RAW_STATION_DATA_FRAME;
import static gms.dataacquisition.data.preloader.GenerationType.STATION_SOH;

import gms.dataacquisition.data.preloader.generator.AceiAnalogDataGenerator;
import gms.dataacquisition.data.preloader.generator.AceiBooleanDataGenerator;
import gms.dataacquisition.data.preloader.generator.CapabilitySohRollupDataGenerator;
import gms.dataacquisition.data.preloader.generator.CoiDataGenerator;
import gms.dataacquisition.data.preloader.generator.RsdfDataGenerator;
import gms.dataacquisition.data.preloader.generator.StationSohDataGenerator;
import gms.shared.frameworks.injector.Modifier;
import gms.shared.frameworks.osd.api.OsdRepositoryInterface;
import java.util.Map;
import java.util.function.BiFunction;

/**
 * Retrieves a data generator based on data generation type
 */
public class DataGeneratorFactory {

  private static final Map<GenerationType, BiFunction<GenerationSpec, OsdRepositoryInterface, ? extends CoiDataGenerator<?, ?>>> generatorBuilders = Map
      .of(
          RAW_STATION_DATA_FRAME, RsdfDataGenerator::new,
          CAPABILITY_SOH_ROLLUP, CapabilitySohRollupDataGenerator::new,
          ACQUIRED_CHANNEL_ENV_ISSUE_ANALOG, AceiAnalogDataGenerator::new,
          ACQUIRED_CHANNEL_ENV_ISSUE_BOOLEAN, AceiBooleanDataGenerator::new,
          STATION_SOH, StationSohDataGenerator::new
      );

  private DataGeneratorFactory() {
  }

  /**
   * Retrieves a data generator based on data generation type
   *
   * @param generationSpec used to determine data generation type
   * @param sohRepository  an instance of a connection to the OSD
   * @param <D>            type of data that is generated by a generator
   * @param <M>            the modifier for a particular type of data
   * @return a new instance of data generator
   */
  public static <D, M extends Modifier<Iterable<D>>> CoiDataGenerator<D, M> getDataGenerator(
      GenerationSpec generationSpec, OsdRepositoryInterface sohRepository) {
    final GenerationType generationType = generationSpec.getType();
    if (generatorBuilders.containsKey(generationType)) {
      return (CoiDataGenerator<D, M>) generatorBuilders.get(generationType)
          .apply(generationSpec, sohRepository);
    } else {
      throw new IllegalArgumentException(
          "No Builder Found For Data Generation Type: " + generationType);
    }
  }

}