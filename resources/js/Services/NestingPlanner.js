const toNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const round = (value, decimals = 2) => Number(toNumber(value).toFixed(decimals));

const getMaterialWidth = (material) => (
    toNumber(material?.ancho_cm || material?.ancho_imprimible || material?.ancho)
);

const getMaterialHeight = (material) => (
    toNumber(material?.largo_cm || material?.largo_imprimible || material?.largo)
);

const getArtworkWidth = (job) => (
    toNumber(job?.producto?.ancho_imprimible || job?.ancho_imprimible)
);

const getArtworkHeight = (job) => (
    toNumber(job?.producto?.largo_imprimible || job?.largo_imprimible)
);

const getBleed = (job) => (
    toNumber(job?.producto?.sangrado || job?.sangrado)
);

const getGap = (job, material) => Math.max(
    toNumber(job?.producto?.separacion_piezas || job?.separacion_piezas),
    toNumber(material?.margen_seguridad_cm)
);

const canRotate = (job) => Boolean(job?.producto?.permite_rotacion || job?.permite_rotacion);

const getJobLabel = (job) => (
    job?.producto?.nombre || job?.venta?.numero_orden || `Trabajo ${job?.id}`
);

const createColor = (index) => {
    const palette = [
        { fill: '#0f766e', stroke: '#115e59', text: '#ecfeff' },
        { fill: '#1d4ed8', stroke: '#1e40af', text: '#eff6ff' },
        { fill: '#c2410c', stroke: '#9a3412', text: '#fff7ed' },
        { fill: '#7c3aed', stroke: '#6d28d9', text: '#f5f3ff' },
        { fill: '#be123c', stroke: '#9f1239', text: '#fff1f2' },
        { fill: '#4d7c0f', stroke: '#3f6212', text: '#f7fee7' },
    ];

    return palette[index % palette.length];
};

const computeOrientation = (job, material, rotated = false) => {
    const materialWidth = getMaterialWidth(material);
    const materialHeight = getMaterialHeight(material);
    const baseWidth = getArtworkWidth(job);
    const baseHeight = getArtworkHeight(job);
    const bleed = getBleed(job);
    const gap = getGap(job, material);

    const pieceWidth = rotated ? baseHeight : baseWidth;
    const pieceHeight = rotated ? baseWidth : baseHeight;

    if (materialWidth <= 0 || pieceWidth <= 0 || pieceHeight <= 0) {
        return null;
    }

    const totalWidth = pieceWidth + (bleed * 2);
    const totalHeight = pieceHeight + (bleed * 2);

    if (material?.es_rollo) {
        const columns = Math.floor((materialWidth + gap) / (totalWidth + gap));

        if (columns <= 0) {
            return null;
        }

        return {
            rotated,
            mode: 'rollo',
            pieceWidth: totalWidth,
            pieceHeight: totalHeight,
            columns,
            rows: 0,
            capacity: columns,
            gap,
            materialWidth,
            materialHeight,
        };
    }

    if (materialHeight <= 0) {
        return null;
    }

    const columns = Math.floor((materialWidth + gap) / (totalWidth + gap));
    const rows = Math.floor((materialHeight + gap) / (totalHeight + gap));
    const capacity = Math.max(0, columns) * Math.max(0, rows);

    if (capacity <= 0) {
        return null;
    }

    return {
        rotated,
        mode: 'pliego',
        pieceWidth: totalWidth,
        pieceHeight: totalHeight,
        columns,
        rows,
        capacity,
        gap,
        materialWidth,
        materialHeight,
    };
};

const getBestOrientation = (job, material) => {
    const base = computeOrientation(job, material, false);
    const rotated = canRotate(job) ? computeOrientation(job, material, true) : null;

    if (!base) return rotated;
    if (!rotated) return base;

    if (material?.es_rollo) {
        return rotated.capacity > base.capacity ? rotated : base;
    }

    return rotated.capacity > base.capacity ? rotated : base;
};

