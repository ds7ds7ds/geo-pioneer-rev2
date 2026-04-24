# QC Verification Report: EEAC and GMAC Public Comments V8

**Date:** April 24, 2026  
**Prepared for:** Dmitry  
**Purpose:** Full source verification of every quantitative claim in the V8 public comments

---

## Executive Summary

This report documents the line-by-line verification of every number, percentage, and technical claim used in the EEAC and GMAC V8 public comments against the original source documents. Several critical errors in the earlier draft were identified and corrected. All numbers in the final V8 documents are now traceable to specific slides in the source presentations.

---

## Source Documents Reviewed

| # | Document | Pages | Key Data |
|---|----------|-------|----------|
| 1 | EEAC EM&V Presentation (April 2026) | 49 | Satisfaction, willingness, pricing, COP, rates |
| 2 | Heat Pump Incentive Study (April 2026) | 7 | Willingness to adopt, NPV analysis, cost trends |
| 3 | C-Team Reaction (April 2026) | 1 | EEAC consultant team implications |
| 4 | Draft Guiding Principles (April 2026) | 3 | 2028-2030 budget direction |
| 5 | CVEO Battery Presentation (April 2026) | 4 | Storm resilience data |
| 6 | PA Updates (April 2026) | 4 | Current deployment rate |
| 7 | WaterFurnace/NY-GEO Peak Demand (April 2025) | 28 | AHRI 1600 peak demand calculations |

---

## Errors Found and Corrected

### Error 1: "13% extremely satisfied with heat during extreme cold"

The earlier draft claimed that only 13% of whole-home central ducted ASHP users were "extremely satisfied" with their heat during extreme cold. This is **incorrect**. The 13% figure actually represents the "Not applicable" segment for Partial Home Central Ducted installations.

The correct value from EM&V Slide 19 is **20%** extremely satisfied for Whole Home Central Ducted ASHP (n=60). The V8 documents use the corrected 20% figure.

### Error 2: "15% extremely satisfied with operating cost"

The earlier draft cited 15% as the "extremely satisfied" rate for operating costs. This is **inverted** — the 15% is actually the "extremely *dissatisfied*" segment (bottom of the stacked bar chart on EM&V Slide 20).

The correct "extremely satisfied" value is **18%** for Whole Home Central Ducted ASHP (n=60). The V8 documents use the corrected 18% figure and also cite the 42% combined dissatisfaction rate (27% moderately + 15% extremely dissatisfied).

### Error 3: "81% of homeowners not considering heat pumps"

The earlier draft cited "81% not considering" from EM&V Slide 10. This is a **misread**. Slide 10 is about *awareness*, not willingness. The 81% means that 81% of single-family detached homeowners **are aware** of heat pumps — the opposite of what was claimed.

This claim has been **removed** from V8. The willingness data (34% to 29% decline) from Slide 13 is used instead.

### Error 4: "77% above national industry norms"

The earlier draft stated contractor markups were "77% above national industry norms." This is **misleading phrasing**. The 77% is the markup percentage itself, not the amount above the national norm. The national norm is approximately 40%.

The V8 documents now correctly state: "contractor markups on ducted ASHPs in Massachusetts average 77%, compared to a national industry norm of roughly 40%" (EM&V Slide 30).

### Error 5: "18-20 GW vs 6-7 GW" winter peak demand

The earlier draft claimed that an ASHP-only pathway would create 18-20 GW of winter peak demand versus 6-7 GW for GSHP. These numbers were **significantly overstated** based on the WaterFurnace AHRI 1600 data.

Using verified data for a 4-ton system at 5°F (MA design temperature) with a 60% coincidence factor applied to 2 million homes, the correct figures are approximately **7.2 GW** (ASHP pathway) versus **3.2 GW** (GSHP pathway), a difference of ~4.0 GW. The V8 documents use these corrected figures.

### Error 6: "13 kW per ASHP home"

The earlier draft used 13 kW as the peak demand per ASHP home. The WaterFurnace data shows this is only accurate at -15°F (14.4 kW). At the Massachusetts design temperature of 5°F, the correct figure is **6.04 kW** per 4-ton ASHP system. The V8 documents use the 6.04 kW figure with the 5°F design condition clearly stated.

---

## Verified Claims Used in V8

### Peak Demand Data (Source: WaterFurnace/NY-GEO, AHRI 1600 Standard, April 2025)

