import type { AuthLocale } from "@/lib/auth-copy";

export const QUICK_ONBOARDING_COOKIE = "fv_learner_quick";
export type OnboardingStep = { title: string; body: string; question?: "level" | "goal" | "mode" | "audience" | "frequency" | "time" | "style"; options?: readonly { value: string; label: string; icon: string; description?: string; badge?: string }[] };
export const quickOnboarding = {
  en: {
    next: "Continue", skip: "Skip this question", start: "Start learning on the web", app: "Try the ForroVivo app", note: "Your answers stay in this browser. You can skip any question.",
    steps: [
      { title: "How would you like to learn?", body: "Your language. Your way. Choose where to begin.", question: "mode", options: [
        { value: "solo", label: "Solo", icon: "🌱", description: "Short lessons, at your own pace.", badge: "Start today" },
        { value: "connection", label: "Forro Conexão", icon: "🎥", description: "Paid video lessons with a Forro teacher.", badge: "Coming soon" },
      ] },
      { title: "Who’s learning Forro?", body: "A personal journey, or something to share?", question: "audience", options: [
        { value: "myself", label: "Just me", icon: "🙋", description: "A little time for my own learning." },
        { value: "together", label: "Me and my family", icon: "🏡", description: "Bring the language into our everyday life." },
        { value: "children", label: "My child or children", icon: "🌻", description: "Help the next generation discover Forro." },
      ] },
      { title: "How much Forro do you know?", body: "Let’s get to know you a little.", question: "level", options: [
        { value: "new", label: "I’m starting from zero", icon: "🌱" },
        { value: "some", label: "I know a few words", icon: "💬" },
        { value: "confident", label: "I can have a conversation", icon: "✨" },
      ] },
      { title: "What brings you to Forro?", body: "Every learner has a story. What’s yours?", question: "goal", options: [
        { value: "roots", label: "Connect with my roots", icon: "🌴" },
        { value: "people", label: "Talk with family and friends", icon: "🫶" },
        { value: "travel", label: "Explore São Tomé and Príncipe", icon: "🏝️" },
        { value: "curiosity", label: "Discover a new language", icon: "🌍" },
      ] },
      { title: "A little Forro, wherever you go", body: "Keep learning on your phone with the dictionary, audio and offline study. Try the app, or start your first web lesson right here." },
    ],
  },
  pt: {
    next: "Continuar", skip: "Saltar esta pergunta", start: "Começar a aprender no site", app: "Experimenta a app ForroVivo", note: "As respostas ficam neste browser. Podes saltar qualquer pergunta.",
    steps: [
      { title: "Como queres aprender?", body: "A tua língua. Ao teu ritmo. Escolhe por onde começar.", question: "mode", options: [
        { value: "solo", label: "Solo", icon: "🌱", description: "Aulas curtas, ao teu próprio ritmo.", badge: "Começa hoje" },
        { value: "connection", label: "Forro Conexão", icon: "🎥", description: "Aulas pagas por videochamada com professores de Forro.", badge: "Em breve" },
      ] },
      { title: "Quem vai aprender Forro?", body: "Uma descoberta tua ou uma experiência em família?", question: "audience", options: [
        { value: "myself", label: "Só eu", icon: "🙋", description: "Um pouco de tempo para aprender." },
        { value: "together", label: "Eu e a minha família", icon: "🏡", description: "Trazer a língua para o nosso dia a dia." },
        { value: "children", label: "O meu filho ou os meus filhos", icon: "🌻", description: "Dar a conhecer o Forro à próxima geração." },
      ] },
      { title: "Quanto Forro já sabes?", body: "Vamos conhecer-te um pouco melhor.", question: "level", options: [
        { value: "new", label: "Estou a começar do zero", icon: "🌱" },
        { value: "some", label: "Já sei algumas palavras", icon: "💬" },
        { value: "confident", label: "Já consigo conversar", icon: "✨" },
      ] },
      { title: "O que te traz ao Forro?", body: "Cada pessoa tem uma história. Qual é a tua?", question: "goal", options: [
        { value: "roots", label: "Ligar-me às minhas raízes", icon: "🌴" },
        { value: "people", label: "Falar com família e amigos", icon: "🫶" },
        { value: "travel", label: "Explorar São Tomé e Príncipe", icon: "🏝️" },
        { value: "curiosity", label: "Descobrir uma nova língua", icon: "🌍" },
      ] },
      { title: "Um pouco de Forro, onde estiveres", body: "Continua no telemóvel com o dicionário, áudio e estudo offline. Experimenta a app ou começa já a tua primeira aula aqui no site." },
    ],
  },
} as const satisfies Record<AuthLocale, { next: string; skip: string; start: string; app: string; note: string; steps: readonly OnboardingStep[] }>;

