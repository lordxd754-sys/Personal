export interface AssessmentInput {
  weight: number
  height: number
  age: number
  triceps: number
  subscapular: number
  pectoral: number
  midaxillary: number
  suprailiac: number
  abdominal: number
  thigh: number
}

export interface AssessmentResult {
  soma7dobras: number
  bodyFatPercent: number
  leanMassKg: number
  fatMassKg: number
  bmi: number
  classification: string
  classificationColor: 'blue' | 'green' | 'yellow' | 'red'
}

export function calculateAssessment(input: AssessmentInput): AssessmentResult {
  const { weight, height, age, triceps, subscapular, pectoral, midaxillary, suprailiac, abdominal, thigh } = input

  const soma7 = triceps + subscapular + pectoral + midaxillary + suprailiac + abdominal + thigh

  const densidade =
    1.112 -
    0.00043499 * soma7 +
    0.00000055 * soma7 * soma7 -
    0.00028826 * age

  const bodyFatPercent = Math.round(((4.95 / densidade) - 4.50) * 100 * 10) / 10
  const fatMassKg = Math.round((weight * bodyFatPercent / 100) * 10) / 10
  const leanMassKg = Math.round((weight - fatMassKg) * 10) / 10
  const heightM = height / 100
  const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10

  let classification = ''
  let classificationColor: 'blue' | 'green' | 'yellow' | 'red' = 'green'

  if (bodyFatPercent < 10) {
    classification = 'Atlético'; classificationColor = 'blue'
  } else if (bodyFatPercent < 18) {
    classification = 'Excelente'; classificationColor = 'green'
  } else if (bodyFatPercent < 25) {
    classification = 'Bom'; classificationColor = 'green'
  } else if (bodyFatPercent < 30) {
    classification = 'Acima da média'; classificationColor = 'yellow'
  } else if (bodyFatPercent < 35) {
    classification = 'Obesidade leve'; classificationColor = 'red'
  } else {
    classification = 'Obesidade severa'; classificationColor = 'red'
  }

  return { soma7dobras: soma7, bodyFatPercent, leanMassKg, fatMassKg, bmi, classification, classificationColor }
}

export function classifyBMI(bmi: number): { label: string; color: 'blue' | 'green' | 'yellow' | 'red' } {
  if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'blue' }
  if (bmi < 25) return { label: 'Normal', color: 'green' }
  if (bmi < 30) return { label: 'Sobrepeso', color: 'yellow' }
  return { label: 'Obesidade', color: 'red' }
}
