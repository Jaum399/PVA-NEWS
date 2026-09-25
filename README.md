# PVA NEWS

Portal de notícias de Primavera do Leste com área editorial protegida em `/admin`.

## Publicar na Vercel

1. Importe o repositório `Jaum399/PVA-NEWS` na Vercel.
2. Configure as variáveis de ambiente do projeto:
	- `MONGODB_URI`: URI completa do Atlas, incluindo a senha do usuário `jmsfagundes_db_user`.
	- `MONGODB_DB`: nome do banco, por exemplo `pva_news`.
	- `ADMIN_USER`: `francimar`.
	- `ADMIN_PASSWORD`: cadastre a senha privada escolhida diretamente na Vercel. Não coloque a senha no GitHub.
3. Faça o deploy. O painel ficará disponível em `https://pva-news.vercel.app/admin` se esse for o domínio atribuído ao projeto.

## MongoDB Atlas

O usuário do banco precisa ter acesso de leitura e escrita ao banco escolhido, e o IP da Vercel precisa ser permitido na configuração de Network Access do Atlas. A aplicação reutiliza o `MongoClient` entre invocações quentes e usa um pool pequeno, adequado ao uso editorial serverless. Não publique os valores de `ADMIN_PASSWORD` ou `MONGODB_URI` no GitHub.

## Conteúdo

O painel cria, edita, publica e exclui documentos na coleção `articles`. Apenas documentos com `published: true` são exibidos no front-end público. Imagens podem ser importadas no painel ou informadas por URL HTTPS; não envie senhas, tokens ou arquivos `.env` ao GitHub.

## Integridade editorial

Para publicar uma notícia pelo painel, a redação precisa registrar ao menos uma referência HTTPS e confirmar a revisão editorial. O painel também aponta sinais heurísticos como ausência de referências, linguagem potencialmente sensacionalista, títulos em caixa alta e pontuação enfática. Esses indicadores servem para priorizar revisão humana; não verificam fontes automaticamente e não classificam uma notícia como verdadeira ou falsa. As referências cadastradas e o registro de revisão ficam visíveis na matéria publicada para dar contexto ao leitor.
