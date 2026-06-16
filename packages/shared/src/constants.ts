export const EMPLOYEE_STATUSES = [
  'onboarding',
  'active',
  'offboarding',
  'terminated',
] as const;

export const DOCUMENT_TYPES = [
  'offer_letter',
  'onboarding_pack',
  'payslip',
  'experience_letter',
  'relieving_letter',
  'promotion_letter',
  'increment_letter',
  'confirmation_letter',
  'warning_letter',
  'employment_verification',
  'internship_certificate',
  'noc',
] as const;

/** Letters that HR issues on demand with custom parameters. */
export const LETTER_TYPES = [
  'promotion_letter',
  'increment_letter',
  'confirmation_letter',
  'warning_letter',
  'employment_verification',
  'internship_certificate',
  'noc',
] as const;

export const DOCUMENT_LABELS: Record<string, string> = {
  offer_letter: 'Offer Letter',
  onboarding_pack: 'Onboarding Pack',
  payslip: 'Payslip',
  experience_letter: 'Experience Certificate',
  relieving_letter: 'Relieving Letter',
  promotion_letter: 'Promotion Letter',
  increment_letter: 'Increment Letter',
  confirmation_letter: 'Confirmation Letter',
  warning_letter: 'Warning Letter',
  employment_verification: 'Employment Verification',
  internship_certificate: 'Internship Certificate',
  noc: 'No Objection Certificate',
};

export const TEMPLATE_TYPES = [...DOCUMENT_TYPES] as const;

export const LEAVE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
] as const;

export const HOLIDAY_TYPES = ['public', 'optional', 'restricted'] as const;

export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'intern',
  'contract',
] as const;

export const GENDERS = ['male', 'female', 'other'] as const;

export const USER_ROLES = ['hr_admin'] as const;
