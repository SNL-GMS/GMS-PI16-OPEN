package gms.core.dataacquisition.reactor;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import gms.core.dataacquisition.reactor.util.AceiMergeChecker;
import gms.shared.frameworks.osd.repository.OsdRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AceiMergerFactoryTest {

  @Mock
  OsdRepository osdRepository;

  @Mock
  AceiMergeChecker mergeChecker;

  AceiMergerFactory mergerFactory;

  @BeforeEach
  void setUp() {
    mergerFactory = AceiMergerFactory.create(osdRepository, mergeChecker);
  }

  @Test
  void createNullParameters() {
    assertAll(
        () -> assertThrows(NullPointerException.class,
            () -> AceiMergerFactory.create(null, mergeChecker)),
        () -> assertThrows(NullPointerException.class,
            () -> AceiMergerFactory.create(osdRepository, null))
    );
  }

  @Test
  void buildUpdatesMerger() {
    AceiUpdatesMerger actualUpdatesMerger = mergerFactory.buildUpdatesMerger();
    assertEquals(mergeChecker, actualUpdatesMerger.getAceiMergeChecker());
  }

  @Test
  void buildNeighborMerger() {
    AceiNeighborMerger actualBackfillMerger = mergerFactory.buildNeighborMerger();
    assertEquals(mergeChecker, actualBackfillMerger.getUpdatesMerger().getAceiMergeChecker());
    assertEquals(osdRepository, actualBackfillMerger.getSohRepository());
  }
}