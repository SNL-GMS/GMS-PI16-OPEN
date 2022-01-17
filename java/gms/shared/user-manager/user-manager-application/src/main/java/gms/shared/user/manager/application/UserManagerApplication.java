package gms.shared.user.manager.application;

import gms.shared.frameworks.service.ServiceGenerator;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.user.preferences.dao.util.CoiEntityManagerFactory;
import gms.shared.user.preferences.repository.UserPreferencesRepositoryJpa;
import javax.persistence.EntityManagerFactory;

public class UserManagerApplication {

  public static void main(String[] args) {
    final SystemConfig config = SystemConfig.create("user-manager");
    EntityManagerFactory entityManagerFactory = CoiEntityManagerFactory.create(config);
    ServiceGenerator.runService(
        UserPreferencesRepositoryJpa.create(entityManagerFactory), config);
  }
}