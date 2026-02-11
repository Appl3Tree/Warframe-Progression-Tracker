// ===== FILE: src/domain/catalog/starChart/index.ts =====

import type { StarChartData } from "../../models/starChart";
import { STAR_CHART_NODES } from "./nodes";
import { STAR_CHART_PLANETS } from "./planets";

export const STAR_CHART_DATA: StarChartData = {
    planets: STAR_CHART_PLANETS,
    nodes: STAR_CHART_NODES
};

