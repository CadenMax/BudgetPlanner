
import React, { useMemo, useState } from "react";

const taxTables = {
  "Standard - no tax-free threshold": [
    {
      "threshold": 0.0,
      "rate": 0.16,
      "base": 0.16
    },
    {
      "threshold": 150.0,
      "rate": 0.2117,
      "base": 7.755
    },
    {
      "threshold": 371.0,
      "rate": 0.189,
      "base": -0.6702
    },
    {
      "threshold": 515.0,
      "rate": 0.3227,
      "base": 68.2367
    },
    {
      "threshold": 932.0,
      "rate": 0.32,
      "base": 65.7202
    },
    {
      "threshold": 2246.0,
      "rate": 0.39,
      "base": 222.951
    },
    {
      "threshold": 3303.0,
      "rate": 0.47,
      "base": 487.2587
    }
  ],
  "Standard - tax-free threshold": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 361.0,
      "rate": 0.16,
      "base": 57.8462
    },
    {
      "threshold": 500.0,
      "rate": 0.26,
      "base": 107.8462
    },
    {
      "threshold": 625.0,
      "rate": 0.18,
      "base": 57.8462
    },
    {
      "threshold": 721.0,
      "rate": 0.189,
      "base": 64.3365
    },
    {
      "threshold": 865.0,
      "rate": 0.3227,
      "base": 180.0385
    },
    {
      "threshold": 1282.0,
      "rate": 0.32,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.39,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.47,
      "base": 650.6154
    }
  ],
  "Scale 3": [
    {
      "threshold": 0.0,
      "rate": 0.3,
      "base": 0.3
    },
    {
      "threshold": 2596.0,
      "rate": 0.37,
      "base": 181.7308
    },
    {
      "threshold": 3653.0,
      "rate": 0.45,
      "base": 474.0385
    }
  ],
  "Scale 5": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 361.0,
      "rate": 0.16,
      "base": 57.8462
    },
    {
      "threshold": 721.0,
      "rate": 0.169,
      "base": 64.3365
    },
    {
      "threshold": 865.0,
      "rate": 0.3027,
      "base": 180.0385
    },
    {
      "threshold": 1282.0,
      "rate": 0.3,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.37,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.45,
      "base": 650.6154
    }
  ],
  "Scale 6": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 361.0,
      "rate": 0.16,
      "base": 57.8462
    },
    {
      "threshold": 721.0,
      "rate": 0.169,
      "base": 64.3365
    },
    {
      "threshold": 843.0,
      "rate": 0.219,
      "base": 106.4962
    },
    {
      "threshold": 865.0,
      "rate": 0.3527,
      "base": 222.1981
    },
    {
      "threshold": 1053.0,
      "rate": 0.3127,
      "base": 180.0385
    },
    {
      "threshold": 1282.0,
      "rate": 0.31,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.38,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.46,
      "base": 650.6154
    }
  ],
  "Scale 8": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 629.0,
      "rate": 0.16,
      "base": 100.7308
    },
    {
      "threshold": 671.0,
      "rate": 0.285,
      "base": 184.6707
    },
    {
      "threshold": 721.0,
      "rate": 0.294,
      "base": 191.1611
    },
    {
      "threshold": 790.0,
      "rate": 0.394,
      "base": 270.1784
    },
    {
      "threshold": 865.0,
      "rate": 0.5277,
      "base": 385.8803
    },
    {
      "threshold": 987.0,
      "rate": 0.4477,
      "base": 306.863
    },
    {
      "threshold": 1014.0,
      "rate": 0.3227,
      "base": 180.0385
    },
    {
      "threshold": 1282.0,
      "rate": 0.32,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.39,
      "base": 358.3077
    }
  ],
  "Scale 8 - Medicare exemption": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 629.0,
      "rate": 0.16,
      "base": 100.7308
    },
    {
      "threshold": 671.0,
      "rate": 0.285,
      "base": 184.6707
    },
    {
      "threshold": 721.0,
      "rate": 0.294,
      "base": 191.1611
    },
    {
      "threshold": 865.0,
      "rate": 0.4277,
      "base": 306.863
    },
    {
      "threshold": 1014.0,
      "rate": 0.3027,
      "base": 180.0385
    },
    {
      "threshold": 1282.0,
      "rate": 0.3,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.37,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.45,
      "base": 650.6154
    }
  ],
  "Scale 8 - Medicare half levy": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 629.0,
      "rate": 0.16,
      "base": 100.7308
    },
    {
      "threshold": 671.0,
      "rate": 0.285,
      "base": 184.6707
    },
    {
      "threshold": 721.0,
      "rate": 0.294,
      "base": 191.1611
    },
    {
      "threshold": 865.0,
      "rate": 0.4277,
      "base": 306.863
    },
    {
      "threshold": 1014.0,
      "rate": 0.3027,
      "base": 180.0385
    },
    {
      "threshold": 1099.0,
      "rate": 0.3527,
      "base": 235.0365
    },
    {
      "threshold": 1282.0,
      "rate": 0.35,
      "base": 231.575
    },
    {
      "threshold": 1374.0,
      "rate": 0.31,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.38,
      "base": 358.3077
    }
  ],
  "Scale 9": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 606.0,
      "rate": 0.16,
      "base": 97.0769
    },
    {
      "threshold": 648.0,
      "rate": 0.285,
      "base": 178.1635
    },
    {
      "threshold": 721.0,
      "rate": 0.294,
      "base": 184.6538
    },
    {
      "threshold": 790.0,
      "rate": 0.394,
      "base": 263.6712
    },
    {
      "threshold": 865.0,
      "rate": 0.5277,
      "base": 379.3731
    },
    {
      "threshold": 962.0,
      "rate": 0.4027,
      "base": 259.0558
    },
    {
      "threshold": 987.0,
      "rate": 0.3227,
      "base": 180.0385
    },
    {
      "threshold": 1282.0,
      "rate": 0.32,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.39,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.47,
      "base": 650.6154
    }
  ],
  "Scale 9 - Medicare exemption": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 606.0,
      "rate": 0.16,
      "base": 97.0769
    },
    {
      "threshold": 648.0,
      "rate": 0.285,
      "base": 178.1635
    },
    {
      "threshold": 721.0,
      "rate": 0.294,
      "base": 184.6538
    },
    {
      "threshold": 865.0,
      "rate": 0.4277,
      "base": 300.3558
    },
    {
      "threshold": 962.0,
      "rate": 0.3027,
      "base": 180.0385
    },
    {
      "threshold": 1282.0,
      "rate": 0.3,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.37,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.45,
      "base": 650.6154
    }
  ],
  "Scale 9 - Medicare half levy": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 606.0,
      "rate": 0.16,
      "base": 97.0769
    },
    {
      "threshold": 648.0,
      "rate": 0.285,
      "base": 178.1635
    },
    {
      "threshold": 721.0,
      "rate": 0.294,
      "base": 184.6538
    },
    {
      "threshold": 865.0,
      "rate": 0.4277,
      "base": 300.3558
    },
    {
      "threshold": 962.0,
      "rate": 0.3027,
      "base": 180.0385
    },
    {
      "threshold": 1099.0,
      "rate": 0.3527,
      "base": 235.0365
    },
    {
      "threshold": 1282.0,
      "rate": 0.35,
      "base": 231.575
    },
    {
      "threshold": 1374.0,
      "rate": 0.31,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.38,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.46,
      "base": 650.6154
    }
  ],
  "Scale 10": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 554.0,
      "rate": 0.16,
      "base": 88.6538
    },
    {
      "threshold": 596.0,
      "rate": 0.285,
      "base": 163.1587
    },
    {
      "threshold": 721.0,
      "rate": 0.294,
      "base": 169.649
    },
    {
      "threshold": 790.0,
      "rate": 0.394,
      "base": 248.6663
    },
    {
      "threshold": 842.0,
      "rate": 0.269,
      "base": 143.3538
    },
    {
      "threshold": 865.0,
      "rate": 0.4027,
      "base": 259.0558
    },
    {
      "threshold": 987.0,
      "rate": 0.3227,
      "base": 180.0385
    },
    {
      "threshold": 1282.0,
      "rate": 0.32,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.39,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.47,
      "base": 650.6154
    }
  ],
  "Scale 10 - Medicare exemption": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 554.0,
      "rate": 0.16,
      "base": 88.6538
    },
    {
      "threshold": 596.0,
      "rate": 0.285,
      "base": 163.1587
    },
    {
      "threshold": 721.0,
      "rate": 0.294,
      "base": 169.649
    },
    {
      "threshold": 842.0,
      "rate": 0.169,
      "base": 64.3365
    },
    {
      "threshold": 865.0,
      "rate": 0.3027,
      "base": 180.0385
    },
    {
      "threshold": 1282.0,
      "rate": 0.3,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.37,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.45,
      "base": 650.6154
    }
  ],
  "Scale 10 - Medicare half levy": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 554.0,
      "rate": 0.16,
      "base": 88.6538
    },
    {
      "threshold": 596.0,
      "rate": 0.285,
      "base": 163.1587
    },
    {
      "threshold": 721.0,
      "rate": 0.294,
      "base": 169.649
    },
    {
      "threshold": 842.0,
      "rate": 0.169,
      "base": 64.3365
    },
    {
      "threshold": 865.0,
      "rate": 0.3027,
      "base": 180.0385
    },
    {
      "threshold": 1099.0,
      "rate": 0.3527,
      "base": 235.0365
    },
    {
      "threshold": 1282.0,
      "rate": 0.35,
      "base": 231.575
    },
    {
      "threshold": 1374.0,
      "rate": 0.31,
      "base": 176.5769
    },
    {
      "threshold": 2596.0,
      "rate": 0.38,
      "base": 358.3077
    },
    {
      "threshold": 3653.0,
      "rate": 0.46,
      "base": 650.6154
    }
  ],
  "Actors": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 451.0,
      "rate": 0.128,
      "base": 57.8462
    },
    {
      "threshold": 625.0,
      "rate": 0.208,
      "base": 107.8462
    },
    {
      "threshold": 781.0,
      "rate": 0.144,
      "base": 57.8462
    },
    {
      "threshold": 901.0,
      "rate": 0.1512,
      "base": 64.3365
    },
    {
      "threshold": 1081.0,
      "rate": 0.2582,
      "base": 180.0385
    },
    {
      "threshold": 1602.0,
      "rate": 0.256,
      "base": 176.5769
    },
    {
      "threshold": 3245.0,
      "rate": 0.312,
      "base": 358.3077
    },
    {
      "threshold": 4567.0,
      "rate": 0.376,
      "base": 650.6154
    }
  ],
  "HELP - tax-free threshold": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 991.0,
      "rate": 0.01,
      "base": 0.0
    },
    {
      "threshold": 1144.0,
      "rate": 0.02,
      "base": 0.0
    },
    {
      "threshold": 1213.0,
      "rate": 0.025,
      "base": 0.0
    },
    {
      "threshold": 1286.0,
      "rate": 0.03,
      "base": 0.0
    },
    {
      "threshold": 1363.0,
      "rate": 0.035,
      "base": 0.0
    },
    {
      "threshold": 1445.0,
      "rate": 0.04,
      "base": 0.0
    },
    {
      "threshold": 1531.0,
      "rate": 0.045,
      "base": 0.0
    },
    {
      "threshold": 1623.0,
      "rate": 0.05,
      "base": 0.0
    },
    {
      "threshold": 1721.0,
      "rate": 0.055,
      "base": 0.0
    },
    {
      "threshold": 1824.0,
      "rate": 0.06,
      "base": 0.0
    },
    {
      "threshold": 1933.0,
      "rate": 0.065,
      "base": 0.0
    },
    {
      "threshold": 2049.0,
      "rate": 0.07,
      "base": 0.0
    },
    {
      "threshold": 2172.0,
      "rate": 0.075,
      "base": 0.0
    },
    {
      "threshold": 2303.0,
      "rate": 0.08,
      "base": 0.0
    },
    {
      "threshold": 2441.0,
      "rate": 0.085,
      "base": 0.0
    },
    {
      "threshold": 2587.0,
      "rate": 0.09,
      "base": 0.0
    },
    {
      "threshold": 2743.0,
      "rate": 0.095,
      "base": 0.0
    },
    {
      "threshold": 2907.0,
      "rate": 0.1,
      "base": 0.0
    }
  ],
  "HELP - no tax-free threshold": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 641.0,
      "rate": 0.01,
      "base": 0.0
    },
    {
      "threshold": 794.0,
      "rate": 0.02,
      "base": 0.0
    },
    {
      "threshold": 863.0,
      "rate": 0.025,
      "base": 0.0
    },
    {
      "threshold": 936.0,
      "rate": 0.03,
      "base": 0.0
    },
    {
      "threshold": 1013.0,
      "rate": 0.035,
      "base": 0.0
    },
    {
      "threshold": 1095.0,
      "rate": 0.04,
      "base": 0.0
    },
    {
      "threshold": 1181.0,
      "rate": 0.045,
      "base": 0.0
    },
    {
      "threshold": 1273.0,
      "rate": 0.05,
      "base": 0.0
    },
    {
      "threshold": 1371.0,
      "rate": 0.055,
      "base": 0.0
    },
    {
      "threshold": 1474.0,
      "rate": 0.06,
      "base": 0.0
    },
    {
      "threshold": 1583.0,
      "rate": 0.065,
      "base": 0.0
    },
    {
      "threshold": 1699.0,
      "rate": 0.07,
      "base": 0.0
    },
    {
      "threshold": 1822.0,
      "rate": 0.075,
      "base": 0.0
    },
    {
      "threshold": 1953.0,
      "rate": 0.08,
      "base": 0.0
    },
    {
      "threshold": 2091.0,
      "rate": 0.085,
      "base": 0.0
    },
    {
      "threshold": 2237.0,
      "rate": 0.09,
      "base": 0.0
    },
    {
      "threshold": 2393.0,
      "rate": 0.095,
      "base": 0.0
    },
    {
      "threshold": 2557.0,
      "rate": 0.1,
      "base": 0.0
    }
  ],
  "Study / training - no tax-free threshold": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 641.0,
      "rate": 0.01,
      "base": 0.0
    },
    {
      "threshold": 794.0,
      "rate": 0.02,
      "base": 0.0
    },
    {
      "threshold": 863.0,
      "rate": 0.025,
      "base": 0.0
    },
    {
      "threshold": 936.0,
      "rate": 0.03,
      "base": 0.0
    },
    {
      "threshold": 1013.0,
      "rate": 0.035,
      "base": 0.0
    },
    {
      "threshold": 1095.0,
      "rate": 0.04,
      "base": 0.0
    },
    {
      "threshold": 1181.0,
      "rate": 0.045,
      "base": 0.0
    },
    {
      "threshold": 1273.0,
      "rate": 0.05,
      "base": 0.0
    },
    {
      "threshold": 1371.0,
      "rate": 0.055,
      "base": 0.0
    },
    {
      "threshold": 1474.0,
      "rate": 0.06,
      "base": 0.0
    },
    {
      "threshold": 1583.0,
      "rate": 0.065,
      "base": 0.0
    },
    {
      "threshold": 1699.0,
      "rate": 0.07,
      "base": 0.0
    },
    {
      "threshold": 1822.0,
      "rate": 0.075,
      "base": 0.0
    },
    {
      "threshold": 1953.0,
      "rate": 0.08,
      "base": 0.0
    }
  ],
  "Study / training - tax-free threshold": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 991.0,
      "rate": 0.01,
      "base": 0.0
    },
    {
      "threshold": 1144.0,
      "rate": 0.02,
      "base": 0.0
    },
    {
      "threshold": 1213.0,
      "rate": 0.025,
      "base": 0.0
    },
    {
      "threshold": 1286.0,
      "rate": 0.03,
      "base": 0.0
    },
    {
      "threshold": 1363.0,
      "rate": 0.035,
      "base": 0.0
    },
    {
      "threshold": 1445.0,
      "rate": 0.04,
      "base": 0.0
    },
    {
      "threshold": 1531.0,
      "rate": 0.045,
      "base": 0.0
    },
    {
      "threshold": 1623.0,
      "rate": 0.05,
      "base": 0.0
    },
    {
      "threshold": 1721.0,
      "rate": 0.055,
      "base": 0.0
    },
    {
      "threshold": 1824.0,
      "rate": 0.06,
      "base": 0.0
    },
    {
      "threshold": 1933.0,
      "rate": 0.065,
      "base": 0.0
    },
    {
      "threshold": 2049.0,
      "rate": 0.07,
      "base": 0.0
    },
    {
      "threshold": 2172.0,
      "rate": 0.075,
      "base": 0.0
    },
    {
      "threshold": 2303.0,
      "rate": 0.08,
      "base": 0.0
    }
  ],
  "Foreign student - tax-free threshold": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 1110.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 1363.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 1934.0,
      "rate": 0.0,
      "base": 0.0
    }
  ],
  "Foreign student - no tax-free threshold": [
    {
      "threshold": 0.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 760.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 1013.0,
      "rate": 0.0,
      "base": 0.0
    },
    {
      "threshold": 1584.0,
      "rate": 0.0,
      "base": 0.0
    }
  ]
};
const whmTable = [
  {
    "min": 0.0,
    "max": 45000.0,
    "rate": 0.15
  },
  {
    "min": 45000.0,
    "max": 135000.0,
    "rate": 0.3
  },
  {
    "min": 135000.0,
    "max": 190000.0,
    "rate": 0.37
  },
  {
    "min": 190000.0,
    "max": 250000.0,
    "rate": 0.45
  }
];
const budgetDefs = {
  "needs": [
    {
      "id": "rent",
      "label": "Rent (Virtual)",
      "mode": "fixed",
      "value": 193.75,
      "note": "Fortnightly rent \u00f7 4 \u00f7 number of people \u00f7 2 weeks",
      "account": "Bills"
    },
    {
      "id": "electricity",
      "label": "Electricity (Virtual)",
      "mode": "pctOfCategory",
      "value": 0.04,
      "note": "Average payment \u00f7 4 \u00f7 4",
      "account": "Bills"
    },
    {
      "id": "internet",
      "label": "Internet",
      "mode": "fixed",
      "value": 5.625,
      "note": "Payment \u00f7 4 \u00f7 4",
      "account": "Bills"
    },
    {
      "id": "phone",
      "label": "Phone",
      "mode": "fixed",
      "value": 12.5,
      "note": "About $50/month",
      "account": "Bills"
    },
    {
      "id": "groceries",
      "label": "Groceries / Food",
      "mode": "fixed",
      "value": 120,
      "note": "About $120/week",
      "account": "Float"
    },
    {
      "id": "fuel",
      "label": "Transport - Fuel",
      "mode": "pctOfCategory",
      "value": 0.22,
      "note": "Percentage of needs budget",
      "account": "Float"
    },
    {
      "id": "rego",
      "label": "Transport - Rego",
      "mode": "fixed",
      "value": 15,
      "note": "About $820/yr \u00f7 52 weeks",
      "account": "Bills"
    },
    {
      "id": "gym",
      "label": "Gym / Health",
      "mode": "fixed",
      "value": 18.53,
      "note": "$18.53/week",
      "account": "Subscriptions"
    }
  ],
  "wants": [
    {
      "id": "eating_out",
      "label": "Eating Out / Takeaway",
      "mode": "pctOfCategory",
      "value": 0.3,
      "note": "About 30%",
      "account": "Float"
    },
    {
      "id": "entertainment",
      "label": "Entertainment",
      "mode": "pctOfCategory",
      "value": 0.1,
      "note": "Movies, events, etc",
      "account": "Float"
    },
    {
      "id": "hobbies",
      "label": "Hobbies",
      "mode": "pctOfCategory",
      "value": 0.1,
      "note": "D&D, 3D printing, online purchases",
      "account": "Float"
    },
    {
      "id": "subscriptions",
      "label": "Subscriptions",
      "mode": "fixed",
      "value": 24.36,
      "note": "D&D Beyond, Owlbear, Dropout",
      "account": "Subscriptions"
    },
    {
      "id": "clothing",
      "label": "Clothing / Shopping",
      "mode": "pctOfCategory",
      "value": 0.2,
      "note": "About a shirt a week",
      "account": "Float"
    },
    {
      "id": "personal_care",
      "label": "Personal Care / Beauty",
      "mode": "fixed",
      "value": 10,
      "note": "Haircut, toiletries, etc",
      "account": "Float"
    }
  ],
  "savings": [
    {
      "id": "emergency",
      "label": "Emergency Fund",
      "mode": "pctOfCategory",
      "value": 0.2,
      "note": "Until 3 months expenses saved",
      "account": "Emergency Fund"
    },
    {
      "id": "investments",
      "label": "Investments / Shares",
      "mode": "pctOfCategory",
      "value": 0.35,
      "note": "Main wealth builder",
      "account": "Investments"
    },
    {
      "id": "medical",
      "label": "Medical",
      "mode": "pctOfCategory",
      "value": 0.3,
      "note": "Money aside for medical bills",
      "account": "Medical"
    },
    {
      "id": "short_term",
      "label": "Savings",
      "mode": "pctOfCategory",
      "value": 0.15,
      "note": "Holiday or item",
      "account": "Savings"
    }
  ]
};

