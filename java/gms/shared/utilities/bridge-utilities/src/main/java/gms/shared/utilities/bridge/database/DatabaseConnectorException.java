package gms.shared.utilities.bridge.database;

public class DatabaseConnectorException extends
    RuntimeException {
  public DatabaseConnectorException(String message, Exception e) {
    super(message, e);
  }
}
