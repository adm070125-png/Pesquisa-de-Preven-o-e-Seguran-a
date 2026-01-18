
import { FormData, ProfileType } from '../types';

export function calculateProfile(data: FormData): ProfileType {
  let score = 0;
  let totalPoints = 0;

  // Question 1: Preference
  totalPoints += 2;
  if (data.perfilPreferencia === 'Se prevenir antes') score += 2;
  else if (data.perfilPreferencia === 'Nunca pensou muito sobre isso') score += 0.5;

  // Question: Preparedness
  totalPoints += 2;
  if (data.preparacaoFamilia === 'Preparada') score += 2;
  else if (data.preparacaoFamilia === 'Parcialmente preparada') score += 1;

  // Insurances / Plans
  const indicators = [
    data.seguroResidencial,
    data.seguroVeicular,
    data.planoSaude,
    data.seguroVida,
    data.planoFunerario
  ];

  indicators.forEach(val => {
    totalPoints += 1;
    if (val === 'Sim') score += 1;
  });

  // Future interest
  totalPoints += 1;
  if (data.interesseConhecer === 'Sim') score += 1;
  else if (data.interesseConhecer === 'Talvez') score += 0.5;

  const percentage = (score / totalPoints) * 100;

  if (percentage >= 75) return 'Preventivo';
  if (percentage >= 40) return 'Parcialmente preventivo';
  return 'Reativo';
}
