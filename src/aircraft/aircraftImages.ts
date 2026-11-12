// Mapping of aircraft model IDs to custom generated stylized illustrations.
// All images follow the unified aesthetic requested:
// - Exact same corporate "STARLINE" livery (white top, navy belly, gold cheatline, gold star tail)
// - Consistent side-profile orientation: NOSE POINTING TO THE LEFT
// - Dark navy studio background (#071224)
// - Accurate historical aerodynamics (classic A320 with fences, true A350 with racoon mask & curved winglets)

import b737Img from "../assets/images/b737_200_unified_1794413975332.jpg";
import b727Img from "../assets/images/b727_200_unified_1794413990888.jpg";
import b747_200Img from "../assets/images/b747_200_unified_1794414006761.jpg";
import b747_400Img from "../assets/images/b747_400_unified_1794415278046.jpg";
import dc9Img from "../assets/images/dc9_30_unified_1794414025399.jpg";
import concordeImg from "../assets/images/concorde_unified_1794414148775.jpg";
import a300Img from "../assets/images/a300_b4_unified_1794414040493.jpg";
import dhc6Img from "../assets/images/dhc6_twin_otter_unified_1794414056208.jpg";
import fokkerImg from "../assets/images/fokker_f28_unified_1794414072072.jpg";
import l1011Img from "../assets/images/l1011_tristar_unified_1794414087453.jpg";
import dc10Img from "../assets/images/dc10_30_unified_1794414103273.jpg";
import a320Img from "../assets/images/a320_200_unified_1794414164534.jpg";
import a321neoImg from "../assets/images/a321neo_unified_1794415324397.jpg";
import a350Img from "../assets/images/a350_900_unified_1794414179904.jpg";
import a380Img from "../assets/images/a380_800_unified_1794414212965.jpg";
import b787Img from "../assets/images/b787_8_unified_1794415309371.jpg";
import b777Img from "../assets/images/b777_200_unified_1794415293476.jpg";
import b757Img from "../assets/images/b757_200_unified_1794415262895.jpg";
import b767Img from "../assets/images/b767_300er_unified_1794478114154.jpg";
import md11Img from "../assets/images/md11_unified_1794478127463.jpg";
import dc3Img from "../assets/images/dc3_unified_1794415342168.jpg";
import tu154Img from "../assets/images/tu154_unified_1794415358294.jpg";

const IMAGE_MAP: Record<string, string> = {
  "dc-3": dc3Img,
  "tu-154b2": tu154Img,
  "b737-200": b737Img,
  "b727-200": b727Img,
  "b747-200b": b747_200Img,
  "b747-400": b747_400Img,
  "dc-9-30": dc9Img,
  "md-82": dc9Img, // Direct DC-9 stretch family
  "concorde": concordeImg,
  "a300-b4": a300Img,
  "dhc-6-300": dhc6Img,
  "fokker-f28-1000": fokkerImg,
  "l-1011-100": l1011Img,
  "dc-10-30": dc10Img,
  "a320-200": a320Img,
  "a321neo": a321neoImg,
  "a350-900": a350Img,
  "a380-800": a380Img,
  "b787-8": b787Img,
  "b777-200er": b777Img,
  "b757-200": b757Img,
  "b767-300er": b767Img,
  "md-11": md11Img,
};

export function getAircraftImageUrl(modelId: string): string {
  return IMAGE_MAP[modelId] || b737Img;
}