const formatMoney = (n) => {
  const value = Number.isFinite(n) ? n : 0;
  if (Math.abs(value) < 0.005) return "-";
  const formatted = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return value < 0 ? `(${formatted})` : formatted;
};

const formatPct = (n) => `${(n * 100).toFixed(1)}%`;

function lookupWithholding(income, table) {
  const taxable = Math.trunc(Number(income) || 0);
  let row = table[0];
  for (const candidate of table) {
    if (taxable >= candidate.threshold) row = candidate;
  }
  return Math.round((taxable + 0.99) * row.rate - row.base);
}

function sum(values) {
  return values.reduce((a, b) => a + (Number(b) || 0), 0);
}

function useBudgetModel() {
  const [hoursWorked, setHoursWorked] = useState(29);
  const [hourlyRate, setHourlyRate] = useState(33.36);
  const [extraIncome, setExtraIncome] = useState(0);
  const [taxProfile, setTaxProfile] = useState("Standard - tax-free threshold");
  const [biggerPurchase, setBiggerPurchase] = useState(0);

  const [inputs, setInputs] = useState(() => {
    const initial = {};
    for (const section of Object.values(budgetDefs)) {
      for (const item of section) initial[item.id] = item.value;
    }
    return initial;
  });

  const grossIncome = useMemo(() => (hoursWorked * hourlyRate) + extraIncome, [hoursWorked, hourlyRate, extraIncome]);
  const payg = useMemo(() => lookupWithholding(grossIncome, taxTables[taxProfile]), [grossIncome, taxProfile]);
  const netPay = useMemo(() => grossIncome - payg, [grossIncome, payg]);

  const needsBudget = netPay * 0.5;
  const wantsBudget = netPay * 0.3;
  const savingsBudget = netPay * 0.2;

  const resolved = useMemo(() => {
    const result = { needs: {}, wants: {}, savings: {} };
    for (const item of budgetDefs.needs) {
      result.needs[item.id] = item.mode === "fixed" ? inputs[item.id] : needsBudget * inputs[item.id];
    }
    for (const item of budgetDefs.wants) {
      result.wants[item.id] = item.mode === "fixed" ? inputs[item.id] : wantsBudget * inputs[item.id];
    }
    for (const item of budgetDefs.savings) {
      result.savings[item.id] = item.mode === "fixed" ? inputs[item.id] : savingsBudget * inputs[item.id];
    }
    return result;
  }, [inputs, needsBudget, wantsBudget, savingsBudget]);

  const needsTotal = sum(Object.values(resolved.needs));
  const wantsTotal = sum(Object.values(resolved.wants));
  const savingsTotal = sum(Object.values(resolved.savings));

  const needsRemaining = needsBudget - needsTotal;
  const wantsRemaining = wantsBudget - wantsTotal;
  const savingsRemaining = savingsBudget - savingsTotal;

  const rent = resolved.needs.rent;
  const electricity = resolved.needs.electricity;
  const internet = resolved.needs.internet;
  const phone = resolved.needs.phone;
  const rego = resolved.needs.rego;

  const freedBills = rent + electricity + internet + phone + rego;
  const freeloaderMoney = needsRemaining + freedBills;
  const totalFreed = freedBills + wantsRemaining + freeloaderMoney + savingsRemaining;
  const remainderToInvestments = totalFreed - biggerPurchase;

  const budgetSections = [
    {
      title: "Needs",
      total: needsBudget,
      spent: needsTotal,
      remaining: needsRemaining,
      items: budgetDefs.needs.map((item) => ({
        ...item,
        computed: resolved.needs[item.id],
      })),
    },
    {
      title: "Wants",
      total: wantsBudget,
      spent: wantsTotal,
      remaining: wantsRemaining,
      items: budgetDefs.wants.map((item) => ({
        ...item,
        computed: resolved.wants[item.id],
      })),
    },
    {
      title: "Savings",
      total: savingsBudget,
      spent: savingsTotal,
      remaining: savingsRemaining,
      items: budgetDefs.savings.map((item) => ({
        ...item,
        computed: resolved.savings[item.id],
      })),
    },
  ];

  return {
    hoursWorked,
    setHoursWorked,
    hourlyRate,
    setHourlyRate,
    extraIncome,
    setExtraIncome,
    taxProfile,
    setTaxProfile,
    biggerPurchase,
    setBiggerPurchase,
    grossIncome,
    payg,
    netPay,
    budgetSections,
    needsBudget,
    wantsBudget,
    savingsBudget,
    needsRemaining,
    wantsRemaining,
    savingsRemaining,
    freeloaderMoney,
    totalFreed,
    remainderToInvestments,
    inputs,
    setInputs,
  };
}