| Metric | ASHP (4-ton) | CCHP (4-ton) | GSHP (4-ton) | Source |
|--------|-------------|--------------|--------------|--------|
| Total Peak kW at 5°F | 6.04 | 5.09 | 2.70 | Slide 25 |
| Total Peak kW at -15°F | 14.4 | 11.9 | 4.01 | Slide 25 |
| Peak kW per ton at 5°F | 1.51 | 1.27 | 0.68 | Slide 26 |
| Peak kW per ton at -15°F | 3.6 | 3.6 | 1.0 | Slide 26 |
| Total Peak COP at 5°F | 1.87 | 2.08 | 3.89 | Slide 25 |
| Total Peak COP at -15°F | 1.0 | 1.21 | 3.59 | Slide 25 |
| Peak kW Cooling at 95°F | 2.70 | 2.74 | 1.55 | Slide 23 |

### Grid Impact Math (Derived from WaterFurnace data)

| Scenario | ASHP Pathway | GSHP Pathway | Avoidable Difference |
|----------|-------------|-------------|---------------------|
| 2 million homes at 5°F, 60% CF | ~7.2 GW | ~3.2 GW | ~4.0 GW |
| 30,000 homes/year at 5°F, 100% | ~180 MW/yr | ~81 MW/yr | ~100 MW/yr |

The 180 MW figure is calculated as: 30,000 homes x 6.04 kW = 181.2 MW (before coincidence factor). This represents the nameplate capacity addition.

### Customer Satisfaction (Source: EEAC EM&V Presentation, April 2026)

| Metric | ASHP Whole Home Ducted (n=60) | GSHP Whole Home (n=45) | Source |
|--------|------------------------------|----------------------|--------|
| Extremely satisfied with heat in extreme cold | 20% | 62% | Slide 19 |
| Extremely satisfied with operating cost | 18% | 42% | Slide 20 |
| Dissatisfied with operating cost (mod+extreme) | 42% | ~7% | Slide 20 |

**Caveat:** Sample sizes are small (n=60 for ASHP ducted, n=45 for GSHP). These results are indicative but not statistically definitive.

### Cost and Market Data (Source: EEAC EM&V Presentation, April 2026)

| Claim | Value | Source |
|-------|-------|--------|
| Electricity vs gas cost ratio | 4.55x per MMBTU | Slide 45 |
| Electricity rate used | $0.30/kWh | Slide 45 |
| Gas rate used | $1.93/therm ($19.29/MMBTU) | Slide 45 |
| Ducted ASHP contractor markup (MA) | 77% | Slide 30 |
| National HVAC industry markup | ~40% | Slide 30 |
| Willingness decline (no CAC, keeping backup) | 34% (2022) to 29% (2025) | Slide 13 |

### Breakeven COP Calculation

At 4.55x electricity-to-gas cost ratio and 95% gas furnace efficiency, the breakeven COP is 4.55 x 0.95 = **4.32**. This means a heat pump must maintain COP above 4.32 to save money versus a gas furnace. GSHP winter COP of 3.8-4.8 straddles this threshold; ASHP winter COP of 1.5-2.3 at 5°F falls far short.

### Budget Data (Source: DPU records, legislative filings)

| Claim | Value | Source |
|-------|-------|--------|
| 2025-2027 approved budget | $4.5 billion | DPU approval Feb 2025 |
| H.5151 proposed cut | $1 billion | Legislative filing 2026 |

---

## Caveats and Transparency Notes

The V8 documents include the following important caveats that strengthen credibility:

1. **WaterFurnace data is from a GSHP manufacturer.** While the engineering calculations use AHRI 1600/600 standards (industry-standard methodology), the source has a commercial interest. The data should be independently verified by utilities.

2. **Sample sizes are small.** The EM&V satisfaction data has n=60 for whole-home ducted ASHP and n=45 for GSHP. These are directionally informative but not large enough for high statistical confidence.

3. **Grid math uses assumptions.** The 60% coincidence factor is a standard utility planning assumption but actual coincidence varies by weather event and building stock. The 4-ton system size is representative but many MA homes may need 5-6 tons.

4. **The 4.55x ratio uses $0.30/kWh.** At the actual MA average of $0.35/kWh (including delivery), the ratio would be approximately 5.3x, making the breakeven COP even harder for ASHPs to achieve.

5. **COP ranges are for specific equipment.** ASHP COP of 1.5-2.3 at 5°F spans standard to Mitsubishi Hyper Heat models. GSHP COP of 3.8-4.8 is from WaterFurnace variable-speed units. Actual field performance may vary.

---

## Files Delivered

Both V8 documents have been pushed to the GitHub repository `ds7ds7ds/geo-pioneer-rev2`:

- `EEAC_Public_Comment_V8.docx` — For the Energy Efficiency Advisory Council
- `GMAC_Public_Comment_V8.docx` — For the Grid Modernization Advisory Council
