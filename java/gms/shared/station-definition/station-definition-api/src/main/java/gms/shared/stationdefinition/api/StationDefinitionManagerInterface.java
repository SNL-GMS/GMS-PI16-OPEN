package gms.shared.stationdefinition.api;

import gms.shared.frameworks.common.annotations.Component;
import gms.shared.stationdefinition.api.channel.ChannelGroupManagerInterface;
import gms.shared.stationdefinition.api.channel.ChannelManagerInterface;
import gms.shared.stationdefinition.api.channel.ResponseManagerInterface;
import gms.shared.stationdefinition.api.station.StationGroupManagerInterface;
import gms.shared.stationdefinition.api.station.StationManagerInterface;

import javax.ws.rs.Path;

@Component("station-definition")
@Path("/station-definition-service/station-definition")
public interface StationDefinitionManagerInterface extends
  StationGroupManagerInterface,
  StationManagerInterface,
  ChannelGroupManagerInterface,
  ChannelManagerInterface,
  ResponseManagerInterface {
}
