# GeoStellar Physics Engine — Comprehensive Research & Architecture Document

**Prepared for:** GeoStellar Software Development  
**Author:** Dmitry Kuravskiy, PE & Manus AI  
**Date:** February 24, 2026 | **Revision:** 3.0 (Enhanced)

---

## **Introduction: Building the Next-Generation Geothermal Engine**

This document represents a significant enhancement of the *GeoStellar Physics Engine Research v2*, integrating its comprehensive research with a targeted analysis to fill identified gaps and provide a robust, actionable implementation plan. The original document laid an excellent foundation, correctly identifying the core physics and advanced features required for a market-leading geothermal design tool. This enhanced version builds upon that work by introducing critical components for **computational performance, model completeness, and validation**, ensuring the final software is not only powerful but also fast, accurate, and reliable.

The primary enhancements in this document include:

1.  **A Detailed High-Performance Computational Strategy:** A dedicated section outlining the specific algorithms—including the **Claesson-Javed load aggregation**, **Cimmino's similarities method**, and **FFT-based temporal superposition**—required to meet the ambitious performance target of simulating a 100-bore, 1000-foot field in approximately one minute.
2.  **Complete Physics for All Well Types:** Filling a key gap in the original document by providing a detailed physical model for **Standing Column Wells (SCWs)**, including the critical role of the bleed ratio and recirculation dynamics.
3.  **Advanced Physical Phenomena:** Introducing models for crucial real-world effects, such as **ground freezing (latent heat)**, the properties of **antifreeze fluids**, and the blending of **short-time-step and long-time-step** thermal responses for full temporal accuracy.
4.  **A Formal Validation & Verification (V&V) Framework:** Proposing a structured V&V plan with specific benchmarks and test cases to ensure the engine's accuracy and reliability against analytical solutions, other software, and field data.
5.  **Expanded Modeling Capabilities:** Incorporating plans for a **borefield optimization module**, a **Thermal Response Test (TRT) analysis module**, and a model for **5th Generation District Heating and Cooling (5GDHC)** ambient loop networks.

This document serves as the definitive architectural blueprint for the GeoStellar Physics Engine, combining the original vision with the engineering detail needed to bring it to fruition.

---

## **Section 1: Foundational Physical Models & Analytical Baseline**

This section, largely derived from the excellent v2 document, establishes the theoretical baseline. We have added a critical subsection on short-time-step modeling to ensure accuracy from the first minutes of simulation.

### **1.1 Governing Energy Equation in Porous Media**

The fundamental equation governing heat transport in a saturated or partially saturated porous medium combines conduction through the composite soil-water-air matrix with advection due to groundwater flow:

`(ρC)ₑ ∂T/∂t = ∇·(λₑ ∇T) − ρₗcₗ v·∇T + Q`

Where `(ρC)ₑ` is the effective volumetric heat capacity [J/(m³·K)], `λₑ` is effective thermal conductivity [W/(m·K)], `ρₗcₗ` is the volumetric heat capacity of the fluid [J/(m³·K)], `v` is the Darcy velocity vector [m/s], and `Q` is the volumetric heat source/sink from the borehole [W/m³]. When `v = 0` (no groundwater flow), this reduces to the pure conduction equation that forms the basis of all standard GHE sizing tools.

### **1.2 Infinite Line Source (ILS) — The Kelvin Foundation**

The ILS model, attributed to Lord Kelvin and applied to geothermal systems by Ingersoll and Plass (1948), treats each borehole as an infinite line of constant heat flux in an infinite homogeneous medium. It is valid for `t > 5r_b²/α` (typically several hours after startup) and forms the basis for TRT analysis but is unsuitable for long-term borefield simulation due to its simplifying assumptions.

### **1.3 Finite Line Source (FLS) — The Modern Workhorse**

The FLS model (Eskilson, 1987; Claesson and Javed, 2011) corrects the ILS by accounting for finite borehole length and the isothermal ground surface boundary condition. The solution integrates the point-source Green’s function along the borehole length with an image source. This is the form implemented in `pygfunction` and is the basis for all modern g-function computation.

### **1.4 Spatial G-Functions (Eskilson, 1987)**

G-functions are dimensionless thermal response functions for specific borehole field geometries, encapsulating the complete spatial superposition problem. The modern approach (Cimmino and Bernier, 2014) uses axial discretization of each borehole into segments combined with spatial superposition of the FLS solution to enforce a uniform borehole wall temperature (UBWT) boundary condition.

### **1.5 Borehole Thermal Resistance (Multipole Method)**

