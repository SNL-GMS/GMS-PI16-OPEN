package gms.shared.workflow.api.requests;

import java.time.Instant;

public interface UserRequest {

  String getUserName();

  Instant getTime();
}
