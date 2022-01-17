package gms.shared.user.preferences.api;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.user.preferences.coi.UserPreferences;
import gms.shared.frameworks.common.ContentType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import java.util.Optional;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

@Path("/user-manager-service")
@Component("user-preferences")
public interface UserPreferencesRepositoryInterface {

  @Path("/user-preferences")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(description = "returns the user preferences specified by the provided user id")
  Optional<UserPreferences> getUserPreferencesByUserId(
      @RequestBody(description = "User id to retrieve preferences for") String userId);

  @Path("/user-preferences/store")
  @POST
  @Consumes(ContentType.JSON_NAME)
  @Produces(ContentType.JSON_NAME)
  @Operation(description = "stores the provided user preferences")
  void setUserPreferences(
      @RequestBody(description = "User preferences to store")
      UserPreferences userPreferences);

}
