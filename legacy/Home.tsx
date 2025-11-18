import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { BookOpen, Bot, FileText, Image, Sparkles, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => setLocation("/dashboard")}>
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()}>
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="container max-w-6xl">
          <div className="text-center space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground">
              Crie Livros, Cursos e Conteúdo
              <br />
              <span className="text-primary">com Inteligência Artificial</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Uma fábrica de conteúdo completa com 5 agentes especializados trabalhando juntos
              para criar materiais de até 250 páginas com qualidade profissional.
            </p>
            <div className="flex gap-4 justify-center pt-6">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8">
                Começar Agora
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation("/dashboard")}>
                Ver Exemplos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Sistema de Agentes Especializados
            </h3>
            <p className="text-muted-foreground text-lg">
              Cada agente tem um papel específico no processo de criação
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Editor</CardTitle>
                <CardDescription>
                  Orquestra todo o processo e garante coesão entre capítulos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Pesquisador</CardTitle>
                <CardDescription>
                  Busca e valida informações relevantes para cada tópico
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Escritor</CardTitle>
                <CardDescription>
                  Cria conteúdo envolvente mantendo tom e estilo consistentes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <Bot className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Revisor</CardTitle>
                <CardDescription>
                  Revisa gramática, coesão e sugere melhorias de qualidade
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <Image className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Artista</CardTitle>
                <CardDescription>
                  Gera imagens e ilustrações para enriquecer o conteúdo
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Controle de Contexto</CardTitle>
                <CardDescription>
                  Mantém coerência através de resumos e conexões entre capítulos
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-foreground">
                Recursos Avançados
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Até 250 Páginas</p>
                    <p className="text-muted-foreground">Crie materiais extensos com controle total de qualidade</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Modelos Personalizáveis</p>
                    <p className="text-muted-foreground">Escolha o modelo de IA ideal para cada agente</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Geração Flexível</p>
                    <p className="text-muted-foreground">Gere tudo de uma vez ou ajuste capítulo por capítulo</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Exportação Múltipla</p>
                    <p className="text-muted-foreground">Exporte para PDF, DOCX, EPUB e HTML</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <Card className="bg-card border-border p-8">
              <CardHeader>
                <CardTitle className="text-2xl">Pronto para começar?</CardTitle>
                <CardDescription className="text-base">
                  Crie seu primeiro projeto em minutos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">✓ Configure seus agentes</p>
                  <p className="text-sm text-muted-foreground">✓ Defina a estrutura do conteúdo</p>
                  <p className="text-sm text-muted-foreground">✓ Inicie a geração</p>
                  <p className="text-sm text-muted-foreground">✓ Acompanhe o progresso em tempo real</p>
                </div>
                <Button className="w-full" size="lg" onClick={handleGetStarted}>
                  Criar Meu Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 {APP_TITLE}. Powered by AI Agents.</p>
        </div>
      </footer>
    </div>
  );
}
