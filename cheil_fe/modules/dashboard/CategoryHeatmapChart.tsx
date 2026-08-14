"use client";

import { Box, Chip, Stack } from "@mui/material";
import type { DashboardCategory, MonthlyCategoryRecord } from "./dashboard.types";

type CategoryHeatmapChartProps = {
  data: MonthlyCategoryRecord[];
  categories: DashboardCategory[];
};

const CELL_WIDTH = 54;
const CELL_HEIGHT = 34;
const LABEL_WIDTH = 126;
const HEADER_HEIGHT = 28;
const ROW_LABEL_HEIGHT = 32;

const formatValue = new Intl.NumberFormat("ko-KR");

const mixOpacity = (value: number, maxValue: number) => {
  const ratio = maxValue === 0 ? 0 : value / maxValue;
  return 0.14 + ratio * 0.72;
};

export function CategoryHeatmapChart({ data, categories }: CategoryHeatmapChartProps) {
  const maxValue = Math.max(...data.flatMap((item) => categories.map((category) => item[category.key])), 1);
  const width = LABEL_WIDTH + CELL_WIDTH * data.length + 24;
  const height = HEADER_HEIGHT + ROW_LABEL_HEIGHT * categories.length + 20;

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Chip size="small" label="Higher volume = deeper color" sx={{ bgcolor: "action.hover", fontWeight: 700 }} />
      </Stack>

      <Box sx={{ width: "100%", overflowX: "auto", pb: 1 }}>
        <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ display: "block", minWidth: 720, width: "100%" }}>
          {data.map((item, index) => (
            <text
              key={item.month}
              x={LABEL_WIDTH + CELL_WIDTH * index + CELL_WIDTH / 2}
              y={18}
              fill="#64748b"
              fontSize="12"
              textAnchor="middle"
            >
              {item.month}
            </text>
          ))}

          {categories.map((category, rowIndex) => {
            const y = HEADER_HEIGHT + ROW_LABEL_HEIGHT * rowIndex + ROW_LABEL_HEIGHT / 2 + 5;

            return (
              <g key={category.key}>
                <text x={12} y={y} fill="#0f172a" fontSize="12" fontWeight="700">
                  {category.label}
                </text>
                {data.map((item, colIndex) => {
                  const value = item[category.key];
                  const x = LABEL_WIDTH + CELL_WIDTH * colIndex;
                  const opacity = mixOpacity(value, maxValue);

                  return (
                    <g key={`${category.key}-${item.month}`}>
                      <rect
                        x={x + 4}
                        y={HEADER_HEIGHT + ROW_LABEL_HEIGHT * rowIndex + 4}
                        width={CELL_WIDTH - 8}
                        height={CELL_HEIGHT}
                        rx="8"
                        fill={category.color}
                        opacity={opacity}
                      />
                      <text
                        x={x + CELL_WIDTH / 2}
                        y={HEADER_HEIGHT + ROW_LABEL_HEIGHT * rowIndex + 26}
                        fill={value > maxValue * 0.45 ? "white" : "#0f172a"}
                        fontSize="12"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {formatValue.format(value)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
