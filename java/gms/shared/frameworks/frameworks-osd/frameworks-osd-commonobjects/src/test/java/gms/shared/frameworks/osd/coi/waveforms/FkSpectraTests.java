package gms.shared.frameworks.osd.coi.waveforms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import gms.shared.frameworks.osd.coi.PhaseType;
import gms.shared.frameworks.osd.coi.fk.FkTestFixtures;
import gms.shared.frameworks.osd.coi.util.TestUtilities;
import gms.shared.frameworks.osd.coi.waveforms.FkSpectra.Metadata;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;
import org.junit.jupiter.api.Test;

public class FkSpectraTests {

  private final Instant startTime = Instant.EPOCH;
  private final double sampleRate = 1.0;
  private final PhaseType phaseType = PhaseType.P;
  private final double slowStartX = -.5;
  private final double slowDeltaX = 0.1;
  private final double slowStartY = -.2;
  private final double slowDeltaY = 0.2;
  private final Metadata metadata = Metadata.from(
      phaseType, slowStartX, slowStartY, slowDeltaX, slowDeltaY);
  private final int fkQual = 4;
  private final double[][] powerValues = new double[][]{
      {-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5},
      {5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5},
      {-.5, -.4, -.3, -.2, -.1, 0, .1, .2, .3, .4, .5}
  };
  private final double[][] fstatValues = new double[][]{
      {5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5},
      {-.5, -.4, -.3, -.2, -.1, 0, .1, .2, .3, .4, .5},
      {-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5}};

  private final FkSpectrum fkSpectrum = FkSpectrum.from(
      powerValues, fstatValues, fkQual);

  private FkSpectra.Builder fkSpectraBuilder() {
    FkSpectra.Builder builder = FkSpectra.builder()
        .setStartTime(startTime)
        .setSampleRate(sampleRate)
        .withValues(List.of(fkSpectrum));

    builder.metadataBuilder()
        .setPhaseType(phaseType)
        .setSlowStartX(slowStartX)
        .setSlowDeltaX(slowDeltaX)
        .setSlowStartY(slowStartY)
        .setSlowDeltaY(slowDeltaY);

    return builder;
  }

  @Test
  public void testFrom() {
    FkSpectra fk = fkSpectraBuilder()
        .setValues(List.of(fkSpectrum))
        .setSampleCount(1).build();

    assertEquals(startTime, fk.getStartTime());
    assertEquals(sampleRate, fk.getSampleRate(), 1e-6);
    assertEquals(1, fk.getSampleCount());

    assertEquals(1, fk.getValues().size());
    assertEquals(1, fk.getSampleCount());
    assertTrue(Arrays.deepEquals(powerValues, fk.getValues().get(0).getPower().copyOf()));

    Metadata metadata = fk.getMetadata();
    assertEquals(phaseType, metadata.getPhaseType());

    assertEquals(slowStartX, metadata.getSlowStartX(), 1e-6);
    assertEquals(slowDeltaX, metadata.getSlowDeltaX(), 1e-6);

    assertEquals(slowStartY, metadata.getSlowStartY(), 1e-6);
    assertEquals(slowDeltaY, metadata.getSlowDeltaY(), 1e-6);
  }

  @Test
  public void testEmptyValuesExpectIllegalArgument() {
    final Predicate<Exception> validator
        = ex -> ex.getMessage().contains("cannot contain empty FkSpectrum values");
    IllegalStateException ex = assertThrows(IllegalStateException.class,
        () -> FkSpectra.from(Instant.EPOCH, 1.0, 1, List.of(), metadata));
    assertTrue(validator.test(ex));
    ex = assertThrows(IllegalStateException.class,
        () -> fkSpectraBuilder().setValues(List.of()).build());
    assertTrue(validator.test(ex));
  }

  @Test
  public void testFromDifferentSpectrumDimensionsExpectIllegalArgument() {
    FkSpectra.Builder fk = fkSpectraBuilder();

    double[][] smallColumn = new double[][]{
            {-5, -4, -3, -2, -1, 0},
            {5, 4, 3, 2, 1, 0},
            {-.5, -.4, -.3, -.2, -.1, 0}
    };
    double[][] smallRow = new double[][]{
        {-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5},
        {-.5, -.4, -.3, -.2, -.1, 0, .1, .2, .3, .4, .5}
    };

    IllegalStateException e;

    e = assertThrows(IllegalStateException.class,
        () -> fk.withValues(List.of(fkSpectrum,
            FkSpectrum.from(smallRow, smallRow, 4))).build());
    assertTrue(e.getMessage().contains("Power") && e.getMessage().contains("rows"));

    e = assertThrows(IllegalStateException.class,
        () -> fk.withValues(List.of(fkSpectrum,
            FkSpectrum.from(smallColumn, smallColumn, 4))).build());
    assertTrue(e.getMessage().contains("Power") && e.getMessage().contains("columns"));

  }

  @Test
  public void testSerialization() throws Exception {
    TestUtilities.testSerialization(FkTestFixtures.fkSpectra, FkSpectra.class);
  }
}