The borehole thermal resistance `R_b` [K·m/W] quantifies the temperature difference between the circulating fluid and the borehole wall. The Multipole Method (Hellström, 1991) provides exact analytical solutions for arbitrary pipe configurations within the borehole. The engine must include a robust multipole implementation to accurately model single U-tubes, double U-tubes, and coaxial pipes with various grout properties.

### **1.6 Temporal Superposition & Load Aggregation**

To handle variable hourly building loads, temporal superposition is used. Direct superposition of 20+ years of hourly data (175,200 steps) is computationally prohibitive. The **Claesson-Javed (2012) load aggregation algorithm** is the industry standard for accelerating this process. It uses geometrically increasing time blocks to compress the load history, reducing computation to approximately 500 superposition terms with negligible error. **This algorithm is a mandatory component for the engine's performance.**

### **1.7 Short-Time-Step Response & Model Blending (Gap Filled)**

The FLS model neglects the thermal capacity of the borehole itself (fluid, pipes, grout), making it inaccurate for the first few hours of simulation. To capture the initial transient behavior correctly, a short-time-step (STS) model is required.

> **The Yavuzturk & Spitler (1999) model**, based on a 2D finite volume representation of the borehole cross-section, provides numerical response factors for these early times [1]. Alternatively, the **Cylindrical Heat Source (CHS) model** provides an analytical solution that accounts for the borehole's thermal mass [2].

The GeoStellar engine will implement a blended approach, as used in tools like EnergyPlus:

1.  For the initial time period (`t < 5r_b²/α`), the engine will use a short-time-step response calculated from a 2D numerical model of the borehole.
2.  For all subsequent time steps, the engine will use the computationally efficient FLS-based g-function.

This ensures accuracy across all time scales, from the first minute of heat pump operation to the 25-year lifecycle of the system.

---

## **Section 2: High-Performance Computational Strategy (Gap Filled)**

Achieving the performance target of **~1 minute for a 100-bore x 1000ft simulation** requires a dedicated computational strategy. This section details the specific algorithms and techniques that must be implemented to move beyond a simple proof-of-concept to a production-grade, high-speed engine.

### **2.1 The Performance Bottlenecks**

A naive simulation involves two primary bottlenecks:

1.  **G-Function Calculation (Spatial Superposition):** This is a one-time, upfront cost. It requires calculating the thermal interaction between every pair of borehole segments. For `N_b` boreholes with `N_s` segments each, this scales as `O((N_b * N_s)²)`. For a 100-bore field with 12 segments each, this is over **1.4 million** FLS evaluations.
2.  **Simulation (Temporal Superposition):** This cost is paid at every time step. It requires convolving the entire load history with the g-function. For `N_t` time steps, this scales as `O(N_t²)`, leading to trillions of operations over a 20-year hourly simulation.

### **2.2 The High-Performance Solution: A Multi-Algorithm Approach**

Our strategy attacks these bottlenecks with a combination of state-of-the-art algorithms.

#### **2.2.1 Tackling the G-Function: The "Similarities" Method**

For the one-time g-function calculation, we will implement the **similarities method pioneered by Cimmino (2018)** [3]. This algorithm intelligently identifies and groups geometrically identical segment pairs in a borefield, calculating the FLS interaction only once for each unique group. For regular or semi-regular fields, the performance gains are enormous.

> **Benchmark:** For a 12x12 (144 borehole) field, the similarities method was shown to reduce the g-function calculation time from **7.5 hours to 88 seconds**—a speedup factor of **308**. For a field of 512 randomly placed boreholes, the calculation was completed in 27 minutes.

This method is essential for making the design of large, complex borefields practical.

#### **2.2.2 Tackling the Simulation: Load Aggregation and FFT**

For the temporal simulation, a two-pronged attack is required:

1.  **Claesson-Javed Load Aggregation:** As established in Section 1.6, this algorithm is non-negotiable. It reduces the number of terms in the superposition from `N_t` to a small, constant number (e.g., ~500), effectively changing the complexity from `O(N_t²)` to `O(N_t)`.

2.  **FFT-Based Convolution:** The remaining convolution at each time step can be further accelerated using the **Fast Fourier Transform (FFT)**. By transforming the load history and the g-function into the frequency domain, the convolution becomes a simple element-wise multiplication, reducing the complexity of the operation from `O(n²)` to `O(n log n)` [4].

#### **2.2.3 Hardware Acceleration: Architecting for the GPU**

