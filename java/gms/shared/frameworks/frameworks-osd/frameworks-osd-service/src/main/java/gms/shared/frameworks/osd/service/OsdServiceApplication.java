package gms.shared.frameworks.osd.service;

import gms.shared.frameworks.service.ServiceGenerator;
import gms.shared.frameworks.osd.repository.OsdRepositoryFactory;
import gms.shared.frameworks.systemconfig.SystemConfig;

public class OsdServiceApplication {

    public static void main(String[] args) {
      final SystemConfig config = SystemConfig.create("osd");
      ServiceGenerator.runService(
          OsdRepositoryFactory.createOsdRepository(config),
          config);
    }
}
