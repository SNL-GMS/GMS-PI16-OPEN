package gms.shared.frameworks.coi.exceptions;

public class StorageUnavailableException extends RepositoryException {

  public StorageUnavailableException(Throwable cause) {
    super(cause);
  }

  public StorageUnavailableException(String msg) {
    super(msg);
  }

  public StorageUnavailableException() {
    super();
  }
}
