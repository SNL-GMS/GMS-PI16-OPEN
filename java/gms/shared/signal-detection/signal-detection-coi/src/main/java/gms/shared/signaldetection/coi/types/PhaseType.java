package gms.shared.signaldetection.coi.types;


import com.google.common.collect.ImmutableMap;

import java.util.HashMap;

public enum PhaseType {

  // TODO: need to elaborate with full set of phase labels
  // if adding values, need to edit EnumeratedMeasurementValueConverter to add support for those
  UNKNOWN("Unknown"),
  P("P"),
  S("S"),
  I("I"),
  L("l"),
  LG("Lg"),
  LQ("LQ"),
  LR("LR"),
  NNL("nNL"),
  NP(""),
  NP_1(""),
  P3KP(""),
  P3KPBC("P3KPbc"),
  P3KPBC_B("P3KPbc_B"),
  P3KPDF("P3KPdf"),
  P3KPDF_B("P3KPdf_B"),
  P4KP("P4KP"),
  P4KPBC("P4KPbc"),
  P4KPDF("P4KPdf"),
  P4KPDF_B("P4KPdf_B"),
  P5KP("P5KP"),
  P5KPBC("P5KPbc"),
  P5KPBC_B("P5KPbc_B"),
  P5KPDF("P5KPdf"),
  P5KPDF_B("P5KPdf_B"),
  P5KPDF_C("P5KPdf_C"),
  P7KP("P7KP"),
  P7KPBC("P7KPbc"),
  P7KPBC_B("P7KPbc_B"),
  P7KPBC_C("P7KPbc_C"),
  P7KPDF("P7KPdf"),
  P7KPDF_B("P7KPdf_B"),
  P7KPDF_C("P7KPdf_C"),
  P7KPDF_D("P7KPdf_D"),
  PB("Pb"),
  PCP("PcP"),
  PCS("PcS"),
  PDIFF("Pdiff"),
  PG("Pg"),
  PKHKP("PKhKP"),
  PKIKP("PKiKP"),
  PKKP("PKKP"),
  PKKPAB("PKKPab"),
  PKKPBC("PKKPbc"),
  PKKPDF("PKKPdf"),
  PKKS("PKKS"),
  PKKSAB("PKKSab"),
  PKKSBC("PKKSbc"),
  PKKSDF("PKKSdf"),
  PKP("PKP"),
  PKP2("PKP2"),
  PKP2AB("PKP2ab"),
  PKP2BC("PKP2bc"),
  PKP2DF("PKP2df"),
  PKP3("PKP3"),
  PKP3AB("PKP3ab"),
  PKP3BC("PKP3bc"),
  PKP3DF("PKP3df"),
  PKP3DF_B("PKP3df_B"),
  PKPAB("PKPab"),
  PKPBC("PKPbc"),
  PKPDF("PKPdf"),
  PKPPKP("PKPPKP"),
  PKS("PKS"),
  PKSAB("PKSab"),
  PKSBC("PKSbc"),
  PKSDF("PKSdf"),
  PMP("PmP"),
  PN("Pn"),
  PNPN("PnPn"),
  PP("PP"),
  P_P("pP"),
  PP_1("PP_1"),
  PP_B("PP_B"),
  PPDIFF("pPdiff"),
  PPKIKP("pPKiKP"),
  PPKP("pPKP"),
  PPKPAB("pPKPab"),
  PPKPBC("pPKPbc"),
  PPKPDF("pPKPdf"),
  PPP("PPP"),
  PPP_B("PPP_B"),
  PPS("PPS"),
  PPS_B("PPS_B"),
  PS("PS"),
  PS_1("PS_1"),
  PSDIFF("pSdiff"),
  PSKS("pSKS"),
  PSKSAC("pSKSac"),
  PSKSDF("pSKSdf"),
  RG("Rg"),
  SB("Sb"),
  SCP("ScP"),
  SCS("ScS"),
  SDIFF("Sdiff"),
  SG("Sg"),
  SKIKP("SKiKP"),
  SKKP("SKKP"),
  SKKPAB("SKKPab"),
  SKKPBC("SKKPbc"),
  SKKPDF("SKKPdf"),
  SKKS("SKKS"),
  SKKSAC("SKKSac"),
  SKKSAC_B("SKKSac_B"),
  SKKSDF("SKKSdf"),
  SKP("SKP"),
  SKPAB("SKPab"),
  SKPBC("SKPbc"),
  SKPDF("SKPdf"),
  SKS("SKS"),
  SKS2("SKS2"),
  SKS2AC("SKS2ac"),
  SKS2DF("SKS2df"),
  SKSAC("SKSac"),
  SKSDF("SKSdf"),
  SKSSKS("SKSSKS"),
  SN("Sn"),
  SNSN("SnSn"),
  SP("SP"),
  SP_1("SP_1"),
  SPDIFF("sPdiff"),
  SPKIKP("sPKiKP"),
  SPKP("sPKP"),
  SPKPAB("sPKPab"),
  SPKPBC("sPKPbc"),
  SPKPDF("sPKPdf"),
  SS("SS"),
  SS_1("SS_1"),
  SS_B("SS_B"),
  SSDIFF("sSdiff"),
  SSKS("sSKS"),
  SSKSAC("sSKSac"),
  SSKSDF("sSKSdf"),
  SSS("SSS"),
  SSS_B("SSS_B"),
  T("T"),
  TX("Tx"),
  SX("Sx"),
  PX("Px"),
  IPX("IPx");

  public final String label;

  private PhaseType(String label) {
    this.label = label;
  }

  private static final ImmutableMap<String, PhaseType> BY_LABEL;

  static {
    HashMap<String, PhaseType> hashMapValues = new HashMap<>();
    for (PhaseType phaseType : values()) {
      hashMapValues.put(phaseType.label, phaseType);
    }
    BY_LABEL = ImmutableMap.copyOf(hashMapValues);
  }

  public static PhaseType valueOfLabel(String label) {
    return BY_LABEL.get(label);
  }

  public PhaseType getFinalPhase() {
    int diff = this.name().lastIndexOf("P") - this.name().lastIndexOf("S");

    if (diff == 0) {
      return UNKNOWN;
    } else if (diff > 0) {
      return P;
    } else {
      return S;
    }
  }
}
