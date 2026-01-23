// nexus-research-agent/demoData.ts
import { DocumentItem } from './types';

export const DEMO_DOCUMENTS: DocumentItem[] = [
  {
    id: 'demo-protocol-v1',
    name: 'experiment_protocol_v1.md',
    type: 'markdown',
    timestamp: Date.now(),
    content: `# Experiment Protocol v1.0

## Objective
Evaluate accuracy–latency tradeoffs under fixed architectural constraints while maintaining inference stability across batches.

## Fixed Constraints
- **Architecture:** Fixed (no structural changes)
- **Batch Size:** 32
- **Latency Limit:** 120 ms (p95)
- **Evaluation Dataset:** Identical across runs

## Metrics
- **Accuracy (%)**
- **p95 Latency (ms)**
- **Error Variance (σ² across batches)**

## Experimental Runs
Two experimental runs were conducted with identical constraints but different parameter tuning strategies.
- **Run 1:** Baseline configuration optimized for stability.
- **Run 2:** Aggressively tuned for accuracy.

## Evaluation Artifacts
- Quantitative results are provided in \`run_1_results.csv\` and \`run_2_results.csv\`
- Visual comparison shown in Figure 1 (\`performance_comparison.png\`)

## Figure References
**Figure 1:** Accuracy vs Latency comparison between Run 1 and Run 2.
Note: Run 2 violates the 120ms latency constraint (actual: 131ms) as indicated in visual plots.

## Protocol Notes
Any future run must:
- Remain under the 120 ms latency threshold.
- Use the same dataset and batch size.
- Optimize only inference‑time parameters.`
  },
  {
    id: 'demo-run1-results',
    name: 'run_1_results.csv',
    type: 'csv',
    timestamp: Date.now(),
    content: `run_id,accuracy,latency_ms,error_variance
run_1,82.4,94,0.021`
  },
  {
    id: 'demo-run2-results',
    name: 'run_2_results.csv',
    type: 'csv',
    timestamp: Date.now(),
    content: `run_id,accuracy,latency_ms,error_variance
run_2,87.6,131,0.047`
  },
  {
    id: 'demo-performance-chart',
    name: 'performance_comparison.png',
    type: 'image',
    mimeType: 'image/png',
    timestamp: Date.now(),
    content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAABkCAIAAAAm1uV2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMWEw0sYp2S/gAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAJElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAPbwb+AABjm213AAAAABJRU5ErkJggg=='
  }
];
