import React from 'react'
import { distillStage } from './distill-guide.js'

const STEPS = ['setup', 'materials', 'generate', 'bind']

export default function DistillGuide({ detail, loading, writable, busy, boundAuthorId, novelId, t, onCreate, onAddMaterials, onCopyInstruction, onBind }) {
  const stage = distillStage({ detail, boundAuthorId })
  const activeIndex = stage === 'done' ? STEPS.length : STEPS.indexOf(stage)
  const keys = { setup: 'distillGuideSetup', materials: 'distillGuideMaterials', generate: 'distillGuideGenerate', bind: 'distillGuideBind', done: 'distillGuideDone' }
  const hints = { setup: 'distillGuideSetupHint', materials: 'distillGuideMaterialsHint', generate: 'distillGuideGenerateHint', bind: 'distillGuideBindHint', done: 'distillGuideDoneHint' }
  const actions = { setup: onCreate, materials: onAddMaterials, generate: onCopyInstruction, bind: onBind }
  return <section className="qibi-distill-guide" aria-label={t('distillGuideTitle')}>
    <strong>{t('distillGuideTitle')}</strong>
    <p className="qibi-sub">{t('distillGuideIntro')}</p>
    <ol className="qibi-distill-steps">{STEPS.map((step, index) => <li key={step} className={index < activeIndex ? 'complete' : index === activeIndex ? 'current' : ''} aria-current={!loading && step === stage ? 'step' : undefined}><span className="qibi-distill-step-number" aria-hidden="true">{index + 1}</span><span>{t(keys[step])}{!loading && index < activeIndex && <span className="qibi-distill-step-status"> · {t('distillGuideCompleted')}</span>}</span></li>)}</ol>
    <div className="qibi-distill-guide-next">
      <span className="qibi-sub">{loading ? t('loading') : t(hints[stage])}</span>
      {!loading && stage !== 'done' && <button type="button" className="qibi-btn" disabled={busy || (stage !== 'generate' && !writable) || (stage === 'bind' && novelId == null)} onClick={actions[stage]}>{t(stage === 'setup' ? 'distillNew' : stage === 'materials' ? 'distillPaste' : stage === 'generate' ? 'distillInstruction' : 'distillBind')}</button>}
    </div>
    {!writable && <p className="qibi-sub">{t('distillGuideReadOnly')}</p>}
  </section>
}
