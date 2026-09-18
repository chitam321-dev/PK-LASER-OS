function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function softmax(rows) {
  if (!rows.length) return [];
  const max = Math.max(...rows.map(r => r.raw));
  const exps = rows.map(r => Math.exp(r.raw - max));
  const total = exps.reduce((a, b) => a + b, 0) || 1;
  return rows.map((r, i) => ({ ...r, probability: exps[i] / total }));
}

export async function loadKnowledge(db, signalCodes) {
  if (!signalCodes.length) return { causes: [], tests: [] };
  const placeholders = signalCodes.map(() => '?').join(',');

  const edgeRows = await db.prepare(`
    SELECT e.signal_code, e.cause_code, e.weight, e.rationale,
           c.name AS cause_name, c.subsystem, c.description AS cause_description,
           c.base_prior, c.severity
    FROM ai_causal_edges e
    JOIN ai_causes c ON c.code = e.cause_code
    WHERE e.signal_code IN (${placeholders})
  `).bind(...signalCodes).all();

  const causes = new Map();
  for (const row of edgeRows.results || []) {
    if (!causes.has(row.cause_code)) {
      causes.set(row.cause_code, {
        code: row.cause_code,
        name: row.cause_name,
        subsystem: row.subsystem,
        description: row.cause_description,
        severity: row.severity,
        prior: clamp01(row.base_prior),
        evidence: [],
      });
    }
    causes.get(row.cause_code).evidence.push({
      signalCode: row.signal_code,
      weight: Number(row.weight),
      rationale: row.rationale,
    });
  }

  const causeCodes = [...causes.keys()];
  if (!causeCodes.length) return { causes: [], tests: [] };
  const causePlaceholders = causeCodes.map(() => '?').join(',');
  const testRows = await db.prepare(`
    SELECT ct.cause_code, ct.information_gain, ct.expected_if_true,
           t.code, t.name, t.subsystem, t.instructions, t.cost_score, t.risk_score
    FROM ai_cause_tests ct
    JOIN ai_tests t ON t.code = ct.test_code
    WHERE ct.cause_code IN (${causePlaceholders})
  `).bind(...causeCodes).all();

  return { causes: [...causes.values()], tests: testRows.results || [] };
}

export function inferDiagnosis(knowledge, evidenceInput = []) {
  const evidenceMap = new Map();
  for (const item of evidenceInput) {
    if (!item?.signalCode) continue;
    const confidence = item.confidence == null ? 1 : clamp01(item.confidence);
    const polarity = item.present === false ? -1 : 1;
    evidenceMap.set(String(item.signalCode), { confidence, polarity, value: item.value ?? null });
  }

  const scored = [];
  for (const cause of knowledge.causes) {
    let raw = Math.log(Math.max(0.001, cause.prior));
    const matchedEvidence = [];
    let support = 0;

    for (const edge of cause.evidence) {
      const observed = evidenceMap.get(edge.signalCode);
      if (!observed) continue;
      const contribution = Number(edge.weight) * observed.confidence * observed.polarity;
      raw += contribution * 2.4;
      support += Math.max(0, contribution);
      matchedEvidence.push({ ...edge, confidence: observed.confidence, contribution });
    }

    scored.push({ ...cause, raw, support, matchedEvidence });
  }

  const ranked = softmax(scored)
    .sort((a, b) => b.probability - a.probability)
    .map((row, index) => ({
      rank: index + 1,
      code: row.code,
      name: row.name,
      subsystem: row.subsystem,
      severity: row.severity,
      probability: Number(row.probability.toFixed(4)),
      confidence: Number(Math.min(0.99, row.probability * (0.65 + Math.min(0.35, row.support / 2))).toFixed(4)),
      evidence: row.matchedEvidence.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
      description: row.description,
    }));

  const tests = [];
  for (const cause of ranked.slice(0, 4)) {
    for (const test of knowledge.tests.filter(t => t.cause_code === cause.code)) {
      const score = cause.probability * Number(test.information_gain) /
        Math.max(0.5, Number(test.cost_score) * 0.65 + Number(test.risk_score) * 0.35);
      tests.push({
        causeCode: cause.code,
        causeName: cause.name,
        testCode: test.code,
        testName: test.name,
        subsystem: test.subsystem,
        instructions: test.instructions,
        expectedIfTrue: test.expected_if_true,
        informationGain: Number(test.information_gain),
        score,
      });
    }
  }

  const nextTests = tests
    .sort((a, b) => b.score - a.score)
    .filter((test, index, arr) => arr.findIndex(x => x.testCode === test.testCode) === index)
    .slice(0, 5)
    .map(({ score, ...test }, index) => ({ priority: index + 1, ...test }));

  const top = ranked[0] || null;
  const uncertainty = top ? Number((1 - top.probability).toFixed(4)) : 1;

  return {
    mode: 'causal-probabilistic-v1',
    topCause: top,
    rankedCauses: ranked.slice(0, 8),
    nextTests,
    uncertainty,
    needsMoreEvidence: !top || top.probability < 0.62,
    safetyNote: 'AI là hệ thống hỗ trợ chẩn đoán. Kỹ thuật viên phải xác minh bằng đo kiểm thực tế trước khi thay linh kiện hoặc can thiệp điện/quang học.',
  };
}

export async function updateLearningFromFeedback(db, runId, confirmedCauseCode, outcome) {
  if (!confirmedCauseCode || !['confirmed', 'rejected', 'partially_confirmed'].includes(outcome)) return;
  const run = await db.prepare('SELECT evidence_json FROM ai_diagnostic_runs WHERE id = ?').bind(runId).first();
  if (!run) return;

  let evidence = [];
  try { evidence = JSON.parse(run.evidence_json) || []; } catch { return; }

  const delta = outcome === 'confirmed' ? 0.03 : outcome === 'partially_confirmed' ? 0.01 : -0.02;
  for (const item of evidence) {
    if (!item?.signalCode || item.present === false) continue;
    await db.prepare(`
      UPDATE ai_causal_edges
      SET weight = MIN(1, MAX(-1, weight + ?)),
          sample_count = sample_count + 1,
          source_type = CASE WHEN sample_count >= 4 THEN 'learned' ELSE source_type END,
          updated_at = CURRENT_TIMESTAMP
      WHERE signal_code = ? AND cause_code = ?
    `).bind(delta, item.signalCode, confirmedCauseCode).run();
  }
}
