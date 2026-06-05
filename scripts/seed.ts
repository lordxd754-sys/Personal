import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function id() {
  return crypto.randomUUID()
}

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const userId = id()
  await supabase.from('User').upsert({
    id: userId,
    name: 'Personal Trainer',
    email: 'admin@ptmanager.com',
    password: hashedPassword,
    specialties: ['Hipertrofia', 'Emagrecimento', 'Reabilitação'],
    bio: 'Personal trainer com 10 anos de experiência. Especialista em hipertrofia e recomposição corporal.',
    createdAt: new Date().toISOString(),
  }, { onConflict: 'email' })
  console.log('✅ Admin user created: admin@ptmanager.com / admin123')

  // 2. Students
  const now = new Date()
  const students = [
    {
      id: id(), name: 'Carlos Silva', email: 'carlos@example.com', phone: '(11) 98765-4321',
      birthdate: '1992-03-15T00:00:00Z', city: 'São Paulo', state: 'SP',
      goal: 'Hipertrofia', level: 'intermediario', daysPerWeek: 4, sessionDuration: 75,
      restrictions: null, equipment: 'Academia completa',
      notes: 'Prefere treinos push/pull. Muito dedicado.',
      status: 'ativo', lastContactAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: id(), name: 'Ana Oliveira', email: 'ana@example.com', phone: '(11) 91234-5678',
      birthdate: '1995-07-22T00:00:00Z', city: 'Campinas', state: 'SP',
      goal: 'Emagrecimento', level: 'iniciante', daysPerWeek: 3, sessionDuration: 60,
      restrictions: 'Joelho direito — evitar agachamento profundo',
      equipment: 'Academia completa + elásticos em casa',
      notes: 'Iniciante, bastante motivada. Cuide da progressão.',
      status: 'ativo', lastContactAt: new Date(now.getTime() - 16 * 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 45 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: id(), name: 'Roberto Costa', email: 'roberto@example.com', phone: '(21) 99876-5432',
      birthdate: '1988-11-08T00:00:00Z', city: 'Rio de Janeiro', state: 'RJ',
      goal: 'Condicionamento e força', level: 'avancado', daysPerWeek: 5, sessionDuration: 90,
      restrictions: null, equipment: 'Academia completa + kettlebells',
      notes: 'Ex-atleta. Prefere volume alto e técnicas avançadas.',
      status: 'ativo', lastContactAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 180 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  for (const student of students) {
    await supabase.from('Student').upsert(student, { onConflict: 'email' })
  }
  console.log('✅ 3 students created')

  // 3. Physical assessments (2 per student for evolution chart)
  const assessments = [
    // Carlos — inicial (90 dias atrás) + atual (30 dias atrás)
    { id: id(), studentId: students[0].id, weight: 86, height: 178, age: 32, triceps: 16, subscapular: 19, pectoral: 18, midaxillary: 20, suprailiac: 22, abdominal: 27, thigh: 21, bodyFatPercent: 21.5, leanMassKg: 67.5, fatMassKg: 18.5, bmi: 27.1, classification: 'Acima da média', assessedAt: new Date(now.getTime() - 90 * 86400000).toISOString() },
    { id: id(), studentId: students[0].id, weight: 82, height: 178, age: 32, triceps: 12, subscapular: 15, pectoral: 14, midaxillary: 16, suprailiac: 18, abdominal: 22, thigh: 17, bodyFatPercent: 18.2, leanMassKg: 67.1, fatMassKg: 14.9, bmi: 25.9, classification: 'Bom', assessedAt: new Date(now.getTime() - 30 * 86400000).toISOString() },
    // Ana — inicial (80 dias atrás) + atual (20 dias atrás)
    { id: id(), studentId: students[1].id, weight: 72, height: 163, age: 29, triceps: 25, subscapular: 22, pectoral: 20, midaxillary: 26, suprailiac: 28, abdominal: 33, thigh: 35, bodyFatPercent: 31.8, leanMassKg: 49.1, fatMassKg: 22.9, bmi: 27.1, classification: 'Obesidade leve', assessedAt: new Date(now.getTime() - 80 * 86400000).toISOString() },
    { id: id(), studentId: students[1].id, weight: 68, height: 163, age: 29, triceps: 20, subscapular: 18, pectoral: 17, midaxillary: 22, suprailiac: 24, abdominal: 28, thigh: 30, bodyFatPercent: 28.5, leanMassKg: 48.6, fatMassKg: 19.4, bmi: 25.6, classification: 'Acima da média', assessedAt: new Date(now.getTime() - 20 * 86400000).toISOString() },
    // Roberto — inicial (75 dias atrás) + atual (15 dias atrás)
    { id: id(), studentId: students[2].id, weight: 94, height: 182, age: 36, triceps: 13, subscapular: 15, pectoral: 14, midaxillary: 16, suprailiac: 17, abdominal: 20, thigh: 17, bodyFatPercent: 16.9, leanMassKg: 78.1, fatMassKg: 15.9, bmi: 28.4, classification: 'Bom', assessedAt: new Date(now.getTime() - 75 * 86400000).toISOString() },
    { id: id(), studentId: students[2].id, weight: 90, height: 182, age: 36, triceps: 10, subscapular: 12, pectoral: 11, midaxillary: 13, suprailiac: 14, abdominal: 16, thigh: 14, bodyFatPercent: 14.8, leanMassKg: 76.7, fatMassKg: 13.3, bmi: 27.2, classification: 'Bom', assessedAt: new Date(now.getTime() - 15 * 86400000).toISOString() },
  ]

  for (const assessment of assessments) {
    await supabase.from('PhysicalAssessment').insert(assessment)
  }
  console.log('✅ Physical assessments created (2 per student)')

  // 4. Exercises (40+)
  const exercises = [
    // Peito
    { id: id(), name: 'Supino Reto com Barra', muscleGroup: 'Peito', equipment: 'Barra Livre', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Peitoral maior', secondaryMuscles: 'Tríceps, Deltóide anterior', steps: ['Deite no banco com as costas apoiadas', 'Segure a barra com pegada um pouco mais larga que os ombros', 'Desça a barra controladamente até tocar levemente o peito', 'Empurre a barra de volta à posição inicial'], safetyTip: 'Mantenha as escápulas retraídas e os pés no chão. Evite arquear excessivamente a lombar.', isCustom: false },
    { id: id(), name: 'Supino Inclinado com Halter', muscleGroup: 'Peito', equipment: 'Halter', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Peitoral maior (porção clavicular)', secondaryMuscles: 'Tríceps, Deltóide anterior', steps: ['Ajuste o banco a 30-45°', 'Segure os halteres na altura do peito', 'Empurre os halteres para cima convergindo no topo', 'Desça controladamente'], safetyTip: 'Não deixe os cotovelos caírem abaixo da linha dos ombros.', isCustom: false },
    { id: id(), name: 'Crucifixo com Halter', muscleGroup: 'Peito', equipment: 'Halter', level: 'Intermediário', type: 'Isolador', primaryMuscles: 'Peitoral maior', secondaryMuscles: 'Deltóide anterior', steps: ['Deite no banco com halteres acima do peito', 'Abra os braços em arco mantendo leve flexão nos cotovelos', 'Sinta o alongamento no peito', 'Feche os braços em arco de volta'], safetyTip: 'Mantenha uma leve flexão nos cotovelos durante todo o movimento para proteger as articulações.', isCustom: false },
    { id: id(), name: 'Flexão de Braço', muscleGroup: 'Peito', equipment: 'Peso Corporal', level: 'Iniciante', type: 'Composto', primaryMuscles: 'Peitoral maior', secondaryMuscles: 'Tríceps, Deltóide anterior, Core', steps: ['Apoie as mãos no chão na largura dos ombros', 'Mantenha o corpo reto formando uma prancha', 'Desça o peito até quase tocar o chão', 'Empurre de volta à posição inicial'], safetyTip: 'Mantenha o abdômen contraído e o corpo alinhado durante todo o exercício.', isCustom: false },
    { id: id(), name: 'Supino Declinado com Barra', muscleGroup: 'Peito', equipment: 'Barra Livre', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Peitoral maior (porção esternal inferior)', secondaryMuscles: 'Tríceps', steps: ['Deite no banco declinado', 'Segure a barra com pegada média', 'Desça controladamente ao peito inferior', 'Empurre para cima'], safetyTip: 'Use um assistente ao trabalhar com cargas elevadas neste exercício.', isCustom: false },
    { id: id(), name: 'Peck Deck (Voador)', muscleGroup: 'Peito', equipment: 'Máquina', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Peitoral maior', secondaryMuscles: 'Deltóide anterior', steps: ['Sente-se e ajuste os apoios na altura dos ombros', 'Coloque os antebraços nos apoios', 'Traga os braços à frente contraindo o peito', 'Volte lentamente controlando a abertura'], safetyTip: 'Evite hiperestender os ombros na fase excêntrica.', isCustom: false },
    // Costas
    { id: id(), name: 'Puxada Frontal', muscleGroup: 'Costas', equipment: 'Máquina', level: 'Iniciante', type: 'Composto', primaryMuscles: 'Grande dorsal', secondaryMuscles: 'Bíceps, Rombóides, Infraespinhal', steps: ['Sente-se e segure a barra com pegada aberta supinada ou pronada', 'Puxe a barra até a frente do peito', 'Contraia o dorsal no final do movimento', 'Suba controladamente com os braços estendidos'], safetyTip: 'Evite balançar o tronco. Concentre-se em puxar com os cotovelos.', isCustom: false },
    { id: id(), name: 'Remada Curvada com Barra', muscleGroup: 'Costas', equipment: 'Barra Livre', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Grande dorsal, Rombóides', secondaryMuscles: 'Bíceps, Trapézio', steps: ['Incline o tronco a 45° com as costas retas', 'Segure a barra com pegada pronada', 'Puxe a barra em direção ao abdômen', 'Desça controladamente'], safetyTip: 'Mantenha a coluna neutra. Não arredonde as costas sob carga pesada.', isCustom: false },
    { id: id(), name: 'Remada Unilateral com Halter', muscleGroup: 'Costas', equipment: 'Halter', level: 'Iniciante', type: 'Composto', primaryMuscles: 'Grande dorsal', secondaryMuscles: 'Bíceps, Rombóides', steps: ['Apoie um joelho e mão no banco', 'Segure o halter com o braço estendido', 'Puxe o halter até a cintura contraindo o dorsal', 'Desça lentamente'], safetyTip: 'Mantenha o quadril nivelado e evite rotação do tronco.', isCustom: false },
    { id: id(), name: 'Levantamento Terra', muscleGroup: 'Costas', equipment: 'Barra Livre', level: 'Avançado', type: 'Composto', primaryMuscles: 'Eretores da espinha, Glúteos', secondaryMuscles: 'Isquiotibiais, Trapézio, Quadríceps', steps: ['Posicione a barra sobre os pés', 'Agache e segure a barra com pegada dupla pronada', 'Mantenha as costas retas e o peito erguido', 'Levante empurrando o chão com os pés'], safetyTip: 'Este exercício requer técnica perfeita. Nunca arredonde a lombar. Aprenda a técnica antes de usar cargas pesadas.', isCustom: false },
    { id: id(), name: 'Pull-up (Barra Fixa)', muscleGroup: 'Costas', equipment: 'Peso Corporal', level: 'Avançado', type: 'Composto', primaryMuscles: 'Grande dorsal', secondaryMuscles: 'Bíceps, Infraespinhal', steps: ['Segure a barra com pegada pronada mais larga que os ombros', 'Parta do ponto morto inferior com braços estendidos', 'Puxe até o queixo ultrapassar a barra', 'Desça completamente'], safetyTip: 'Evite movimentos balísticos. Controle a fase excêntrica.', isCustom: false },
    { id: id(), name: 'Remada na Máquina', muscleGroup: 'Costas', equipment: 'Máquina', level: 'Iniciante', type: 'Composto', primaryMuscles: 'Grande dorsal, Rombóides', secondaryMuscles: 'Bíceps, Trapézio médio', steps: ['Sente-se e apoie o peito no suporte', 'Segure as pegadas', 'Puxe em direção ao abdômen', 'Volte controladamente'], safetyTip: 'Ótimo para iniciantes por oferecer suporte e guiar o movimento.', isCustom: false },
    // Pernas
    { id: id(), name: 'Agachamento Livre', muscleGroup: 'Pernas', equipment: 'Barra Livre', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Quadríceps, Glúteos', secondaryMuscles: 'Isquiotibiais, Core, Adutores', steps: ['Posicione a barra na parte posterior do trapézio', 'Pés na largura dos ombros, ponta dos pés levemente abertos', 'Desça como se fosse sentar em uma cadeira', 'Suba empurrando o chão com os calcanhares'], safetyTip: 'Mantenha os joelhos alinhados com os pés. Coluna neutra em todo movimento.', isCustom: false },
    { id: id(), name: 'Leg Press 45°', muscleGroup: 'Pernas', equipment: 'Máquina', level: 'Iniciante', type: 'Composto', primaryMuscles: 'Quadríceps', secondaryMuscles: 'Glúteos, Isquiotibiais', steps: ['Sente-se e posicione os pés na plataforma', 'Desace os joelhos em direção ao peito', 'Empurre de volta sem travar os joelhos', 'Controle sempre a descida'], safetyTip: 'Não trave os joelhos no ponto final. Mantenha os calcanhares na plataforma.', isCustom: false },
    { id: id(), name: 'Cadeira Extensora', muscleGroup: 'Pernas', equipment: 'Máquina', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Quadríceps', secondaryMuscles: null, steps: ['Sente-se e posicione as pernas sob o suporte', 'Estenda as pernas até a posição horizontal', 'Contraia o quadríceps no topo', 'Desça controladamente'], safetyTip: 'Use como exercício acessório. Evite usar como único exercício de pernas.', isCustom: false },
    { id: id(), name: 'Mesa Flexora', muscleGroup: 'Pernas', equipment: 'Máquina', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Isquiotibiais', secondaryMuscles: 'Gastrocnêmio', steps: ['Deite de bruços e posicione os tornozelos sob o suporte', 'Flexione os joelhos trazendo os calcanhares aos glúteos', 'Contraia os isquiotibiais no topo', 'Desça lentamente'], safetyTip: 'Mantenha o quadril apoiado no banco durante todo o movimento.', isCustom: false },
    { id: id(), name: 'Stiff (Terra Romano)', muscleGroup: 'Pernas', equipment: 'Barra Livre', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Isquiotibiais', secondaryMuscles: 'Glúteos, Eretores da espinha', steps: ['Segure a barra na frente do corpo', 'Com leve flexão nos joelhos, incline o tronco para frente', 'Sinta o alongamento nos isquiotibiais', 'Volte erguendo o tronco contraindo os glúteos'], safetyTip: 'Mantenha as costas retas durante todo o movimento.', isCustom: false },
    { id: id(), name: 'Afundo (Lunge)', muscleGroup: 'Pernas', equipment: 'Halter', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Quadríceps, Glúteos', secondaryMuscles: 'Isquiotibiais, Core', steps: ['Segure halteres em cada mão', 'Dê um passo grande para frente', 'Desça o joelho traseiro em direção ao chão', 'Empurre com o pé da frente e retorne'], safetyTip: 'O joelho da frente não deve ultrapassar a ponta do pé.', isCustom: false },
    { id: id(), name: 'Panturrilha em Pé', muscleGroup: 'Pernas', equipment: 'Máquina', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Gastrocnêmio', secondaryMuscles: 'Sóleo', steps: ['Posicione os ombros sob os suportes', 'Fique na ponta dos pés', 'Suba o mais alto possível', 'Desça controladamente abaixo do nível do degrau'], safetyTip: 'Execute o movimento em amplitude completa para melhores resultados.', isCustom: false },
    // Ombros
    { id: id(), name: 'Desenvolvimento com Barra', muscleGroup: 'Ombro', equipment: 'Barra Livre', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Deltóide anterior e medial', secondaryMuscles: 'Tríceps, Trapézio', steps: ['Segure a barra na frente do peito na altura dos ombros', 'Empurre para cima até os braços estendidos', 'Desça controladamente'], safetyTip: 'Não arqueie a lombar. Use cinto de musculação em cargas pesadas.', isCustom: false },
    { id: id(), name: 'Desenvolvimento Arnold', muscleGroup: 'Ombro', equipment: 'Halter', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Deltóide (todas as porções)', secondaryMuscles: 'Tríceps', steps: ['Segure halteres com palmas para você na altura do mento', 'Ao subir, gire os pulsos para fora', 'No topo palmas para frente', 'Inverta o movimento ao descer'], safetyTip: 'Movimento controlado. Ótimo para desenvolver todas as porções do deltóide.', isCustom: false },
    { id: id(), name: 'Elevação Lateral', muscleGroup: 'Ombro', equipment: 'Halter', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Deltóide medial', secondaryMuscles: 'Trapézio', steps: ['Segure halteres ao lado do corpo', 'Eleve os braços lateralmente até a altura dos ombros', 'Mantenha leve flexão nos cotovelos', 'Desça controladamente'], safetyTip: 'Evite usar o trapézio. Mantenha o tronco estável sem balançar.', isCustom: false },
    { id: id(), name: 'Elevação Frontal', muscleGroup: 'Ombro', equipment: 'Halter', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Deltóide anterior', secondaryMuscles: null, steps: ['Segure halteres à frente das coxas', 'Eleve um braço por vez até a altura dos ombros', 'Desça controladamente', 'Alterne os braços'], safetyTip: 'Use cargas leves. O deltóide anterior já é muito solicitado no supino.', isCustom: false },
    { id: id(), name: 'Encolhimento de Ombros', muscleGroup: 'Ombro', equipment: 'Halter', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Trapézio', secondaryMuscles: null, steps: ['Segure halteres ao lado do corpo', 'Encolha os ombros em direção às orelhas', 'Mantenha no topo por 1 segundo', 'Desça lentamente'], safetyTip: 'Não gire os ombros. Movimento estritamente vertical.', isCustom: false },
    // Braços
    { id: id(), name: 'Rosca Direta com Barra', muscleGroup: 'Braços', equipment: 'Barra Livre', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Bíceps', secondaryMuscles: 'Braquial, Braquiorradial', steps: ['Segure a barra com pegada supinada', 'Mantenha os cotovelos junto ao corpo', 'Flexione os cotovelos trazendo a barra ao peito', 'Desça controladamente'], safetyTip: 'Não balance o tronco para ajudar no movimento.', isCustom: false },
    { id: id(), name: 'Rosca Alternada com Halter', muscleGroup: 'Braços', equipment: 'Halter', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Bíceps', secondaryMuscles: 'Braquial', steps: ['Segure halteres com os braços estendidos', 'Flexione um cotovelo por vez', 'Gire o punho ao subir (supinação)', 'Desça o halter enquanto sobe o outro'], safetyTip: 'Mantenha os cotovelos fixos ao lado do corpo.', isCustom: false },
    { id: id(), name: 'Tríceps Pulley (Polia)', muscleGroup: 'Braços', equipment: 'Cabo', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Tríceps', secondaryMuscles: null, steps: ['Segure a corda ou barra na polia alta', 'Cotovelos fixos ao lado do corpo', 'Estenda os braços para baixo', 'Retorne controladamente'], safetyTip: 'Mantenha os cotovelos fixos e o tronco ligeiramente inclinado para frente.', isCustom: false },
    { id: id(), name: 'Tríceps Francês', muscleGroup: 'Braços', equipment: 'Halter', level: 'Intermediário', type: 'Isolador', primaryMuscles: 'Tríceps (cabeça longa)', secondaryMuscles: null, steps: ['Deite no banco e segure halter com ambas as mãos acima da cabeça', 'Flexione os cotovelos abaixando o halter atrás da cabeça', 'Estenda os braços de volta'], safetyTip: 'Mantenha os cotovelos apontados para o teto durante todo o movimento.', isCustom: false },
    { id: id(), name: 'Rosca Martelo', muscleGroup: 'Braços', equipment: 'Halter', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Braquial, Braquiorradial', secondaryMuscles: 'Bíceps', steps: ['Segure halteres com pegada neutra (palmas para dentro)', 'Flexione os cotovelos', 'Não gire o punho durante o movimento', 'Desça controladamente'], safetyTip: 'Excelente para espessura do braço. Mantenha a pegada neutra.', isCustom: false },
    // Abdominais
    { id: id(), name: 'Crunch Abdominal', muscleGroup: 'Abdominais', equipment: 'Peso Corporal', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Reto abdominal', secondaryMuscles: 'Oblíquos', steps: ['Deite de costas com joelhos dobrados', 'Mãos atrás da cabeça sem puxar o pescoço', 'Contraia o abdômen elevando os ombros do chão', 'Desça lentamente'], safetyTip: 'Não puxe o pescoço com as mãos. Foque na contração do abdômen.', isCustom: false },
    { id: id(), name: 'Prancha (Plank)', muscleGroup: 'Abdominais', equipment: 'Peso Corporal', level: 'Iniciante', type: 'Composto', primaryMuscles: 'Core (transverso abdominal)', secondaryMuscles: 'Deltóides, Glúteos, Isquiotibiais', steps: ['Apoie os antebraços e ponta dos pés', 'Corpo reto como uma tábua', 'Abdômen contraído', 'Mantenha a posição pelo tempo determinado'], safetyTip: 'Não deixe o quadril cair ou subir. Respire normalmente durante o exercício.', isCustom: false },
    { id: id(), name: 'Abdominal Infra (Elevação de Pernas)', muscleGroup: 'Abdominais', equipment: 'Peso Corporal', level: 'Intermediário', type: 'Isolador', primaryMuscles: 'Reto abdominal inferior', secondaryMuscles: 'Flexores do quadril', steps: ['Deite com as mãos sob os glúteos', 'Eleve as pernas retas até 90°', 'Desça controladamente sem tocar o chão', 'Repita'], safetyTip: 'Se sentir dor lombar, flexione levemente os joelhos.', isCustom: false },
    { id: id(), name: 'Oblíquo (Russian Twist)', muscleGroup: 'Abdominais', equipment: 'Peso Corporal', level: 'Intermediário', type: 'Isolador', primaryMuscles: 'Oblíquos', secondaryMuscles: 'Reto abdominal', steps: ['Sente-se com os pés levemente elevados', 'Tronco inclinado a 45°', 'Gire o tronco de lado a lado', 'Toque o chão ao lado do quadril a cada rotação'], safetyTip: 'Mantenha o abdômen contraído. Pode segurar um peso para aumentar a intensidade.', isCustom: false },
    // Glúteos
    { id: id(), name: 'Glúteo 4 Apoios', muscleGroup: 'Glúteos', equipment: 'Peso Corporal', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Glúteo máximo', secondaryMuscles: 'Isquiotibiais', steps: ['Posicione-se de quatro apoios', 'Estenda uma perna para trás e para cima', 'Contraia o glúteo no topo', 'Desça sem tocar o chão e repita'], safetyTip: 'Mantenha o core ativo para estabilizar o tronco.', isCustom: false },
    { id: id(), name: 'Elevação Pélvica (Hip Thrust)', muscleGroup: 'Glúteos', equipment: 'Barra Livre', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Glúteo máximo', secondaryMuscles: 'Isquiotibiais, Core', steps: ['Apoie as costas no banco e a barra no colo', 'Pés no chão, joelhos a 90°', 'Eleve o quadril até o alinhamento com o tronco', 'Contraia os glúteos no topo e desça'], safetyTip: 'Use proteção na barra para conforto. Foque em ativar os glúteos, não a lombar.', isCustom: false },
    { id: id(), name: 'Abdução com Cabo', muscleGroup: 'Glúteos', equipment: 'Cabo', level: 'Iniciante', type: 'Isolador', primaryMuscles: 'Glúteo médio', secondaryMuscles: 'Glúteo mínimo', steps: ['Fixe o cabo no tornozelo', 'Fique de lado à polia', 'Abdua a perna lateralmente', 'Controle a volta ao centro'], safetyTip: 'Use carga leve. Foque na contração do glúteo médio.', isCustom: false },
    // Cardio
    { id: id(), name: 'Esteira', muscleGroup: 'Cardio', equipment: 'Máquina', level: 'Iniciante', type: 'Composto', primaryMuscles: 'Cardiovascular, Pernas', secondaryMuscles: null, steps: ['Comece em velocidade baixa por 2-3 minutos', 'Aumente gradualmente a velocidade', 'Mantenha a cadência por todo o tempo', 'Reduza gradualmente ao final'], safetyTip: 'Mantenha postura ereta. Não segure nos corrimãos durante corrida.', isCustom: false },
    { id: id(), name: 'Bicicleta Ergométrica', muscleGroup: 'Cardio', equipment: 'Máquina', level: 'Iniciante', type: 'Composto', primaryMuscles: 'Cardiovascular, Quadríceps', secondaryMuscles: 'Glúteos, Isquiotibiais', steps: ['Ajuste o selim na altura correta', 'Pedale em ritmo constante', 'Varie a resistência conforme necessário'], safetyTip: 'Ótima opção de baixo impacto para pessoas com lesões nos joelhos.', isCustom: false },
    { id: id(), name: 'Elíptico', muscleGroup: 'Cardio', equipment: 'Máquina', level: 'Iniciante', type: 'Composto', primaryMuscles: 'Cardiovascular', secondaryMuscles: 'Pernas, Braços', steps: ['Suba na máquina e segure as alças', 'Mova as pernas em movimento elíptico', 'Use os braços para intensificar', 'Mantenha ritmo constante'], safetyTip: 'Exercício de baixíssimo impacto. Excelente para iniciantes e reabilitação.', isCustom: false },
    { id: id(), name: 'Escada (Step Mill)', muscleGroup: 'Cardio', equipment: 'Máquina', level: 'Intermediário', type: 'Composto', primaryMuscles: 'Cardiovascular, Glúteos, Quadríceps', secondaryMuscles: 'Panturrilha', steps: ['Suba na escada e inicie em velocidade baixa', 'Suba degrau a degrau mantendo postura ereta', 'Use as corrimãos apenas para equilíbrio', 'Mantenha o ritmo por todo o tempo'], safetyTip: 'Não segure nos corrimãos com força total — isso reduz o gasto calórico.', isCustom: false },
  ]

  for (const exercise of exercises) {
    await supabase.from('Exercise').upsert(exercise, { onConflict: 'id' })
  }
  console.log(`✅ ${exercises.length} exercises created`)

  // 5. Workout for Carlos
  const workoutId = id()
  await supabase.from('Workout').insert({
    id: workoutId,
    studentId: students[0].id,
    title: 'Treino Push/Pull — Hipertrofia',
    content: JSON.stringify({ generalNotes: 'Progressão linear de cargas. Aumentar 2.5kg a cada 2 semanas ou quando completar todas as reps com boa técnica. Foco na conexão mente-músculo.' }),
    status: 'aprovado',
    createdAt: new Date(now.getTime() - 25 * 86400000).toISOString(),
  })

  const sessionA = id(), sessionB = id(), sessionC = id()
  const sessions = [
    { id: sessionA, workoutId, name: 'Treino A — Peito e Tríceps', order: 1, warmup: '5 min esteira + mobilidade de ombros + ativação de manguito rotador' },
    { id: sessionB, workoutId, name: 'Treino B — Costas e Bíceps', order: 2, warmup: '5 min elíptico + mobilidade torácica + activação do dorsal' },
    { id: sessionC, workoutId, name: 'Treino C — Pernas', order: 3, warmup: '5 min bicicleta + mobilidade de quadril + ativação glútea' },
  ]
  for (const session of sessions) {
    await supabase.from('WorkoutSession').insert(session)
  }

  // Find exercise IDs by name
  const { data: exData } = await supabase.from('Exercise').select('id, name')
  const exMap: Record<string, string> = {}
  ;(exData || []).forEach((e: any) => { exMap[e.name] = e.id })

  const workoutExercises = [
    // Session A
    { id: id(), sessionId: sessionA, exerciseId: exMap['Supino Reto com Barra'], name: 'Supino Reto com Barra', sets: 4, reps: '8-10', rest: 90, notes: 'Controle excêntrico de 3s. Escápulas retraídas.', muscleGroup: 'Peito', order: 1 },
    { id: id(), sessionId: sessionA, exerciseId: exMap['Supino Inclinado com Halter'], name: 'Supino Inclinado com Halter', sets: 3, reps: '10-12', rest: 75, notes: null, muscleGroup: 'Peito', order: 2 },
    { id: id(), sessionId: sessionA, exerciseId: exMap['Peck Deck (Voador)'], name: 'Peck Deck', sets: 3, reps: '12-15', rest: 60, notes: 'Foco na contração máxima.', muscleGroup: 'Peito', order: 3 },
    { id: id(), sessionId: sessionA, exerciseId: exMap['Tríceps Pulley (Polia)'], name: 'Tríceps Pulley', sets: 4, reps: '10-12', rest: 60, notes: null, muscleGroup: 'Braços', order: 4 },
    { id: id(), sessionId: sessionA, exerciseId: exMap['Tríceps Francês'], name: 'Tríceps Francês', sets: 3, reps: '10-12', rest: 60, notes: null, muscleGroup: 'Braços', order: 5 },
    // Session B
    { id: id(), sessionId: sessionB, exerciseId: exMap['Remada Curvada com Barra'], name: 'Remada Curvada', sets: 4, reps: '8-10', rest: 90, notes: 'Coluna neutra. Puxar até o abdômen.', muscleGroup: 'Costas', order: 1 },
    { id: id(), sessionId: sessionB, exerciseId: exMap['Puxada Frontal'], name: 'Puxada Frontal', sets: 4, reps: '10-12', rest: 75, notes: null, muscleGroup: 'Costas', order: 2 },
    { id: id(), sessionId: sessionB, exerciseId: exMap['Remada Unilateral com Halter'], name: 'Remada Unilateral', sets: 3, reps: '10-12', rest: 60, notes: null, muscleGroup: 'Costas', order: 3 },
    { id: id(), sessionId: sessionB, exerciseId: exMap['Rosca Direta com Barra'], name: 'Rosca Direta', sets: 4, reps: '10-12', rest: 60, notes: null, muscleGroup: 'Braços', order: 4 },
    { id: id(), sessionId: sessionB, exerciseId: exMap['Rosca Martelo'], name: 'Rosca Martelo', sets: 3, reps: '12-15', rest: 60, notes: null, muscleGroup: 'Braços', order: 5 },
    // Session C
    { id: id(), sessionId: sessionC, exerciseId: exMap['Agachamento Livre'], name: 'Agachamento Livre', sets: 4, reps: '8-10', rest: 120, notes: 'Profundidade mínima: paralelo. Controle excêntrico.', muscleGroup: 'Pernas', order: 1 },
    { id: id(), sessionId: sessionC, exerciseId: exMap['Leg Press 45°'], name: 'Leg Press 45°', sets: 3, reps: '10-12', rest: 90, notes: null, muscleGroup: 'Pernas', order: 2 },
    { id: id(), sessionId: sessionC, exerciseId: exMap['Stiff (Terra Romano)'], name: 'Stiff', sets: 3, reps: '10-12', rest: 75, notes: 'Foco no alongamento dos isquiotibiais.', muscleGroup: 'Pernas', order: 3 },
    { id: id(), sessionId: sessionC, exerciseId: exMap['Mesa Flexora'], name: 'Mesa Flexora', sets: 3, reps: '12-15', rest: 60, notes: null, muscleGroup: 'Pernas', order: 4 },
    { id: id(), sessionId: sessionC, exerciseId: exMap['Panturrilha em Pé'], name: 'Panturrilha em Pé', sets: 4, reps: '15-20', rest: 45, notes: 'Amplitude completa.', muscleGroup: 'Pernas', order: 5 },
  ]

  for (const ex of workoutExercises) {
    await supabase.from('WorkoutExercise').insert(ex)
  }
  console.log('✅ Workout created for Carlos Silva')

  // 6. Default settings
  const { data: existingSettings } = await supabase.from('Settings').select('id').limit(1)
  if (!existingSettings || existingSettings.length === 0) {
    await supabase.from('Settings').insert({
      id: id(),
      smtpHost: null,
      smtpPort: 587,
      smtpUser: null,
      smtpPass: null,
      smtpFrom: null,
      followUpTemplate: 'Olá {nome}! 👋\n\nPassando para ver como estão seus treinos de {objetivo}. Já são {dias} dias juntos nessa jornada!\n\nLembre-se de registrar seus treinos e me avisar se tiver qualquer dúvida ou precisar ajustar algo no seu plano.\n\nContinue firme! 💪',
      autoFollowUp: false,
      followUpHour: 8,
      workoutPreferences: 'Priorizar exercícios multiarticulares. Usar periodização linear para iniciantes e ondulatória para intermediários/avançados. Sempre incluir aquecimento específico e progressão de cargas planejada.',
    })
  }
  console.log('✅ Default settings created')

  console.log('\n🎉 Seed complete!')
  console.log('   Login: admin@ptmanager.com / admin123')
  process.exit(0)
}

main().catch(err => { console.error('❌ Seed error:', err); process.exit(1) })
