export const navItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { icon: 'groups', label: 'Alunos', href: '/alunos' },
  { icon: 'fitness_center', label: 'Treinos', href: '/treinos' },
  { icon: 'menu_book', label: 'Exercícios', href: '/exercicios' },
  { icon: 'calendar_month', label: 'Agenda', href: '/agenda' },
  { icon: 'monitoring', label: 'Acompanhamento', href: '/acompanhamento', badge: true },
  { icon: 'settings', label: 'Configurações', href: '/configuracoes' },
  { icon: 'person', label: 'Perfil', href: '/perfil' },
]

export type NavItem = (typeof navItems)[number]
