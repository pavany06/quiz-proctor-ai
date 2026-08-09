import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { MLModelResult } from '../../types';
import { BrainCircuit, Cpu, Award, BarChart2, CheckCircle, Sparkles, Sliders } from 'lucide-react';

export const AIMLAnalyticsAdmin: React.FC = () => {
  const [mlData, setMlData] = useState<{ models: MLModelResult[]; bestModelName: string; totalSamples: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMLComparison();
  }, []);

  const loadMLComparison = async () => {
    setLoading(true);
    try {
      const data = await api.getMLModelComparison();
      setMlData(data);
    } catch (err) {
      console.error('Failed loading ML comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900">Machine Learning Analytics & Algorithm Comparison</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Supervised Student Performance Prediction (PASS/FAIL) evaluated across 5 classification algorithms
        </p>
      </div>

      {/* Distinction Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
          <div className="flex items-center gap-2 font-bold text-sm text-purple-900">
            <Cpu className="h-4 w-4 text-purple-700" /> Machine Learning (Supervised Classification)
          </div>
          <p className="mt-1 text-xs text-purple-800 leading-relaxed">
            Trains mathematical classifiers (Logistic Regression, Decision Trees, Random Forest, SVM, KNN) on student feature metrics (previous score, attempts, accuracy, topic mastery) to predict PASS/FAIL outcomes.
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
            <Sparkles className="h-4 w-4 text-blue-700" /> Generative AI (Gemini 3.6 Flash)
          </div>
          <p className="mt-1 text-xs text-blue-800 leading-relaxed">
            Powers AI Question Generation with JSON schema validation and AI Academic Performance Insights to offer natural language recommendations for faculty.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-slate-400 text-xs">
          Running ML Model Evaluation & Calculating Metrics...
        </div>
      ) : mlData ? (
        <>
          {/* Best Model Banner */}
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-emerald-800">Top Performing Classifier</div>
                <div className="text-base font-bold text-slate-900">{mlData.bestModelName}</div>
                <div className="text-[11px] text-slate-600">
                  Evaluated on {mlData.totalSamples} B.Tech student feature vectors (80% Train / 20% Test Split)
                </div>
              </div>
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Algorithm Performance Matrix</h3>
              <span className="text-[11px] font-semibold text-slate-500">Supervised Classification (PASS / FAIL)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Algorithm</th>
                    <th className="px-4 py-3 text-center">Accuracy</th>
                    <th className="px-4 py-3 text-center">Precision</th>
                    <th className="px-4 py-3 text-center">Recall</th>
                    <th className="px-4 py-3 text-center">F1 Score</th>
                    <th className="px-4 py-3 text-center">Confusion Matrix (TP / FP / TN / FN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                  {mlData.models.map(m => {
                    const isBest = m.algorithmName === mlData.bestModelName;
                    return (
                      <tr key={m.algorithmName} className={isBest ? 'bg-emerald-50/40 font-bold' : 'hover:bg-slate-50'}>
                        <td className="px-4 py-3.5 text-slate-900 flex items-center gap-2">
                          {m.algorithmName}
                          {isBest && <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">BEST</span>}
                        </td>
                        <td className="px-4 py-3 text-center text-indigo-700 font-bold">{m.accuracy}%</td>
                        <td className="px-4 py-3 text-center">{m.precision}%</td>
                        <td className="px-4 py-3 text-center">{m.recall}%</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">{m.f1Score}%</td>
                        <td className="px-4 py-3 text-center font-mono text-[11px]">
                          TP:{m.confusionMatrix.truePositive} | FP:{m.confusionMatrix.falsePositive} | TN:{m.confusionMatrix.trueNegative} | FN:{m.confusionMatrix.falseNegative}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Model Accuracy Visual Bar Chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Accuracy Comparison Visualizer</h3>
            <div className="space-y-3">
              {mlData.models.map(m => (
                <div key={m.algorithmName} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{m.algorithmName}</span>
                    <span>{m.accuracy}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        m.algorithmName === mlData.bestModelName ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${m.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