const buildJobState = (job, material, index) => {
    const quantity = Math.max(0, Math.ceil(toNumber(job?.cantidad)));
    const orientation = getBestOrientation(job, material);

    return {
        id: job.id,
        job,
        quantity,
        remaining: quantity,
        color: createColor(index),
        label: getJobLabel(job),
        orientation,
    };
};

const sortStates = (states) => (
    [...states].sort((a, b) => {
        const areaA = (a.orientation?.pieceWidth || 0) * (a.orientation?.pieceHeight || 0);
        const areaB = (b.orientation?.pieceWidth || 0) * (b.orientation?.pieceHeight || 0);
        return areaB - areaA;
    })
);

const packSheetOnce = (states, material, previewLimit = 48) => {
    const width = getMaterialWidth(material);
    const height = getMaterialHeight(material);
    const ordered = sortStates(states).filter((state) => state.remaining > 0 && state.orientation);
    const placements = [];
    const usedByJob = {};
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    let placedSomething = false;
    let guard = 0;

    while (guard < 2000) {
        guard += 1;
        let placedInPass = false;

        for (const state of ordered) {
            if (state.remaining <= 0 || !state.orientation) {
                continue;
            }

            const { pieceWidth, pieceHeight, gap } = state.orientation;

            if (x > 0 && x + pieceWidth > width) {
                x = 0;
                y += rowHeight + gap;
                rowHeight = 0;
            }

            if (y + pieceHeight > height) {
                continue;
            }

            if (x + pieceWidth > width) {
                continue;
            }

            state.remaining -= 1;
            usedByJob[state.id] = (usedByJob[state.id] || 0) + 1;
            placedSomething = true;
            placedInPass = true;

            if (placements.length < previewLimit) {
                placements.push({
                    orderId: state.id,
                    label: state.label,
                    x,
                    y,
                    width: pieceWidth,
                    height: pieceHeight,
                    color: state.color,
                    rotated: state.orientation.rotated,
                });
            }

            x += pieceWidth + gap;
            rowHeight = Math.max(rowHeight, pieceHeight);
        }

        if (!placedInPass) {
            break;
        }
    }

    return {
        placements,
        usedByJob,
        count: Object.values(usedByJob).reduce((sum, count) => sum + count, 0),
        width,
        height,
        placedSomething,
    };
};

const simulateSheets = (states, material) => {
    const working = states.map((state) => ({ ...state }));
    const sheetSummaries = [];
    let totalSheets = 0;
    let guard = 0;

    while (working.some((state) => state.remaining > 0) && guard < 1000) {
        guard += 1;
        const packed = packSheetOnce(working, material);

        if (!packed.placedSomething) {
            break;
        }

        totalSheets += 1;
        sheetSummaries.push(packed.usedByJob);
    }

    return {
        totalSheets,
        sheetSummaries,
        remaining: working,
        preview: sheetSummaries[0] || {},
    };
};

const packRoll = (states, material, previewLimit = 60) => {
    const width = getMaterialWidth(material);
    const ordered = sortStates(states).filter((state) => state.remaining > 0 && state.orientation);
    const placements = [];
    const usedByJob = {};
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    let totalLength = 0;
    let guard = 0;

    while (ordered.some((state) => state.remaining > 0) && guard < 10000) {
        guard += 1;
        let placedInPass = false;

        for (const state of ordered) {
            if (state.remaining <= 0 || !state.orientation) {
                continue;
            }

            const { pieceWidth, pieceHeight, gap } = state.orientation;

            if (x > 0 && x + pieceWidth > width) {
                x = 0;
                y += rowHeight + gap;
                totalLength = y;
                rowHeight = 0;
            }

            if (pieceWidth > width) {
                continue;
            }

            state.remaining -= 1;
            usedByJob[state.id] = (usedByJob[state.id] || 0) + 1;
            placedInPass = true;

            if (placements.length < previewLimit) {
                placements.push({
                    orderId: state.id,
                    label: state.label,
                    x,
                    y,
                    width: pieceWidth,
                    height: pieceHeight,
                    color: state.color,
                    rotated: state.orientation.rotated,
                });
            }

            x += pieceWidth + gap;
            rowHeight = Math.max(rowHeight, pieceHeight);
            totalLength = Math.max(totalLength, y + rowHeight);
        }

        if (!placedInPass) {
            break;
        }
    }

    return {
        placements,
        usedByJob,
        count: Object.values(usedByJob).reduce((sum, count) => sum + count, 0),
        width,
        height: Math.max(totalLength, 1),
        totalLength: round(totalLength, 2),
    };
};

