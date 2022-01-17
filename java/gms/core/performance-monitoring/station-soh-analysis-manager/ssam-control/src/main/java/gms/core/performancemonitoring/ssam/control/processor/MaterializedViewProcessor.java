package gms.core.performancemonitoring.ssam.control.processor;

import gms.core.performancemonitoring.ssam.control.SohPackage;
import gms.core.performancemonitoring.ssam.control.config.StationSohMonitoringUiClientParameters;
import gms.core.performancemonitoring.uimaterializedview.SohQuietAndUnacknowledgedCacheManager;
import gms.core.performancemonitoring.uimaterializedview.UiStationAndStationGroupGenerator;
import gms.core.performancemonitoring.uimaterializedview.UiStationAndStationGroups;
import gms.shared.frameworks.osd.coi.signaldetection.StationGroup;
import gms.shared.frameworks.osd.coi.systemmessages.SystemMessage;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import reactor.core.publisher.FluxSink;

public interface MaterializedViewProcessor
    extends Function<SohPackage, List<UiStationAndStationGroups>> {

  static MaterializedViewProcessor create(
      SohQuietAndUnacknowledgedCacheManager quietAndUnackListsManager,
      StationSohMonitoringUiClientParameters stationSohConfig,
      List<StationGroup> stationGroups,
      FluxSink<SystemMessage> systemMessageFluxSink) {

    return sohPackage -> {

      var unacknowledgedStatusChanges = quietAndUnackListsManager
          .getUnacknowledgedList();

      var quietedSohStatusChanges = quietAndUnackListsManager
          .getQuietedSohStatusChanges();

      // TRUE indicates the UI should immediately redraw the SOH UI.
      // FALSE indicates the UI will batch the List of UiStationAndStationGroups before redraw.
      final var IS_UPDATE = false;

      //TODO: UiStationAndStationGroupGenerator.generateUiStationAndStationGroups needs to take a SET!
      var stationSohList = new ArrayList<>(sohPackage.getStationSohs());

      //TODO: UiStationAndStationGroupGenerator.generateUiStationAndStationGroups needs to take a SET!
      var latestCapabilitySohRollup = new ArrayList<>(sohPackage.getCapabilitySohRollups());

      //update the unacknowledgedList
      quietAndUnackListsManager.updateUnacknowledgedList(stationSohList);

      return UiStationAndStationGroupGenerator.generateUiStationAndStationGroups(
          stationSohList,
          unacknowledgedStatusChanges,
          quietedSohStatusChanges,
          latestCapabilitySohRollup,
          stationSohConfig,
          stationGroups,
          IS_UPDATE,
          systemMessageFluxSink
      );
    };

  }
}
