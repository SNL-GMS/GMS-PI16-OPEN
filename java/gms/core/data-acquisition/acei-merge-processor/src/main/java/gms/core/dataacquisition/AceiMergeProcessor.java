package gms.core.dataacquisition;

/**
 * Processing class responsible for the merging of received ACEIs based on type, value and merge
 * thresholds
 */
public interface AceiMergeProcessor {

  default void initialize() {
  }

  /**
   * Conducts any bookkeeping and setup necessary to initialize the AceiMergeProcessor for handling
   * data, then starts the AceiMergeProcessor
   */
  void start();
}
