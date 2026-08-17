const { chromium } = require('playwright');
const path = require('path');
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text())});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+path.resolve('index.html'));
  await page.waitForTimeout(800);
  await page.screenshot({path:'qa-queue.png',fullPage:true});
  const initial={
    screens:await page.locator('.screen').count(),
    rows:await page.locator('#caseRows tr').count(),
    open:await page.locator('#openMetric').textContent(),
    evidenceCount:await page.locator('.section-head .pill.teal').textContent(),
    agentLabel:await page.locator('.agent-label').first().textContent(),
    caseText:await page.locator('#case').textContent()
  };
  await page.click('[data-case="ir-2841"]');
  await page.click('[data-pane="consent"]');
  await page.click('[data-pane="history"]');
  await page.click('[data-pane="decision"]');
  await page.click('#approveMerge');
  await page.check('#confirmReview');
  await page.click('#confirmMerge');
  await page.waitForTimeout(300);
  const approved={
    status:await page.locator('#caseStatus').textContent(),
    open:await page.locator('#openMetric').textContent(),
    banner:await page.locator('#approvedBanner').isVisible(),
    keepSeparateDisabled:await page.locator('#keepSeparate').isDisabled(),
    escalateDisabled:await page.locator('#escalate').isDisabled(),
    keepSeparateLabel:await page.locator('#keepSeparate').textContent(),
    escalateLabel:await page.locator('#escalate').textContent()
  };
  await page.locator('#keepSeparate').evaluate(el=>el.click());
  await page.locator('#escalate').evaluate(el=>el.click());
  approved.statusAfterContradictoryAttempts=await page.locator('#caseStatus').textContent();
  await page.screenshot({path:'qa-case-approved.png',fullPage:true});
  await page.click('[data-screen="audit"]');
  const newestAudit=await page.locator('#auditRows tr').first().textContent();
  await page.screenshot({path:'qa-audit.png',fullPage:true});
  await page.click('[data-screen="onboarding"]');
  await page.screenshot({path:'qa-onboarding.png',fullPage:true});
  await page.click('[data-screen="analytics"]');
  await page.screenshot({path:'qa-operations.png',fullPage:true});
  console.log(JSON.stringify({title:await page.title(),initial,approved,newestAudit,errors},null,2));
  const copyOk=
    initial.evidenceCount.includes('5 sources checked') &&
    initial.agentLabel.includes('Identity Resolution Agent · working concept') &&
    !initial.caseText.includes('MyLigo agent') &&
    !initial.caseText.includes('v2.4') &&
    initial.caseText.includes('04/09/1978') &&
    initial.caseText.includes('09/04/1978');
  const stateOk=approved.keepSeparateDisabled && approved.escalateDisabled && approved.keepSeparateLabel.trim()==='Keep separate' && approved.escalateLabel.trim()==='Escalate' && approved.statusAfterContradictoryAttempts.includes('Merge approved');
  if(errors.length || initial.rows!==8 || !approved.banner || !newestAudit.includes('Merge approved') || !copyOk || !stateOk) process.exitCode=1;
  await browser.close();
})();
