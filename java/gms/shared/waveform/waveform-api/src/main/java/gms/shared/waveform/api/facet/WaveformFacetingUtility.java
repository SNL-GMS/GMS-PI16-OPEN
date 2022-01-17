package gms.shared.waveform.api.facet;

import static com.google.common.base.Preconditions.checkState;
import static gms.shared.stationdefinition.facet.FacetingTypes.CHANNEL_SEGMENT_TYPE;
import static gms.shared.stationdefinition.facet.FacetingTypes.CHANNEL_TYPE;
import static gms.shared.stationdefinition.facet.FacetingTypes.ID_CHANNEL_KEY;

import com.google.common.base.Preconditions;
import gms.shared.stationdefinition.api.StationDefinitionAccessorInterface;
import gms.shared.stationdefinition.coi.channel.Channel;
import gms.shared.stationdefinition.coi.facets.FacetingDefinition;
import gms.shared.stationdefinition.facet.FacetingTypes;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.waveform.api.WaveformRepositoryInterface;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Timeseries;
import gms.shared.waveform.coi.Waveform;
import java.util.Objects;

public class WaveformFacetingUtility {

  //this will be needed in the future
  private final WaveformRepositoryInterface waveformAccessor;

  private final StationDefinitionAccessorInterface channelAccessorImpl;
  private final StationDefinitionFacetingUtility stationDefinitionFacetingUtility;
  private WaveformFacetingUtility(WaveformRepositoryInterface waveformAccessor,
    StationDefinitionAccessorInterface stationDefinitionAccessorImpl) {
    this.waveformAccessor = waveformAccessor;
    this.channelAccessorImpl = stationDefinitionAccessorImpl;
    this.stationDefinitionFacetingUtility = StationDefinitionFacetingUtility.create(channelAccessorImpl);
  }

  /**
   * creates and validates a new {@link WaveformFacetingUtility}
   *
   * @return a {@link WaveformFacetingUtility}
   */
  public static WaveformFacetingUtility create(WaveformRepositoryInterface waveformAccessor,
    StationDefinitionAccessorInterface stationDefinitionAccessorImpl) {
    Objects.requireNonNull(waveformAccessor);
    Objects.requireNonNull(stationDefinitionAccessorImpl);

    return new WaveformFacetingUtility(waveformAccessor, stationDefinitionAccessorImpl);
  }

  public ChannelSegment<? extends Timeseries> populateFacets(ChannelSegment<? extends Timeseries> initialChannelSegment,
      FacetingDefinition facetingDefinition) {

    Objects.requireNonNull(initialChannelSegment);
    Objects.requireNonNull(facetingDefinition);
    checkState(facetingDefinition.getClassType().equals(FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue()));
    checkState(facetingDefinition.isPopulated(),
        FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue() + " only supports populated = true at this time");

    FacetingDefinition channelFacetingDefinition = facetingDefinition.getFacetingDefinitionByName(
        FacetingTypes.ID_CHANNEL_KEY.getValue());

    //validate facetingDefinition types passed in
    if(facetingDefinition.getFacetingDefinitions().size() > 0){
      Preconditions.checkState(facetingDefinition.getFacetingDefinitions().size() == 1,
          "Only valid faceting definition is: " + FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue());
      Preconditions.checkState(channelFacetingDefinition != null,
          "Only valid faceting definition is: " + FacetingTypes.CHANNEL_SEGMENT_TYPE.getValue());
      Preconditions.checkState(channelFacetingDefinition.getClassType().equals(FacetingTypes.CHANNEL_TYPE.getValue()),
          "Only valid faceting definition ClassType is: " + FacetingTypes.CHANNEL_TYPE.getValue());
    }

    //delegate channelFaceting to StationDefinitionFacetingUtility
    if (channelFacetingDefinition != null) {
      Channel facetedChannel = stationDefinitionFacetingUtility.populateFacets(
          initialChannelSegment.getId().getChannel(),
          channelFacetingDefinition,
          initialChannelSegment.getId().getCreationTime());
      return ChannelSegment.from(
          facetedChannel,
          initialChannelSegment.getUnits(),
          initialChannelSegment.getTimeseries(),
          initialChannelSegment.getId().getCreationTime());
    }

    return initialChannelSegment;
  }
}


