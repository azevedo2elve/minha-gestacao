import {
  GESTATION_TOTAL_DAYS,
  addDays,
  diffInDays,
  normalizeToUtcDate,
  formatToIsoDateString,
  calculateEffectiveDumFromDum,
  calculateEffectiveDumFromUltrasound,
  calculateDpp,
  getTrimester,
  formatGestationalAge,
  formatGestationalAgeShort,
  getGestationalAge,
  hasObstetricRedFlag,
  CRITICAL_RED_FLAG_SYMPTOMS,
} from '../obstetrics';

describe('Obstetrics Calculation Engine (RN01 & RN04)', () => {
  describe('Date normalization & utilities', () => {
    it('normalizes string date and Date object consistently in UTC', () => {
      const d1 = normalizeToUtcDate('2026-05-10');
      const d2 = normalizeToUtcDate(new Date(Date.UTC(2026, 4, 10)));
      expect(d1.getTime()).toBe(d2.getTime());
      expect(formatToIsoDateString(d1)).toBe('2026-05-10');
    });

    it('calculates diffInDays accurately across months and leap years', () => {
      // 2024 is a leap year (Feb 29 exists)
      expect(diffInDays('2024-03-01', '2024-02-28')).toBe(2);
      expect(diffInDays('2026-01-10', '2026-01-01')).toBe(9);
      expect(diffInDays('2026-01-01', '2026-01-01')).toBe(0);
    });

    it('adds and subtracts days correctly', () => {
      const start = '2026-01-01';
      const plus10 = addDays(start, 10);
      expect(formatToIsoDateString(plus10)).toBe('2026-01-11');
      const minus5 = addDays(start, -5);
      expect(formatToIsoDateString(minus5)).toBe('2025-12-27');
    });
  });

  describe('DUM vs Ultrasound calculation equivalence (RN01)', () => {
    it('calculates effective DUM directly from DUM', () => {
      const dum = '2026-02-15';
      const effDum = calculateEffectiveDumFromDum(dum);
      expect(formatToIsoDateString(effDum)).toBe('2026-02-15');
    });

    it('calculates corrected DUM from ultrasound retroceding elapsed days', () => {
      // If ultrasound was done on 2026-05-01 at 10 weeks and 4 days (74 days)
      // Effective DUM should be 2026-05-01 minus 74 days = 2026-02-16
      const usDate = '2026-05-01';
      const weeks = 10;
      const days = 4;
      const effDum = calculateEffectiveDumFromUltrasound(usDate, weeks, days);
      expect(formatToIsoDateString(effDum)).toBe('2026-02-16');

      // Verifying reciprocity: from effective DUM to ultrasound date must be exactly 10w 4d
      const ageAtUltrasound = getGestationalAge(effDum, usDate);
      expect(ageAtUltrasound.weeks).toBe(10);
      expect(ageAtUltrasound.days).toBe(4);
    });

    it('produces identical DPP and gestational age when DUM and ultrasound are equivalent', () => {
      const dumDate = '2026-03-01';
      // At 12w 0d after DUM: 12 * 7 = 84 days later -> 2026-05-24
      const usDate = '2026-05-24';
      const usWeeks = 12;
      const usDays = 0;

      const effFromDum = calculateEffectiveDumFromDum(dumDate);
      const effFromUs = calculateEffectiveDumFromUltrasound(usDate, usWeeks, usDays);

      expect(formatToIsoDateString(effFromDum)).toBe(formatToIsoDateString(effFromUs));

      const targetCheckDate = '2026-08-01';
      const resDum = getGestationalAge(effFromDum, targetCheckDate);
      const resUs = getGestationalAge(effFromUs, targetCheckDate);

      expect(resDum.weeks).toBe(resUs.weeks);
      expect(resDum.days).toBe(resUs.days);
      expect(resDum.daysRemaining).toBe(resUs.daysRemaining);
      expect(formatToIsoDateString(resDum.dppDate)).toBe(formatToIsoDateString(resUs.dppDate));
    });
  });

  describe('DPP & Gestational Milestones', () => {
    it('calculates DPP as exactly 280 days after effective DUM', () => {
      const dum = '2026-01-01';
      const dpp = calculateDpp(dum);
      expect(diffInDays(dpp, dum)).toBe(GESTATION_TOTAL_DAYS);
      expect(formatToIsoDateString(dpp)).toBe('2026-10-08');
    });

    it('identifies trimesters correctly according to RN01 boundaries', () => {
      expect(getTrimester(0)).toBe(1);
      expect(getTrimester(13)).toBe(1);
      expect(getTrimester(14)).toBe(2);
      expect(getTrimester(27)).toBe(2);
      expect(getTrimester(28)).toBe(3);
      expect(getTrimester(40)).toBe(3);
      expect(getTrimester(42)).toBe(3);
    });

    it('computes edge cases: start of pregnancy, milestones, and overdue', () => {
      const dum = '2026-01-01';

      // Day 0: start of gestation
      const day0 = getGestationalAge(dum, '2026-01-01');
      expect(day0.weeks).toBe(0);
      expect(day0.days).toBe(0);
      expect(day0.daysRemaining).toBe(280);
      expect(day0.progressPercentage).toBe(0);
      expect(day0.trimester).toBe(1);
      expect(day0.isPreTerm).toBe(true);
      expect(day0.isFullTerm).toBe(false);

      // 13 weeks 6 days (97 days) - end of 1st trimester
      const end1st = getGestationalAge(dum, addDays(dum, 97));
      expect(end1st.weeks).toBe(13);
      expect(end1st.days).toBe(6);
      expect(end1st.trimester).toBe(1);

      // 14 weeks 0 days (98 days) - start of 2nd trimester
      const start2nd = getGestationalAge(dum, addDays(dum, 98));
      expect(start2nd.weeks).toBe(14);
      expect(start2nd.days).toBe(0);
      expect(start2nd.trimester).toBe(2);

      // 27 weeks 6 days (195 days) - end of 2nd trimester
      const end2nd = getGestationalAge(dum, addDays(dum, 195));
      expect(end2nd.weeks).toBe(27);
      expect(end2nd.days).toBe(6);
      expect(end2nd.trimester).toBe(2);

      // 28 weeks 0 days (196 days) - start of 3rd trimester
      const start3rd = getGestationalAge(dum, addDays(dum, 196));
      expect(start3rd.weeks).toBe(28);
      expect(start3rd.days).toBe(0);
      expect(start3rd.trimester).toBe(3);

      // 37 weeks 0 days (259 days) - Full Term (A termo precoce)
      const term37 = getGestationalAge(dum, addDays(dum, 259));
      expect(term37.weeks).toBe(37);
      expect(term37.isPreTerm).toBe(false);
      expect(term37.isFullTerm).toBe(true);
      expect(term37.isPostTerm).toBe(false);

      // 40 weeks 0 days (280 days) - DPP
      const dppDay = getGestationalAge(dum, addDays(dum, 280));
      expect(dppDay.weeks).toBe(40);
      expect(dppDay.days).toBe(0);
      expect(dppDay.daysRemaining).toBe(0);
      expect(dppDay.progressPercentage).toBe(100);
      expect(dppDay.isFullTerm).toBe(true);

      // 42 weeks 1 day (295 days) - Post Term
      const postTerm = getGestationalAge(dum, addDays(dum, 295));
      expect(postTerm.weeks).toBe(42);
      expect(postTerm.days).toBe(1);
      expect(postTerm.isPostTerm).toBe(true);
    });
  });

  describe('Formatting helpers', () => {
    it('formats gestational ages properly in Portuguese', () => {
      expect(formatGestationalAge(0, 0)).toBe('0 semanas');
      expect(formatGestationalAge(1, 0)).toBe('1 semana');
      expect(formatGestationalAge(1, 1)).toBe('1 semana e 1 dia');
      expect(formatGestationalAge(28, 4)).toBe('28 semanas e 4 dias');
      expect(formatGestationalAgeShort(28, 4)).toBe('28s 4d');
    });
  });

  describe('RN04: Obstetric Red Flag Engine', () => {
    it('triggers red flag on critical symptom tags', () => {
      CRITICAL_RED_FLAG_SYMPTOMS.forEach((symptom) => {
        expect(
          hasObstetricRedFlag({
            symptomTags: [symptom, 'NAUSEA'],
            gestationalWeeks: 20,
            fetalMovement: 'NORMAL',
          })
        ).toBe(true);
      });
    });

    it('does not trigger red flag on non-critical symptoms', () => {
      expect(
        hasObstetricRedFlag({
          symptomTags: ['ENJOO', 'CANSACO', 'AZIA'],
          gestationalWeeks: 32,
          fetalMovement: 'NORMAL',
        })
      ).toBe(false);
    });

    it('triggers red flag for DECREASED fetal movement ONLY at >= 28 weeks', () => {
      // At 27 weeks, decreased movement is not a critical flag
      expect(
        hasObstetricRedFlag({
          symptomTags: [],
          gestationalWeeks: 27,
          fetalMovement: 'DECREASED',
        })
      ).toBe(false);

      // At 28 weeks, decreased movement MUST trigger red flag
      expect(
        hasObstetricRedFlag({
          symptomTags: [],
          gestationalWeeks: 28,
          fetalMovement: 'DECREASED',
        })
      ).toBe(true);

      // At 35 weeks, decreased movement MUST trigger red flag
      expect(
        hasObstetricRedFlag({
          symptomTags: [],
          gestationalWeeks: 35,
          fetalMovement: 'DECREASED',
        })
      ).toBe(true);

      // Normal movement at 35 weeks is fine
      expect(
        hasObstetricRedFlag({
          symptomTags: [],
          gestationalWeeks: 35,
          fetalMovement: 'NORMAL',
        })
      ).toBe(false);
    });
  });
});
