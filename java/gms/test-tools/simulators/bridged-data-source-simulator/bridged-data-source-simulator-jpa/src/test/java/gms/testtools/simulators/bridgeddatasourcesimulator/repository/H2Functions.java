package gms.testtools.simulators.bridgeddatasourcesimulator.repository;

import java.sql.Connection;
import java.sql.SQLException;

public class H2Functions {

  public static boolean simulationCleanup(Connection conn, String i_table_name) throws SQLException {
    return conn.createStatement()
      .execute("TRUNCATE TABLE GMS_SIMULATION_GLOBAL.`" + i_table_name + "`; ");
  }
}