While the algorithmic optimizations provide the largest gains, the engine should be architected for future GPU acceleration. The FLS calculations and the FFT are both highly parallelizable tasks. Research has shown that a hybrid CPU/GPU approach can reduce total simulation time for a 20-year VGCHP simulation by an additional **33.5%** compared to a CPU-only method [5].

**Implementation:** The core computational routines will be written in a language like C++ or Rust and exposed through a C-style API. This allows a Python front-end to call the high-performance core, and it enables straightforward integration with GPU libraries like CUDA (`cuFFT`) or OpenCL in the future.

### **2.3 Performance Strategy Summary**

This table summarizes the mandatory computational strategy for the GeoStellar engine.

| Bottleneck | Algorithm / Technique | Impact on Performance | Implementation Priority |
| :--- | :--- | :--- | :--- |
| **G-Function Calculation** | **Cimmino Similarities Method** | **Critical** (100-300x speedup) | **High** |
| **Temporal Simulation** | **Claesson-Javed Load Aggregation** | **Critical** (Orders of magnitude) | **High** |
| **Temporal Convolution** | **Fast Fourier Transform (FFT)** | **High** (Reduces complexity) | **Medium** |
| **Parallel Execution** | **GPU-Ready Architecture** | **Medium** (Further 30-50% speedup) | **Medium (Architect for it)** |

---

## **Section 3: Complex Closed-Loop Geometries: Zipper & Pyramid**

This section, based on the excellent research in the v2 document, details the modeling of advanced, high-density borefield configurations. The mathematical foundation is the **inclined Finite Line Source (FLS)** solution, which generalizes the FLS for boreholes of arbitrary orientation in 3D space [6].

### **3.1 Zipper / Directional Line Array Configuration**

The zipper configuration drills boreholes at alternating angles from a linear surface corridor. The engine will provide a parametric generator for these fields, defined by corridor length, bore spacing, and inclination angle. The g-function will be computed using the full inclined FLS solution to accurately capture the depth-dependent thermal interference.

### **3.2 Pyramid / Collocated Inclined (Active Directional Control)**

The pyramid configuration drills multiple boreholes from a single pad, creating a conical subsurface exchange volume. This is a key technical differentiator. The engine will provide a generator for pyramid fields defined by the pad location, number of bores, and their inclination/azimuth pattern. A critical feature will be the tracking of the **near-surface thermal zone** to flag designs with excessive thermal buildup near the pad.

### **3.3 Superposition for Mixed/Complex Fields**

The engine will support arbitrary combinations of vertical, zipper, and pyramid boreholes in a single simulation. The g-function for the entire mixed field will be computed by assembling the full `N x N` segment interaction matrix, where `N` is the total number of segments across all boreholes.

---

## **Section 4: Open-Loop & Standing Column Well Physics (Gap Filled)**

Open-loop systems are fundamentally different from closed-loop, as heat transport is dominated by advection. The engine must treat them as a first-class well type.

### **4.1 Open-Loop Doublet Systems**

For standard production/injection well doublets, the engine will model:

*   **Well Hydraulics:** Using the Theis (transient) and Cooper-Jacob (steady-state) equations for drawdown, with superposition to account for well interference.
*   **Thermal Breakthrough:** The critical design parameter. The engine will provide both the Gringarten & Sauty (1975) analytical solution for preliminary design and a 2D numerical finite-difference solver for the advection-dispersion equation for final design verification [7].

### **4.2 Standing Column Wells (SCWs) - Detailed Model**

SCWs are a unique hybrid system that uses a single deep borehole in competent rock as both an open and closed-loop heat exchanger. The v2 document correctly identified SCWs but lacked the detailed physics. This section fills that gap.

> A Standing Column Well consists of a pump placed deep within the water column of a borehole. Water is drawn from the bottom, passed through the heat pump, and the majority is returned to the top of the same water column. A small fraction, known as the **bleed** (`β`, typically 5-15%), is discharged to maintain the well temperature.

The bleed is the critical factor. It induces radial groundwater flow from the surrounding aquifer into the well, which significantly enhances heat transfer. The SCW model must therefore couple three processes:

1.  **Borehole Recirculation:** The thermal interaction between the downward-flowing annulus of water and the upward-flowing pump column.
2.  **Conduction with the Rock:** Heat exchange between the water column and the surrounding rock mass, similar to a closed-loop bore.
3.  **Advection from Bleed:** The introduction of fresh aquifer water at the undisturbed ground temperature, driven by the bleed-induced drawdown.

