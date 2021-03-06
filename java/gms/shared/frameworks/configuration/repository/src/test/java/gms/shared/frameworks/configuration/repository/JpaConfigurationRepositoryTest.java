package gms.shared.frameworks.configuration.repository;

import gms.shared.frameworks.configuration.Configuration;
import gms.shared.frameworks.configuration.ConfigurationOption;
import gms.shared.frameworks.configuration.Constraint;
import gms.shared.frameworks.configuration.Operator;
import gms.shared.frameworks.configuration.Operator.Type;
import gms.shared.frameworks.configuration.constraints.*;
import gms.shared.utilities.db.test.utils.ConfigDbTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class JpaConfigurationRepositoryTest extends ConfigDbTest {

    private Configuration configuration;
    private Configuration configuration2;


    @BeforeEach
    void createTestConfigs() {

        Collection<ConfigurationOption> configurationOptions = new ArrayList<>();
        List<Constraint> constraints = new ArrayList<>();
        Operator operatorIn = Operator.from(Type.IN, false);
        Operator operatorEq = Operator.from(Type.EQ, false);

        constraints.add(BooleanConstraint.from("test1", true, 1));
        constraints.add(DefaultConstraint.from());
        constraints.add(NumericRangeConstraint.from("test2", operatorIn, DoubleRange.from(0, 1), 1));
        constraints.add(NumericScalarConstraint.from("test3", operatorEq, 0, 1));
        constraints.add(PhaseConstraint.from("test4", operatorEq, new LinkedHashSet<>(), 1));
        constraints.add(StringConstraint.from("test5", operatorEq, new LinkedHashSet<>(), 1));
        constraints.add(TimeOfDayRangeConstraint.from("test6", operatorIn, TimeOfDayRange.from(LocalTime.now(), LocalTime.now()), 1));
        constraints.add(TimeOfYearRangeConstraint.from("test7", operatorIn, TimeOfYearRange.from(LocalDateTime.now(), LocalDateTime.now()), 1));
        constraints.add(WildcardConstraint.from("test8"));

        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("some-string", "some-value");
        ConfigurationOption co = ConfigurationOption.from("config-option-test", constraints, parameters);
        configurationOptions.add(co);

        this.configuration = Configuration.from(
                "test-config", configurationOptions
        );
        this.configuration2 = Configuration.from(
                "test-config2", configurationOptions
        );
    }

    @Test
    void getEmptyCheck() {
        JpaConfigurationRepository jcr = new JpaConfigurationRepository();
        jcr.setEntityManagerFactory(this.entityManagerFactory);
        jcr.put(this.configuration);
        Optional<Configuration> cfg = jcr.get("not-there");
        assertFalse(cfg.isPresent());
    }

    @Test
    void putAndGet() {
        JpaConfigurationRepository jcr = new JpaConfigurationRepository();
        jcr.setEntityManagerFactory(this.entityManagerFactory);
        jcr.put(this.configuration);
        Optional<Configuration> cfg = jcr.get("test-config");
        assertTrue(cfg.get().getName().equalsIgnoreCase("test-config"), "Cfg name doesn't match expected value");
        cfg.get().getConfigurationOptions().forEach(cfgOption -> {
                    assertTrue(cfgOption.getName().equals("config-option-test"), "CfgOption name doesn't match expected value");
                    assertTrue(cfgOption.getParameters().get("some-string").equals("some-value"), "CfgOption paremeters don't match expected value");
                    assertTrue(cfgOption.getConstraints().size() == 9, "CfgOption options not correct size");
                }
        );
    }

    @Test
    void putAllAndGetRange() {
        Collection<Configuration> configurations = new ArrayList<>();
        JpaConfigurationRepository jcr = new JpaConfigurationRepository();
        jcr.setEntityManagerFactory(this.entityManagerFactory);
        configurations.add(this.configuration);
        configurations.add(this.configuration2);
        jcr.putAll(configurations);
        Collection<Configuration> cfgs = jcr.getKeyRange("test");

        assertTrue(cfgs.size() == 2, "There should be 2 configurations returned by getKeyRange");
        cfgs.forEach(cfg -> {
            assertTrue(cfg.getName().startsWith("test"), "Cfg name doesn't match expected value");

            cfg.getConfigurationOptions().forEach(cfgOption -> {
                assertTrue(cfgOption.getName().equals("config-option-test"), "CfgOption name doesn't match expected value");
                assertTrue(cfgOption.getParameters().get("some-string").equals("some-value"), "CfgOption paremeters don't match expected value");
                assertTrue(cfgOption.getConstraints().size() == 9, "CfgOption options not correct size");
            });
        });
    }
}
