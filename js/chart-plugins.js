// Chart.js Plugin for Aligned Dual Labels
const dualSideLabelsPlugin = {
    id: 'dualSideLabels',
    afterDraw: (chart) => {
        // Only apply to horizontal bar charts with team name data
        if (chart.config.type !== 'bar' || 
            !chart.config.options?.indexAxis || 
            chart.config.options.indexAxis !== 'y' ||
            !chart.config.data?.team1Names || 
            !chart.config.data?.team2Names) {
            return; // Skip for other chart types (radar, etc.)
        }

        const { ctx, chartArea: { left, right } } = chart;
        const { team1Names, team2Names } = chart.config.data;

        const meta1 = chart.getDatasetMeta(0); // Team 1
        const meta2 = chart.getDatasetMeta(1); // Team 2

        ctx.save();
        ctx.font = 'bold 12px Inter';
        ctx.textBaseline = 'middle';

        // Calculate max widths for dynamic positioning
        let maxT1Width = 0;
        for (let name of team1Names || []) {
            maxT1Width = Math.max(maxT1Width, ctx.measureText(name).width);
        }
        let maxT2Width = 0;
        for (let name of team2Names || []) {
            maxT2Width = Math.max(maxT2Width, ctx.measureText(name).width);
        }

        const numBars = Math.max(meta1.data.length, meta2.data.length);

        for (let i = 0; i < numBars; i++) {
            // Draw Team 1 name (left side, right-aligned near chart)
            if (meta1.data[i]) {
                const bar1 = meta1.data[i];
                const t1Name = team1Names[i] || '';
                ctx.fillStyle = 'rgba(96, 165, 250, 1)';
                ctx.textAlign = 'right';
                ctx.fillText(t1Name, left - 15, bar1.y);
            }

            // Draw Team 2 name (right side, left-aligned near chart)
            if (meta2.data[i]) {
                const bar2 = meta2.data[i];
                const t2Name = team2Names[i] || '';
                ctx.fillStyle = 'rgba(251, 146, 60, 1)';
                ctx.textAlign = 'left';
                ctx.fillText(t2Name, right + 15, bar2.y);
            }
        }
        ctx.restore();
    }
};

Chart.register(dualSideLabelsPlugin);