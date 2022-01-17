package gms.shared.utilities.bridge.database.converter;

import java.time.Instant;
import javax.persistence.Converter;

@Converter
public class JulianDateConverterNegativeNa extends JulianDateConverter {

  public static final int NA_VALUE = -1;

  protected Instant getDefaultValue() {
    return Instant.MIN;
  }

  protected int getNaValue() {
    return NA_VALUE;
  }


}