The engine will implement a 1D finite difference model along the well axis, as described by Rees et al. (2004) in the definitive ASHRAE Research Project 1119 [8]. This model solves the coupled energy balance equations for the fluid and the surrounding ground, fully accounting for the bleed ratio and its impact on performance.

---

## **Section 5: Water Saturation, Groundwater Advection & Regional Aquifers**

This section details the critical hydrogeological factors that influence ground thermal properties and heat transport, building on the robust foundation of the v2 document.

### **5.1 Water Saturation Effects on Thermal Properties**

The presence of water dramatically affects the ground's thermal conductivity and heat capacity. The engine will model this using the **Johansen method**, which interpolates between dry and saturated thermal conductivity using a normalized Kersten number (`K_e`) that depends on the degree of saturation (`S_w`). The Lu & Ren (2007) refinement for `K_e` will be the default implementation [9]. Below the user-defined water table depth, the ground will be assumed fully saturated (`S_w = 1.0`).

### **5.2 Groundwater Advection in Closed-Loop Systems**

Even in closed-loop systems, groundwater flow enhances heat transfer. The engine will implement the **Moving Infinite Line Source (MILS)** solution (Diao et al., 2004) to model this effect [10]. This creates an asymmetric thermal plume and can significantly reduce required bore lengths in active aquifers. The engine will automatically calculate the thermal **Peclet Number (`Pe`)** for each ground layer to determine the significance of advection:

*   **`Pe < 0.1`:** Pure conduction regime. Advection calculations are skipped.
*   **`0.1 < Pe < 10`:** Mixed advection-conduction regime. The MILS model is applied.
*   **`Pe > 10`:** Advection-dominated regime. The model will flag this as more suitable for an open-loop analysis.

### **5.3 Regional Aquifer Test Cases**

The engine will be validated against a diverse set of North American aquifer characteristics, as outlined in the v2 document. These include the high-conductivity glacial outwash aquifers of the US Northeast, the low-conductivity glacial tills, and the extreme high-advection carbonate rock of the Edwards Aquifer in Texas. This ensures the engine is robust across the full spectrum of hydrogeological conditions.

---

## **Section 6: SNMR/MRS Integration for Aquifer-Tuned Physics**

Surface Nuclear Magnetic Resonance (SNMR), or Magnetic Resonance Sounding (MRS), is a geophysical method that directly measures mobile water content in the subsurface. Integrating SNMR data is a key innovation for the GeoStellar engine, allowing for site-specific, data-driven hydrogeological models.

### **6.1 Mapping SNMR Outputs to Engine Inputs**

The engine will feature a dedicated import module for standard SNMR inversion results. This module will automatically map the SNMR outputs to the core physics engine parameters as follows:

| SNMR Output | Engine Parameter | How It Tunes the Model |
| :--- | :--- | :--- |
| Water Content Profile `θ(z)` | Porosity `n(z)`, Saturation `S_w(z)` | Defines layer-by-layer effective thermal properties. |
| Aquifer Geometry (Top/Bottom) | Aquifer Depth & Thickness `b` | Identifies depth zones where advection is active. |
| T₂* Decay Time | Hydraulic Conductivity `K(z)` | Calculates Darcy velocity for the MILS model via the SDR equation. |

### **6.2 Quantifying the Aquifer Thermal Contribution**

By combining the SNMR-derived aquifer thickness and hydraulic conductivity with a user-supplied hydraulic gradient, the engine will calculate the **renewable thermal power** available from the aquifer. This will be presented to the user as a percentage of the total building load, providing a clear metric for the hydrogeological 

---

## **Section 7: Advanced Physical Phenomena (Gap Filled)**

To achieve high-fidelity simulations that match real-world performance, the engine must account for several advanced physical effects that are often simplified or ignored in basic models. This section details the implementation of these critical phenomena.

### **7.1 Ground Freezing and Latent Heat**

In cold climates, the ground surrounding the boreholes can drop below 0°C. When this occurs in saturated soil, the phase change of water to ice releases a significant amount of latent heat (334 kJ/kg), which buffers the ground temperature and impacts system performance. Ignoring this effect can lead to under-prediction of entering fluid temperatures during heating-dominated periods.

The engine will model this using the **apparent heat capacity method**. In this approach, the volumetric heat capacity of the soil is artificially increased in the temperature range where freezing occurs (e.g., -1°C to 0°C) to account for the latent heat of fusion.

`(ρC)_apparent = (ρC)_unfrozen + n·S_w·ρ_w·L_f·(dS_ice/dT)`