export const connectionOnboarding: Record<AuthLocale, { steps: readonly OnboardingStep[]; finish: OnboardingStep; primary: string; later: string; notice: string }> = {
  en: {
    primary: "Save preferences", later: "Try Solo while I wait",
    notice: "Paid lessons · Coming soon. Teacher profiles, availability and prices will be available before booking opens. Saving preferences here does not book a lesson, join a waitlist or charge you.",
    finish: { title: "Your next chapter, with a teacher", body: "Forro Conexão will bring you paid video lessons with Forro teachers. Your learning preferences can be saved on this device while we prepare the service." },
    steps: [
      { title: "How often would you like to meet?", body: "This is a preference for future paid lessons, not a booking.", question: "frequency", options: [
        { value: "weekly", label: "Once a week", icon: "🌱" },
        { value: "twice", label: "Twice a week", icon: "🌿" },
        { value: "flexible", label: "Keep it flexible", icon: "🗓️" },
      ] },
      { title: "When do lessons suit you?", body: "A broad preference for now. Exact dates and time zones come at booking.", question: "time", options: [
        { value: "weekdays", label: "Weekdays", icon: "☀️" },
        { value: "evenings", label: "Evenings", icon: "🌙" },
        { value: "weekends", label: "Weekends", icon: "🏡" },
      ] },
      { title: "What helps you learn best?", body: "Think about the kind of teacher you’d enjoy learning with.", question: "style", options: [
        { value: "structured", label: "A clear, structured lesson", icon: "📚" },
        { value: "conversation", label: "Relaxed conversation", icon: "💬" },
        { value: "mixed", label: "A mix of both", icon: "✨" },
      ] },
    ],
  },
  pt: {
    primary: "Guardar preferências", later: "Experimentar Solo enquanto espero",
    notice: "Aulas pagas · Em breve. Os perfis dos professores, horários e preços estarão disponíveis antes da abertura das marcações. Guardar preferências aqui não marca uma aula, não inscreve numa lista de espera e não implica pagamento.",
    finish: { title: "O próximo passo, com um professor", body: "O Forro Conexão vai trazer aulas pagas por videochamada com professores de Forro. Podes guardar as tuas preferências neste dispositivo enquanto preparamos o serviço." },
    steps: [
      { title: "Com que frequência queres aprender?", body: "É uma preferência para futuras aulas pagas, não uma marcação.", question: "frequency", options: [
        { value: "weekly", label: "Uma vez por semana", icon: "🌱" },
        { value: "twice", label: "Duas vezes por semana", icon: "🌿" },
        { value: "flexible", label: "Prefiro flexibilidade", icon: "🗓️" },
      ] },
      { title: "Quando te dá mais jeito?", body: "Por agora, basta uma preferência geral. As datas e o fuso horário ficam para a marcação.", question: "time", options: [
        { value: "weekdays", label: "Dias úteis", icon: "☀️" },
        { value: "evenings", label: "Ao fim do dia", icon: "🌙" },
        { value: "weekends", label: "Fins de semana", icon: "🏡" },
      ] },
      { title: "Como aprendes melhor?", body: "Pensa no tipo de professor com quem gostarias de aprender.", question: "style", options: [
        { value: "structured", label: "Uma aula bem estruturada", icon: "📚" },
        { value: "conversation", label: "Conversa descontraída", icon: "💬" },
        { value: "mixed", label: "Um pouco de ambos", icon: "✨" },
      ] },
    ],
  },
};

export function onboardingSteps(locale: AuthLocale, mode?: string): readonly OnboardingStep[] {
  const shared = quickOnboarding[locale].steps;
  return mode === "connection"
    ? [shared[0], shared[1], shared[2], shared[3], ...connectionOnboarding[locale].steps, connectionOnboarding[locale].finish]
    : [shared[0], shared[2], shared[3], shared[4]];
}