export const isOrderCompatibleWithMaterial = (job, material) => {
    if (!job || !material) return true;
    if (job.materia_prima_id && Number(job.materia_prima_id) !== Number(material.id)) return false;

    const compatibles = job?.producto?.papeles_compatibles || job?.producto?.papelesCompatibles || [];
    if (!compatibles.length) return true;

    return compatibles.some((support) => Number(support.id) === Number(material.id));
};

export const buildNestingPlan = (orders, material) => {
    if (!material) {
        return {
            errors: ['Selecciona primero el papel o soporte para calcular el pliego.'],
            jobs: [],
            preview: null,
            summary: null,
        };
    }

    if (!orders.length) {
        return {
            errors: ['Selecciona al menos un trabajo para ver el nesting visual.'],
            jobs: [],
            preview: null,
            summary: null,
        };
    }

    const jobs = orders.map((order, index) => buildJobState(order, material, index));
    const invalidJobs = jobs.filter((job) => !job.orientation);
    const incompatibleJobs = orders.filter((order) => !isOrderCompatibleWithMaterial(order, material));
    const errors = [];

    if (incompatibleJobs.length) {
        errors.push('Hay trabajos seleccionados que no son compatibles con el soporte actual.');
    }

    if (invalidJobs.length) {
        errors.push('Algunos trabajos no tienen medidas suficientes para calcular el nesting.');
    }

    if (material.es_rollo) {
        const rollPlan = packRoll(jobs, material);
        const totalQuantity = jobs.reduce((sum, job) => sum + job.quantity, 0);

        return {
            errors,
            jobs,
            preview: {
                mode: 'rollo',
                width: rollPlan.width,
                height: rollPlan.height,
                placements: rollPlan.placements,
                usedByJob: rollPlan.usedByJob,
                totalLength: rollPlan.totalLength,
            },
            summary: {
                totalTrabajos: jobs.length,
                totalPiezas: totalQuantity,
                totalMaterial: rollPlan.totalLength,
                unidadMaterial: 'cm lineales',
                piezasEnVista: rollPlan.count,
            },
        };
    }

    const simulation = simulateSheets(jobs, material);
    const previewState = jobs.map((job) => ({ ...job, remaining: job.quantity }));
    const previewSheet = packSheetOnce(previewState, material);
    const totalQuantity = jobs.reduce((sum, job) => sum + job.quantity, 0);

    return {
        errors,
        jobs,
        preview: {
            mode: 'pliego',
            width: previewSheet.width,
            height: previewSheet.height,
            placements: previewSheet.placements,
            usedByJob: previewSheet.usedByJob,
            totalSheets: simulation.totalSheets,
        },
        summary: {
            totalTrabajos: jobs.length,
            totalPiezas: totalQuantity,
            totalPliegos: simulation.totalSheets,
            piezasEnPrimerPliego: previewSheet.count,
            material: material.nombre,
        },
    };
};

export const formatMaterialDimensions = (material) => {
    if (!material) return 'Sin soporte';

    const width = getMaterialWidth(material);
    const height = getMaterialHeight(material);

    if (material.es_rollo) {
        return width > 0 ? `Rollo ${round(width)} cm de ancho` : 'Rollo';
    }

    if (width > 0 && height > 0) {
        return `${round(width)} x ${round(height)} cm`;
    }

    return 'Sin medidas';
};