Where `L_f` is the latent heat of fusion and `dS_ice/dT` is the change in ice fraction with respect to temperature. This method avoids the complexity of a moving-front phase change problem while accurately capturing the thermal impact on the borehole wall temperature [11]. This feature is critical for accurate design in markets like the Northern US, Canada, and Northern Europe.

### **7.2 Antifreeze Fluid Properties**

The circulating fluid in a closed-loop system is typically a mixture of water and an antifreeze agent, such as propylene glycol (PG) or ethanol. The type and concentration of antifreeze significantly alter the fluid's density, specific heat, viscosity, and thermal conductivity, which in turn affect the borehole thermal resistance (`R_b`) and pumping energy.

The engine will include a comprehensive fluid property library with correlations for:

*   Propylene Glycol (10-40% concentration)
*   Ethanol (10-30% concentration)
*   Methanol (10-30% concentration)

These correlations will be temperature-dependent, ensuring that the fluid properties are calculated accurately at the actual operating temperatures within the loop. The pump power calculation will use the correct fluid viscosity to provide realistic estimates of parasitic energy consumption, a crucial factor in overall system efficiency [12].

---

## **Section 8: Unified Physics Engine: Strategic Implementation Game Plan**

This section presents a revised and enhanced phased implementation plan. It integrates the original plan with the new components identified in the gap analysis, creating a comprehensive roadmap from a foundational vertical loop model to a full-featured, high-performance simulation suite.

### **8.1 Core Architecture**

The engine will be built on a modular architecture, with a high-performance computational core written in **Rust or C++** and a user-facing API layer in **Python**. This hybrid approach allows for both extreme performance and ease of integration.

### **8.2 Phase 1: Foundation — High-Performance Vertical Closed-Loop (Months 1-5)**

**Goal:** Create a best-in-class engine for standard vertical boreholes that is faster and more accurate than existing tools. Validate against `pygfunction` and commercial software.

*   **Computational Core:** Implement the **Cimmino Similarities Method** for g-function calculation and the **Claesson-Javed Load Aggregation** for temporal superposition from day one. This establishes the high-performance backbone.
*   **Physics:** FLS kernel, multipole method for `R_b`, and the **blended short-time-step (CHS) / long-time-step (FLS)** response model.
*   **Fluid Properties:** Implement the full **temperature-dependent antifreeze library** (PG, Ethanol).
*   **Validation:** Achieve <1% g-function deviation from `pygfunction` benchmarks. Validate sizing results against industry-standard software (e.g., GLHEPro, EED).

### **8.3 Phase 2: Advanced Geometries & Hydrogeology (Months 6-9)**

**Goal:** Extend the engine to complex 3D geometries and incorporate groundwater effects.

*   **Geometry Engine:** Parametric generators for **zipper and pyramid** fields.
*   **Physics:** Implement the **inclined FLS kernel** and the **MILS (Moving Infinite Line Source)** solution for groundwater advection. Implement the **Johansen method** for saturation-dependent properties.
*   **SNMR Integration:** Build the SNMR data import module to automatically configure the ground model.
*   **Validation:** Validate inclined g-functions against `pygfunction` v2.2+. Validate MILS results against published analytical solutions and benchmarks.

### **8.4 Phase 3: Open-Loop, SCW & Freezing (Months 10-13)**

**Goal:** Add full support for open-loop systems and critical cold-climate physics.

*   **Physics:** Implement the **Theis/Cooper-Jacob** well hydraulics and **Gringarten-Sauty** thermal breakthrough model for open-loop doublets. Implement the full **1D finite difference Standing Column Well (SCW) model** with bleed. Implement the **apparent heat capacity method for ground freezing**.
*   **Validation:** Validate open-loop breakthrough against MODFLOW/MT3DMS. Validate SCW model against ASHRAE RP-1119 results. Validate freezing model against experimental data.

### **8.5 Phase 4: System Integration & Optimization (Months 14-18)**

**Goal:** Wrap the core engine in user-facing tools and add advanced optimization features.

*   **TRNSYS Module:** Develop the **Type GS-xxx** TRNSYS add-on module as a thin Fortran wrapper calling the C++/Rust core engine DLL.
*   **Standalone Simulator:** Create a standalone Python-based tool that can run hourly simulations using TMY weather files and CSV load profiles.
*   **Advanced Modules:** Develop the **TRT Analysis Module** (inverse modeling) and a **Borefield Optimization Module** (spacing, layout, inclination).
*   **5GDHC Model:** Implement a network model for ambient loops to analyze multi-building energy sharing.

---

## **Section 9: TRNSYS Architecture & Compatible Add-On Module**

