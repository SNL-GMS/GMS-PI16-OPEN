package gms.shared.signaldetection.coi.types;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PhaseTypeTests {

  @Test
  void testPorSCheckForSampleOfPhases() {
    assertEquals(PhaseType.P, PhaseType.PPDIFF.getFinalPhase());
    assertEquals(PhaseType.P, PhaseType.PPKIKP.getFinalPhase());
    assertEquals(PhaseType.P, PhaseType.PPKP.getFinalPhase());
    assertEquals(PhaseType.S, PhaseType.SKKSDF.getFinalPhase());
    assertEquals(PhaseType.P, PhaseType.SKP.getFinalPhase());
    assertEquals(PhaseType.P, PhaseType.SKPAB.getFinalPhase());
    assertEquals(PhaseType.P, PhaseType.SKPBC.getFinalPhase());
    assertEquals(PhaseType.P, PhaseType.PPP.getFinalPhase());
    assertEquals(PhaseType.P, PhaseType.PPP_B.getFinalPhase());
    assertEquals(PhaseType.S, PhaseType.PPS.getFinalPhase());
    assertEquals(PhaseType.S, PhaseType.PPS_B.getFinalPhase());
    assertEquals(PhaseType.S, PhaseType.PS.getFinalPhase());
    assertEquals(PhaseType.S, PhaseType.PS_1.getFinalPhase());
    assertEquals(PhaseType.S, PhaseType.PSDIFF.getFinalPhase());
  }

  @Test
  void testNewValueMap() {
    assertEquals("pP", PhaseType.P_P.label);
    assertEquals("P3KPdf_B", PhaseType.P3KPDF_B.label);
    assertEquals("P_P", PhaseType.valueOfLabel("pP").name());
    assertEquals(PhaseType.P, PhaseType.valueOfLabel("pP").getFinalPhase());
    assertEquals(PhaseType.S, PhaseType.valueOfLabel("pSdiff").getFinalPhase());
  }

}
