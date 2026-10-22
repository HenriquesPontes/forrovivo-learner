export type AuthLocale = "en" | "pt";
export const AUTH_LOCALE_COOKIE = "fv_learner_locale";
export const authLocale = (value?: string): AuthLocale => value === "pt" ? "pt" : "en";

export const authCopy = {
  en: {
    language: "Language", skip: "Skip to sign-in", website: "ForroVivo website", navigation: "Login navigation",
    tryLesson: "Try a lesson", backLessons: "Back to lessons", island: "A little Forro, every day.",
    login: "Log in", register: "Create account", emailLogin: "Email sign-in", emailRegister: "Email registration",
    welcome: "Good to see you again!", registerWelcome: "Your Forro adventure starts here.",
    intro: "Let’s pick up where you left off.", registerIntro: "Make a little room for a new language.",
    alreadyHere: "Already part of the flock?",
    accountNote: "Email accounts are for the website. Apple and Google accounts stay separate; matching email addresses do not link them.",
    footer: "Made for the living language of São Tomé and Príncipe.",
    rights: "All rights reserved.",
    name: "Name", optional: "optional", namePlaceholder: "What should we call you?", email: "Email", emailPlaceholder: "you@example.com",
    password: "Password", passwordPlaceholder: "Your password", newPasswordPlaceholder: "At least 8 characters",
    showPassword: "Show password", hidePassword: "Hide password", forgot: "Forgot password?",
    signingIn: "Signing in…", creating: "Creating account…", formAlreadyHere: "Already have an account? ",
    pending: "Check your email to finish registration. If you already have an account, sign in or reset your password.",
    socialIntro: "Continue with Apple or Google. Use the same account as in the app to keep your progress together.",
    social: "Social sign-in", orContinue: "Or continue with", apple: "Continue with Apple", google: "Continue with Google",
    appleUnavailable: "Apple sign-in is currently unavailable.", googleUnavailable: "Google sign-in is currently unavailable.",
    retrySocial: "Retry social sign-in", providerFailed: "A sign-in provider could not load. Please try again.",
    socialFailed: "Could not load social sign-in. Please try again.", appleCancelled: "Apple sign-in was cancelled or failed. Please try again.",
    generalError: "Something went wrong. Please try again.", oauthError: "Sign-in failed. Please try again.",
  },
  pt: {
    language: "Idioma", skip: "Saltar para o início de sessão", website: "Site ForroVivo", navigation: "Navegação de acesso",
    tryLesson: "Experimentar uma aula", backLessons: "Voltar às aulas", island: "Um pouco de Forro, todos os dias.",
    login: "Entrar", register: "Criar conta", emailLogin: "Entrar com e-mail", emailRegister: "Registo com e-mail",
    welcome: "É bom ter-te de volta!", registerWelcome: "A tua aventura em Forro começa aqui.",
    intro: "Vamos continuar de onde ficámos.", registerIntro: "Abre espaço para uma nova língua.",
    alreadyHere: "Já fazes parte do grupo?",
    accountNote: "As contas com e-mail são para o site. As contas Apple e Google são distintas; ter o mesmo e-mail não as associa.",
    footer: "Feito para a língua viva de São Tomé e Príncipe.",
    rights: "Todos os direitos reservados.",
    name: "Nome", optional: "opcional", namePlaceholder: "Como te devemos chamar?", email: "E-mail", emailPlaceholder: "tu@exemplo.com",
    password: "Palavra-passe", passwordPlaceholder: "A tua palavra-passe", newPasswordPlaceholder: "Pelo menos 8 caracteres",
    showPassword: "Mostrar palavra-passe", hidePassword: "Ocultar palavra-passe", forgot: "Esqueceste-te da palavra-passe?",
    signingIn: "A entrar…", creating: "A criar conta…", formAlreadyHere: "Já tens conta? ",
    pending: "Consulta o teu e-mail para concluir o registo. Se já tens conta, inicia sessão ou recupera a palavra-passe.",
    socialIntro: "Continua com Apple ou Google. Usa a mesma conta da app para manter o teu progresso sincronizado.",
    social: "Entrar com uma conta social", orContinue: "Ou continua com", apple: "Continuar com Apple", google: "Continuar com Google",
    appleUnavailable: "A entrada com Apple está indisponível.", googleUnavailable: "A entrada com Google está indisponível.",
    retrySocial: "Tentar novamente", providerFailed: "Não foi possível carregar um dos serviços. Tenta novamente.",
    socialFailed: "Não foi possível carregar o acesso com Apple ou Google. Tenta novamente.",
    appleCancelled: "A entrada com Apple foi cancelada ou falhou. Tenta novamente.",
    generalError: "Ocorreu um erro. Tenta novamente.", oauthError: "Não foi possível iniciar sessão. Tenta novamente.",
  },
} as const;

export function authErrorText(message: string, status: number, locale: AuthLocale, mode: "login" | "register" | "oauth") {
  if (locale === "en") return message || (mode === "oauth" ? authCopy.en.oauthError : authCopy.en.generalError);
  if (message === authCopy.en.providerFailed) return authCopy.pt.providerFailed;
  if (message === authCopy.en.socialFailed) return authCopy.pt.socialFailed;
  if (message === authCopy.en.appleCancelled) return authCopy.pt.appleCancelled;
  if (status === 429) return "Demasiadas tentativas. Aguarda um pouco e tenta novamente.";
  if (status === 502 || status === 503) return "O serviço está temporariamente indisponível. Tenta novamente mais tarde.";
  if (status === 413) return "Os dados introduzidos são demasiado longos.";
  if (mode === "login" && (status === 400 || status === 401)) return "E-mail ou palavra-passe incorretos.";
  if (status === 403) return "Não foi possível concluir o pedido. Atualiza a página e tenta novamente.";
  return mode === "oauth" ? authCopy.pt.oauthError : authCopy.pt.generalError;
}