This section, largely adopted from the excellent and thorough analysis in the v2 document, outlines the architecture for integrating the GeoStellar Physics Engine as a custom Type within the TRNSYS simulation environment. The strategy is to compile the high-performance C++/Rust core as a standalone Dynamic Link Library (DLL) and call it from a thin Fortran wrapper that implements the standard TRNSYS Type interface.

### **9.1 Proposed Module: Type GS-xxx (GeoStellar Advanced GHE)**

The new Type will expose the full power of the engine through the standard TRNSYS parameter/input/output mechanism.

*   **Parameters (Set at simulation start):** These will include selectors for well configuration (Vertical, Zipper, Pyramid, Open-Loop, SCW), all geometric parameters (depth, spacing, angles), pipe and grout properties, the full layered ground model, hydrogeological inputs (water table, Darcy velocity), and optional paths to SNMR data or pre-computed g-function files.
*   **Inputs (Time-varying):** Inlet fluid temperature, mass flow rate, and ambient air temperature.
*   **Outputs (Time-varying):** Outlet fluid temperature, average borehole wall temperature, heat exchange rate, pump power, and specialized outputs for open-loop systems (e.g., production well temperature, drawdown, thermal breakthrough fraction).

### **9.2 TRNSYS Type Implementation Flow**

1.  **Initialization:** On the first call, the Fortran wrapper will pass all Parameters to the core engine DLL. The engine will then perform the one-time, computationally intensive g-function calculation (leveraging the similarities method) and initialize the load aggregation arrays.
2.  **Each Time Step:** The wrapper will pass the current Inputs to the engine. The core DLL will then execute the high-performance temporal superposition (using load aggregation and FFT) to calculate the borehole wall temperature and, subsequently, all other Outputs.
3.  **End of Simulation:** The wrapper will trigger the engine to write summary statistics and optionally save the calculated g-function and detailed logs.

This architecture minimizes the amount of code written in Fortran and keeps the core physics in a modern, high-performance, and easily maintainable language.

---

## **Section 10: Validation & Verification (V&V) Plan (Gap Filled)**

A rigorous V&V plan is non-negotiable for building confidence in a new physics engine. The engine's outputs must be tested and validated against a hierarchy of benchmarks, from analytical solutions to real-world field data.

### **10.1 Unit & Module Level Validation**

Each component of the engine will be validated independently.

| Module | Validation Benchmark | Acceptance Criteria |
| :--- | :--- | :--- |
| **FLS Kernel** | Eskilson (1987) FLS tables | < 0.5% deviation |
| **Borehole Resistance** | Hellström (1991) multipole benchmarks | < 0.1% deviation |
| **Vertical G-Function** | `pygfunction` library results | < 1.0% deviation for standard fields |
| **Inclined G-Function** | `pygfunction` v2.2+ results | < 1.5% deviation for zipper/pyramid |
| **MILS Model** | Diao et al. (2004) published charts | < 2.0% deviation |
| **SCW Model** | ASHRAE RP-1119 results | < 5.0% deviation from published curves |
| **Open-Loop Breakthrough** | Gringarten & Sauty analytical solution | < 2.0% deviation for homogeneous aquifers |

### **10.2 System Level Verification**

Once the modules are validated, the integrated engine will be verified against established industry software for complete building and system simulations.

*   **Comparison with GLHEPro/EED:** For standard vertical borefield designs based on ASHRAE handbook methods, the GeoStellar engine's sizing results (required total bore length) should be within **±5%** of the results from these legacy tools.
*   **Comparison with TRNSYS Type 557:** For long-term simulations, the ground temperature predictions should align closely with the results from the established DST model in Type 557 for cases where groundwater flow is negligible.

### **10.3 Field Data Validation**

The ultimate test is validation against real-world data. The V&V plan will include:

*   **TRT Data:** The engine's TRT analysis module will be tested against at least 10 different field TRT datasets. The inverse model must be able to estimate ground thermal conductivity (`k`) and borehole thermal resistance (`R_b`) values that are consistent with those derived from conventional line-source analysis.
*   **Monitored System Performance:** Data from at least two fully monitored geothermal systems (with at least one year of hourly data) will be used to validate the full system simulation. The model must be able to predict the entering and leaving fluid temperatures to the heat pumps with a monthly root-mean-square error (RMSE) of less than **1.0°C**.

---

## **Section 11: References**

[1] Yavuzturk, C., & Spitler, J. D. (1999). A Short Time Step Response Factor Model for Vertical Ground Loop Heat Exchangers. *ASHRAE Transactions*, 105(2).

