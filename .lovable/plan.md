# Plano de Diagnóstico e Correção de E-mails

Para resolver a questão dos e-mails não estarem chegando e permitir o teste manual no admin, realizaremos as seguintes ações:

## Ações de Diagnóstico e Correção

1.  **Diagnóstico SMTP**:
    *   Verificar se as credenciais `SMTP_USER` e `SMTP_PASS` estão configuradas corretamente no ambiente do servidor.
    *   Testar a conectividade com o host `smtp.hostinger.com` na porta 465 (SSL).

2.  **Correção do Fluxo de E-mail**:
    *   Garantir que o `recordSignup` em `src/lib/signups-repo.server.ts` esteja disparando o e-mail de boas-vindas corretamente através do `sendTransactionalEmail`.
    *   Adicionar logs mais detalhados para capturar erros específicos de transporte do nodemailer.

3.  **Implementação de Reenvio Manual no Admin**:
    *   Criar a server function `adminResendWelcomeEmail` (já criada em `src/lib/email-manual.functions.ts`).
    *   Adicionar um botão "Reenviar Boas-vindas" no componente `SignupsCard` dentro da aba de Cadastros no Admin.
    *   Isso permitirá que você teste o envio para o e-mail solicitado (`gaahdesigner@gmail.com`) com um clique.

4.  **Verificação de Logs no Admin**:
    *   Garantir que todos os disparos (sucesso ou erro) fiquem registrados na aba "E-mails" do Admin para facilitar a auditoria.

## Detalhes Técnicos

*   **Server Function**: `adminResendWelcomeEmail` utiliza o repositório de signups e a função de e-mail transacional centralizada.
*   **Segurança**: O reenvio manual exige a senha de admin no servidor.
*   **UI**: Botão de ação rápida adicionado a cada registro de cadastro no `SignupsCard`.
