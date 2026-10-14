// Local (device timezone) date as yyyy-mm-dd, for "valid today only" values.
function todayStr_() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

export const Store = {
  getTargetCalories: () => {
    return parseInt(localStorage.getItem('target_calories')) || 2000;
  },
  setTargetCalories: (val) => {
    localStorage.setItem('target_calories', val);
  },
  // Optional daily macro targets in grams. 0 means "not set".
  getMacroTargets: () => {
    const fallback = { protein_g: 0, karbo_g: 0, lemak_g: 0 };
    try {
      const raw = JSON.parse(localStorage.getItem('macro_targets'));
      if (!raw || typeof raw !== 'object') return fallback;
      return {
        protein_g: Number(raw.protein_g) || 0,
        karbo_g: Number(raw.karbo_g) || 0,
        lemak_g: Number(raw.lemak_g) || 0,
      };
    } catch {
      return fallback;
    }
  },
  setMacroTargets: (val) => {
    localStorage.setItem('macro_targets', JSON.stringify({
      protein_g: Number(val.protein_g) || 0,
      karbo_g: Number(val.karbo_g) || 0,
      lemak_g: Number(val.lemak_g) || 0,
    }));
  },
  // Last known remaining analyses for today (sent by the backend on each
  // successful `analyze`). Only valid for the day it was saved on.
  getQuotaSisa: () => {
    try {
      const raw = JSON.parse(localStorage.getItem('quota_sisa'));
      if (!raw || typeof raw !== 'object') return null;
      if (raw.date !== todayStr_()) return null;
      const n = Number(raw.sisa);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  },
  setQuotaSisa: (sisa) => {
    try {
      localStorage.setItem('quota_sisa', JSON.stringify({ date: todayStr_(), sisa: Number(sisa) || 0 }));
    } catch {
      // storage full/disabled: the badge is optional
    }
  },
  getProfile: () => {
    const defaultProfile = { weight: 60, height: 165, age: 25, gender: 'M', activity: 1.2 };
    try {
      return JSON.parse(localStorage.getItem('profile')) || defaultProfile;
    } catch {
      return defaultProfile;
    }
  },
  setProfile: (profile) => {
    localStorage.setItem('profile', JSON.stringify(profile));
  },
  getSavedCalorieCalculation: () => {
    try {
      const raw = JSON.parse(localStorage.getItem('saved_calorie_calculation'));
      if (!raw || typeof raw !== 'object' || !Number.isFinite(Number(raw.tdee)) || Number(raw.tdee) <= 0) return null;
      return { tdee: Number(raw.tdee) };
    } catch {
      return null;
    }
  },
  setSavedCalorieCalculation: (calculation) => {
    localStorage.setItem('saved_calorie_calculation', JSON.stringify({ tdee: calculation.tdee }));
  }
};