[2] Lamarche, L., & Beauchamp, B. (2007). New solutions for the short-time analysis of geothermal vertical boreholes. *International Journal of Heat and Mass Transfer*, 50(7-8).

[3] Cimmino, M. (2018). Fast calculation of the g-functions of geothermal borehole fields using similarities in the evaluation of the finite line source solution. *International Journal of Heat and Mass Transfer*, 127.

[4] Marcotte, D., & Pasquier, P. (2008). Fast fluid and ground temperature computation for geothermal ground-loop heat exchanger systems. *Geothermics*, 37(6).

[5] Beck, M., et al. (2023). Accelerating vertical ground-coupled heat pump simulations through a hybrid CPU/GPU approach. *Applied Energy*, 348.

[6] Lazzarotto, A. (2016). A methodology for the calculation of response functions for geothermal fields with arbitrarily oriented boreholes. *Renewable Energy*, 86.

[7] Gringarten, A. C., & Sauty, J. P. (1975). A theoretical study of heat extraction from aquifers with uniform regional flow. *Journal of Geophysical Research*, 80(35).

[8] Rees, S. J., Spitler, J. D., & Deng, Z. (2004). A Study of Geothermal Heat Pump and Standing Column Well Performance. *ASHRAE Research Project 1119-TRP*.

[9] Lu, S., Ren, T., Gong, Y., & Horton, R. (2007). An Improved Model for Predicting Soil Thermal Conductivity from Water Content at Room Temperature. *Soil Science Society of America Journal*, 71(1).

[10] Diao, N., Li, Q., & Fang, Z. (2004). Heat transfer in ground heat exchangers with groundwater advection. *International Journal of Thermal Sciences*, 43(12).

[11] Kurevija, T., & Vulin, D. (2011). The effect of soil freezing on the performance of a borehole heat exchanger. *Geofizika*, 28(2).

[12] Kavanaugh, S. P. (2006). Geothermal Heat Pump Antifreeze/Heat Transfer Fluids. *ASHRAE Journal*, 48(9).

---

## **Section 11: Advanced Analysis & Optimization Modules (Gap Filled)**

Beyond core simulation, a market-leading tool must provide advanced analysis and optimization capabilities. This section details the planned modules for TRT analysis, borefield optimization, and 5GDHC network modeling.

### **11.1 Thermal Response Test (TRT) Analysis Module**

A TRT is the industry-standard method for measuring in-situ ground thermal conductivity (`k`) and borehole thermal resistance (`R_b`). The engine will include a dedicated TRT analysis module that uses **inverse modeling** to automatically estimate these parameters from raw test data.

*   **Forward Model:** The engine will use its high-fidelity, blended short-time/long-time response model to simulate the TRT.
*   **Inverse Algorithm:** A non-linear least-squares optimization algorithm (e.g., Levenberg-Marquardt) will be used to find the `k` and `R_b` values that minimize the error between the simulated and measured fluid temperatures.
*   **Features:** The module will support analysis of standard and interrupted TRTs and provide uncertainty estimates for the derived parameters.

### **11.2 Borefield Layout Optimization Module**

Manually designing the optimal borefield layout is a tedious and error-prone process. The engine will include an automated optimization module to find the best layout based on user-defined constraints.

*   **Optimization Algorithm:** A **Genetic Algorithm (GA)** will be employed to explore the vast design space of possible borehole locations and inclinations.
*   **Objective Function:** The GA will seek to minimize a multi-objective cost function that can include lifecycle cost (drilling + pumping energy), surface footprint area, and peak fluid temperature deviation.
*   **Output:** The module will deliver an optimized field layout (coordinates and angles) that meets the project's performance and cost objectives.

### **11.3 5th Generation District Heating & Cooling (5GDHC) Network Model**

5GDHC, or ambient loop, systems are a rapidly growing market segment. These systems connect multiple buildings with a shared, low-temperature water loop, allowing for energy sharing between buildings with diverse loads. The GeoStellar engine will include a module for modeling these networks.

*   **Hydraulic Network:** The module will integrate with or replicate the functionality of a pipe network solver like **EPANET** to model the hydraulics of the ambient loop, calculating flow rates and pressure drops.
*   **Thermal Network:** A 1D advection-diffusion model will track the temperature evolution along the network as heat is exchanged with multiple, independent borefields and buildings.
*   **Analysis:** This module will allow designers to quantify the benefits of load diversification, optimize the central loop and borefield sizes, and ensure proper hydraulic balancing across the network.

