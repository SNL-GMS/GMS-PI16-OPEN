package gms.core.dataacquisition.reactor;

import static com.google.common.base.Preconditions.checkNotNull;

import gms.core.dataacquisition.reactor.util.AceiMergeChecker;
import gms.shared.frameworks.osd.repository.OsdRepository;

/**
 * Factory class for generating different kinds of acei mergers the {@link
 * ReactorAceiMergeProcessor} needs
 */
public class AceiMergerFactory {

  private final OsdRepository osdRepository;
  private final AceiMergeChecker mergeChecker;

  private AceiMergerFactory(OsdRepository osdRepository, AceiMergeChecker mergeChecker) {
    this.osdRepository = osdRepository;
    this.mergeChecker = mergeChecker;
  }

  public static AceiMergerFactory create(OsdRepository osdRepository,
      AceiMergeChecker aceiMergeChecker) {

    return new AceiMergerFactory(checkNotNull(osdRepository), checkNotNull(aceiMergeChecker));
  }

  public AceiUpdatesMerger buildUpdatesMerger() {
    return AceiUpdatesMerger.create(mergeChecker);
  }

  public AceiNeighborMerger buildNeighborMerger() {
    return AceiNeighborMerger.create(buildUpdatesMerger(), osdRepository);
  }
}
