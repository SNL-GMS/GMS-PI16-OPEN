package gms.shared.utilities.bridge.database.converter;

import java.time.Instant;
import javax.persistence.Converter;

@Converter
public class JulianDateConverterPositiveNa extends JulianDateConverter {

  public static final int NA_VALUE = 2286324;

  protected Instant getDefaultValue() {
    return Instant.MAX;
  }

  protected int getNaValue() {
    return NA_VALUE;
  }
}