---

## **Section 12: Data Management & I/O Specifications (Gap Filled)**

Robust and standardized data input/output is crucial for usability and interoperability. The engine will use clear, well-defined file formats for all data exchange.

*   **Project Configuration:** A primary JSON file will define the entire project, including all simulation settings, ground properties, geometry parameters, and paths to other data files.
*   **Weather Data:** Standard TMY3 and EPW weather file formats will be supported for hourly simulations.
*   **Load Profiles:** Building heating and cooling loads will be imported from simple, two-column CSV files (Timestamp, Load [kW]).
*   **SNMR/TRT Data:** Standardized CSV templates will be provided for importing raw data from these field tests.
*   **Results Export:** All simulation results will be exportable to CSV for easy post-processing and to a specific format compatible with the TRNSYS plotting and reporting tools.

---

## **Section 13: Final V&V Plan and References**

This section consolidates the V&V plan and the full list of references from the entire document.

### **13.1 Consolidated Validation & Verification (V&V) Plan**

| Module | Validation Benchmark | Acceptance Criteria |
| :--- | :--- | :--- |
| **FLS Kernel** | Eskilson (1987) FLS tables | < 0.5% deviation |
| **Borehole Resistance** | Hellström (1991) multipole benchmarks | < 0.1% deviation |
| **Vertical G-Function** | `pygfunction` library results | < 1.0% deviation for standard fields |
| **Inclined G-Function** | `pygfunction` v2.2+ results | < 1.5% deviation for zipper/pyramid |
| **MILS Model** | Diao et al. (2004) published charts | < 2.0% deviation |
| **SCW Model** | ASHRAE RP-1119 results | < 5.0% deviation from published curves |
| **Open-Loop Breakthrough** | Gringarten & Sauty analytical solution | < 2.0% deviation for homogeneous aquifers |
| **System Sizing** | GLHEPro / EED | < ±5% on total bore length |
| **System Simulation** | TRNSYS Type 557 | < 1.0°C monthly RMSE on fluid temps |
| **TRT Analysis** | Field Data (10+ tests) | Consistent `k` and `R_b` estimates |
| **Full System** | Monitored Field Data (2+ sites) | < 1.0°C monthly RMSE on fluid temps |

### **13.2 Consolidated References**

[1] Yavuzturk, C., & Spitler, J. D. (1999). A Short Time Step Response Factor Model for Vertical Ground Loop Heat Exchangers. *ASHRAE Transactions*, 105(2).

[2] Lamarche, L., & Beauchamp, B. (2007). New solutions for the short-time analysis of geothermal vertical boreholes. *International Journal of Heat and Mass Transfer*, 50(7-8).

[3] Cimmino, M. (2018). Fast calculation of the g-functions of geothermal borehole fields using similarities in the evaluation of the finite line source solution. *International Journal of Heat and Mass Transfer*, 127.

[4] Marcotte, D., & Pasquier, P. (2008). Fast fluid and ground temperature computation for geothermal ground-loop heat exchanger systems. *Geothermics*, 37(6).

[5] Beck, M., et al. (2023). Accelerating vertical ground-coupled heat pump simulations through a hybrid CPU/GPU approach. *Applied Energy*, 348.

[6] Lazzarotto, A. (2016). A methodology for the calculation of response functions for geothermal fields with arbitrarily oriented boreholes. *Renewable Energy*, 86.

[7] Gringarten, A. C., & Sauty, J. P. (1975). A theoretical study of heat extraction from aquifers with uniform regional flow. *Journal of Geophysical Research*, 80(35).

[8] Rees, S. J., Spitler, J. D., & Deng, Z. (2004). A Study of Geothermal Heat Pump and Standing Column Well Performance. *ASHRAE Research Project 1119-TRP*.

[9] Lu, S., Ren, T., Gong, Y., & Horton, R. (2007). An Improved Model for Predicting Soil Thermal Conductivity from Water Content at Room Temperature. *Soil Science Society of America Journal*, 71(1).

[10] Diao, N., Li, Q., & Fang, Z. (2004). Heat transfer in ground heat exchangers with groundwater advection. *International Journal of Thermal Sciences*, 43(12).

[11] Kurevija, T., & Vulin, D. (2011). The effect of soil freezing on the performance of a borehole heat exchanger. *Geofizika*, 28(2).

[12] Kavanaugh, S. P. (2006). Geothermal Heat Pump Antifreeze/Heat Transfer Fluids. *ASHRAE Journal*, 48(9).
