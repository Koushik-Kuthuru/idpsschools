export const TRANSPORT_FEE_BELOW_7KM_ANNUAL = 15000;
export const TRANSPORT_FEE_ABOVE_7KM_ANNUAL = 23000;

/** @deprecated use ANNUAL constants */
export const TRANSPORT_FEE_BELOW_7KM_QUARTERLY = TRANSPORT_FEE_BELOW_7KM_ANNUAL;
/** @deprecated use ANNUAL constants */
export const TRANSPORT_FEE_ABOVE_7KM_QUARTERLY = TRANSPORT_FEE_ABOVE_7KM_ANNUAL;

/** APR–MAR month order used across fee grids and transport fees. */
export const FEE_MONTHS = ["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"];

/** Three installments per year: Jul, Oct, Jan (indices 3, 6, 9). */
const INSTALLMENT_MONTH_INDEXES = [3, 6, 9];

const INSTALLMENTS_BY_SLAB = {
  below: [5000, 5000, 5000],
  above: [8000, 8000, 7000],
};

export function transportSlabFromStop(stopLabel) {
  const stop = String(stopLabel ?? "").trim().toUpperCase();
  if (stop.includes("BELOW")) return "below";
  if (stop.includes("ABOVE")) return "above";
  return null;
}

export function annualAmountForSlab(slab) {
  if (slab === "below") return TRANSPORT_FEE_BELOW_7KM_ANNUAL;
  if (slab === "above") return TRANSPORT_FEE_ABOVE_7KM_ANNUAL;
  return 0;
}

/** @deprecated use annualAmountForSlab */
export function quarterlyAmountForSlab(slab) {
  return annualAmountForSlab(slab);
}

export function buildQuarterlyTransportFeeValues(stopLabel) {
  const slab = transportSlabFromStop(stopLabel);
  const parts = slab ? INSTALLMENTS_BY_SLAB[slab] : null;
  const values = Array(12).fill("0");
  if (!parts) return values;

  INSTALLMENT_MONTH_INDEXES.forEach((index, partIndex) => {
    values[index] = String(parts[partIndex]);
  });
  return values;
}

export function upsertTransportFeeRow(feeGrid, transportValues) {
  const values = [...transportValues];
  const rows = Array.isArray(feeGrid) ? feeGrid.map((row) => ({ ...row, values: [...(row.values ?? [])] })) : [];

  const idx = rows.findIndex((row) => String(row.name ?? "").toUpperCase().includes("TRANSPORT"));
  const transportRow = {
    name: "TRANSPORT FEE",
    method: "QUARTERLY",
    values,
  };

  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...transportRow };
  } else {
    rows.push(transportRow);
  }

  return rows;
}