function MetricCard({ label, value, hint }) {
  const negative = typeof value === "number" && value < 0;
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${negative ? "text-red-600" : "text-zinc-900"}`}>{typeof value === "number" ? formatMoney(value) : value}</div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}

function Field({ label, value, onChange, step = "0.01", type = "number" }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-900"
      />
    </label>
  );
}

function SectionTable({ section, inputs, setInputs }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div>
          <div className="text-lg font-semibold text-zinc-900">{section.title}</div>
          <div className="text-sm text-zinc-500">
            Budget {formatMoney(section.total)} · Spent {formatMoney(section.spent)} · Remaining {formatMoney(section.remaining)}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Input</th>
              <th className="px-5 py-3 font-medium">Calculated</th>
              <th className="px-5 py-3 font-medium">Account</th>
              <th className="px-5 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => {
              const editable = item.mode === "fixed" || item.mode === "pctOfCategory";
              return (
                <tr key={item.id} className="border-t border-zinc-100">
                  <td className="px-5 py-3 font-medium text-zinc-900">{item.label}</td>
                  <td className="px-5 py-3">
                    {editable ? (
                      <input
                        type="number"
                        step={item.mode === "fixed" ? "0.01" : "0.01"}
                        value={inputs[item.id]}
                        onChange={(e) => setInputs((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                        className="w-32 rounded-xl border border-zinc-300 px-3 py-2"
                      />
                    ) : (
                      <span className="text-zinc-400">n/a</span>
                    )}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-zinc-900">{formatMoney(item.computed)}</td>
                  <td className="px-5 py-3 text-zinc-600">{item.account}</td>
                  <td className="px-5 py-3 text-zinc-500">{item.note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaxTableViewer({ selected, onSelect }) {
  const table = taxTables[selected];
  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-700">Tax table</span>
            <select
              value={selected}
              onChange={(e) => onSelect(e.target.value)}
              className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none"
            >
              {Object.keys(taxTables).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
            This matches the workbook's NAT1005-style lookup logic: floor the income, find the last matching row, then apply the rate/base formula.
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <div className="text-lg font-semibold text-zinc-900">{selected}</div>
          <div className="text-sm text-zinc-500">{table.length} rows</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Threshold</th>
                <th className="px-5 py-3 text-left font-medium">Rate</th>
                <th className="px-5 py-3 text-left font-medium">Base</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, idx) => (
                <tr key={idx} className="border-t border-zinc-100">
                  <td className="px-5 py-3 tabular-nums">{formatMoney(row.threshold)}</td>
                  <td className="px-5 py-3 tabular-nums">{formatPct(row.rate)}</td>
                  <td className="px-5 py-3 tabular-nums">{formatMoney(row.base)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-5 py-4">
          <div className="text-lg font-semibold text-zinc-900">WHM reference table</div>
          <div className="text-sm text-zinc-500">Included from the workbook as reference data</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Income from</th>
                <th className="px-5 py-3 text-left font-medium">Income to</th>
                <th className="px-5 py-3 text-left font-medium">Tax rate</th>
              </tr>
            </thead>
            <tbody>
              {whmTable.map((row, idx) => (
                <tr key={idx} className="border-t border-zinc-100">
                  <td className="px-5 py-3 tabular-nums">{formatMoney(row.min)}</td>
                  <td className="px-5 py-3 tabular-nums">{formatMoney(row.max)}</td>
                  <td className="px-5 py-3 tabular-nums">{formatPct(row.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function BudgetPlannerApp() {
  const model = useBudgetModel();
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-zinc-900 to-zinc-700 p-6 text-white shadow-xl">
          <div className="text-sm uppercase tracking-[0.2em] text-zinc-300">Personal Finance App</div>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Budget Tracker + ATO tax withholding</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-200">
            A React version of the workbook logic, split into a dashboard, budget allocator, tax lookup view, and reference tables.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ["dashboard", "Dashboard"],
            ["tax", "Tax calculator"],
            ["tables", "Lookup tables"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === key ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 shadow-sm hover:bg-zinc-200"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "dashboard" ? (
          <div className="mt-6 grid gap-6">
            <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
              <Field label="Hours worked" value={model.hoursWorked} onChange={model.setHoursWorked} />
              <Field label="Hourly rate" value={model.hourlyRate} onChange={model.setHourlyRate} />
              <Field label="Extra income" value={model.extraIncome} onChange={model.setExtraIncome} />
              <Field label="Bigger purchase" value={model.biggerPurchase} onChange={model.setBiggerPurchase} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Gross income" value={model.grossIncome} hint="Hours × rate + extra income" />
              <MetricCard label="PAYG withheld" value={model.payg} hint={`Using ${model.taxProfile}`} />
              <MetricCard label="Net pay" value={model.netPay} hint="Gross minus PAYG" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Needs budget" value={model.needsBudget} hint="50% of net pay" />
              <MetricCard label="Wants budget" value={model.wantsBudget} hint="30% of net pay" />
              <MetricCard label="Savings budget" value={model.savingsBudget} hint="20% of net pay" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Needs remaining" value={model.needsRemaining} hint="Budget left after needs items" />
              <MetricCard label="Wants remaining" value={model.wantsRemaining} hint="Budget left after wants items" />
              <MetricCard label="Savings remaining" value={model.savingsRemaining} hint="Budget left after savings items" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard label="Freeloader money" value={model.freeloaderMoney} hint="Workbook-style freed-up needs logic" />
              <MetricCard label="Remainder to investments" value={model.remainderToInvestments} hint="Total freed minus bigger purchase" />
            </div>

            <div className="grid gap-6">
              {model.budgetSections.map((section) => (
                <SectionTable key={section.title} section={section} inputs={model.inputs} setInputs={model.setInputs} />
              ))}
            </div>
          </div>
        ) : tab === "tax" ? (
          <div className="mt-6 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <Field label="Weekly hours" value={model.hoursWorked} onChange={model.setHoursWorked} />
              <Field label="Hourly rate" value={model.hourlyRate} onChange={model.setHourlyRate} />
              <Field label="Extra income" value={model.extraIncome} onChange={model.setExtraIncome} />
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-700">Tax profile</span>
                <select
                  value={model.taxProfile}
                  onChange={(e) => model.setTaxProfile(e.target.value)}
                  className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none"
                >
                  {Object.keys(taxTables).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              <div className="rounded-3xl bg-zinc-50 p-5">
                <div className="text-sm text-zinc-500">Weekly gross</div>
                <div className="mt-1 text-3xl font-semibold">{formatMoney(model.grossIncome)}</div>
                <div className="mt-4 text-sm text-zinc-500">Estimated withholding</div>
                <div className="mt-1 text-3xl font-semibold">{formatMoney(model.payg)}</div>
                <div className="mt-4 text-sm text-zinc-500">Estimated net</div>
                <div className="mt-1 text-3xl font-semibold">{formatMoney(model.netPay)}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-semibold">Calculation rule</div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                This uses the same structure as the workbook's NAT1005 lookup sheet: truncate income to whole dollars, find the matching tax row, then apply <code>ROUND((income + 0.99) × rate - base, 0)</code>.
              </p>
              <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
                ATO's weekly tax table applies from 1 July 2024, and the ATO still lists the weekly tax table among the tax tables that continue to apply after the 24 September 2025 update.
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <TaxTableViewer selected={model.taxProfile} onSelect={model.setTaxProfile} />
          </div>
        )}
      </div>
    </div>
  );
}
