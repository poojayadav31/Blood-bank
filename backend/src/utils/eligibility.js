/**
 * Donor Eligibility Engine
 * Rules:
 * - Age: 18 - 65 years
 * - Weight: > 45 kg
 * - Donation Gap: >= 90 days (Whole Blood)
 */

function calculateAge(dobString) {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function checkEligibility({ dob, weight, lastDonationDate }) {
  const reasons = [];
  let isEligible = true;
  let nextEligibleDate = null;
  let daysRemaining = 0;

  // 1. Age check
  const age = calculateAge(dob);
  if (age < 18) {
    isEligible = false;
    reasons.push(`Minimum age for blood donation is 18 years. Current age: ${age} years.`);
  } else if (age > 65) {
    isEligible = false;
    reasons.push(`Maximum age for blood donation is 65 years. Current age: ${age} years.`);
  }

  // 2. Weight check
  const weightNum = parseFloat(weight);
  if (isNaN(weightNum) || weightNum <= 45) {
    isEligible = false;
    reasons.push(`Minimum weight requirement is greater than 45 kg. Current weight: ${weightNum || 0} kg.`);
  }

  // 3. Donation interval check (90 days)
  if (lastDonationDate) {
    const lastDate = new Date(lastDonationDate);
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 90) {
      isEligible = false;
      daysRemaining = 90 - diffDays;
      const nextDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      nextEligibleDate = nextDate.toISOString().split('T')[0];
      reasons.push(`Last donation was ${diffDays} days ago. Minimum interval required is 90 days. You will be eligible in ${daysRemaining} days (on ${nextEligibleDate}).`);
    }
  }

  return {
    isEligible,
    age,
    reasons,
    reason: reasons.join(' '),
    daysRemaining,
    nextEligibleDate,
  };
}

module.exports = {
  calculateAge,
  checkEligibility,
};
