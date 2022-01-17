package gms.shared.frameworks.osd.repository;

import gms.shared.frameworks.osd.dao.util.CoiEntityManagerFactory;
import gms.shared.frameworks.osd.repository.channel.ChannelRepositoryJpa;
import gms.shared.frameworks.osd.repository.performancemonitoring.CapabilitySohRollupRepositoryJpa;
import gms.shared.frameworks.osd.repository.performancemonitoring.PerformanceMonitoringRepositoryJpa;
import gms.shared.frameworks.osd.repository.performancemonitoring.SohStatusChangeRepositoryJpa;
import gms.shared.frameworks.osd.repository.rawstationdataframe.AcquiredChannelEnvironmentIssueRepositoryJpa;
import gms.shared.frameworks.osd.repository.rawstationdataframe.AcquiredChannelEnvironmentIssueRepositoryQueryJpa;
import gms.shared.frameworks.osd.repository.rawstationdataframe.RawStationDataFrameRepositoryJpa;
import gms.shared.frameworks.osd.repository.rawstationdataframe.RawStationDataFrameRepositoryQueryViewJpa;
import gms.shared.frameworks.osd.repository.station.StationGroupRepositoryJpa;
import gms.shared.frameworks.osd.repository.station.StationRepositoryJpa;
import gms.shared.frameworks.osd.repository.stationreference.*;
import gms.shared.frameworks.osd.repository.systemmessage.SystemMessageRepositoryJpa;
import gms.shared.frameworks.systemconfig.SystemConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManagerFactory;

public class OsdRepositoryFactory {

  private static final Logger LOGGER = LoggerFactory.getLogger(OsdRepositoryFactory.class);

  private OsdRepositoryFactory() {
  }

  public static OsdRepository createOsdRepository(SystemConfig config) {
    EntityManagerFactory emf = CoiEntityManagerFactory.create(config);
    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      LOGGER.info("Shutting down EntityManagerFactory");
      emf.close();
    }));

    return OsdRepository.from(
        new CapabilitySohRollupRepositoryJpa(emf),
        new ChannelRepositoryJpa(emf),
        new PerformanceMonitoringRepositoryJpa(emf),
        new RawStationDataFrameRepositoryJpa(emf),
        new RawStationDataFrameRepositoryQueryViewJpa(emf),
        new ReferenceChannelRepositoryJpa(emf),
        new ReferenceNetworkRepositoryJpa(emf),
        new ReferenceResponseRepositoryJpa(emf),
        new ReferenceSensorRepositoryJpa(emf),
        new ReferenceSiteRepositoryJpa(emf),
        new ReferenceStationRepositoryJpa(emf),
        new SohStatusChangeRepositoryJpa(emf),
        new StationGroupRepositoryJpa(emf),
        new StationRepositoryJpa(emf),
        new AcquiredChannelEnvironmentIssueRepositoryJpa(emf),
        new AcquiredChannelEnvironmentIssueRepositoryQueryJpa(emf, new StationRepositoryJpa(emf)),
        new SystemMessageRepositoryJpa(emf));
  }

}
