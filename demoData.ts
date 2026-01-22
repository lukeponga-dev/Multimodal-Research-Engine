// nexus-research-agent/demoData.ts
import { DocumentItem } from './types';

export const DEMO_DOCUMENTS: DocumentItem[] = [
  {
    id: 'demo-protocol-ocr',
    name: 'experiment_protocol.md',
    type: 'markdown',
    timestamp: Date.now(),
    content: `# Protocol: Adaptive Model Evaluation
## Constraints
- **Batch Size:** 32
- **Max p95 Latency:** 120ms (Hard Threshold)
- **Dataset:** Constant across runs

## Metrics Tracked
- Accuracy, Precision, Recall
- p95 Latency (ms)
- Error Variance

## Evaluation Criteria
Improvements in accuracy are invalid if p95 latency exceeds 120ms. Variance spikes (>0.04) indicate model instability.`
  },
  {
    id: 'demo-run1',
    name: 'run_1_results.csv',
    type: 'text',
    timestamp: Date.now(),
    content: `"metric,value"
"accuracy,82.4"
"precision,80.1"
"recall,78.9"
"p95_latency_ms,94"
"error_variance,0.021"`
  },
  {
    id: 'demo-run2',
    name: 'run_2_results.csv',
    type: 'text',
    timestamp: Date.now(),
    content: `"metric,value"
"accuracy,87.6"
"precision,85.9"
"recall,84.1"
"p95_latency_ms,131"
"error_variance,0.047"`
  },
  {
    id: 'demo-chart-analysis',
    name: 'accuracy_latency_comparison.png',
    type: 'image',
    mimeType: 'image/png',
    timestamp: Date.now(),
    // Base64 placeholder for the comparison chart
    content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAABkCAIAAAAm1uV2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gMWEw0sYp2S/gAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAJElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAPbwb+AABjm213AAAAABJRU5ErkJggg=='
  }
];