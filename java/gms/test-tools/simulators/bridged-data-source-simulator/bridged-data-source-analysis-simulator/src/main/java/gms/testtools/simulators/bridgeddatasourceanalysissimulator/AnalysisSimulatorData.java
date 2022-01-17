package gms.testtools.simulators.bridgeddatasourceanalysissimulator;

import com.google.auto.value.AutoValue;
import gms.shared.signaldetection.dao.css.ArrivalDao;
import gms.shared.stationdefinition.dao.css.BeamDao;
import gms.shared.stationdefinition.dao.css.WfTagDao;
import gms.shared.stationdefinition.dao.css.WfdiscDao;
import java.util.List;


@AutoValue
public abstract class AnalysisSimulatorData {

  public abstract List<WfdiscDao> getWfdiscDaos();

  public abstract List<ArrivalDao> getArrivalDaos();

  public abstract List<WfTagDao> getWfTagDaos();

  public abstract List<BeamDao> getBeamDaos();

  public static AnalysisSimulatorData create(List<WfdiscDao> wfdiscDaos,
      List<ArrivalDao> arrivalDaos, List<WfTagDao> wfTagDaos, List<BeamDao> beamDaos){

    return new AutoValue_AnalysisSimulatorData(wfdiscDaos, arrivalDaos, wfTagDaos, beamDaos);
  }
}